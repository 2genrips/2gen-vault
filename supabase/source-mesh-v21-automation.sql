-- VaultSignal v21 Source Mesh automation + hardening
-- Run after source-mesh-v21.sql.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- Do not create a new incident from negative/unknown automated evidence alone.
create or replace function public.link_source_observation_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident public.signal_incidents;
  v_product text;
begin
  new.normalized_product := public.vaultsignal_normalize_signal(coalesce(nullif(trim(new.product),''),'Source observation'));
  new.normalized_retailer := public.vaultsignal_normalize_signal(new.retailer);
  new.normalized_region := public.vaultsignal_normalize_signal(new.region);

  if new.source_type='retailer_check' or new.evidence_kind in ('unknown','price') then return new; end if;

  v_product := coalesce(nullif(trim(new.product),''),'Source observation');
  select * into v_incident
  from public.signal_incidents i
  where i.room=new.room
    and i.normalized_product=new.normalized_product
    and i.normalized_retailer=new.normalized_retailer
    and (new.room<>'local-finds' or i.normalized_region=new.normalized_region)
    and i.last_seen_at>now()-interval '90 minutes'
    and (i.status<>'GONE' or i.last_seen_at>now()-interval '15 minutes')
  order by i.last_seen_at desc
  limit 1
  for update;

  if v_incident.id is null and new.available is distinct from true then return new; end if;

  if v_incident.id is null then
    insert into public.signal_incidents(room,product,retailer,region,normalized_product,normalized_retailer,normalized_region,status,confidence,first_seen_at,last_seen_at)
    values(new.room,v_product,new.retailer,new.region,new.normalized_product,new.normalized_retailer,new.normalized_region,'WATCH',0,new.observed_at,new.observed_at)
    returning * into v_incident;
  else
    update public.signal_incidents
      set product=case when product='' then v_product else product end,
          retailer=case when retailer='' then new.retailer else retailer end,
          region=case when region='' then new.region else region end,
          last_seen_at=greatest(last_seen_at,new.observed_at),
          updated_at=now()
      where id=v_incident.id;
  end if;

  new.incident_id := v_incident.id;
  return new;
end;
$$;
revoke all on function public.link_source_observation_before_insert() from public, anon, authenticated;

-- Upserts refresh the same observation row, so refresh incidents on INSERT and UPDATE.
drop trigger if exists source_mesh_refresh_after_insert on public.source_observations;
drop trigger if exists source_mesh_refresh_after_change on public.source_observations;
create trigger source_mesh_refresh_after_change
after insert or update of observed_at,expires_at,available,status,confidence on public.source_observations
for each row execute function public.refresh_incident_after_source_observation();

-- Edge Function reads the expected scheduler secret through service-role-only RPC.
create or replace function public.vaultsignal_source_mesh_config()
returns jsonb
language sql
security definer
set search_path = public, vault
as $$
  select jsonb_build_object(
    'webhook_secret',(select decrypted_secret from vault.decrypted_secrets where name='vaultsignal_source_mesh_webhook_secret' limit 1),
    'worker_url','https://2gen-vault-inventory.willingpaige.workers.dev'
  );
$$;
revoke all on function public.vaultsignal_source_mesh_config() from public, anon, authenticated;
grant execute on function public.vaultsignal_source_mesh_config() to service_role;

create or replace function public.dispatch_source_mesh_refresh()
returns bigint
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  mesh_secret text;
  request_id bigint;
begin
  select decrypted_secret into mesh_secret
  from vault.decrypted_secrets
  where name='vaultsignal_source_mesh_webhook_secret'
  limit 1;
  if coalesce(mesh_secret,'')='' then return null; end if;

  select net.http_post(
    url := 'https://ztesewpipghbkvtbidry.supabase.co/functions/v1/source-mesh',
    headers := jsonb_build_object('Content-Type','application/json','x-vaultsignal-secret',mesh_secret),
    body := jsonb_build_object('mode','global_refresh'),
    timeout_milliseconds := 15000
  ) into request_id;
  return request_id;
end;
$$;
revoke all on function public.dispatch_source_mesh_refresh() from public, anon, authenticated;

-- Keep only one scheduler job by this name.
do $$
declare j record;
begin
  for j in select jobid from cron.job where jobname='vaultsignal-source-mesh-refresh' loop
    perform cron.unschedule(j.jobid);
  end loop;
  perform cron.schedule('vaultsignal-source-mesh-refresh','*/5 * * * *','select public.dispatch_source_mesh_refresh();');
end $$;

-- Old observations are audit evidence, but do not need to live forever on the free backend.
create or replace function public.prune_source_mesh_observations()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.source_observations where observed_at < now()-interval '30 days';
$$;
revoke all on function public.prune_source_mesh_observations() from public, anon, authenticated;

do $$
declare j record;
begin
  for j in select jobid from cron.job where jobname='vaultsignal-source-mesh-prune' loop
    perform cron.unschedule(j.jobid);
  end loop;
  perform cron.schedule('vaultsignal-source-mesh-prune','17 4 * * *','select public.prune_source_mesh_observations();');
end $$;

-- Production must store vaultsignal_source_mesh_webhook_secret in Supabase Vault separately.
