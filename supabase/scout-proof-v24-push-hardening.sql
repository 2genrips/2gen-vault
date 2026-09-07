-- VaultSignal v24 Scout Proof push hardening.
-- A new independent corroborating check-in already carries its own CORROBORATED alert.
-- Only late SOURCE_VERIFIED upgrades can create a follow-up, and only for the latest matching public-store claim.

drop trigger if exists hunt_push_after_proof_upgrade on public.hunt_mission_checkins;

create or replace function public.dispatch_latest_hunt_source_verification()
returns trigger
language plpgsql
security definer
set search_path=public,vault,extensions
as $$
declare
  push_secret text;
  m public.hunt_missions;
  request_id bigint;
  store_key text:=public.vaultsignal_normalize_signal(coalesce(new.store_label,''));
  retailer_key text:=public.vaultsignal_normalize_signal(coalesce(new.retailer,''));
begin
  if old.verification_state is not distinct from new.verification_state
     or new.verification_state<>'SOURCE_VERIFIED'
     or new.result not in ('FOUND','SOLD_OUT') then
    return new;
  end if;

  -- Do not emit multiple verification upgrades for the same store/outcome cluster.
  if exists(
    select 1 from public.hunt_mission_checkins c
    where c.mission_id=new.mission_id
      and c.id<>new.id
      and c.result=new.result
      and c.created_at>new.created_at
      and (
        (store_key<>'' and public.vaultsignal_normalize_signal(c.store_label)=store_key)
        or (
          store_key=''
          and public.vaultsignal_normalize_signal(c.retailer)=retailer_key
          and c.broad_region=new.broad_region
        )
      )
  ) then
    return new;
  end if;

  select * into m from public.hunt_missions where id=new.mission_id;
  if m.id is null then return new; end if;

  select decrypted_secret into push_secret
  from vault.decrypted_secrets
  where name='vaultsignal_signal_push_webhook_secret'
  limit 1;
  if coalesce(push_secret,'')='' then return new; end if;

  select net.http_post(
    url := 'https://ztesewpipghbkvtbidry.supabase.co/functions/v1/signal-push',
    headers := jsonb_build_object('Content-Type','application/json','x-vaultsignal-secret',push_secret),
    body := jsonb_build_object('mission',to_jsonb(m),'checkin',to_jsonb(new)),
    timeout_milliseconds := 5000
  ) into request_id;

  return new;
end;
$$;
revoke all on function public.dispatch_latest_hunt_source_verification() from public,anon,authenticated;

drop trigger if exists hunt_push_after_source_verification on public.hunt_mission_checkins;
create trigger hunt_push_after_source_verification
after update of verification_state on public.hunt_mission_checkins
for each row
when (old.verification_state is distinct from new.verification_state and new.verification_state='SOURCE_VERIFIED')
execute function public.dispatch_latest_hunt_source_verification();
