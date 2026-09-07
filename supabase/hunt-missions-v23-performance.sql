-- VaultSignal v23 Hunt Mission performance hardening.
-- Cover mission foreign keys and avoid per-row auth.uid() re-evaluation in RLS.

create index if not exists hunt_missions_created_by_idx
  on public.hunt_missions(created_by,last_activity_at desc);
create index if not exists hunt_checkins_source_observation_idx
  on public.hunt_mission_checkins(source_observation_id)
  where source_observation_id is not null;
create index if not exists signal_push_deliveries_mission_checkin_idx
  on public.signal_push_deliveries(mission_checkin_id)
  where mission_checkin_id is not null;

drop policy if exists "hunt missions create own" on public.hunt_missions;
create policy "hunt missions create own" on public.hunt_missions
for insert to authenticated with check (created_by=(select auth.uid()));

drop policy if exists "hunt missions delete own" on public.hunt_missions;
create policy "hunt missions delete own" on public.hunt_missions
for delete to authenticated using (created_by=(select auth.uid()));

drop policy if exists "hunt missions update own guarded" on public.hunt_missions;
create policy "hunt missions update own guarded" on public.hunt_missions
for update to authenticated
using (created_by=(select auth.uid()))
with check (created_by=(select auth.uid()));

drop policy if exists "hunt scouts join self" on public.hunt_mission_scouts;
create policy "hunt scouts join self" on public.hunt_mission_scouts
for insert to authenticated with check (user_id=(select auth.uid()));

drop policy if exists "hunt scouts leave self" on public.hunt_mission_scouts;
create policy "hunt scouts leave self" on public.hunt_mission_scouts
for delete to authenticated using (user_id=(select auth.uid()));

drop policy if exists "hunt checkins create own" on public.hunt_mission_checkins;
create policy "hunt checkins create own" on public.hunt_mission_checkins
for insert to authenticated with check (user_id=(select auth.uid()));

drop policy if exists "hunt checkins delete own" on public.hunt_mission_checkins;
create policy "hunt checkins delete own" on public.hunt_mission_checkins
for delete to authenticated using (user_id=(select auth.uid()));
