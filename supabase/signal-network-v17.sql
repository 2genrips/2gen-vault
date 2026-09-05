-- VaultSignal v17 Signal Network
-- Hardened production schema for structured community rooms.

create extension if not exists pgcrypto;

create table if not exists public.signal_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  room text not null check (room in ('pokemon-drops','local-finds','deals','pulls','trade-talk','creator-lab')),
  type text not null check (type in ('DROP','FOUND','SOLD OUT','LIMIT','CHECKOUT','DEAL','PULL','INFO')),
  title text not null default '',
  product text not null default '',
  retailer text not null default '',
  region text not null default '',
  body text not null default '',
  created_at timestamptz not null default now(),
  constraint signal_posts_title_len check (char_length(title) <= 140),
  constraint signal_posts_product_len check (char_length(product) <= 140),
  constraint signal_posts_retailer_len check (char_length(retailer) <= 80),
  constraint signal_posts_region_len check (char_length(region) <= 32),
  constraint signal_posts_body_len check (char_length(body) <= 420)
);

create index if not exists signal_posts_room_created_idx on public.signal_posts(room, created_at desc);
create index if not exists signal_posts_user_created_idx on public.signal_posts(user_id, created_at desc);

create table if not exists public.signal_reactions (
  post_id uuid not null references public.signal_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('confirm','gone','helpful')),
  created_at timestamptz not null default now(),
  primary key(post_id,user_id,kind)
);
create index if not exists signal_reactions_post_idx on public.signal_reactions(post_id);
create index if not exists signal_reactions_user_idx on public.signal_reactions(user_id);

create table if not exists public.signal_room_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  room text not null check (room in ('pokemon-drops','local-finds','deals','pulls','trade-talk','creator-lab')),
  created_at timestamptz not null default now(),
  primary key(user_id,room)
);

alter table public.signal_posts enable row level security;
alter table public.signal_reactions enable row level security;
alter table public.signal_room_follows enable row level security;

grant select,insert,delete on public.signal_posts to authenticated;
grant select,insert,delete on public.signal_reactions to authenticated;
grant select,insert,delete on public.signal_room_follows to authenticated;

drop policy if exists "signal posts readable by authenticated" on public.signal_posts;
create policy "signal posts readable by authenticated" on public.signal_posts for select to authenticated using (true);
drop policy if exists "users create own signal posts" on public.signal_posts;
create policy "users create own signal posts" on public.signal_posts for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "users delete own signal posts" on public.signal_posts;
create policy "users delete own signal posts" on public.signal_posts for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "signal reactions readable by authenticated" on public.signal_reactions;
create policy "signal reactions readable by authenticated" on public.signal_reactions for select to authenticated using (true);
drop policy if exists "users create own signal reactions" on public.signal_reactions;
create policy "users create own signal reactions" on public.signal_reactions for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "users delete own signal reactions" on public.signal_reactions;
create policy "users delete own signal reactions" on public.signal_reactions for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "users read own room follows" on public.signal_room_follows;
create policy "users read own room follows" on public.signal_room_follows for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "users create own room follows" on public.signal_room_follows;
create policy "users create own room follows" on public.signal_room_follows for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "users delete own room follows" on public.signal_room_follows;
create policy "users delete own room follows" on public.signal_room_follows for delete to authenticated using ((select auth.uid()) = user_id);

do $$ begin alter publication supabase_realtime add table public.signal_posts; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.signal_reactions; exception when duplicate_object then null; end $$;

-- Community location is intentionally broad. Never store household addresses or child contact data here.
