-- VaultSignal v25 Store Intel refresh hardening.
-- Preserve follows for stores that continue to qualify by upserting in place instead of delete/reinsert.

create or replace function public.refresh_store_intel()
returns integer
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare affected integer:=0;
begin
  drop table if exists pg_temp.vaultsignal_store_intel_build;

  create temporary table vaultsignal_store_intel_build on commit drop as
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
  select
    a.store_key,a.retailer,a.store_label,a.broad_region,a.claim_count,a.trusted_claims,a.source_verified_claims,a.corroborated_claims,
    a.unverified_claims,a.conflicted_claims,a.found_claims,a.sold_out_claims,a.independent_scouts,a.product_count,a.average_proof_score,
    latest.result as latest_trusted_result,latest.created_at as latest_trusted_at,a.last_activity_at,
    coalesce((select array(select q.product from (
      select b2.product,max(b2.created_at) as last_seen
      from base b2
      where b2.store_key=a.store_key and b2.verification_state in ('SOURCE_VERIFIED','CORROBORATED') and coalesce(b2.product,'')<>''
      group by b2.product order by max(b2.created_at) desc limit 5
    ) q)),'{}'::text[]) as recent_products,
    a.trusted_claims>=3 as sample_ready,
    now() as updated_at
  from agg a
  left join lateral (
    select b.result,b.created_at from base b
    where b.store_key=a.store_key and b.verification_state in ('SOURCE_VERIFIED','CORROBORATED')
    order by b.created_at desc limit 1
  ) latest on true;

  insert into public.store_intel(
    store_key,retailer,store_label,broad_region,claim_count,trusted_claims,source_verified_claims,corroborated_claims,
    unverified_claims,conflicted_claims,found_claims,sold_out_claims,independent_scouts,product_count,average_proof_score,
    latest_trusted_result,latest_trusted_at,last_activity_at,recent_products,sample_ready,updated_at
  )
  select
    store_key,retailer,store_label,broad_region,claim_count,trusted_claims,source_verified_claims,corroborated_claims,
    unverified_claims,conflicted_claims,found_claims,sold_out_claims,independent_scouts,product_count,average_proof_score,
    latest_trusted_result,latest_trusted_at,last_activity_at,recent_products,sample_ready,updated_at
  from pg_temp.vaultsignal_store_intel_build
  on conflict(store_key) do update set
    retailer=excluded.retailer,
    store_label=excluded.store_label,
    broad_region=excluded.broad_region,
    claim_count=excluded.claim_count,
    trusted_claims=excluded.trusted_claims,
    source_verified_claims=excluded.source_verified_claims,
    corroborated_claims=excluded.corroborated_claims,
    unverified_claims=excluded.unverified_claims,
    conflicted_claims=excluded.conflicted_claims,
    found_claims=excluded.found_claims,
    sold_out_claims=excluded.sold_out_claims,
    independent_scouts=excluded.independent_scouts,
    product_count=excluded.product_count,
    average_proof_score=excluded.average_proof_score,
    latest_trusted_result=excluded.latest_trusted_result,
    latest_trusted_at=excluded.latest_trusted_at,
    last_activity_at=excluded.last_activity_at,
    recent_products=excluded.recent_products,
    sample_ready=excluded.sample_ready,
    updated_at=excluded.updated_at;
  get diagnostics affected=row_count;

  delete from public.store_intel s
  where not exists(select 1 from pg_temp.vaultsignal_store_intel_build b where b.store_key=s.store_key);

  return affected;
end;
$$;
revoke all on function public.refresh_store_intel() from public,anon,authenticated;
grant execute on function public.refresh_store_intel() to service_role;

select public.refresh_store_intel();
