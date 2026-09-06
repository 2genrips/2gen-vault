# VaultSignal v21 — Source Mesh

v21 adds an automated evidence layer underneath Signal Fusion so VaultSignal can explain **why** an incident is believed to be live.

## Why this matters
Discord-style restock groups are fast, but they often mix official data, retailer links, screenshots, guesses and community comments into one stream. Source Mesh keeps each evidence type explicit and lets supported provider evidence strengthen a War Room without pretending all sources are equal.

## Source classes
- **OFFICIAL API** — supported retailer inventory API evidence, currently including the existing Best Buy connector when configured.
- **PARTNER FEED** — licensed/authorized local inventory provider evidence.
- **PUBLIC STOREFRONT** — the source store's own published online product availability.
- **CHECK ONLY** — retailer search/handoff links. These never count as stock by themselves.
- **SYSTEM** — provider/watch-engine health information.

## Backend data model
`supabase/source-mesh-v21.sql` adds:
- `source_catalog`
- `source_observations`
- source-evidence counters on `signal_incidents`
- fusion scoring that separately considers community evidence and provider evidence
- source observation -> incident linking
- automated incident refresh and material-change alerting

Automated evidence remains separate from `signal_posts`. A provider observation is never disguised as a human community report.

## Background ingestion
`supabase/functions/source-mesh/` polls the existing VaultSignal inventory worker and imports supported global storefront evidence.

`supabase/source-mesh-v21-automation.sql` schedules a refresh every five minutes with `pg_cron` and `pg_net`. A private webhook secret lives only in Supabase Vault.

Repeated provider observations update the same evidence row instead of creating endless history rows. Old observations are pruned after 30 days.

## Verify My Watches
Signed-in collectors can run **Verify My Watches** from Source Mesh.

The Edge Function receives up to four watch/chase queries plus the user's ZIP and asks the existing inventory worker to verify supported local providers. The exact ZIP is used only for the live lookup. Stored evidence contains only the broad region such as `287xx`.

Only supported `official_api` and `partner_api` inventory results can be written as local provider evidence. Retailer search pages are excluded.

## Source Mesh UI
The mobile-first Source Mesh screen shows:
- provider health
- source class / truth labels
- fresh automated observations
- product, retailer and broad region
- quantity only when a provider actually supplies it
- reference price when supplied
- source confidence
- direct source links
- direct War Room links when an observation is fused to an incident
- local watch verification results

## Signal Fusion impact
The v21 incident confidence calculation retains all community inputs and adds separate weights for active provider evidence.

Official and partner inventory evidence carry more weight than public storefront availability. A retailer-check handoff carries no stock weight.

Automated negative evidence alone does not create a new War Room. It may update an already-active matching incident, but `GONE` still requires stronger evidence rather than a single missing provider result.

## Privacy and truthfulness
- Exact household locations are not stored in Source Mesh.
- Provider secrets remain server-side.
- Retailer handoffs are never represented as live inventory.
- No quantity is invented when a provider omits quantity.
- Public storefront availability means only that the source storefront published the item as available at the time checked.
- Source confidence is evidence quality/freshness metadata, not a guarantee that an item can still be purchased.
