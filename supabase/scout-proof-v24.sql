-- VaultSignal v24 Scout Proof Engine
-- Evidence-backed Hunt Mission verification. Scouts cannot self-assign proof states.

alter table public.hunt_mission_checkins
  add column if not exists verification_state text not null default 'UNVERIFIED',
  add column if not exists verification_score integer not null default 0,
  add column if not exists verification_reason text not null default '',
  add column if not exists independent_confirmations integer not null default 0,
  add column if not exists source_matches integer not null default 0,
  add column if not exists last_verified_at timestamptz;

do $$ begin
  if not exists(select 1 from pg_constraint where conname='hunt_checkin_verification_state_check') then
    alter table public.hunt_mission_checkins add constraint hunt_checkin_verification_state_check
      check (verification_state in ('UNVERIFIED','CORROBORATED','SOURCE_VERIFIED','CONFLICTED','OBSERVATION'));
  end if;
  if not exists(select 1 from pg_constraint where conname='hunt_checkin_verification_score_check') then
    alter table public.hunt_mission_checkins add constraint hunt_checkin_verification_score_check
      check (verification_score between 0 and 100);
  end if;
  if not exists(select 1 from pg_constraint where conname='hunt_checkin_verification_reason_len') then
    alter table public.hunt_mission_checkins add constraint hunt_checkin_verification_reason_len
      check (char_length(verification_reason)<=240);
  end if;
end $$;

create index if not exists hunt_checkins_proof_state_idx
  on public.hunt_mission_checkins(verification_state,verification_score desc,created_at desc);

create or replace function public.calculate_hunt_checkin_proof(
  p_mission uuid,
  p_user uuid,
  p_result text,
  p_retailer text,
  p_store_label text,
  p_region text,
  p_created_at timestamptz,
  p_source_observation uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  product_key text:='';
  retailer_key text:=public.vaultsignal_normalize_signal(coalesce(p_retailer,''));
  region_key text:=public.vaultsignal_normalize_signal(coalesce(p_region,''));
  store_key text:=public.vaultsignal_normalize_signal(coalesce(p_store_label,''));
  result_key text:=upper(coalesce(p_result,'INFO'));
  source_live integer:=0;
  source_gone integer:=0;
  independent integer:=0;
  conflicts integer:=0;
  state text:='OBSERVATION';
  score integer:=0;
  reason text:='Routine scout observation.';
  at_time timestamptz:=coalesce(p_created_at,now());
begin
  select normalized_product into product_key from public.hunt_missions where id=p_mission;
  if coalesce(product_key,'')='' then
    return jsonb_build_object('state','UNVERIFIED','score',0,'reason','Mission product unavailable.','independent',0,'sources',0);
  end if;

  select
    count(*) filter(where o.available=true)::integer,
    count(*) filter(where o.available=false or o.evidence_kind='gone' or lower(coalesce(o.status,'')) in ('out_of_stock','sold_out','unavailable'))::integer
  into source_live,source_gone
  from public.source_observations o
  where o.normalized_product=product_key
    and o.source_type<>'retailer_check'
    and (
      o.observed_at between at_time-interval '45 minutes' and at_time+interval '45 minutes'
      or (p_source_observation is not null and o.id=p_source_observation)
    )
    and (
      retailer_key=''
      or coalesce(o.normalized_retailer,'')=''
      or o.normalized_retailer=retailer_key
      or position(o.normalized_retailer in retailer_key)>0
      or position(retailer_key in o.normalized_retailer)>0
    )
    and (
      (coalesce(p_region,'Online')='Online' and coalesce(o.normalized_region,'') in ('','online'))
      or (coalesce(p_region,'Online')<>'Online' and o.normalized_region=region_key)
    );

  select count(distinct c.user_id)::integer into independent
  from public.hunt_mission_checkins c
  where c.mission_id=p_mission
    and c.user_id<>p_user
    and upper(c.result)=result_key
    and c.created_at between at_time-interval '90 minutes' and at_time+interval '90 minutes';

  if store_key<>'' and result_key in ('FOUND','SOLD_OUT') then
    select count(distinct c.user_id)::integer into conflicts
    from public.hunt_mission_checkins c
    where c.mission_id=p_mission
      and c.user_id<>p_user
      and public.vaultsignal_normalize_signal(c.store_label)=store_key
      and c.created_at between at_time-interval '30 minutes' and at_time+interval '30 minutes'
      and ((result_key='FOUND' and c.result='SOLD_OUT') or (result_key='SOLD_OUT' and c.result='FOUND'));
  end if;

  if result_key='FOUND' then
    if source_live>0 then
      state:='SOURCE_VERIFIED'; score:=least(99,92+least(source_live,3)*2);
      reason:=format('%s fresh provider source%s supported availability.',source_live,case when source_live=1 then '' else 's' end);
    elsif conflicts>0 and independent=0 then
      state:='CONFLICTED'; score:=35;
      reason:='A conflicting scout report exists for the same public store; confirmation is needed.';
    elsif independent>0 then
      state:='CORROBORATED'; score:=least(94,82+least(independent,2)*6);
      reason:=format('%s independent scout%s reported the same outcome nearby in time.',independent,case when independent=1 then '' else 's' end);
    else
      state:='UNVERIFIED'; score:=62;
      reason:='Single-scout FOUND report awaiting independent or provider confirmation.';
    end if;
  elsif result_key='SOLD_OUT' then
    if source_gone>0 then
      state:='SOURCE_VERIFIED'; score:=least(96,88+least(source_gone,3)*2);
      reason:=format('%s fresh provider source%s supported unavailable status.',source_gone,case when source_gone=1 then '' else 's' end);
    elsif conflicts>0 and independent=0 then
      state:='CONFLICTED'; score:=30;
      reason:='A conflicting FOUND report exists for the same public store; confirmation is needed.';
    elsif independent>0 then
      state:='CORROBORATED'; score:=least(90,78+least(independent,2)*6);
      reason:=format('%s independent scout%s reported the same outcome nearby in time.',independent,case when independent=1 then '' else 's' end);
    else
      state:='UNVERIFIED'; score:=55;
      reason:='Single-scout SOLD OUT report; this does not prove the entire region is sold out.';
    end if;
  elsif result_key='NOT_FOUND' then
    state:='OBSERVATION'; score:=45;
    reason:='Single-store observation only; it never declares the broader region sold out.';
  else
    state:='OBSERVATION'; score:=0;
    reason:='Routine mission activity; no availability claim to verify.';
  end if;

  return jsonb_build_object(
    'state',state,'score',score,'reason',reason,
    'independent',coalesce(independent,0),
    'sources',case when result_key='FOUND' then coalesce(source_live,0) when result_key='SOLD_OUT' then coalesce(source_gone,0) else 0 end
  );
end;
$$;
revoke all on function public.calculate_hunt_checkin_proof(uuid,uuid,text,text,text,text,timestamptz,uuid) from public,anon,authenticated;

create or replace function public.prepare_hunt_checkin_proof()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare proof jsonb;
begin
  proof:=public.calculate_hunt_checkin_proof(new.mission_id,new.user_id,new.result,new.retailer,new.store_label,new.broad_region,coalesce(new.created_at,now()),new.source_observation_id);
  new.verification_state:=coalesce(proof->>'state','UNVERIFIED');
  new.verification_score:=coalesce((proof->>'score')::integer,0);
  new.verification_reason:=left(coalesce(proof->>'reason',''),240);
  new.independent_confirmations:=coalesce((proof->>'independent')::integer,0);
  new.source_matches:=coalesce((proof->>'sources')::integer,0);
  new.last_verified_at:=now();
  return new;
end;
$$;
revoke all on function public.prepare_hunt_checkin_proof() from public,anon,authenticated;

drop trigger if exists hunt_proof_before_insert on public.hunt_mission_checkins;
create trigger hunt_proof_before_insert
before insert on public.hunt_mission_checkins
for each row execute function public.prepare_hunt_checkin_proof();

create or replace function public.refresh_hunt_mission_proof(p_mission uuid)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare r record; proof jsonb; changed integer:=0;
begin
  for r in
    select * from public.hunt_mission_checkins
    where mission_id=p_mission and result in ('FOUND','SOLD_OUT') and created_at>now()-interval '24 hours'
    order by created_at
  loop
    proof:=public.calculate_hunt_checkin_proof(r.mission_id,r.user_id,r.result,r.retailer,r.store_label,r.broad_region,r.created_at,r.source_observation_id);
    update public.hunt_mission_checkins
    set verification_state=coalesce(proof->>'state','UNVERIFIED'),
        verification_score=coalesce((proof->>'score')::integer,0),
        verification_reason=left(coalesce(proof->>'reason',''),240),
        independent_confirmations=coalesce((proof->>'independent')::integer,0),
        source_matches=coalesce((proof->>'sources')::integer,0),
        last_verified_at=now()
    where id=r.id and (
      verification_state is distinct from coalesce(proof->>'state','UNVERIFIED')
      or verification_score is distinct from coalesce((proof->>'score')::integer,0)
      or independent_confirmations is distinct from coalesce((proof->>'independent')::integer,0)
      or source_matches is distinct from coalesce((proof->>'sources')::integer,0)
    );
    if found then changed:=changed+1; end if;
  end loop;
  return changed;
end;
$$;
revoke all on function public.refresh_hunt_mission_proof(uuid) from public,anon,authenticated;
grant execute on function public.refresh_hunt_mission_proof(uuid) to service_role;

create or replace function public.refresh_hunt_proof_after_change()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.refresh_hunt_mission_proof(case when tg_op='DELETE' then old.mission_id else new.mission_id end);
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function public.refresh_hunt_proof_after_change() from public,anon,authenticated;

drop trigger if exists hunt_proof_refresh_after_insert on public.hunt_mission_checkins;
create trigger hunt_proof_refresh_after_insert
after insert on public.hunt_mission_checkins
for each row execute function public.refresh_hunt_proof_after_change();

drop trigger if exists hunt_proof_refresh_after_delete on public.hunt_mission_checkins;
create trigger hunt_proof_refresh_after_delete
after delete on public.hunt_mission_checkins
for each row execute function public.refresh_hunt_proof_after_change();

-- If a previously unverified claim becomes corroborated/source-verified later, the mission team can receive a proof-upgrade alert.
drop trigger if exists hunt_push_after_proof_upgrade on public.hunt_mission_checkins;
create trigger hunt_push_after_proof_upgrade
after update of verification_state on public.hunt_mission_checkins
for each row
when (old.verification_state is distinct from new.verification_state and new.verification_state in ('CORROBORATED','SOURCE_VERIFIED'))
execute function public.dispatch_hunt_mission_checkin();

create or replace function public.refresh_recent_hunt_proofs()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare m record; total integer:=0; n integer;
begin
  for m in select distinct mission_id from public.hunt_mission_checkins where created_at>now()-interval '24 hours' and result in ('FOUND','SOLD_OUT')
  loop
    n:=public.refresh_hunt_mission_proof(m.mission_id); total:=total+coalesce(n,0);
  end loop;
  return total;
end;
$$;
revoke all on function public.refresh_recent_hunt_proofs() from public,anon,authenticated;

do $$ declare j record; begin
  for j in select jobid from cron.job where jobname='vaultsignal-scout-proof-refresh' loop perform cron.unschedule(j.jobid); end loop;
  perform cron.schedule('vaultsignal-scout-proof-refresh','1-59/5 * * * *','select public.refresh_recent_hunt_proofs();');
end $$;

create or replace view public.hunt_scout_trust
with (security_invoker=true)
as
with claims as (
  select user_id,
    count(*)::integer as claim_count,
    count(*) filter(where verification_state='SOURCE_VERIFIED')::integer as source_verified_count,
    count(*) filter(where verification_state='CORROBORATED')::integer as corroborated_count,
    count(*) filter(where verification_state='CONFLICTED')::integer as conflicted_count,
    round(avg(verification_score))::integer as average_proof_score
  from public.hunt_mission_checkins
  where result in ('FOUND','SOLD_OUT')
  group by user_id
)
select user_id,claim_count,source_verified_count,corroborated_count,conflicted_count,
  case when claim_count>=3 then greatest(20,least(99,average_proof_score)) else 0 end as proof_score,
  claim_count>=3 as public_visible
from claims;

grant select on public.hunt_scout_trust to authenticated;

-- Backfill recent claims and let the proof engine re-evaluate them against existing Source Mesh evidence.
select public.refresh_recent_hunt_proofs();
