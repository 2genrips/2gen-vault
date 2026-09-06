-- VaultSignal v23 Hunt Mission targeted push dispatch.
-- Only FOUND and SOLD_OUT check-ins wake joined mission scouts; routine collaboration stays in-app/realtime.

alter table public.signal_push_deliveries add column if not exists mission_id uuid references public.hunt_missions(id) on delete set null;
alter table public.signal_push_deliveries add column if not exists mission_checkin_id uuid references public.hunt_mission_checkins(id) on delete set null;
create index if not exists signal_push_deliveries_mission_idx on public.signal_push_deliveries(mission_id,created_at desc);

create or replace function public.dispatch_hunt_mission_checkin()
returns trigger
language plpgsql
security definer
set search_path=public,vault,extensions
as $$
declare
  push_secret text;
  m public.hunt_missions;
  request_id bigint;
begin
  if new.result not in ('FOUND','SOLD_OUT') then return new; end if;
  select * into m from public.hunt_missions where id=new.mission_id;
  if m.id is null then return new; end if;

  select decrypted_secret into push_secret from vault.decrypted_secrets
  where name='vaultsignal_signal_push_webhook_secret' limit 1;
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
revoke all on function public.dispatch_hunt_mission_checkin() from public,anon,authenticated;

drop trigger if exists hunt_push_after_checkin on public.hunt_mission_checkins;
create trigger hunt_push_after_checkin
after insert on public.hunt_mission_checkins
for each row execute function public.dispatch_hunt_mission_checkin();
