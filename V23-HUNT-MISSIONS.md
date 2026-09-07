# VaultSignal v23 — Hunt Missions

Hunt Missions turns collector chatter into coordinated, privacy-safe scouting.

## What it adds

- Create a mission for a product, retailer, broad region, target price and deadline.
- Join another collector's mission as a scout.
- Post immutable CHECKING, FOUND, NOT_FOUND, SOLD_OUT or INFO check-ins.
- Mission state automatically derives from the scout team and evidence: OPEN, SCOUTING, FOUND, EXPIRED or CLOSED.
- FOUND requires an actual FOUND check-in. NOT_FOUND or SOLD_OUT reports never automatically declare an entire region unavailable.
- Mission detail combines scout activity with Demand Radar, Signal Fusion and Source Mesh context.
- One-tap route into Find Stock and matching War Room intelligence.
- Push deep-links use `?mission=<uuid>` and open the exact mission.

## Mobile UX

- `COMMAND → Hunt Missions` is the primary phone entry.
- The separate HUNT top-bar pill is hidden below 760px so the mobile header stays clean.
- Hunt Mission CSS/JS are cached for offline shell availability in `vaultsignal-hunt-missions-v230`.

## Community safety and privacy

- Hunt Missions are signed-in, public-room-style collaboration; there are no private DMs.
- Mission and check-in regions accept only `Online` or a broad `###xx` ZIP region.
- Never store household coordinates, home addresses, school information, phone numbers or a child's precise location in mission records.
- Mission creators automatically join their own mission and cannot leave their own scout team.
- Scouts must join before posting a check-in.
- Check-ins are rate-limited and cannot be edited after posting; a collector may delete their own mistaken check-in instead.
- Mission counters and status are server-derived rather than browser-controlled.
- Active mission creation is capped per user and missions expire automatically.

## Targeted push

Signal Push v5 supports mission payloads separately from Signal Network posts.

- FOUND and SOLD_OUT check-ins are eligible for mission-team push.
- Routine CHECKING, INFO and NOT_FOUND activity stays in the live mission feed to reduce notification noise.
- Recipients are limited to the mission creator and joined scouts with notifications enabled.
- User quiet hours and minimum score preferences still apply.
- Push delivery audit rows store `mission_id` and `mission_checkin_id` instead of inventing a fake Signal Network post.

## Backend files

- `supabase/hunt-missions-v23.sql`
- `supabase/hunt-missions-v23-hardening.sql`
- `supabase/hunt-missions-v23-push.sql`
- `supabase/functions/signal-push/index.ts`

## Important boundaries

Hunt Missions coordinates collector scouting. It does not guarantee inventory, reserve merchandise, purchase products automatically, expose exact household location, or infer that an entire region is sold out from a small number of scout reports.
