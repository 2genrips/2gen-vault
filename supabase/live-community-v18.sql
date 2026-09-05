-- VaultSignal v18 Live Community Core
-- Run after supabase/signal-network-v17.sql.
-- Adds public community identity, derived reputation, moderation, blocks,
-- notification preferences, push subscriptions, rate limiting and private Realtime auth.

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

alter table public.signal_posts add column if not exists is_removed boolean not null default false;

alter table public.community_profiles enable row level security;
alter table public.user_blocks enable row level security;
alter table public.moderation_reports enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;

-- Community profiles are intentionally limited to public-safe fields.
drop policy if exists "community profiles readable by authenticated" on public.community_profiles;
create policy "community profiles readable by authenticated" on public.community_profiles
for select to authenticated using (true);

drop policy if exists "users create own community profile" on public.community_profiles;
create policy "users create own community profile" on public.community_profiles
for insert to authenticated with check (auth.uid() = user_id);

-- Profile edits go through an RPC so reputation/admin fields can never be client-written.
create or replace function public.update_my_community_profile(p_display_name text, p_broad_region text)
returns public.community_profiles
language plpgsql
security definer
set search_path = public
as $$
declare result public.community_profiles;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.community_profiles(user_id, display_name, broad_region, updated_at)
  values(auth.uid(), left(coalesce(nullif(trim(p_display_name),''),'Collector'),40), left(coalesce(trim(p_broad_region),''),24), now())
  on conflict(user_id) do update set
    display_name = excluded.display_name,
    broad_region = excluded.broad_region,
    updated_at = now()
  returning * into result;
  return result;
end;
$$;
grant execute on function public.update_my_community_profile(text,text) to authenticated;

-- Blocks are private to the blocker.
drop policy if exists "users read own blocks" on public.user_blocks;
create policy "users read own blocks" on public.user_blocks for select to authenticated using (auth.uid() = blocker_id);
drop policy if exists "users create own blocks" on public.user_blocks;
create policy "users create own blocks" on public.user_blocks for insert to authenticated with check (auth.uid() = blocker_id);
drop policy if exists "users delete own blocks" on public.user_blocks;
create policy "users delete own blocks" on public.user_blocks for delete to authenticated using (auth.uid() = blocker_id);

-- Reporters may submit and view their own reports. Moderator review is server/admin-side.
drop policy if exists "users submit own moderation reports" on public.moderation_reports;
create policy "users submit own moderation reports" on public.moderation_reports for insert to authenticated with check (auth.uid() = reporter_id);
drop policy if exists "users read own moderation reports" on public.moderation_reports;
create policy "users read own moderation reports" on public.moderation_reports for select to authenticated using (auth.uid() = reporter_id);

-- Notification preferences and push endpoints are private account data.
drop policy if exists "users manage own notification preferences" on public.notification_preferences;
create policy "users manage own notification preferences" on public.notification_preferences for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users manage own push subscriptions" on public.push_subscriptions;
create policy "users manage own push subscriptions" on public.push_subscriptions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Hide moderator-removed posts from normal community reads.
drop policy if exists "signal posts readable by authenticated" on public.signal_posts;
create policy "signal posts readable by authenticated" on public.signal_posts
for select to authenticated using (is_removed = false);

-- Basic anti-spam: no more than 12 new Signal posts in a rolling 10-minute window.
create or replace function public.enforce_signal_post_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare recent_count integer;
begin
  select count(*) into recent_count
  from public.signal_posts
  where user_id = new.user_id and created_at > now() - interval '10 minutes';
  if recent_count >= 12 then
    raise exception 'Signal posting limit reached. Try again shortly.' using errcode='P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists signal_post_rate_limit on public.signal_posts;
create trigger signal_post_rate_limit before insert on public.signal_posts
for each row execute function public.enforce_signal_post_rate_limit();

-- Derived reputation. No client can directly edit a reputation score.
create or replace view public.community_reputation
with (security_invoker = true)
as
select
  cp.user_id,
  count(distinct sp.id)::integer as post_count,
  count(sr.*) filter (where sr.kind='helpful')::integer as helpful_count,
  count(sr.*) filter (where sr.kind='confirm')::integer as confirm_count,
  count(sr.*) filter (where sr.kind='gone')::integer as gone_count,
  greatest(20, least(99,
    50
    + (count(sr.*) filter (where sr.kind='helpful'))::integer * 2
    + (count(sr.*) filter (where sr.kind='confirm'))::integer * 4
    - (count(sr.*) filter (where sr.kind='gone'))::integer * 2
  ))::integer as reputation_score
from public.community_profiles cp
left join public.signal_posts sp on sp.user_id = cp.user_id and sp.is_removed = false
left join public.signal_reactions sr on sr.post_id = sp.id
group by cp.user_id;

grant select on public.community_reputation to authenticated;

-- Private Realtime authorization for Signal Network Broadcast + Presence.
-- In Supabase Realtime Settings, disable public-channel access before production launch.
drop policy if exists "signal network authenticated realtime read" on realtime.messages;
create policy "signal network authenticated realtime read"
on realtime.messages for select to authenticated
using (
  (select realtime.topic()) like 'signal:%'
  and realtime.messages.extension in ('broadcast','presence')
);

drop policy if exists "signal network authenticated realtime write" on realtime.messages;
create policy "signal network authenticated realtime write"
on realtime.messages for insert to authenticated
with check (
  (select realtime.topic()) like 'signal:%'
  and realtime.messages.extension in ('broadcast','presence')
);

-- Helpful indexes for moderation and push fan-out.
create index if not exists moderation_reports_status_created_idx on public.moderation_reports(status, created_at desc);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);
create index if not exists notification_preferences_enabled_idx on public.notification_preferences(enabled) where enabled = true;

-- Privacy principle: keep public community identity broad. Do not add exact home address,
-- precise household coordinates, private child contact details, passwords or payment data here.
