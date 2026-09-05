# VaultSignal v14 — Grail Intelligence

v14 adds a decision/intelligence layer on top of the existing collector OS and v13 Creator Command.

## Grail IQ Brief
- Vault data-health score
- next-best-move queue
- unread signal awareness
- backup freshness
- monthly hobby-budget awareness
- nearly complete set prompts
- ready creator-content prompts
- stock-watch prompts
- weekly shareable hobby review

The score is an organization/workflow signal, not an investment rating.

## Chase Command
Ranks current Wishlist + Acquisition Queue items using:
- current reference price
- target price
- owned copies
- priority
- fit within remaining monthly hobby budget

The score does not predict future card prices.

## Rip / Keep Lab
A personal collector-fit calculator for tracked sealed products.

Inputs:
- sealed reference value
- user's expected pull value
- copies owned / minimum keep-on-hand
- chase excitement
- creator/content value
- current monthly hobby-budget state

Output:
- RIP FIT
- KEEP FIT
- EITHER FITS

This is deliberately not presented as financial advice or guaranteed opening ROI.

## Episode Builder
Reads the latest Rip Session and creates a father-and-son filming rundown:
- cold open
- product reveal
- battle/goal setup
- rip sequence pacing
- hit/value-check beat
- final recap
- copyable episode plan

It links directly back to v13 Creator Command's Content Engine.

## Collection Quest
Milestones currently include:
- first card
- 100 cards
- first sealed product
- 10 / 50 Rip Sessions
- 10 Pack Battles
- completed set goal
- creator posting milestone
- 90+ data health
- two-generation family profiles

Milestones reward organizing, collecting and creating; they are not designed to encourage overspending.

## Android/PWA integration
- GRAIL IQ button in the top bar
- next-move Grail card injected into Home
- IQ shortcut inside Creator Command
- full-screen mobile overlay
- offline shell caching through the v14 service worker

## Data safety
- Existing localStorage key remains unchanged: `2gen-vault-collector-os-v4`
- Grail-specific state is nested under `grailEngine`
- Existing v12/v13 collection and creator data remains compatible

## Build quality
v14 adds `.github/workflows/validate-static.yml` to run `node --check` on the static JavaScript files and verify that Grail assets remain wired into the build.

## Still intentionally dependent on real providers
VaultSignal does not fabricate:
- Target/Walmart/GameStop shelf quantities
- professional card grades
- guaranteed sale prices
- follower counts
- native paid entitlement

Those continue to require supported providers, backend services, or native store billing.
