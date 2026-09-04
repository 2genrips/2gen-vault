-- 2GEN Vault v0.6 — Supabase schema
-- Run this entire file once in Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Collector',
  home_zip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store text not null,
  product text not null,
  game text not null default 'Pokemon',
  status text not null check (status in ('In stock','Low stock','Out of stock','in_stock','low_stock','out_of_stock')),
  quantity integer not null default 0 check (quantity >= 0),
  price numeric(10,2) not null default 0 check (price >= 0),
  notes text not null default '',
  zip text,
  lat double precision,
  lon double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stock_reports_zip_idx on public.stock_reports(zip);
create index if not exists stock_reports_game_idx on public.stock_reports(game);
create index if not exists stock_reports_updated_idx on public.stock_reports(updated_at desc);
create index if not exists stock_reports_product_idx on public.stock_reports using gin (to_tsvector('simple', product));

create table if not exists public.stock_confirmations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.stock_reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('still','gone')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(report_id,user_id)
);

create index if not exists stock_confirmations_report_idx on public.stock_confirmations(report_id);

create table if not exists public.vault_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.stock_reports enable row level security;
alter table public.stock_confirmations enable row level security;
alter table public.vault_backups enable row level security;

-- Profiles: users can read public display names but only write their own profile.
drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read"
on public.profiles for select
using (true);

drop policy if exists "profiles own insert" on public.profiles;
create policy "profiles own insert"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Stock reports: anyone using the app can read; only signed-in users can publish,
-- and users can only edit/delete their own reports.
drop policy if exists "stock reports public read" on public.stock_reports;
create policy "stock reports public read"
on public.stock_reports for select
using (true);

drop policy if exists "stock reports auth insert" on public.stock_reports;
create policy "stock reports auth insert"
on public.stock_reports for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "stock reports own update" on public.stock_reports;
create policy "stock reports own update"
on public.stock_reports for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "stock reports own delete" on public.stock_reports;
create policy "stock reports own delete"
on public.stock_reports for delete
to authenticated
using (auth.uid() = user_id);

-- Confirmations: public read; signed-in collectors can create/update/delete only their own vote.
drop policy if exists "confirmations public read" on public.stock_confirmations;
create policy "confirmations public read"
on public.stock_confirmations for select
using (true);

drop policy if exists "confirmations own insert" on public.stock_confirmations;
create policy "confirmations own insert"
on public.stock_confirmations for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "confirmations own update" on public.stock_confirmations;
create policy "confirmations own update"
on public.stock_confirmations for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "confirmations own delete" on public.stock_confirmations;
create policy "confirmations own delete"
on public.stock_confirmations for delete
to authenticated
using (auth.uid() = user_id);

-- Private vault backups: only the owner can read/write.
drop policy if exists "vault backup own read" on public.vault_backups;
create policy "vault backup own read"
on public.vault_backups for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "vault backup own insert" on public.vault_backups;
create policy "vault backup own insert"
on public.vault_backups for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "vault backup own update" on public.vault_backups;
create policy "vault backup own update"
on public.vault_backups for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Automatically create a basic profile after signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name','Collector'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
