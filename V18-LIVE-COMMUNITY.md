# VaultSignal v18 — Live Community Core

v18 turns Signal Network from a structured local/community preview into a production-oriented community foundation.

## What v18 adds

### Collector accounts and public-safe identity
- Sign in, create account, or request a magic link through the existing Supabase Auth foundation.
- Community profiles expose only a display name and broad region.
- Exact home addresses, household coordinates, payment data and private child-contact fields are intentionally excluded.

### Reputation
`community_reputation` is a derived database view. Clients do not write their own score.

The first score model uses:
- structured posts
- helpful marks
- confirmations
- sold-out/gone disagreement

The score is a community-usefulness indicator only. It is not identity verification and does not guarantee that inventory is still available.

### Signal Shield moderation
v18 adds:
- authenticated moderation reports
- local immediate hide
- user blocks
- moderator-state fields for server/admin review
- public-room-first design with no Signal Network DMs
- 12 posts per rolling 10 minutes anti-spam trigger

### Private Realtime hardening
The v18 client wraps Signal Network Realtime topics as private channels when cloud is connected.

The database migration includes RLS policies on `realtime.messages` for authenticated Signal Network Broadcast and Presence traffic.

Before a production community launch, disable public channel access in Supabase Realtime settings so clients must pass the private-channel authorization policies.

### Smart alert router
Each account can keep:
- notifications enabled/disabled
- followed alert rooms
- minimum desired Signal score
- urgent-only mode
- quiet start/end times

Push notification permission is requested only after an explicit user action.

### Web Push
The PWA service worker now handles `push` events and notification deep links.

A device subscription is stored in `push_subscriptions` only after:
1. the user explicitly enables push,
2. browser notification permission is granted,
3. a public VAPID key is configured,
4. the collector is signed in.

Private VAPID credentials never belong in GitHub Pages.

### Edge Function
`supabase/functions/signal-push/` contains a deployable Edge Function for sending Web Push notifications.

Required Edge Function secrets:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- optional `SIGNAL_PUSH_WEBHOOK_SECRET`

The function:
- receives a new Signal payload,
- finds enabled notification preferences for that room,
- respects urgent-only mode,
- respects quiet hours when a timezone is stored,
- sends notifications to registered devices,
- removes expired push endpoints after 404/410 responses.

Use a Supabase Database Webhook or other trusted server call to invoke the function on new `signal_posts` inserts.

## Supabase key transition
Supabase is moving from legacy anon/service-role keys toward publishable/secret keys.

v18 adds `supabasePublishableKey` to public config while keeping `supabaseAnonKey` as a temporary compatibility fallback for the existing cloud bootstrap.

Never put a Supabase secret key or legacy service-role key in `config.js`.

## Files
- `live-community.js`
- `live-community.css`
- `cloud-compat-v18.js`
- `supabase/live-community-v18.sql`
- `supabase/functions/signal-push/index.ts`
- `supabase/functions/signal-push/deno.json`

## Activation sequence
The code can ship while cloud values remain blank; it stays in clearly labeled preview mode.

To activate real multi-user community mode later:
1. Create/connect the Supabase project.
2. Apply `signal-network-v17.sql` then `live-community-v18.sql`.
3. Add the Project URL and publishable key to public config.
4. Disable public Realtime channels and use the included RLS policies.
5. Generate VAPID keys; place only the public key in app config.
6. Put private VAPID and server Supabase credentials in Edge Function secrets.
7. Deploy `signal-push`.
8. Connect a trusted database webhook for new Signal posts.

## Safety and fairness
Signal Network remains a fair-access collector tool. It does not bypass queues, CAPTCHAs, purchase limits or retailer access controls.

No community stock report is treated as guaranteed inventory. Freshness, disagreement and reputation are context—not certainty.
