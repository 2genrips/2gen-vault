# VaultSignal v19 — Signal Alert Engine

v19 activates production-oriented smart Web Push routing for Signal Network.

## What it adds
- Background Web Push when VaultSignal is closed.
- Followed-room filtering.
- Quiet hours and timezone-aware delivery.
- Urgent-only mode.
- Minimum signal-score filtering.
- Watch/chase term matching for stock and deal rooms.
- Broad-region filtering for Local Finds.
- Delivery deduplication and expired-subscription cleanup.

## Security
The public VAPID key is safe to ship in the browser. The VAPID private key and dispatcher webhook secret are never committed to GitHub; production stores them in Supabase Vault. The database trigger decrypts only the dispatcher secret at call time, and the Edge Function reads push credentials through a service-role-only RPC.

## Client sync
`signal-alert-engine.js` keeps the signed-in notification profile updated with the device timezone and up to 40 watch/chase terms from the local VaultSignal state.

## Database
`supabase/signal-alert-engine-v19.sql` adds smart-routing preferences, a server-only push-delivery audit/dedup table, the Vault config RPC, and automatic `pg_net` dispatch for new Signal Network posts.

## Important
Community signals are time-sensitive reports, not guaranteed inventory. Exact household location is never required for routing.
