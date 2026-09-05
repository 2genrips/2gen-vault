# VaultSignal v15 — Card Journey

v15 adds the missing life-story layer to VaultSignal: a card is no longer only a row with a market value. It can carry a history from acquisition/pull through collection, market tracking, grading, trading, selling, giveaways and creator moments.

## Card Journey timeline

For a selected card, VaultSignal attempts to connect existing local data from:

- the Vault card record
- Rip Sessions
- purchase history
- grading tracker
- Trade Lab history
- Sell Lab history
- Giveaway Locker
- Creator Content Queue
- local Market Pulse price snapshots
- user-added personal milestones

Identity matching prefers explicit IDs. If IDs are unavailable, it uses conservative name + set/card-number matching where possible.

## Journey completeness

Each card receives a story-completeness score based on organization fields such as:

- set
- collector/card number
- cost basis
- current market/reference field
- binder/storage location
- condition/grade metadata
- multiple Journey events

This is an organization score, not a quality, investment or grading score.

## Card Passport

A card can generate a shareable text passport containing:

- card identity
- game/set/number
- copies tracked
- cost basis
- current tracked reference value
- Journey completeness
- recent story milestones

v15 keeps passports local/private except when the user deliberately shares or copies one.

## Story Studio

Story Studio reframes collecting around memories as well as value. It creates a simple card-story summary suitable for sharing with family or using as a creator-content starting point.

The data model is prepared for future opt-in public card-story/profile links after authenticated cloud sync exists.

## Grading Review

The grading tool compares:

- current raw reference
- user-entered graded reference
- grading fee
- shipping/insurance estimate

It calculates a break-even graded reference and reference spread after entered costs.

It does **not** predict a professional grade, inspect physical condition, authenticate the card, or guarantee resale value.

## One-Tap Command

The Journey overlay includes a mobile command launcher for the major jobs in VaultSignal:

- Scan & Value
- Find Stock
- Start a Rip
- My Vault
- Search Market
- Trade Lab
- Sell Lab
- Creator Command
- Grail IQ
- Card Journey

This is intended to reduce navigation friction as the collector OS grows.

## Android/PWA integration

- Journey floating action button
- Journey Home card when the Vault has cards
- full-screen mobile overlay
- PWA offline-shell caching
- v15 cache/version bump

## Data safety

The existing storage key remains unchanged:

`2gen-vault-collector-os-v4`

New v15-only state is nested under:

`journeyEngine`

Existing v12–v14 Vault, Creator Command and Grail IQ data stays compatible.

## Accuracy rules

Card Journey does not fabricate missing history. It only builds automatic events when existing VaultSignal data can be linked with reasonable confidence. Users can add manual personal milestones when the app could not have known an event automatically.
