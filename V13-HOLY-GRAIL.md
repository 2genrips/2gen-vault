# VaultSignal v13 — Holy Grail Creator Command

VaultSignal v13 preserves the v12 collector OS and adds a dedicated creator/family layer designed for 2GEN RIPS.

## New Creator Command Center

Open from the floating **Creator** button or the **2GEN** button in the top bar.

### Pack Battle
- Dad vs Son scoring
- Pokémon, Lorcana, Magic, Yu-Gi-Oh!, One Piece, Sports and Other
- transparent score = tracked reference value + small rarity bonus
- live score
- best-pull tracking
- import the latest Rip Session
- share battle result with Web Share / clipboard fallback
- persistent family battle history
- family win leaderboard
- explicitly fun-only scoring; no wagering or investment meaning

### Content Engine
Uses the latest VaultSignal Rip Session to generate:
- YouTube title
- TikTok/Facebook short caption
- YouTube/Facebook description
- hashtags
- opening cost, tracked pull value, hit count and ROI context
- copy/share actions

### Family Board
- reads existing VaultSignal collector profiles
- shows assigned card/sealed quantities and tracked values
- Pack Battle leaderboard
- quick routes to Vault, Creator Hub, Content Engine and Battle

### 2GEN Hub
Direct launch links for the existing 2GEN RIPS channels:
- YouTube
- TikTok
- Facebook

## Architecture

- No existing v12 storage key was changed.
- Existing local collection data is preserved.
- v13 creator state is nested inside the same local VaultSignal JSON under `creatorCommand`.
- Creator Command is isolated into `creator-command.js` and `creator-command.css` to reduce regression risk in the large v12 core.
- The PWA service worker caches the new creator assets for offline shell support.

## Still honest about external dependencies

The frontend does not invent:
- live Target/Walmart/GameStop shelf quantities
- grading outcomes
- social follower counts
- paid premium entitlement
- marketplace sale prices

Those features continue to require supported providers/backends or native billing where appropriate.

## Test focus

Before merging to `main`, test on Android/PWA:
1. Existing v12 Vault data still appears.
2. Creator button opens and closes cleanly.
3. Start a battle, add pulls to both sides, finish, share, reopen.
4. Latest Rip Session imports into one battle side.
5. Content Engine reads the latest Rip Session.
6. Creator routes to Stock, Search, Vault and Tools.
7. Install/PWA refresh loads v13 assets after service-worker update.
