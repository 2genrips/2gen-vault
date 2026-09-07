-- VaultSignal v25 Store Intel
-- Turns evidence-backed public-store Hunt history into structured store intelligence.
-- A single unverified report is never enough to create a Store Intel profile.

create table if not exists public.store_intel (
  store_key text primary key,
  retailer text not null,
  store_label text not null,
  broad_region text not null,
  claim_count integer not null default 0,
  trusted_claims integer not null default 0,
  source_verified_claims integer not null default 0,
  corroborated_claims integer not null default 0,
  unverified_claims integer not null default 0,
  conflicted_claims integer not null default 0,
  found_claims integer not null default 0,
  sold_out_claims integer not null default 0,
  independent_scouts integer not null default 0,
  product_count integer not null default 0,
  average_proof_score integer not null default 0,
  latest_trusted_result text,
  latest_trusted_at timestamptz,
  last_activity_at timestamptz,
  recent_products text[] not null default '{}',
  sample_ready boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint store_intel_region_safe check (broad_region='Online' or broad_region ~ '^[0-9]{3}xx$'),
  constraint store_intel_score_safe check (average_proof_score between 0 and 100),
  constraint store_intel_latest_result_safe check (latest_trusted_result is null or latest_trusted_result in ('FOUND','SOLD_OUT'))
);

alter table public.store_intel enable row level security;
grant select on public.store_intel to authenticated;
drop policy if exists "store intel authenticated read" on public.store_intel;
create policy "store intel authenticated read" on public.store_intel for select to authenticated using (true);

create index if not exists store_intel_region_updated_idx on public.store_intel(broad_region,updated_at desc);
create index if not exists store_intel_retailer_updated_idx on public.store_intel(retailer,updated_at desc);
create index if not exists store_intel_trusted_idx on public.store_intel(sample_ready,average_proof_score desc,latest_trusted_at desc);

create table if not exists public.store_intel_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  store_key text not null references public.store_intel(store_key) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,store_key)
);

alter table public.store_intel_follows enable row level security;
grant select,insert,delete on public.store_intel_follows to authenticated;
drop policy if exists "store follows read own" on public.store_intel_follows;
create policy "store follows read own" on public.store_intel_follows for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "store follows add own" on public.store_intel_follows;
create policy "store follows add own" on public.store_intel_follows for insert to authenticated with check (user_id=(select auth.uid()));
drop policy if exists "store follows delete own" on public.store_intel_follows;
create policy "store follows delete own" on public.store_intel_follows for delete to authenticated using (user_id=(select auth.uid()));
create index if not exists store_intel_follows_store_idx on public.store_intel_follows(store_key,user_id);

create or replace function public.store_intel_label_safe(p_retailer text,p_store_label text)
returns boolean
language sql
immutable
security invoker
set search_path=public
as $$
  select
    char_length(trim(coalesce(p_retailer,''))) between 2 and 80
    and char_length(trim(coalesce(p_store_label,''))) between 3 and 120
    and position(public.vaultsignal_normalize_signal(p_retailer) in public.vaultsignal_normalize_signal(p_store_label))>0
    and coalesce(p_store_label,'') !~* '\m(?:home|house|residence|school)\M'
    and coalesce(p_store_label,'') !~ '(?:\+?1[-. ]?)?\(?[0-9]{3}\)?[-. ][0-9]{3}[-. ][0-9]{4}';
$$;

grant execute on function public.store_intel_label_safe(text,text) to authenticated;

create or replace view public.store_intel_recent_claims
with (security_invoker=true)
as
select
  c.id as checkin_id,
  public.vaultsignal_normalize_signal(coalesce(nullif(c.retailer,''),nullif(m.retailer,''),'')) || '|' ||
    public.vaultsignal_normalize_signal(c.store_label) || '|' || lower(c.broad_region) as store_key,
  m.product,
  c.result,
  c.store_label,
  coalesce(nullif(c.retailer,''),nullif(m.retailer,''),'') as retailer,
  c.broad_region,
  c.created_at,
  c.verification_state,
  c.verification_score,
  c.verification_reason,
  c.independent_confirmations,
  c.source_matches
from public.hunt_mission_checkins c
join public.hunt_missions m on m.id=c.mission_id
where c.result in ('FOUND','SOLD_OUT','NOT_FOUND')
  and public.store_intel_label_safe(coalesce(nullif(c.retailer,''),nullif(m.retailer,''),''),c.store_label)
  and (c.broad_region='Online' or c.broad_region ~ '^[0-9]{3}xx$');

grant select on public.store_intel_recent_claims to authenticated;

create or replace function public.refresh_store_intel()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare inserted integer:=0;
begin
  delete from public.store_intel;

  with base as (
    select
      c.id,
      c.user_id,
      c.result,
      c.created_at,
      c.verification_state,
      c.verification_score,
      c.source_matches,
      m.product,
      public.vaultsignal_normalize_signal(coalesce(nullif(c.retailer,''),nullif(m.retailer,''),'')) || '|' ||
        public.vaultsignal_normalize_signal(c.store_label) || '|' || lower(c.broad_region) as store_key,
      coalesce(nullif(c.retailer,''),nullif(m.retailer,''),'') as retailer,
      c.store_label,
      c.broad_region
    from public.hunt_mission_checkins c
    join public.hunt_missions m on m.id=c.mission_id
    where c.result in ('FOUND','SOLD_OUT')
      and public.store_intel_label_safe(coalesce(nullif(c.retailer,''),nullif(m.retailer,''),''),c.store_label)
      and (c.broad_region='Online' or c.broad_region ~ '^[0-9]{3}xx$')
  ), agg as (
    select
      store_key,
      min(retailer) as retailer,
      min(store_label) as store_label,
      min(broad_region) as broad_region,
      count(*)::integer as claim_count,
      count(*) filter(where verification_state in ('SOURCE_VERIFIED','CORROBORATED'))::integer as trusted_claims,
      count(*) filter(where verification_state='SOURCE_VERIFIED')::integer as source_verified_claims,
      count(*) filter(where verification_state='CORROBORATED')::integer as corroborated_claims,
      count(*) filter(where verification_state='UNVERIFIED')::integer as unverified_claims,
      count(*) filter(where verification_state='CONFLICTED')::integer as conflicted_claims,
      count(*) filter(where result='FOUND')::integer as found_claims,
      count(*) filter(where result='SOLD_OUT')::integer as sold_out_claims,
      count(distinct user_id) filter(where verification_state in ('SOURCE_VERIFIED','CORROBORATED'))::integer as independent_scouts,
      count(distinct product) filter(where verification_state in ('SOURCE_VERIFIED','CORROBORATED'))::integer as product_count,
      coalesce(round(avg(verification_score) filter(where verification_state in ('SOURCE_VERIFIED','CORROBORATED')))::integer,0) as average_proof_score,
      max(created_at) as last_activity_at
    from base
    group by store_key
    having count(*) filter(where verification_state in ('SOURCE_VERIFIED','CORROBORATED'))>0
       or count(distinct user_id)>=2
  )
  insert into public.store_intel(
    store_key,retailer,store_label,broad_region,claim_count,trusted_claims,source_verified_claims,corroborated_claims,
    unverified_claims,conflicted_claims,found_claims,sold_out_claims,independent_scouts,product_count,average_proof_score,
    latest_trusted_result,latest_trusted_at,last_activity_at,recent_products,sample_ready,updated_at
  )
  select
    a.store_key,a.retailer,a.store_label,a.broad_region,a.claim_count,a.trusted_claims,a.source_verified_claims,a.corroborated_claims,
    a.unverified_claims,a.conflicted_claims,a.found_claims,a.sold_out_claims,a.independent_scouts,a.product_count,a.average_proof_score,
    latest.result,latest.created_at,a.last_activity_at,
    coalesce((select array(select q.product from (
      select b2.product,max(b2.created_at) as last_seen
      from base b2
      where b2.store_key=a.store_key and b2.verification_state in ('SOURCE_VERIFIED','CORROBORATED') and coalesce(b2.product,'')<>''
      group by b2.product order by max(b2.created_at) desc limit 5
    ) q)),'{}'::text[]),
    a.trusted_claims>=3,now()
  from agg a
  left join lateral (
    select b.result,b.created_at from base b
    where b.store_key=a.store_key and b.verification_state in ('SOURCE_VERIFIED','CORROBORATED')
    order by b.created_at desc limit 1
  ) latest on true;

  get diagnostics inserted=row_count;
  return inserted;
end;
$$;
revoke all on function public.refresh_store_intel() from public,anon,authenticated;
grant execute on function public.refresh_store_intel() to service_role;

create or replace function public.refresh_store_intel_after_claim()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.refresh_store_intel();
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function public.refresh_store_intel_after_claim() from public,anon,authenticated;

drop trigger if exists store_intel_after_claim_insert on public.hunt_mission_checkins;
create trigger store_intel_after_claim_insert
after insert on public.hunt_mission_checkins
for each statement execute function public.refresh_store_intel_after_claim();

drop trigger if exists store_intel_after_claim_delete on public.hunt_mission_checkins;
create trigger store_intel_after_claim_delete
after delete on public.hunt_mission_checkins
for each statement execute function public.refresh_store_intel_after_claim();

do $$ declare j record; begin
  for j in select jobid from cron.job where jobname='vaultsignal-store-intel-refresh' loop perform cron.unschedule(j.jobid); end loop;
  perform cron.schedule('vaultsignal-store-intel-refresh','3-59/10 * * * *','select public.refresh_store_intel();');
end $$;

-- Rebuild now from existing safe/evidence-backed history. Empty history produces an empty directory rather than fake examples.
select public.refresh_store_intel();

-- Realtime table exposure for signed-in Store Intel clients.
do $$ begin
  if not exists(
    select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='store_intel'
  ) then
    alter publication supabase_realtime add table public.store_intel;
  end if;
end $$;
