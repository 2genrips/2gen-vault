-- VaultSignal v22 Demand Radar
-- Privacy-safe aggregate collector attention + availability intelligence.
-- Raw user watch terms never appear in this table. Shared watcher counts require >=3 distinct collectors.

create table if not exists public.demand_radar (
  normalized_product text primary key,
  product text not null,
  game text not null default '',
  heat_score integer not null default 0 check (heat_score between 0 and 100),
  heat_state text not null default 'QUIET' check (heat_state in ('SURGING','HOT','ACTIVE','COOLING','QUIET')),
  momentum integer not null default 0 check (momentum between -100 and 100),
  watcher_count integer not null default 0,
  watch_interest_visible boolean not null default false,
  incidents_6h integer not null default 0,
  incidents_prev_6h integer not null default 0,
  live_incidents integer not null default 0,
  collector_reports integer not null default 0,
  independent_collectors integer not null default 0,
  confirmations integer not null default 0,
  gone_reports integer not null default 0,
  source_evidence integer not null default 0,
  official_evidence integer not null default 0,
  partner_evidence integer not null default 0,
  storefront_evidence integer not null default 0,
  source_live integer not null default 0,
  source_gone integer not null default 0,
  first_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint demand_radar_product_len check (char_length(product) between 1 and 160)
);

create index if not exists demand_radar_heat_idx on public.demand_radar(heat_score desc,updated_at desc);
create index if not exists demand_radar_state_idx on public.demand_radar(heat_state,heat_score desc);

alter table public.demand_radar enable row level security;
grant select on public.demand_radar to authenticated;
grant all on public.demand_radar to service_role;

drop policy if exists "demand radar readable by authenticated" on public.demand_radar;
create policy "demand radar readable by authenticated" on public.demand_radar
for select to authenticated using (true);

drop policy if exists "service role manages demand radar" on public.demand_radar;
create policy "service role manages demand radar" on public.demand_radar
for all to service_role using (true) with check (true);

create or replace function public.refresh_demand_radar()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
begin
  with raw_watch as (
    select np.user_id,
           public.vaultsignal_normalize_signal(term) as term
    from public.notification_preferences np
    cross join lateral unnest(coalesce(np.watch_terms,'{}'::text[])) term
    where char_length(public.vaultsignal_normalize_signal(term)) >= 3
  ),
  watch_seed as (
    select term as normalized_product,
           min(term) as product,
           count(distinct user_id)::integer as watchers
    from raw_watch
    group by term
    having count(distinct user_id) >= 3
  ),
  candidates as (
    select distinct on (normalized_product)
      normalized_product,
      product
    from (
      select i.normalized_product, i.product, 1 as priority
      from public.signal_incidents i
      where i.normalized_product<>'' and i.last_seen_at > now()-interval '24 hours'
      union all
      select o.normalized_product, o.product, 2
      from public.source_observations o
      where o.normalized_product<>'' and o.observed_at > now()-interval '24 hours'
      union all
      select w.normalized_product, w.product, 3
      from watch_seed w
    ) x
    order by normalized_product, priority
  ),
  metrics as (
    select
      c.normalized_product,
      c.product,
      coalesce((select max(o.game) filter (where o.game<>'') from public.source_observations o
                where o.observed_at>now()-interval '24 hours'
                  and (o.normalized_product=c.normalized_product
                       or position(o.normalized_product in c.normalized_product)>0
                       or position(c.normalized_product in o.normalized_product)>0)), '') as game,
      coalesce((select count(distinct w.user_id)::integer from raw_watch w
                where w.term=c.normalized_product
                   or position(w.term in c.normalized_product)>0
                   or position(c.normalized_product in w.term)>0),0) as raw_watchers,
      coalesce((select count(*)::integer from public.signal_incidents i
                where i.last_seen_at>now()-interval '6 hours'
                  and (i.normalized_product=c.normalized_product
                       or position(i.normalized_product in c.normalized_product)>0
                       or position(c.normalized_product in i.normalized_product)>0)),0) as incidents_6h,
      coalesce((select count(*)::integer from public.signal_incidents i
                where i.last_seen_at>now()-interval '12 hours'
                  and i.last_seen_at<=now()-interval '6 hours'
                  and (i.normalized_product=c.normalized_product
                       or position(i.normalized_product in c.normalized_product)>0
                       or position(c.normalized_product in i.normalized_product)>0)),0) as incidents_prev_6h,
      coalesce((select count(*)::integer from public.signal_incidents i
                where i.status='LIVE' and i.last_seen_at>now()-interval '90 minutes'
                  and (i.normalized_product=c.normalized_product
                       or position(i.normalized_product in c.normalized_product)>0
                       or position(c.normalized_product in i.normalized_product)>0)),0) as live_incidents,
      coalesce((select sum(i.report_count)::integer from public.signal_incidents i
                where i.last_seen_at>now()-interval '6 hours'
                  and (i.normalized_product=c.normalized_product
                       or position(i.normalized_product in c.normalized_product)>0
                       or position(c.normalized_product in i.normalized_product)>0)),0) as collector_reports,
      coalesce((select sum(i.reporter_count)::integer from public.signal_incidents i
                where i.last_seen_at>now()-interval '6 hours'
                  and (i.normalized_product=c.normalized_product
                       or position(i.normalized_product in c.normalized_product)>0
                       or position(c.normalized_product in i.normalized_product)>0)),0) as independent_collectors,
      coalesce((select sum(i.confirm_count)::integer from public.signal_incidents i
                where i.last_seen_at>now()-interval '6 hours'
                  and (i.normalized_product=c.normalized_product
                       or position(i.normalized_product in c.normalized_product)>0
                       or position(c.normalized_product in i.normalized_product)>0)),0) as confirmations,
      coalesce((select sum(i.gone_count)::integer from public.signal_incidents i
                where i.last_seen_at>now()-interval '6 hours'
                  and (i.normalized_product=c.normalized_product
                       or position(i.normalized_product in c.normalized_product)>0
                       or position(c.normalized_product in i.normalized_product)>0)),0) as gone_reports,
      coalesce((select count(*)::integer from public.source_observations o
                where o.expires_at>now() and o.source_type<>'retailer_check'
                  and (o.normalized_product=c.normalized_product
                       or position(o.normalized_product in c.normalized_product)>0
                       or position(c.normalized_product in o.normalized_product)>0)),0) as source_evidence,
      coalesce((select count(*)::integer from public.source_observations o
                where o.expires_at>now() and o.source_type='official_api'
                  and (o.normalized_product=c.normalized_product
                       or position(o.normalized_product in c.normalized_product)>0
                       or position(c.normalized_product in o.normalized_product)>0)),0) as official_evidence,
      coalesce((select count(*)::integer from public.source_observations o
                where o.expires_at>now() and o.source_type='partner_api'
                  and (o.normalized_product=c.normalized_product
                       or position(o.normalized_product in c.normalized_product)>0
                       or position(c.normalized_product in o.normalized_product)>0)),0) as partner_evidence,
      coalesce((select count(*)::integer from public.source_observations o
                where o.expires_at>now() and o.source_type='public_storefront'
                  and (o.normalized_product=c.normalized_product
                       or position(o.normalized_product in c.normalized_product)>0
                       or position(c.normalized_product in o.normalized_product)>0)),0) as storefront_evidence,
      coalesce((select count(*)::integer from public.source_observations o
                where o.expires_at>now() and o.available=true and o.source_type<>'retailer_check'
                  and (o.normalized_product=c.normalized_product
                       or position(o.normalized_product in c.normalized_product)>0
                       or position(c.normalized_product in o.normalized_product)>0)),0) as source_live,
      coalesce((select count(*)::integer from public.source_observations o
                where o.expires_at>now() and (o.available=false or o.evidence_kind='gone') and o.source_type<>'retailer_check'
                  and (o.normalized_product=c.normalized_product
                       or position(o.normalized_product in c.normalized_product)>0
                       or position(c.normalized_product in o.normalized_product)>0)),0) as source_gone
    from candidates c
  ),
  scored as (
    select m.*,
      greatest(-100,least(100,(m.incidents_6h-m.incidents_prev_6h)*18 + least(m.independent_collectors,8)*3 - least(m.gone_reports,6)*4))::integer as momentum,
      greatest(0,least(100,
        least(m.live_incidents*18,36)
        + least(m.independent_collectors*5,20)
        + least(m.confirmations*4,16)
        + least(m.source_live*7,21)
        + least(m.official_evidence*12,24)
        + least(m.partner_evidence*10,20)
        + least(m.storefront_evidence*3,12)
        + case when m.raw_watchers>=3 then least(m.raw_watchers*4,20) else 0 end
        + greatest(0,least(18,(m.incidents_6h-m.incidents_prev_6h)*6))
        - least(m.gone_reports*5,20)
        - least(m.source_gone*3,12)
      ))::integer as heat_score
    from metrics m
  )
  insert into public.demand_radar(
    normalized_product,product,game,heat_score,heat_state,momentum,
    watcher_count,watch_interest_visible,incidents_6h,incidents_prev_6h,live_incidents,
    collector_reports,independent_collectors,confirmations,gone_reports,
    source_evidence,official_evidence,partner_evidence,storefront_evidence,source_live,source_gone,
    first_seen_at,updated_at
  )
  select
    s.normalized_product,s.product,s.game,s.heat_score,
    case when s.heat_score>=80 and s.momentum>0 then 'SURGING'
         when s.heat_score>=60 then 'HOT'
         when s.heat_score>=35 then 'ACTIVE'
         when s.heat_score>=15 then 'COOLING'
         else 'QUIET' end,
    s.momentum,
    case when s.raw_watchers>=3 then s.raw_watchers else 0 end,
    s.raw_watchers>=3,
    s.incidents_6h,s.incidents_prev_6h,s.live_incidents,
    s.collector_reports,s.independent_collectors,s.confirmations,s.gone_reports,
    s.source_evidence,s.official_evidence,s.partner_evidence,s.storefront_evidence,s.source_live,s.source_gone,
    now(),now()
  from scored s
  where s.heat_score>0 or s.raw_watchers>=3
  on conflict(normalized_product) do update set
    product=excluded.product,
    game=excluded.game,
    heat_score=excluded.heat_score,
    heat_state=excluded.heat_state,
    momentum=excluded.momentum,
    watcher_count=excluded.watcher_count,
    watch_interest_visible=excluded.watch_interest_visible,
    incidents_6h=excluded.incidents_6h,
    incidents_prev_6h=excluded.incidents_prev_6h,
    live_incidents=excluded.live_incidents,
    collector_reports=excluded.collector_reports,
    independent_collectors=excluded.independent_collectors,
    confirmations=excluded.confirmations,
    gone_reports=excluded.gone_reports,
    source_evidence=excluded.source_evidence,
    official_evidence=excluded.official_evidence,
    partner_evidence=excluded.partner_evidence,
    storefront_evidence=excluded.storefront_evidence,
    source_live=excluded.source_live,
    source_gone=excluded.source_gone,
    updated_at=now();

  get diagnostics v_rows = row_count;
  delete from public.demand_radar where updated_at < now()-interval '20 minutes';
  return v_rows;
end;
$$;

revoke all on function public.refresh_demand_radar() from public,anon,authenticated;
grant execute on function public.refresh_demand_radar() to service_role;

-- Refresh after Source Mesh, but independently enough that community-only incidents also appear.
do $$
declare j record;
begin
  for j in select jobid from cron.job where jobname='vaultsignal-demand-radar-refresh' loop
    perform cron.unschedule(j.jobid);
  end loop;
  perform cron.schedule('vaultsignal-demand-radar-refresh','2-59/5 * * * *','select public.refresh_demand_radar();');
end $$;

-- Seed immediately.
select public.refresh_demand_radar();
