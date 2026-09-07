-- VaultSignal v23 Hunt Mission security hardening.
-- Browser-callable owner RPCs use SECURITY INVOKER. A guarded owner UPDATE policy permits only safe mission fields.

grant update on public.hunt_missions to authenticated;

drop policy if exists "hunt missions update own guarded" on public.hunt_missions;
create policy "hunt missions update own guarded" on public.hunt_missions
for update to authenticated
using (created_by=auth.uid())
with check (created_by=auth.uid());

create or replace function public.guard_hunt_mission_client_update()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
declare
  details_changed boolean;
begin
  -- Server-side SECURITY DEFINER maintenance functions (effective role != authenticated)
  -- may refresh derived counters/status. Signed-in browser updates are tightly constrained.
  if current_user='authenticated' then
    if old.created_by<>auth.uid() then raise exception 'mission owner required'; end if;

    if new.id is distinct from old.id
       or new.created_by is distinct from old.created_by
       or new.product is distinct from old.product
       or new.normalized_product is distinct from old.normalized_product
       or new.game is distinct from old.game
       or new.scout_count is distinct from old.scout_count
       or new.checkin_count is distinct from old.checkin_count
       or new.found_count is distinct from old.found_count
       or new.not_found_count is distinct from old.not_found_count
       or new.sold_out_count is distinct from old.sold_out_count
       or new.last_activity_at is distinct from old.last_activity_at
       or new.created_at is distinct from old.created_at then
      raise exception 'derived mission fields cannot be edited';
    end if;

    if new.status is distinct from old.status and new.status<>'CLOSED' then
      raise exception 'mission status is server derived';
    end if;

    details_changed :=
      new.retailer is distinct from old.retailer
      or new.broad_region is distinct from old.broad_region
      or new.target_price is distinct from old.target_price
      or new.note is distinct from old.note
      or new.deadline_at is distinct from old.deadline_at;

    if details_changed and old.status not in ('OPEN','SCOUTING') then
      raise exception 'only active mission details can be edited';
    end if;

    if new.broad_region<>'Online' and new.broad_region !~ '^[0-9]{3}xx$' then
      raise exception 'broad region required';
    end if;
    if new.deadline_at<=now() or new.deadline_at>old.created_at+interval '7 days' then
      raise exception 'deadline must be within 7 days of mission creation';
    end if;
    if new.target_price is not null and new.target_price<0 then
      raise exception 'target price cannot be negative';
    end if;

    new.updated_at:=now();
  end if;
  return new;
end;
$$;
revoke all on function public.guard_hunt_mission_client_update() from public,anon,authenticated;

drop trigger if exists hunt_guard_client_before_update on public.hunt_missions;
create trigger hunt_guard_client_before_update
before update on public.hunt_missions
for each row execute function public.guard_hunt_mission_client_update();

create or replace function public.update_hunt_mission_details(
  p_mission uuid,p_retailer text,p_region text,p_target numeric,p_note text,p_deadline timestamptz
)
returns public.hunt_missions
language plpgsql
security invoker
set search_path=public
as $$
declare m public.hunt_missions;
begin
  if not exists(select 1 from public.hunt_missions where id=p_mission and created_by=auth.uid()) then
    raise exception 'mission owner required';
  end if;
  if p_region<>'Online' and p_region !~ '^[0-9]{3}xx$' then raise exception 'broad region required'; end if;
  if p_deadline<=now() then raise exception 'deadline must be in the future'; end if;

  update public.hunt_missions
  set retailer=left(coalesce(p_retailer,''),80),
      broad_region=p_region,
      target_price=case when p_target is null then null else greatest(0,p_target) end,
      note=left(coalesce(p_note,''),500),
      deadline_at=p_deadline,
      updated_at=now()
  where id=p_mission and created_by=auth.uid()
  returning * into m;
  if m.id is null then raise exception 'mission owner required'; end if;
  return m;
end;
$$;
revoke all on function public.update_hunt_mission_details(uuid,text,text,numeric,text,timestamptz) from public,anon;
grant execute on function public.update_hunt_mission_details(uuid,text,text,numeric,text,timestamptz) to authenticated;

create or replace function public.close_hunt_mission(p_mission uuid)
returns public.hunt_missions
language plpgsql
security invoker
set search_path=public
as $$
declare m public.hunt_missions;
begin
  update public.hunt_missions
  set status='CLOSED',updated_at=now()
  where id=p_mission and created_by=auth.uid()
  returning * into m;
  if m.id is null then raise exception 'mission owner required'; end if;
  return m;
end;
$$;
revoke all on function public.close_hunt_mission(uuid) from public,anon;
grant execute on function public.close_hunt_mission(uuid) to authenticated;
