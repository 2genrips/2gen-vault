-- VaultSignal v20 Signal Fusion
-- Clusters duplicate stock/deal reports into one live incident and dispatches only meaningful alert changes.

create table if not exists public.signal_incidents (
  id uuid primary key default gen_random_uuid(),
  room text not null check (room in ('pokemon-drops','local-finds','deals')),
  product text not null default '',
  retailer text not null default '',
  region text not null default '',
  normalized_product text not null default '',
  normalized_retailer text not null default '',
  normalized_region text not null default '',
  status text not null default 'WATCH' check (status in ('LIVE','WATCH','GONE')),
  confidence integer not null default 0 check (confidence between 0 and 100),
  report_count integer not null default 0,
  reporter_count integer not null default 0,
  confirm_count integer not null default 0,
  gone_count integer not null default 0,
  helpful_count integer not null default 0,
  first_post_id uuid,
  latest_post_id uuid,
  last_post_type text not null default '',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_alerted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint signal_incident_product_len check (char_length(product) <= 140),
  constraint signal_incident_retailer_len check (char_length(retailer) <= 80),
  constraint signal_incident_region_len check (char_length(region) <= 32)
);

create index if not exists signal_incidents_room_last_seen_idx on public.signal_incidents(room,last_seen_at desc);
create index if not exists signal_incidents_match_idx on public.signal_incidents(room,normalized_product,normalized_retailer,normalized_region,last_seen_at desc);

alter table public.signal_posts add column if not exists incident_id uuid references public.signal_incidents(id) on delete set null;
create index if not exists signal_posts_incident_created_idx on public.signal_posts(incident_id,created_at desc);

alter table public.signal_incidents enable row level security;
grant select on public.signal_incidents to authenticated;
drop policy if exists "signal incidents readable by authenticated" on public.signal_incidents;
create policy "signal incidents readable by authenticated" on public.signal_incidents for select to authenticated using (true);

alter table public.signal_push_deliveries add column if not exists incident_id uuid references public.signal_incidents(id) on delete set null;
alter table public.signal_push_deliveries add column if not exists event_key text not null default '';
create index if not exists signal_push_deliveries_incident_idx on public.signal_push_deliveries(incident_id,created_at desc);
create unique index if not exists signal_push_deliveries_event_subscription_uidx
  on public.signal_push_deliveries(event_key,subscription_id)
  where event_key <> '';

create or replace function public.vaultsignal_normalize_signal(value text)
returns text
language sql
immutable
parallel safe
as $$
  select trim(regexp_replace(lower(coalesce(value,'')), '[^a-z0-9]+', ' ', 'g'));
$$;
revoke all on function public.vaultsignal_normalize_signal(text) from public, anon;
grant execute on function public.vaultsignal_normalize_signal(text) to authenticated, service_role;

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
  v_first_seen timestamptz;
  v_last_seen timestamptz;
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
    into v_reports,v_reporters,v_first_seen,v_last_seen,v_first_post,v_latest_post,v_latest_type
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

  v_reports := coalesce(v_reports,0);
  v_reporters := coalesce(v_reporters,0);
  v_confirm := coalesce(v_confirm,0);
  v_gone := coalesce(v_gone,0);
  v_helpful := coalesce(v_helpful,0);

  v_conf := greatest(0,least(100,
      42
      + case when upper(coalesce(v_latest_type,'')) in ('DROP','FOUND','CHECKOUT','LIMIT','DEAL') then 12 else 0 end
      + least(v_reporters*8,24)
      + least(greatest(v_reports-1,0)*4,16)
      + least(v_confirm*6,24)
      + least(v_helpful*2,8)
      - least(v_gone*10,30)
  ));

  if v_gone >= 2 and v_gone > v_confirm then
    v_status := 'GONE';
  elsif v_conf >= 60 and upper(coalesce(v_latest_type,'')) in ('DROP','FOUND','CHECKOUT','LIMIT','DEAL') then
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
      first_post_id=v_first_post,
      latest_post_id=v_latest_post,
      last_post_type=coalesce(v_latest_type,''),
      first_seen_at=coalesce(v_first_seen,first_seen_at),
      last_seen_at=coalesce(v_last_seen,last_seen_at),
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

create or replace function public.vaultsignal_http_dispatch(p_post jsonb, p_incident jsonb default null)
returns bigint
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  push_secret text;
  request_id bigint;
begin
  select decrypted_secret into push_secret
  from vault.decrypted_secrets
  where name='vaultsignal_signal_push_webhook_secret'
  limit 1;
  if coalesce(push_secret,'')='' then return null; end if;

  select net.http_post(
    url := 'https://ztesewpipghbkvtbidry.supabase.co/functions/v1/signal-push',
    headers := jsonb_build_object('Content-Type','application/json','x-vaultsignal-secret',push_secret),
    body := jsonb_build_object('record',p_post,'incident',p_incident),
    timeout_milliseconds := 5000
  ) into request_id;
  return request_id;
end;
$$;
revoke all on function public.vaultsignal_http_dispatch(jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.vaultsignal_http_dispatch(jsonb,jsonb) to service_role;

create or replace function public.fuse_and_dispatch_signal_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident public.signal_incidents;
  v_before_status text;
  v_before_conf integer := 0;
  v_new_incident boolean := false;
  v_product text;
  v_np text;
  v_nr text;
  v_nregion text;
  v_post jsonb;
  v_should_alert boolean := false;
begin
  -- Non-stock community rooms keep normal per-post delivery behavior.
  if new.room not in ('pokemon-drops','local-finds','deals') then
    perform public.vaultsignal_http_dispatch(to_jsonb(new),null);
    return new;
  end if;

  v_product := coalesce(nullif(trim(new.product),''),nullif(trim(new.title),''),'Community signal');
  v_np := public.vaultsignal_normalize_signal(v_product);
  v_nr := public.vaultsignal_normalize_signal(new.retailer);
  v_nregion := public.vaultsignal_normalize_signal(new.region);

  select * into v_incident
  from public.signal_incidents i
  where i.room=new.room
    and i.normalized_product=v_np
    and i.normalized_retailer=v_nr
    and (new.room <> 'local-finds' or i.normalized_region=v_nregion)
    and i.last_seen_at > now()-interval '90 minutes'
    and (i.status <> 'GONE' or i.last_seen_at > now()-interval '15 minutes')
  order by i.last_seen_at desc
  limit 1
  for update;

  if v_incident.id is null then
    insert into public.signal_incidents(room,product,retailer,region,normalized_product,normalized_retailer,normalized_region,status,confidence,first_seen_at,last_seen_at)
    values(new.room,v_product,new.retailer,new.region,v_np,v_nr,v_nregion,'WATCH',0,new.created_at,new.created_at)
    returning * into v_incident;
    v_new_incident := true;
  else
    v_before_status := v_incident.status;
    v_before_conf := v_incident.confidence;
    update public.signal_incidents
      set product=case when product='' then v_product else product end,
          retailer=case when retailer='' then new.retailer else retailer end,
          region=case when region='' then new.region else region end,
          last_seen_at=greatest(last_seen_at,new.created_at),
          updated_at=now()
      where id=v_incident.id;
  end if;

  update public.signal_posts set incident_id=v_incident.id where id=new.id;
  select * into v_incident from public.refresh_signal_incident(v_incident.id);
  select to_jsonb(sp) into v_post from public.signal_posts sp where sp.id=new.id;

  v_should_alert := v_new_incident
    or coalesce(v_before_status,'') is distinct from v_incident.status
    or (v_before_conf < 70 and v_incident.confidence >= 70)
    or (v_before_conf < 85 and v_incident.confidence >= 85);

  if v_should_alert and (v_incident.last_alerted_at is null or v_incident.last_alerted_at < now()-interval '2 minutes') then
    perform public.vaultsignal_http_dispatch(v_post,to_jsonb(v_incident));
    update public.signal_incidents set last_alerted_at=now() where id=v_incident.id;
  end if;

  return new;
end;
$$;
revoke all on function public.fuse_and_dispatch_signal_post() from public, anon, authenticated;

create or replace function public.refresh_incident_after_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident_id uuid;
  v_before public.signal_incidents;
  v_after public.signal_incidents;
  v_latest jsonb;
  v_should_alert boolean := false;
begin
  select incident_id into v_incident_id from public.signal_posts where id=coalesce(new.post_id,old.post_id);
  if v_incident_id is null then return coalesce(new,old); end if;

  select * into v_before from public.signal_incidents where id=v_incident_id for update;
  select * into v_after from public.refresh_signal_incident(v_incident_id);

  v_should_alert := coalesce(v_before.status,'') is distinct from v_after.status
    or (v_before.confidence < 75 and v_after.confidence >= 75)
    or (v_before.confidence < 90 and v_after.confidence >= 90);

  if v_should_alert and (v_after.last_alerted_at is null or v_after.last_alerted_at < now()-interval '2 minutes') then
    select to_jsonb(sp) into v_latest from public.signal_posts sp where sp.id=v_after.latest_post_id;
    perform public.vaultsignal_http_dispatch(v_latest,to_jsonb(v_after));
    update public.signal_incidents set last_alerted_at=now() where id=v_incident_id;
  end if;
  return coalesce(new,old);
end;
$$;
revoke all on function public.refresh_incident_after_reaction() from public, anon, authenticated;

-- Replace v19's per-post stock dispatcher with fusion-aware delivery.
drop trigger if exists vaultsignal_signal_push_after_insert on public.signal_posts;
drop trigger if exists vaultsignal_signal_fusion_after_insert on public.signal_posts;
create trigger vaultsignal_signal_fusion_after_insert
after insert on public.signal_posts
for each row execute function public.fuse_and_dispatch_signal_post();

drop trigger if exists vaultsignal_signal_fusion_reaction_ins on public.signal_reactions;
create trigger vaultsignal_signal_fusion_reaction_ins
after insert on public.signal_reactions
for each row execute function public.refresh_incident_after_reaction();

drop trigger if exists vaultsignal_signal_fusion_reaction_del on public.signal_reactions;
create trigger vaultsignal_signal_fusion_reaction_del
after delete on public.signal_reactions
for each row execute function public.refresh_incident_after_reaction();

-- Incidents expose only broad community information already present in signal posts.
-- Exact household addresses, precise coordinates and private child-contact data must never be stored here.
