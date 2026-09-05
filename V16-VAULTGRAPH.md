# VaultSignal v16 — VaultGraph

v16 adds a provenance layer across the collector OS. VaultSignal can now connect tracked sealed products to Rip Sessions, recorded pulls to owned Vault cards, and those cards to later collection activity.

## What VaultGraph connects

VaultGraph reads the same existing local VaultSignal data and builds relationships across:

- Product Command / sealed inventory
- Rip Sessions
- recorded pulls
- owned Vault cards
- Card Journey
- grading tracker
- Trade Lab
- Sell Lab
- Giveaway Locker
- Creator Content Queue

It does not create a duplicate collection database.

## Product Trail

Each tracked product can show Rip Sessions that appear to originate from it.

Link confidence is intentionally transparent:

- **CONFIRMED / LINKED** — explicit IDs or stored manual link data
- **STRONG MATCH** — exact card identity fields such as name plus set/number
- **SUGGESTED** — conservative name-based relationship that should not be treated as proven provenance

VaultGraph never converts a weak name match into confirmed provenance.

## Pull Tree

A Rip Session can display:

`source product → session → pull → owned Vault card`

When a pull links to a Vault card, the collector can jump directly into Card Journey to see the rest of that card's story.

## Card Provenance score

Cards receive an organization/provenance-completeness score based on whether the record contains useful identity and lifecycle data such as:

- stable card identity
- set
- card / collector number
- cost basis
- current market/reference value
- a linked Rip Session
- later downstream activity such as grading, selling, trading, giveaway or content

This is **not** an authenticity score, condition score, grade prediction or investment score.

## Missing Link Center

VaultGraph surfaces recorded activity that cannot currently be connected with reasonable confidence, including:

- Rip Sessions with no identified source product
- pulls with no matching owned Vault card

This is deliberately better than silently inventing a relationship.

## Provenance Report

The app can generate a privacy-safe text summary of:

- tracked product count
- Rip Session count
- card count
- recorded relationship count
- suggested relationships needing review
- missing-link count

The report does not expose home location, private credentials or full purchase history.

## Android / PWA integration

- GRAPH button in the top bar
- floating Graph shortcut
- full-screen mobile VaultGraph interface
- direct routes to Stock, Rip Lab and Card Journey
- offline shell caching
- v16 service-worker cache bump

## Data safety

The existing VaultSignal storage key remains unchanged:

`2gen-vault-collector-os-v4`

VaultGraph-only data lives under:

`vaultGraph`

Existing v12–v15 Vault, Creator Command, Grail IQ and Card Journey data remains compatible.

## Accuracy principle

VaultGraph is built around a simple rule:

**No provenance claim is stronger than the data that supports it.**

Explicit IDs are trusted. Conservative identity matches are labeled. Missing history remains missing instead of being fabricated.
