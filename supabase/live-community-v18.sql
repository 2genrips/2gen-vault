-- VaultSignal v18 Live Community Core
-- Run after supabase/signal-network-v17.sql.

create extension if not exists pgcrypto;

create table if not exists public.community_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Collector',
  broad_region text not null default '',
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_profile_name_len check (char_length(display_name) between 1 and 40),
  constraint community_profile_region_len check (char_length(broad_region) <= 24)
);

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id, blocked_id),
  constraint cannot_block_self check (blocker_id <> blocked_id)
);
create index if not exists user_blocks_blocked_idx on public.user_blocks(blocked_id);

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.signal_posts(id) on delete set null,
  reported_user_id uuid references auth.users(id) on delete set null,
  reason text not null check (reason in ('spam','scam','harassment','unsafe_location','queue_bypass','private_child_contact','other')),
  details text not null default '',
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint moderation_details_len check (char_length(details) <= 500)
);
create index if not exists moderation_reports_status_created_idx on public.moderation_reports(status, created_at desc);
create index if not exists moderation_reports_post_idx on public.moderation_reports(post_id);
create index if not exists moderation_reports_reported_user_idx on public.moderation_reports(reported_user_id);
create index if not exists moderation_reports_reporter_idx on public.moderation_reports(reporter_id);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  min_score integer not null default 60 check (min_score between 0 and 100),
  urgent_only boolean not null default false,
  quiet_start time not null default '22:00',
  quiet_end time not null default '07:00',
  timezone text not null default 'UTC',
  rooms text[] not null default array['pokemon-drops','local-finds','deals']::text[],
  updated_at timestamptz not null default now()
);
create index if not exists notification_preferences_enabled_idx on public.notification_preferences(enabled) where enabled = true;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text not null default '',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint push_endpoint_len check (char_length(endpoint) <= 2048),
  constraint push_user_agent_len check (char_length(user_agent) <= 240)
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.signal_posts add column if not exists is_removed boolean not null default false;
alter table public.community_profiles enable row level security;
alter table public.user_blocks enable row level security;
alter table public.moderation_reports enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;

grant select,insert,update on public.community_profiles to authenticated;
grant select,insert,delete on public.user_blocks to authenticated;
grant select,insert on public.moderation_reports to authenticated;
grant select,insert,update,delete on public.notification_preferences to authenticated;
grant select,insert,update,delete on public.push_subscriptions to authenticated;

drop policy if exists "community profiles readable by authenticated" on public.community_profiles;
create policy "community profiles readable by authenticated" on public.community_profiles for select to authenticated using (true);
drop policy if exists "users create own community profile" on public.community_profiles;
create policy "users create own community profile" on public.community_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "users update own community profile" on public.community_profiles;
create policy "users update own community profile" on public.community_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.update_my_community_profile(p_display_name text, p_broad_region text)
returns public.community_profiles
language plpgsql
security invoker
set search_path = public
as $$
declare result public.community_profiles;
begin
  if (select auth.uid()) is null then raise exception 'authentication required'; end if;
  insert into public.community_profiles(user_id, display_name, broad_region, updated_at)
  values((select auth.uid()), left(coalesce(nullif(trim(p_display_name),''),'Collector'),40), left(coalesce(trim(p_broad_region),''),24), now())
  on conflict(user_id) do update set display_name = excluded.display_name, broad_region = excluded.broad_region, updated_at = now()
  returning * into result;
  return result;
end;
$$;
revoke all on function public.update_my_community_profile(text,text) from public;
grant execute on function public.update_my_community_profile(text,text) to authenticated;

drop policy if exists "users read own blocks" on public.user_blocks;
create policy "users read own blocks" on public.user_blocks for select to authenticated using ((select auth.uid()) = blocker_id);
drop policy if exists "users create own blocks" on public.user_blocks;
create policy "users create own blocks" on public.user_blocks for insert to authenticated with check ((select auth.uid()) = blocker_id);
drop policy if exists "users delete own blocks" on public.user_blocks;
create policy "users delete own blocks" on public.user_blocks for delete to authenticated using ((select auth.uid()) = blocker_id);

drop policy if exists "users submit own moderation reports" on public.moderation_reports;
create policy "users submit own moderation reports" on public.moderation_reports for insert to authenticated with check ((select auth.uid()) = reporter_id);
drop policy if exists "users read own moderation reports" on public.moderation_reports;
create policy "users read own moderation reports" on public.moderation_reports for select to authenticated using ((select auth.uid()) = reporter_id);

drop policy if exists "users manage own notification preferences" on public.notification_preferences;
create policy "users manage own notification preferences" on public.notification_preferences for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "users manage own push subscriptions" on public.push_subscriptions;
create policy "users manage own push subscriptions" on public.push_subscriptions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "signal posts readable by authenticated" on public.signal_posts;
create policy "signal posts readable by authenticated" on public.signal_posts for select to authenticated using (is_removed = false);

create or replace function public.enforce_signal_post_rate_limit()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare recent_count integer;
begin
  select count(*) into recent_count from public.signal_posts where user_id = new.user_id and created_at > now() - interval '10 minutes';
  if recent_count >= 12 then raise exception 'Signal posting limit reached. Try again shortly.' using errcode='P0001'; end if;
  return new;
end;
$$;
revoke all on function public.enforce_signal_post_rate_limit() from public;
drop trigger if exists signal_post_rate_limit on public.signal_posts;
create trigger signal_post_rate_limit before insert on public.signal_posts for each row execute function public.enforce_signal_post_rate_limit();

create or replace view public.community_reputation with (security_invoker = true) as
select cp.user_id,
  count(distinct sp.id)::integer as post_count,
  count(sr.*) filter (where sr.kind='helpful')::integer as helpful_count,
  count(sr.*) filter (where sr.kind='confirm')::integer as confirm_count,
  count(sr.*) filter (where sr.kind='gone')::integer as gone_count,
  greatest(20, least(99, 50 + (count(sr.*) filter (where sr.kind='helpful'))::integer * 2 + (count(sr.*) filter (where sr.kind='confirm'))::integer * 4 - (count(sr.*) filter (where sr.kind='gone'))::integer * 2))::integer as reputation_score
from public.community_profiles cp
left join public.signal_posts sp on sp.user_id = cp.user_id and sp.is_removed = false
left join public.signal_reactions sr on sr.post_id = sp.id
group by cp.user_id;
grant select on public.community_reputation to authenticated;

drop policy if exists "signal network authenticated realtime read" on realtime.messages;
create policy "signal network authenticated realtime read" on realtime.messages for select to authenticated using ((select realtime.topic()) like 'signal:%' and realtime.messages.extension in ('broadcast','presence'));
drop policy if exists "signal network authenticated realtime write" on realtime.messages;
create policy "signal network authenticated realtime write" on realtime.messages for insert to authenticated with check ((select realtime.topic()) like 'signal:%' and realtime.messages.extension in ('broadcast','presence'));

-- Privacy: public community identity is deliberately broad. Never add exact household addresses,
-- precise coordinates, passwords, payment information, or private child-contact data here.
