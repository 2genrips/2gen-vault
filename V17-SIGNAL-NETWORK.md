# VaultSignal v17 — Signal Network

v17 adds a structured community layer designed to keep the speed and energy of Discord collector groups while reducing channel noise and making each report actionable inside VaultSignal.

## Core idea

Discord is excellent at fast community conversation, but important collector information can disappear in a scroll. Signal Network treats community activity as structured collector data.

A Signal can contain:
- room
- signal type
- product/topic
- retailer/source
- broad ZIP region
- freshness
- confirmations
- sold-out responses
- helpful responses
- author trust signal
- direct routes back into Stock tools

## Rooms

Initial public rooms:
- For You
- Pokémon Drops
- Local Finds
- Deals
- Big Pulls
- Trade Talk
- Creator Lab

The For You room is not just a channel. It matches posts against the user's existing stock watches, wishlist, acquisition queue and chase list.

## Smart Inbox

Smart Inbox reads structured room activity against the collector's own VaultSignal interests. The goal is to reduce the need to manually check many community channels.

## War Room

Drop-like signals can open a focused War Room showing:
- freshness
- signal score
- confirmations
- sold-out reports
- helpful responses
- retailer/product context
- direct access to VaultSignal Stock tools

War Room is a fair-access feature. It does not bypass retailer queues, CAPTCHAs, purchase limits or checkout controls.

## Signal Score

The v17 preview score combines:
- report freshness
- community confirmations
- sold-out responses
- helpful reactions
- a lightweight local reporter-trust signal

It is a community usefulness/confidence score, not a guarantee that inventory is still available.

## Local Finds privacy

Community posts only need a broad location label such as `287xx`.

Signal Network intentionally does not require:
- exact home address
- household coordinates
- a child's location
- private contact information

## No direct messages in v17

Signal Network starts with public structured rooms rather than DMs. This keeps moderation simpler and avoids creating unnecessary private-contact pathways in a family-oriented collector app.

## Cloud / Realtime architecture

When `supabaseUrl` and the public client key are configured, Signal Network can use the existing VaultSignal cloud client for authenticated community posts.

The included SQL migration creates:
- `signal_posts`
- `signal_reactions`
- `signal_room_follows`
- RLS policies
- realtime publication entries

The client is prepared to use Supabase Realtime Broadcast for low-latency room signals and Presence for lightweight online counts. Persisted posts remain in Postgres.

Migration file:

`supabase/signal-network-v17.sql`

Until cloud is configured, the UI runs in clearly labeled `LOCAL PREVIEW` mode with demo examples and local posts.

## Android / PWA integration

- SIGNALS top-bar entry
- floating Signals shortcut
- Signal Network Home card
- full-screen mobile room UI
- offline shell caching
- v17 service-worker cache bump

## Existing data safety

VaultSignal keeps the same localStorage root:

`2gen-vault-collector-os-v4`

Signal Network state is nested under:

`signalNetwork`

Existing Vault, Creator Command, Grail IQ, Card Journey and VaultGraph data remains compatible.

## Accuracy principle

Signal Network never treats a community report as guaranteed stock. Freshness, confirmations and disagreement are visible so the user can judge the signal instead of seeing a fake certainty badge.
