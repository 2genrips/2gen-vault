-- VaultSignal v23 Hunt Missions
-- Structured, public, broad-region collector teamwork. No private DMs or household-level location data.

create table if not exists public.hunt_missions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  product text not null,
  normalized_product text not null default '',
  game text not null default 'Pokemon',
  retailer text not null default '',
  broad_region text not null default 'Online',
  status text not null default 'OPEN' check (status in ('OPEN','SCOUTING','FOUND','EXPIRED','CLOSED')),
  target_price numeric(12,2),
  note text not null default '',
  deadline_at timestamptz not null default (now()+interval '1 day'),
  scout_count integer not null default 1,
  checkin_count integer not null default 0,
  found_count integer not null default 0,
  not_found_count integer not null default 0,
  sold_out_count integer not null default 0,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hunt_product_len check (char_length(product) between 2 and 140),
  constraint hunt_retailer_len check (char_length(retailer) <= 80),
  constraint hunt_note_len check (char_length(note) <= 500),
  constraint hunt_region_safe check (broad_region='Online' or broad_region ~ '^[0-9]{3}xx$'),
  constraint hunt_deadline_window check (deadline_at > created_at and deadline_at <= created_at + interval '7 days'),
  constraint hunt_target_price_nonnegative check (target_price is null or target_price >= 0)
);

create table if not exists public.hunt_mission_scouts (
  mission_id uuid not null references public.hunt_missions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(mission_id,user_id)
);

create table if not exists public.hunt_mission_checkins (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.hunt_missions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  result text not null check (result in ('CHECKING','FOUND','NOT_FOUND','SOLD_OUT','INFO')),
  retailer text not null default '',
  store_label text not null default '',
  broad_region text not null default 'Online',
  note text not null default '',
  source_observation_id uuid references public.source_observations(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint hunt_checkin_retailer_len check (char_length(retailer) <= 80),
  constraint hunt_checkin_store_len check (char_length(store_label) <= 120),
  constraint hunt_checkin_note_len check (char_length(note) <= 360),
  constraint hunt_checkin_region_safe check (broad_region='Online' or broad_region ~ '^[0-9]{3}xx$')
);

create index if not exists hunt_missions_status_activity_idx on public.hunt_missions(status,last_activity_at desc);
create index if not exists hunt_missions_product_idx on public.hunt_missions(normalized_product,last_activity_at desc);
create index if not exists hunt_missions_region_idx on public.hunt_missions(broad_region,status,last_activity_at desc);
create index if not exists hunt_scouts_user_idx on public.hunt_mission_scouts(user_id,joined_at desc);
create index if not exists hunt_checkins_mission_created_idx on public.hunt_mission_checkins(mission_id,created_at desc);
create index if not exists hunt_checkins_user_created_idx on public.hunt_mission_checkins(user_id,created_at desc);

alter table public.hunt_missions enable row level security;
alter table public.hunt_mission_scouts enable row level security;
alter table public.hunt_mission_checkins enable row level security;

grant select,insert,delete on public.hunt_missions to authenticated;
grant select,insert,delete on public.hunt_mission_scouts to authenticated;
grant select,insert,delete on public.hunt_mission_checkins to authenticated;

drop policy if exists "hunt missions readable by authenticated" on public.hunt_missions;
create policy "hunt missions readable by authenticated" on public.hunt_missions for select to authenticated using (true);
drop policy if exists "hunt missions create own" on public.hunt_missions;
create policy "hunt missions create own" on public.hunt_missions for insert to authenticated with check (created_by=auth.uid());
drop policy if exists "hunt missions delete own" on public.hunt_missions;
create policy "hunt missions delete own" on public.hunt_missions for delete to authenticated using (created_by=auth.uid());

drop policy if exists "hunt scouts readable by authenticated" on public.hunt_mission_scouts;
create policy "hunt scouts readable by authenticated" on public.hunt_mission_scouts for select to authenticated using (true);
drop policy if exists "hunt scouts join self" on public.hunt_mission_scouts;
create policy "hunt scouts join self" on public.hunt_mission_scouts for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "hunt scouts leave self" on public.hunt_mission_scouts;
create policy "hunt scouts leave self" on public.hunt_mission_scouts for delete to authenticated using (user_id=auth.uid());

drop policy if exists "hunt checkins readable by authenticated" on public.hunt_mission_checkins;
create policy "hunt checkins readable by authenticated" on public.hunt_mission_checkins for select to authenticated using (true);
drop policy if exists "hunt checkins create own" on public.hunt_mission_checkins;
create policy "hunt checkins create own" on public.hunt_mission_checkins for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "hunt checkins delete own" on public.hunt_mission_checkins;
create policy "hunt checkins delete own" on public.hunt_mission_checkins for delete to authenticated using (user_id=auth.uid());

create or replace function public.prepare_hunt_mission()
returns trigger language plpgsql security definer set search_path=public as $$
declare active_count integer;
begin
  if new.created_by<>auth.uid() then raise exception 'mission owner mismatch'; end if;
  select count(*)::integer into active_count from public.hunt_missions
  where created_by=new.created_by and status in ('OPEN','SCOUTING') and deadline_at>now();
  if active_count>=10 then raise exception 'active mission limit reached'; end if;
  new.normalized_product:=public.vaultsignal_normalize_signal(new.product);
  new.status:='OPEN';new.scout_count:=1;new.checkin_count:=0;new.found_count:=0;new.not_found_count:=0;new.sold_out_count:=0;
  new.updated_at:=now();new.last_activity_at:=now();
  return new;
end;$$;
revoke all on function public.prepare_hunt_mission() from public,anon,authenticated;

drop trigger if exists hunt_prepare_before_insert on public.hunt_missions;
create trigger hunt_prepare_before_insert before insert on public.hunt_missions for each row execute function public.prepare_hunt_mission();

create or replace function public.join_creator_to_hunt_mission()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.hunt_mission_scouts(mission_id,user_id) values(new.id,new.created_by) on conflict do nothing;
  return new;
end;$$;
revoke all on function public.join_creator_to_hunt_mission() from public,anon,authenticated;

drop trigger if exists hunt_creator_join_after_insert on public.hunt_missions;
create trigger hunt_creator_join_after_insert after insert on public.hunt_missions for each row execute function public.join_creator_to_hunt_mission();

create or replace function public.guard_hunt_scout_join()
returns trigger language plpgsql security definer set search_path=public as $$
declare m_status text; m_deadline timestamptz;
begin
  if new.user_id<>auth.uid() then raise exception 'scout owner mismatch'; end if;
  select status,deadline_at into m_status,m_deadline from public.hunt_missions where id=new.mission_id;
  if m_status not in ('OPEN','SCOUTING') or m_deadline<=now() then raise exception 'mission is not accepting scouts'; end if;
  return new;
end;$$;
revoke all on function public.guard_hunt_scout_join() from public,anon,authenticated;

drop trigger if exists hunt_guard_scout_before_insert on public.hunt_mission_scouts;
create trigger hunt_guard_scout_before_insert before insert on public.hunt_mission_scouts for each row execute function public.guard_hunt_scout_join();

create or replace function public.guard_hunt_checkin()
returns trigger language plpgsql security definer set search_path=public as $$
declare joined boolean; recent_count integer; mission_region text; mission_status text; mission_deadline timestamptz;
begin
  if new.user_id<>auth.uid() then raise exception 'check-in owner mismatch'; end if;
  select exists(select 1 from public.hunt_mission_scouts where mission_id=new.mission_id and user_id=new.user_id) into joined;
  if not joined then raise exception 'join the mission before checking in'; end if;
  select count(*)::integer into recent_count from public.hunt_mission_checkins where user_id=new.user_id and created_at>now()-interval '10 minutes';
  if recent_count>=12 then raise exception 'check-in rate limit reached'; end if;
  select broad_region,status,deadline_at into mission_region,mission_status,mission_deadline from public.hunt_missions where id=new.mission_id;
  if mission_status in ('CLOSED','EXPIRED') or mission_deadline<=now() then raise exception 'mission is no longer active'; end if;
  if new.broad_region='Online' and mission_region<>'Online' then new.broad_region:=mission_region; end if;
  return new;
end;$$;
revoke all on function public.guard_hunt_checkin() from public,anon,authenticated;

drop trigger if exists hunt_guard_checkin_before_insert on public.hunt_mission_checkins;
create trigger hunt_guard_checkin_before_insert before insert on public.hunt_mission_checkins for each row execute function public.guard_hunt_checkin();

create or replace function public.refresh_hunt_mission(p_mission uuid)
returns public.hunt_missions language plpgsql security definer set search_path=public as $$
declare scouts integer:=0; checks integer:=0; founds integer:=0; misses integer:=0; sold integer:=0; checking integer:=0; m public.hunt_missions;
begin
  select count(*)::integer into scouts from public.hunt_mission_scouts where mission_id=p_mission;
  select count(*)::integer,count(*) filter(where result='FOUND')::integer,count(*) filter(where result='NOT_FOUND')::integer,
         count(*) filter(where result='SOLD_OUT')::integer,count(*) filter(where result='CHECKING')::integer
  into checks,founds,misses,sold,checking from public.hunt_mission_checkins where mission_id=p_mission;
  update public.hunt_missions set
    scout_count=coalesce(scouts,0),checkin_count=coalesce(checks,0),found_count=coalesce(founds,0),
    not_found_count=coalesce(misses,0),sold_out_count=coalesce(sold,0),
    status=case when status in ('CLOSED','EXPIRED') then status when coalesce(founds,0)>0 then 'FOUND'
                when coalesce(scouts,0)>1 or coalesce(checking,0)>0 then 'SCOUTING' else 'OPEN' end,
    last_activity_at=now(),updated_at=now()
  where id=p_mission returning * into m;
  return m;
end;$$;
revoke all on function public.refresh_hunt_mission(uuid) from public,anon,authenticated;
grant execute on function public.refresh_hunt_mission(uuid) to service_role;

create or replace function public.refresh_hunt_after_change()
returns trigger language plpgsql security definer set search_path=public as $$
declare mission uuid;
begin
  if tg_op='DELETE' then mission:=old.mission_id; else mission:=new.mission_id; end if;
  perform public.refresh_hunt_mission(mission);
  if tg_op='DELETE' then return old; else return new; end if;
end;$$;
revoke all on function public.refresh_hunt_after_change() from public,anon,authenticated;

drop trigger if exists hunt_refresh_after_scout_insert on public.hunt_mission_scouts;
create trigger hunt_refresh_after_scout_insert after insert on public.hunt_mission_scouts for each row execute function public.refresh_hunt_after_change();
drop trigger if exists hunt_refresh_after_scout_delete on public.hunt_mission_scouts;
create trigger hunt_refresh_after_scout_delete after delete on public.hunt_mission_scouts for each row execute function public.refresh_hunt_after_change();
drop trigger if exists hunt_refresh_after_checkin_insert on public.hunt_mission_checkins;
create trigger hunt_refresh_after_checkin_insert after insert on public.hunt_mission_checkins for each row execute function public.refresh_hunt_after_change();
drop trigger if exists hunt_refresh_after_checkin_delete on public.hunt_mission_checkins;
create trigger hunt_refresh_after_checkin_delete after delete on public.hunt_mission_checkins for each row execute function public.refresh_hunt_after_change();

-- Owner edits go through narrow RPCs so counters, creator identity, normalized keys, and FOUND state cannot be forged by the browser.
create or replace function public.update_hunt_mission_details(p_mission uuid,p_retailer text,p_region text,p_target numeric,p_note text,p_deadline timestamptz)
returns public.hunt_missions language plpgsql security definer set search_path=public as $$
declare m public.hunt_missions;
begin
  if not exists(select 1 from public.hunt_missions where id=p_mission and created_by=auth.uid()) then raise exception 'mission owner required'; end if;
  if p_region<>'Online' and p_region !~ '^[0-9]{3}xx$' then raise exception 'broad region required'; end if;
  if p_deadline<=now() or p_deadline>now()+interval '7 days' then raise exception 'deadline must be within 7 days'; end if;
  update public.hunt_missions set retailer=left(coalesce(p_retailer,''),80),broad_region=p_region,target_price=case when p_target is null then null else greatest(0,p_target) end,
    note=left(coalesce(p_note,''),500),deadline_at=p_deadline,updated_at=now(),last_activity_at=now()
  where id=p_mission returning * into m;return m;
end;$$;
revoke all on function public.update_hunt_mission_details(uuid,text,text,numeric,text,timestamptz) from public,anon;
grant execute on function public.update_hunt_mission_details(uuid,text,text,numeric,text,timestamptz) to authenticated;

create or replace function public.close_hunt_mission(p_mission uuid)
returns public.hunt_missions language plpgsql security definer set search_path=public as $$
declare m public.hunt_missions;
begin
  update public.hunt_missions set status='CLOSED',updated_at=now(),last_activity_at=now()
  where id=p_mission and created_by=auth.uid() returning * into m;
  if m.id is null then raise exception 'mission owner required'; end if;return m;
end;$$;
revoke all on function public.close_hunt_mission(uuid) from public,anon;
grant execute on function public.close_hunt_mission(uuid) to authenticated;

create or replace function public.expire_hunt_missions()
returns void language sql security definer set search_path=public as $$
  update public.hunt_missions set status='EXPIRED',updated_at=now() where status in ('OPEN','SCOUTING') and deadline_at<=now();
$$;
revoke all on function public.expire_hunt_missions() from public,anon,authenticated;

do $$ declare j record; begin
  for j in select jobid from cron.job where jobname='vaultsignal-hunt-mission-expire' loop perform cron.unschedule(j.jobid); end loop;
  perform cron.schedule('vaultsignal-hunt-mission-expire','*/15 * * * *','select public.expire_hunt_missions();');
end $$;

-- Safety: mission collaboration is public-room style only. No private DMs, precise home coordinates, or household addresses are stored here.
