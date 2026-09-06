# VaultSignal v20 — Signal Fusion

v20 turns repeated community restock chatter into one evolving incident.

## Why it matters
Discord-style groups are fast, but the same drop can create dozens of duplicate messages. Signal Fusion groups matching stock, local-find and deal reports into one War Room with a shared status, confidence score, freshness and community evidence.

## Incident states
- **LIVE** — current community evidence supports availability/activity.
- **WATCH** — signal exists but confidence is not yet strong enough for LIVE.
- **GONE** — multiple gone reports outweigh confirmations.
- **STALE** — client-side freshness state when an unresolved incident has not been updated for more than 90 minutes.

STALE is intentionally calculated on the device so an old incident does not remain visually live just because no new database write occurred.

## Fusion logic
For `pokemon-drops`, `local-finds` and `deals`, matching reports within a 90-minute window can share one `signal_incident`.

Matching uses normalized:
- room
- product/title
- retailer
- broad region for Local Finds

Local Finds continues to use broad community regions only. Exact household locations are never required.

## Confidence
Incident confidence is based on:
- independent reporter count
- number of matching reports
- confirmations
- helpful reactions
- gone reports
- the latest report type

The UI applies additional freshness decay as time passes.

This is a community-intelligence score, not a guarantee that inventory remains available.

## Smart alert suppression
v20 replaces per-post stock push dispatch with fusion-aware dispatch. A fused incident can alert when:
- a new incident is created,
- status materially changes,
- confidence crosses important thresholds,
- community reactions materially strengthen or weaken the incident.

A short cooldown prevents rapid repeat alerts. The delivery audit uses an incident event key so retries do not send the same state/score-band alert twice to one device.

## War Room
`signal-fusion.js` adds a mobile-first War Room showing:
- effective confidence
- LIVE/WATCH/STALE/GONE status
- report count
- independent collector count
- confirmations and gone reports
- incident timeline
- direct routes to Find Stock and the underlying raw Signal Network room
- shareable incident summary

The raw Signal Network remains available so users can inspect the underlying reports.

## Command Center
Mobile Command Center now includes **Signal Fusion** as a first-class collector system.

## Push deep links
Fused push notifications open `?incident=<id>` so VaultSignal can launch directly into the matching War Room.

## Backend
Migration: `supabase/signal-fusion-v20.sql`

Key objects:
- `signal_incidents`
- `signal_posts.incident_id`
- incident-aware delivery audit fields
- `refresh_signal_incident(...)`
- `fuse_and_dispatch_signal_post()`
- reaction refresh triggers
- fusion-aware HTTP dispatcher

## Safety and truthfulness
VaultSignal does not fabricate shelf quantity, inventory state or community confirmations. Incident status is derived only from recorded provider/community evidence and can change quickly.
