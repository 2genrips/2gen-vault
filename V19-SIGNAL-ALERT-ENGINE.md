# VaultSignal v19 — Signal Alert Engine

This release activates production-oriented smart Web Push routing for Signal Network.

## Goals
- Discord-speed background alerts without requiring the PWA to be open.
- Route alerts by followed room, quiet hours, urgency, minimum confidence, broad region, and local watch/chase terms.
- Keep all private VAPID and webhook credentials out of GitHub Pages.
- Prevent duplicate deliveries when a dispatcher retries.

## Security model
- The public VAPID key may ship in `config.js`.
- The VAPID private key and dispatcher webhook secret live only in Supabase Vault.
- The push Edge Function uses the built-in server credential to read a tightly scoped private RPC.
- Database-triggered delivery authenticates with a dedicated secret header.
- No exact household location is used for alert routing; Local Finds can match only the broad community region.

## Backend
The `signal-alert-engine-v19.sql` migration adds:
- `watch_terms` and `local_region_only` preferences.
- `signal_push_deliveries` deduplication/audit records.
- server-only Vault config RPC.
- signal notification scoring.
- automatic `pg_net` dispatch after new Signal Network posts.

## Client
`signal-alert-engine.js` synchronizes the collector's local watches/chases into the signed-in notification profile and keeps the device timezone current.

## Push routing
A subscriber is eligible only when:
- alerts are enabled,
- the post room is followed,
- quiet hours allow delivery,
- urgent-only mode accepts the signal type,
- the calculated signal score meets the user's minimum,
- optional watch terms match stock/deal signals,
- Local Finds broad-region routing matches when enabled.

Reference values, inventory reports, and community signals are still informational and may change quickly.
