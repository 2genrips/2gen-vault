-- VaultSignal v25 Store Intel trusted follower alerts.
-- Store followers never receive UNVERIFIED or CONFLICTED availability claims.

create or replace function public.vaultsignal_store_http_dispatch(p_mission jsonb,p_checkin jsonb)
returns bigint
language plpgsql
security definer
set search_path=public,vault,extensions
as $$
declare push_secret text; request_id bigint;
begin
  perform public.refresh_store_intel();
  select decrypted_secret into push_secret from vault.decrypted_secrets
  where name='vaultsignal_signal_push_webhook_secret' limit 1;
  if coalesce(push_secret,'')='' then return null; end if;
  select net.http_post(
    url:='https://ztesewpipghbkvtbidry.supabase.co/functions/v1/store-push',
    headers:=jsonb_build_object('Content-Type','application/json','x-vaultsignal-secret',push_secret),
    body:=jsonb_build_object('mission',p_mission,'checkin',p_checkin),
    timeout_milliseconds:=5000
  ) into request_id;
  return request_id;
end;
$$;
revoke all on function public.vaultsignal_store_http_dispatch(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.vaultsignal_store_http_dispatch(jsonb,jsonb) to service_role;

create or replace function public.dispatch_store_follow_insert()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare m public.hunt_missions;
begin
  if new.result not in ('FOUND','SOLD_OUT')
     or new.verification_state not in ('CORROBORATED','SOURCE_VERIFIED') then
    return new;
  end if;
  select * into m from public.hunt_missions where id=new.mission_id;
  if m.id is null then return new; end if;
  if not public.store_intel_label_safe(coalesce(nullif(new.retailer,''),nullif(m.retailer,''),''),new.store_label) then return new; end if;
  perform public.vaultsignal_store_http_dispatch(to_jsonb(m),to_jsonb(new));
  return new;
end;
$$;
revoke all on function public.dispatch_store_follow_insert() from public,anon,authenticated;

drop trigger if exists store_follow_push_after_insert on public.hunt_mission_checkins;
create trigger store_follow_push_after_insert
after insert on public.hunt_mission_checkins
for each row execute function public.dispatch_store_follow_insert();

create or replace function public.dispatch_latest_store_source_verification()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  m public.hunt_missions;
  store_key text:=public.vaultsignal_normalize_signal(coalesce(new.store_label,''));
  retailer_key text:=public.vaultsignal_normalize_signal(coalesce(new.retailer,''));
begin
  if old.verification_state is not distinct from new.verification_state
     or new.verification_state<>'SOURCE_VERIFIED'
     or new.result not in ('FOUND','SOLD_OUT') then return new; end if;

  select * into m from public.hunt_missions where id=new.mission_id;
  if m.id is null then return new; end if;
  if not public.store_intel_label_safe(coalesce(nullif(new.retailer,''),nullif(m.retailer,''),''),new.store_label) then return new; end if;

  -- Only the newest matching public-store claim gets the late verification follow-up.
  if exists(
    select 1 from public.hunt_mission_checkins c
    where c.mission_id=new.mission_id and c.id<>new.id and c.result=new.result
      and c.created_at>new.created_at
      and (
        (store_key<>'' and public.vaultsignal_normalize_signal(c.store_label)=store_key)
        or (store_key='' and public.vaultsignal_normalize_signal(c.retailer)=retailer_key and c.broad_region=new.broad_region)
      )
  ) then return new; end if;

  perform public.vaultsignal_store_http_dispatch(to_jsonb(m),to_jsonb(new));
  return new;
end;
$$;
revoke all on function public.dispatch_latest_store_source_verification() from public,anon,authenticated;

drop trigger if exists store_follow_push_after_source_verification on public.hunt_mission_checkins;
create trigger store_follow_push_after_source_verification
after update of verification_state on public.hunt_mission_checkins
for each row
when (old.verification_state is distinct from new.verification_state and new.verification_state='SOURCE_VERIFIED')
execute function public.dispatch_latest_store_source_verification();
