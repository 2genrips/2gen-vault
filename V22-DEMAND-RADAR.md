# VaultSignal v22 — Demand Radar

Demand Radar turns community activity and supported availability evidence into a privacy-safe hobby attention signal.

## What it solves
Discord groups are useful for speed, but collectors still have to read many posts to understand what is actually heating up. Demand Radar summarizes current activity into one product-level view.

## HEAT score
HEAT is a 0–100 hobby attention / availability intelligence score built from:
- recent Signal Fusion incident velocity,
- independent collector reports,
- confirmations,
- live incident count,
- active Source Mesh evidence,
- official API evidence when configured,
- licensed partner evidence when configured,
- public storefront evidence,
- privacy-safe shared watch interest,
- gone / unavailable evidence.

HEAT is not a price forecast, investment rating, resale recommendation, or guarantee of future availability.

## Heat states
- **SURGING** — very high heat with positive momentum.
- **HOT** — strong current collector/evidence activity.
- **ACTIVE** — meaningful current activity.
- **COOLING** — some current evidence but not strong crowd demand.
- **QUIET** — insufficient activity for a meaningful shared signal.

## Privacy rule
Raw user watch terms never appear in `demand_radar`.

Shared watch interest requires at least **3 distinct collectors** independently matching the same normalized term. Below that threshold:
- `watcher_count` is published as `0`,
- `watch_interest_visible` is `false`,
- private interest contributes **zero** points to shared HEAT.

The UI says only that watch interest is private below the threshold. It never reveals whether the hidden sample is 0, 1, or 2 collectors.

## Source quality guard
Source Mesh can create a LIVE incident without a human post. v22 deliberately prevents that source-created incident from being counted again as community velocity.

A product simply being available at a supported storefront does not equal crowd demand.

## Mobile UI
`demand-radar.js` / `demand-radar.css` add:
- privacy-safe top heat board,
- game filters,
- Your Watch matching from local VaultSignal watch/chase data,
- momentum labels,
- community/source evidence breakdown,
- one-tap Signal Fusion War Room routing,
- one-tap Find Stock routing,
- shareable radar summaries,
- 60-second foreground refresh while the panel is open.

On phone-sized screens the standalone RADAR top-bar pill is hidden. Demand Radar is available through **COMMAND → Demand Radar** so the compact v18.2 mobile header remains clean.

## Backend
Migrations:
- `supabase/demand-radar-v22.sql`
- `supabase/demand-radar-v22-quality.sql`

Key objects:
- `public.demand_radar`
- `public.refresh_demand_radar()`
- `public.refresh_demand_radar_safe()`
- `vaultsignal-demand-radar-refresh` pg_cron job every five minutes

The table is RLS-protected and readable only by authenticated collectors. Service role owns refresh/write behavior.

## Production validation performed before PR
- v22 migrations applied successfully to the live VaultSignal Supabase project.
- shared watch-interest output currently shows zero visible products because the live community has not yet met the 3-collector threshold.
- this confirms the privacy suppression path is active rather than fabricating community demand.
- initial Source Mesh double-counting was detected during live seeding and corrected with the v22 quality guard before release.
