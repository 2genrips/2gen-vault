-- VaultSignal v24 Scout Proof privacy hardening.
-- Low-sample scout rows are not exposed through the shared trust view at all.
-- A collector can still see their own 0/3, 1/3 or 2/3 progress from their own RLS-protected check-ins in the client.

create or replace view public.hunt_scout_trust
with (security_invoker=true)
as
with claims as (
  select user_id,
    count(*)::integer as claim_count,
    count(*) filter(where verification_state='SOURCE_VERIFIED')::integer as source_verified_count,
    count(*) filter(where verification_state='CORROBORATED')::integer as corroborated_count,
    count(*) filter(where verification_state='CONFLICTED')::integer as conflicted_count,
    round(avg(verification_score))::integer as average_proof_score
  from public.hunt_mission_checkins
  where result in ('FOUND','SOLD_OUT')
  group by user_id
)
select user_id,claim_count,source_verified_count,corroborated_count,conflicted_count,
  greatest(20,least(99,average_proof_score)) as proof_score,
  true as public_visible
from claims
where claim_count>=3;

grant select on public.hunt_scout_trust to authenticated;
