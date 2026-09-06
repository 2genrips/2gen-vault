-- VaultSignal v20 Signal Fusion hardening
-- Explicit search_path for immutable normalizer function.

create or replace function public.vaultsignal_normalize_signal(value text)
returns text
language sql
immutable
parallel safe
set search_path = pg_catalog
as $$
  select trim(regexp_replace(lower(coalesce(value,'')), '[^a-z0-9]+', ' ', 'g'));
$$;
revoke all on function public.vaultsignal_normalize_signal(text) from public, anon;
grant execute on function public.vaultsignal_normalize_signal(text) to authenticated, service_role;
