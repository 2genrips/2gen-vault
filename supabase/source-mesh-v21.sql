-- VaultSignal v21 Source Mesh
-- Separates automated/provider evidence from community reports and lets supported evidence strengthen Signal Fusion incidents.

create table if not exists public.source_catalog (
  source_key text primary key,
  source_name text not null,
  source_type text not null check (source_type in ('official_api','partner_api','public_storefront','retailer_check','system')),
  configured boolean not null default false,
  health text not null default 'unknown' check (health in ('healthy','degraded','offline','unknown','not_configured')),
  description text not null default '',
  observation_count integer not null default 0,
  success_count integer not null default 0,
  error_count integer not null default 0,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint source_catalog_key_len check (char_length(source_key) between 1 and 120),
  constraint source_catalog_name_len check (char_length(source_name) between 1 and 120),
  constraint source_catalog_desc_len check (char_length(description) <= 500)
);

create table if not exists public.source_observations (
  id uuid primary key default gen_random_uuid(),
  source_key text not null references public.source_catalog(source_key) on delete cascade,
  source_name text not null,
  source_type text not null check (source_type in ('official_api','partner_api','public_storefront','retailer_check')),
  room text not null check (room in ('pokemon-drops','local-finds','deals')),
  game text not null default '',
  product text not null default '',
  retailer text not null default '',
  region text not null default '',
  normalized_product text not null default '',
  normalized_retailer text not null default '',
  normalized_region text not null default '',
  evidence_kind text not null default 'unknown' check (evidence_kind in ('availability','listing','price','gone','unknown')),
  status text not null default 'unknown',
  available boolean,
  quantity integer,
  price numeric(12,2),
  confidence integer not null default 0 check (confidence between 0 and 100),
  url text not null default '',
  source_item_id text not null default '',
  dedupe_key text not null unique,
  observed_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  incident_id uuid references public.signal_incidents(id) on delete set null,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint source_observation_qty check (quantity is null or quantity >= 0),
  constraint source_observation_product_len check (char_length(product) <= 140),
  constraint source_observation_retailer_len check (char_length(retailer) <= 80),
  constraint source_observation_region_len check (char_length(region) <= 32),
  constraint source_observation_url_len check (char_length(url) <= 2048),
  constraint source_observation_item_len check (char_length(source_item_id) <= 180),
  constraint source_observation_dedupe_len check (char_length(dedupe_key) <= 300)
);

create index if not exists source_observations_recent_idx on public.source_observations(observed_at desc);
create index if not exists source_observations_source_recent_idx on public.source_observations(source_key, observed_at desc);
create index if not exists source_observations_incident_recent_idx on public.source_observations(incident_id, observed_at desc);
create index if not exists source_observations_match_idx on public.source_observations(room,normalized_product,normalized_retailer,normalized_region,observed_at desc);

alter table public.signal_incidents add column if not exists source_evidence_count integer not null default 0;
alter table public.signal_incidents add column if not exists official_evidence_count integer not null default 0;
alter table public.signal_incidents add column if not exists partner_evidence_count integer not null default 0;
alter table public.signal_incidents add column if not exists storefront_evidence_count integer not null default 0;
alter table public.signal_incidents add column if not exists automated_live_count integer not null default 0;
alter table public.signal_incidents add column if not exists automated_gone_count integer not null default 0;
alter table public.signal_incidents add column if not exists source_confidence integer not null default 0;
alter table public.signal_incidents add column if not exists source_names text[] not null default '{}'::text[];

alter table public.source_catalog enable row level security;
alter table public.source_observations enable row level security;
grant select on public.source_catalog to authenticated;
grant select on public.source_observations to authenticated;
grant all on public.source_catalog to service_role;
grant all on public.source_observations to service_role;

drop policy if exists "source catalog readable by authenticated" on public.source_catalog;
create policy "source catalog readable by authenticated" on public.source_catalog for select to authenticated using (true);
drop policy if exists "source observations readable by authenticated" on public.source_observations;
create policy "source observations readable by authenticated" on public.source_observations for select to authenticated using (true);
drop policy if exists "service role manages source catalog" on public.source_catalog;
create policy "service role manages source catalog" on public.source_catalog for all to service_role using (true) with check (true);
drop policy if exists "service role manages source observations" on public.source_observations;
create policy "service role manages source observations" on public.source_observations for all to service_role using (true) with check (true);

create or replace function public.refresh_signal_incident(p_incident uuid)
returns public.signal_incidents
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reports integer := 0;
  v_reporters integer := 0;
  v_confirm integer := 0;
  v_gone integer := 0;
  v_helpful integer := 0;
  v_latest_type text := '';
  v_latest_post uuid;
  v_first_post uuid;
  v_community_first timestamptz;
  v_community_last timestamptz;
  v_source_first timestamptz;
  v_source_last timestamptz;
  v_source_count integer := 0;
  v_official integer := 0;
  v_partner integer := 0;
  v_storefront integer := 0;
  v_source_live integer := 0;
  v_source_gone integer := 0;
  v_source_conf integer := 0;
  v_source_names text[] := '{}'::text[];
  v_conf integer := 0;
  v_status text := 'WATCH';
  v_result public.signal_incidents;
begin
  select count(*)::integer,
         count(distinct user_id)::integer,
         min(created_at), max(created_at),
         (array_agg(id order by created_at asc))[1],
         (array_agg(id order by created_at desc))[1],
         (array_agg(type order by created_at desc))[1]
    into v_reports,v_reporters,v_community_first,v_community_last,v_first_post,v_latest_post,v_latest_type
  from public.signal_posts
  where incident_id = p_incident and coalesce(is_removed,false)=false;

  select
    count(*) filter (where sr.kind='confirm')::integer,
    count(*) filter (where sr.kind='gone')::integer,
    count(*) filter (where sr.kind='helpful')::integer
    into v_confirm,v_gone,v_helpful
  from public.signal_reactions sr
  join public.signal_posts sp on sp.id=sr.post_id
  where sp.incident_id=p_incident and coalesce(sp.is_removed,false)=false;

  select count(*)::integer,
         count(*) filter (where source_type='official_api')::integer,
         count(*) filter (where source_type='partner_api')::integer,
         count(*) filter (where source_type='public_storefront')::integer,
         count(*) filter (where available=true and evidence_kind in ('availability','listing'))::integer,
         count(*) filter (where available=false or evidence_kind='gone')::integer,
         coalesce(round(avg(confidence))::integer,0),
         min(observed_at), max(observed_at),
         coalesce(array_agg(distinct source_name) filter (where source_name<>''),'{}'::text[])
    into v_source_count,v_official,v_partner,v_storefront,v_source_live,v_source_gone,v_source_conf,v_source_first,v_source_last,v_source_names
  from public.source_observations
  where incident_id=p_incident and expires_at>now() and source_type<>'retailer_check';

  v_reports := coalesce(v_reports,0);
  v_reporters := coalesce(v_reporters,0);
  v_confirm := coalesce(v_confirm,0);
  v_gone := coalesce(v_gone,0);
  v_helpful := coalesce(v_helpful,0);
  v_source_count := coalesce(v_source_count,0);
  v_official := coalesce(v_official,0);
  v_partner := coalesce(v_partner,0);
  v_storefront := coalesce(v_storefront,0);
  v_source_live := coalesce(v_source_live,0);
  v_source_gone := coalesce(v_source_gone,0);
  v_source_conf := coalesce(v_source_conf,0);

  v_conf := greatest(0,least(100,
      42
      + case when upper(coalesce(v_latest_type,'')) in ('DROP','FOUND','CHECKOUT','LIMIT','DEAL') then 12 else 0 end
      + least(v_reporters*8,24)
      + least(greatest(v_reports-1,0)*4,16)
      + least(v_confirm*6,24)
      + least(v_helpful*2,8)
      - least(v_gone*10,30)
      + least(v_official*28,34)
      + least(v_partner*24,30)
      + least(v_storefront*14,22)
      + least(greatest(v_source_count-1,0)*4,12)
      + case when v_source_conf>=90 then 10 when v_source_conf>=75 then 7 when v_source_conf>=60 then 4 else 0 end
      - least(v_source_gone*5,15)
  ));

  if v_gone >= 2 and v_gone > v_confirm and v_source_live=0 then
    v_status := 'GONE';
  elsif v_conf >= 60 and (upper(coalesce(v_latest_type,'')) in ('DROP','FOUND','CHECKOUT','LIMIT','DEAL') or v_source_live>0) then
    v_status := 'LIVE';
  else
    v_status := 'WATCH';
  end if;

  update public.signal_incidents
  set report_count=v_reports,
      reporter_count=v_reporters,
      confirm_count=v_confirm,
      gone_count=v_gone,
      helpful_count=v_helpful,
      source_evidence_count=v_source_count,
      official_evidence_count=v_official,
      partner_evidence_count=v_partner,
      storefront_evidence_count=v_storefront,
      automated_live_count=v_source_live,
      automated_gone_count=v_source_gone,
      source_confidence=v_source_conf,
      source_names=v_source_names,
      first_post_id=v_first_post,
      latest_post_id=v_latest_post,
      last_post_type=coalesce(v_latest_type,''),
      first_seen_at=least(coalesce(v_community_first,v_source_first,first_seen_at),coalesce(v_source_first,v_community_first,first_seen_at)),
      last_seen_at=greatest(coalesce(v_community_last,v_source_last,last_seen_at),coalesce(v_source_last,v_community_last,last_seen_at)),
      confidence=v_conf,
      status=v_status,
      updated_at=now()
  where id=p_incident
  returning * into v_result;

  return v_result;
end;
$$;
revoke all on function public.refresh_signal_incident(uuid) from public, anon, authenticated;
grant execute on function public.refresh_signal_incident(uuid) to service_role;

create or replace function public.link_source_observation_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident public.signal_incidents;
  v_product text;
begin
  new.normalized_product := public.vaultsignal_normalize_signal(coalesce(nullif(trim(new.product),''),'Source observation'));
  new.normalized_retailer := public.vaultsignal_normalize_signal(new.retailer);
  new.normalized_region := public.vaultsignal_normalize_signal(new.region);

  if new.source_type='retailer_check' or new.evidence_kind in ('unknown','price') then
    return new;
  end if;

  v_product := coalesce(nullif(trim(new.product),''),'Source observation');
  select * into v_incident
  from public.signal_incidents i
  where i.room=new.room
    and i.normalized_product=new.normalized_product
    and i.normalized_retailer=new.normalized_retailer
    and (new.room<>'local-finds' or i.normalized_region=new.normalized_region)
    and i.last_seen_at>now()-interval '90 minutes'
    and (i.status<>'GONE' or i.last_seen_at>now()-interval '15 minutes')
  order by i.last_seen_at desc
  limit 1
  for update;

  if v_incident.id is null then
    insert into public.signal_incidents(room,product,retailer,region,normalized_product,normalized_retailer,normalized_region,status,confidence,first_seen_at,last_seen_at)
    values(new.room,v_product,new.retailer,new.region,new.normalized_product,new.normalized_retailer,new.normalized_region,'WATCH',0,new.observed_at,new.observed_at)
    returning * into v_incident;
  else
    update public.signal_incidents
      set product=case when product='' then v_product else product end,
          retailer=case when retailer='' then new.retailer else retailer end,
          region=case when region='' then new.region else region end,
          last_seen_at=greatest(last_seen_at,new.observed_at),
          updated_at=now()
      where id=v_incident.id;
  end if;

  new.incident_id := v_incident.id;
  return new;
end;
$$;
revoke all on function public.link_source_observation_before_insert() from public, anon, authenticated;

create or replace function public.refresh_incident_after_source_observation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.signal_incidents;
  v_after public.signal_incidents;
  v_event jsonb;
  v_should_alert boolean := false;
begin
  if new.incident_id is null then return new; end if;
  select * into v_before from public.signal_incidents where id=new.incident_id for update;
  select * into v_after from public.refresh_signal_incident(new.incident_id);

  v_should_alert := coalesce(v_before.status,'') is distinct from v_after.status
    or (v_before.confidence<70 and v_after.confidence>=70)
    or (v_before.confidence<85 and v_after.confidence>=85);

  if v_should_alert and (v_after.last_alerted_at is null or v_after.last_alerted_at<now()-interval '2 minutes') then
    v_event := jsonb_build_object(
      'room',new.room,
      'type',case when new.available=true then 'DROP' when new.available=false then 'SOLD OUT' else 'INFO' end,
      'title','Automated source evidence',
      'product',new.product,
      'retailer',new.retailer,
      'region',new.region,
      'body',new.source_name||' • '||new.source_type
    );
    perform public.vaultsignal_http_dispatch(v_event,to_jsonb(v_after));
    update public.signal_incidents set last_alerted_at=now() where id=new.incident_id;
  end if;
  return new;
end;
$$;
revoke all on function public.refresh_incident_after_source_observation() from public, anon, authenticated;

drop trigger if exists source_mesh_link_before_insert on public.source_observations;
create trigger source_mesh_link_before_insert before insert on public.source_observations
for each row execute function public.link_source_observation_before_insert();

drop trigger if exists source_mesh_refresh_after_insert on public.source_observations;
create trigger source_mesh_refresh_after_insert after insert on public.source_observations
for each row execute function public.refresh_incident_after_source_observation();

-- Automated evidence is intentionally separate from human reports.
-- Retailer search/check links never count as stock. Exact household location is not stored here.
