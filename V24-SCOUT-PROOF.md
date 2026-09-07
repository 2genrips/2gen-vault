# VaultSignal v24 — Scout Proof Engine

Scout Proof makes Hunt Mission availability claims evidence-aware instead of treating every community report equally.

## Proof states

- **SOURCE VERIFIED** — fresh supported Source Mesh evidence matches the claim.
- **CORROBORATED** — an independent scout reports the same outcome nearby in time.
- **NEEDS CONFIRMATION / UNVERIFIED** — a single FOUND or SOLD OUT claim without enough supporting evidence yet.
- **CONFLICTED** — relevant evidence disagrees; the claim remains visible but is not pushed as a trusted alert.
- **OBSERVATION** — routine CHECKING, INFO or NOT_FOUND activity rather than a verified availability claim.

Scouts cannot assign these states or scores to themselves. The database calculates them from provider observations and independent Hunt Mission check-ins.

## Public Scout Proof Score

`hunt_scout_trust` summarizes FOUND/SOLD_OUT claim history. A public Proof Score is suppressed until a scout has at least **3 qualifying claims**. This avoids creating a misleading public reputation from one lucky report.

Proof Score measures evidence quality behind availability claims. It does not reward spending, purchases, collection value, or how many products somebody buys.

## Hunt Mission UI

`scout-proof.js` augments Hunt Mission detail without creating a second mission system:

- proof summary for the active mission
- proof badge and score on each scout claim
- evidence reason under each claim
- public Scout Proof badge only after the minimum sample is earned
- standalone Scout Proof Center with personal claim history and proof-method explanations
- `COMMAND → Scout Proof` on phones
- separate PROOF top pill remains hidden on phone widths

## Push behavior

Signal Push v6 is proof-aware:

- CONFLICTED mission claims never wake phones.
- Routine mission updates stay in-app.
- Single-scout FOUND reports can be labeled **NEEDS CONFIRMATION** rather than pretending to be verified.
- CORROBORATED and SOURCE VERIFIED claims carry their stronger proof state into the notification.
- Deduplication keys include proof state.
- A later Source Mesh verification can produce one useful VERIFIED follow-up.
- `scout-proof-v24-push-hardening.sql` prevents an independent corroboration from producing duplicate upgrade pings for older matching claims and limits late source-verification follow-ups to the latest matching public-store claim.

## Automated refresh

`vaultsignal-scout-proof-refresh` runs every five minutes and rechecks recent FOUND/SOLD_OUT claims against newly arrived Source Mesh evidence and independent scout reports.

## Privacy and safety

Scout Proof uses Hunt Mission broad-region/store labels and evidence already permitted by the community system. It does not require a home address, precise household coordinates, phone number, school, or private DM.

## Backend files

- `supabase/scout-proof-v24.sql`
- `supabase/scout-proof-v24-push-hardening.sql`
- `supabase/functions/signal-push/index.ts`

## Important boundaries

Scout Proof is an evidence-quality system, not a guarantee that inventory remains available, not a purchase reservation, not an investment score, and not a substitute for retailer checkout confirmation.
