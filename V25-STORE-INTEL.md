# VaultSignal v25 — Store Intel

Store Intel turns evidence-backed Hunt Mission history into persistent intelligence for public retailer locations.

## What it adds

- Trusted public-store directory built from Hunt Mission history.
- Store profiles show trusted claims, source-verified claims, corroborated claims, independent scouts, recent products, proof quality, conflict history and last trusted result.
- Filters for All Stores, Following and the collector's broad region.
- Follow/unfollow controls for signed-in collectors.
- Push deep-links use `?store=<store_key>` and open the exact Store Intel profile.
- Android primary entry is `COMMAND → Store Intel`; the separate STORES top entry stays hidden on phones.

## Trust threshold

A single unverified report is never enough to create Store Intel.

A store enters the directory only when it has:

- at least one SOURCE_VERIFIED or CORROBORATED availability claim, or
- multiple independent availability claimants.

The store label must also safely identify the named retailer. Obvious home/residence/school labels and phone-number-like content are rejected.

## Store follows and alerts

Store follows are opt-in and private to the signed-in collector.

The dedicated `store-push` Edge Function sends store-follow alerts only for:

- `FOUND` or `SOLD_OUT`, and
- `CORROBORATED` or `SOURCE_VERIFIED` proof.

UNVERIFIED, CONFLICTED, CHECKING, INFO and NOT_FOUND activity stays out of store-follower push. Personal notification enablement, minimum score and quiet hours still apply.

Mission-team push remains separate in `signal-push`, so Store Intel cannot broaden an unverified Hunt Mission alert to unrelated store followers.

## Persistence hardening

The initial Store Intel rebuild implementation deleted and recreated store rows. Because follows reference store rows with cascading deletes, that would have erased valid follows during a scheduled refresh.

`store-intel-v25-refresh-hardening.sql` replaces that behavior with in-place UPSERTs. Valid store profiles preserve their identity and follows across background rebuilds. A store is deleted only when it genuinely no longer qualifies for the trusted directory.

## Backend

- `supabase/store-intel-v25.sql`
- `supabase/store-intel-v25-push.sql`
- `supabase/store-intel-v25-refresh-hardening.sql`
- `supabase/functions/store-push/index.ts`
- `supabase/functions/store-push/deno.json`

Production automation rebuilds Store Intel every ten minutes and evidence-triggered dispatches refresh it before evaluating a store-follow alert.

## Privacy and safety

- Store Intel covers public retailer locations only.
- Shared location is broad region such as `287xx` or `Online`.
- Do not publish household coordinates, home addresses, school locations, phone numbers or a child's precise location.
- Store follows are visible only to their owner through RLS.
- Store Intel is evidence history, not a guarantee of current shelf inventory.

## Important boundaries

Store Intel does not reserve products, purchase automatically, guarantee inventory, predict future restocks, rank stores by spending opportunity, or encourage overspending. Proof scores describe evidence quality only.
