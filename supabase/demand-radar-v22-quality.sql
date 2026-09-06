-- VaultSignal v22 Demand Radar quality guard
-- Source-created incidents with zero human reports must not be double-counted as community demand.

create or replace function public.refresh_demand_radar_safe()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  v_rows := public.refresh_demand_radar();

  update public.demand_radar
  set heat_score = greatest(0, heat_score - least(live_incidents*18,36)),
      momentum = 0,
      heat_state = case
        when greatest(0, heat_score - least(live_incidents*18,36)) >= 60 then 'HOT'
        when greatest(0, heat_score - least(live_incidents*18,36)) >= 35 then 'ACTIVE'
        when greatest(0, heat_score - least(live_incidents*18,36)) >= 15 then 'COOLING'
        else 'QUIET' end,
      updated_at = now()
  where collector_reports=0 and independent_collectors=0;

  return v_rows;
end;
$$;

revoke all on function public.refresh_demand_radar_safe() from public,anon,authenticated;
grant execute on function public.refresh_demand_radar_safe() to service_role;

do $$
declare j record;
begin
  for j in select jobid from cron.job where jobname='vaultsignal-demand-radar-refresh' loop
    perform cron.unschedule(j.jobid);
  end loop;
  perform cron.schedule('vaultsignal-demand-radar-refresh','2-59/5 * * * *','select public.refresh_demand_radar_safe();');
end $$;

select public.refresh_demand_radar_safe();
