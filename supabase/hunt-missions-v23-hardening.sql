-- VaultSignal v23 Hunt Mission ownership hardening.

create or replace function public.guard_hunt_scout_leave()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if exists(select 1 from public.hunt_missions where id=old.mission_id and created_by=old.user_id) then
    raise exception 'mission owner remains on the scout team';
  end if;
  return old;
end;
$$;
revoke all on function public.guard_hunt_scout_leave() from public,anon,authenticated;

drop trigger if exists hunt_guard_scout_before_delete on public.hunt_mission_scouts;
create trigger hunt_guard_scout_before_delete before delete on public.hunt_mission_scouts
for each row execute function public.guard_hunt_scout_leave();
