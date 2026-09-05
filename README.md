# VaultSignal Collector OS v8.0

**VaultSignal by 2GEN RIPS**  
**Two Generations. One Collection.**

This is the easy-to-deploy GitHub Pages build. No npm, Codespaces, Android Studio, APK, or GitHub Actions are required for normal updates.

## Files to upload to the ROOT of your GitHub repository

- `index.html`
- `styles.css`
- `app.js`
- `config.js`
- `cloud.js`
- `manifest.webmanifest`
- `sw.js`
- `icon.svg`

## Update your current GitHub Pages app

1. Extract this ZIP on Android.
2. Open your `2gen-vault` GitHub repository.
3. Upload all seven website files above to the **root** of the repo.
4. When GitHub asks about files with the same name, replace/update them.
5. Commit the changes to `main`.
6. GitHub Pages will redeploy automatically.
7. Reopen your Pages URL. If your installed PWA still shows the old version, fully close it and reopen it once.

## What is functional in this build

### Stock Finder
- ZIP / postal code
- Search radius
- Optional phone geolocation
- Real nearby store discovery using OpenStreetMap / Overpass
- Retailer filters
- Retailer product-search shortcuts
- Product stock watchlist
- Manual stock reports
- Prepared secure live-inventory connector
- Inventory result cards and saved reports

### Collector Vault
- Card collection
- Quantity, condition, cost basis, market value
- Sealed product inventory
- Open-one workflow
- Set completion goals
- CSV export

### Card Search
- Live Pokémon card search through the public Pokémon TCG data source when available
- TCGplayer market fields where supplied by that source
- Multi-TCG demo catalog for UI testing

### Collector Tools
- Camera/photo capture
- Wishlist
- Card price alerts
- Monthly hobby budget
- Purchase log
- Grading submission tracker
- Trade journal
- Full JSON backup/import
- Editable branding

## Live retailer inventory — important

This app DOES NOT fake retailer stock.

GitHub Pages is a public frontend. Retailer partner keys and other private credentials must never be placed in `config.js` or `app.js`.

When a legal/supported inventory source is available, we will connect it through a small secure backend. The frontend is already built for that.

In `config.js`, only a PUBLIC backend URL will eventually be added:

```js
window.TWOGEN_CONFIG = {
  inventoryApiBase: "https://api.example.com",
  appVersion: "0.4.0"
};
```

The backend will hold private credentials and return normalized stock results to the app.

## Why this architecture is useful

You keep the same installed GitHub Pages app on your phone. As we add retailer connectors, cloud accounts, community reporting, push alerts, and premium features, you update the website files — no APK reinstall is required during development.


## New in v0.5 — 2GEN Live Stock Network

- **Hunt Mode:** builds a collector run from nearby stores and lets you check off each stop.
- **Directions per stop:** one tap opens directions to the store.
- **Report from a hunt stop:** pre-fills the store into the stock-report workflow.
- **Stock confidence:** reports receive a freshness/confidence score based on age and confirmations.
- **Still there / Sold out confirmations:** local proof-of-concept for the future community network.
- **Find → Buy → Track:** “Bought it” can log the purchase and immediately add the product to the Sealed Vault.
- **Hunt saved watches:** load a saved stock watch back into Stock Finder with one tap.
- **Live connector remains honest:** retailer quantities are only shown if a secure connected inventory service returns them.

### Why confidence scoring matters

A stock report that is 8 minutes old should not be treated the same as one from yesterday. The app now visibly scores freshness. When cloud/community accounts are connected, confirmations from multiple collectors can feed this same model.


## New in v0.6 — Accounts + shared community network

The app now has an optional secure cloud layer while preserving Guest mode.

- Email/password accounts
- Magic-link sign-in
- Collector profile + home ZIP
- Shared community stock reports
- “Still there” / “Sold out” confirmations per signed-in collector
- Public report freshness/confidence scoring
- Private cross-device vault backup + restore
- Row Level Security SQL policies
- GitHub Pages remains the frontend
- Supabase is the optional secure account/database layer

To activate the cloud features, follow `START-HERE-CLOUD.txt` and run `SUPABASE_SETUP.sql`.


## New in v0.7 — Restock Radar

This build continues to work even while cloud setup is unavailable.

### Restock Radar
Each saved stock watch now gets a score based on:
- report recency
- repeated sightings
- number of stores seen
- high/medium/low priority
- whether an observed price meets your max-price target

The score is an app intelligence signal, not a claim that inventory is currently available.

### Product watch dashboard
Tap **Details** on any watch to see:
- recent sighting count
- number of stores observed
- best observed price
- retailer comparison
- quick retailer search buttons
- current radar score

### Hot Drops
The app groups recent real reports/results and ranks products by recency + sighting frequency.

No inventory is fabricated.

### Better nearby-store cards
Nearby store discovery now preserves:
- distance
- raw opening-hours text when map data provides it
- directions
- website link when map data provides it

### Watch upgrades
New watches can store:
- priority
- desired quantity
- maximum price
- retailer list
- radius


## New in v0.8 — Smart Product Pages

Sealed product tracking is no longer just a quantity list.

Each product can now have its own page connecting:

- Game / TCG
- Set / release
- Product type
- MSRP
- Your target buy price
- Best observed inventory price
- Current inventory sightings
- Your Restock Radar watch
- Owned sealed quantity
- Average cost basis
- Current tracked sealed value
- Purchase workflow
- Opening history
- Quick watch creation
- Quick add-to-vault

### Product database

The app includes starter sealed-product templates and lets you create your own products without waiting for a third-party product API.

When we later connect a legal sealed-product catalog/API, these pages are already ready for real product IDs, images and release metadata.

### Find → Product Page → Buy → Vault → Open

Inventory results and community reports can now open/create the matching smart product page.

Your sealed vault can also jump back into a product page.

Opening a sealed item records it in Opening History so you can track how much sealed inventory you actually open over time.


## New in v0.9 — Master Set Lab + serious collection organization

### Card detail pages
Search results now open a full card page with:
- market / low price
- owned quantity
- raw vs graded count
- average cost
- unrealized collection value
- your individual copies
- wishlist / alert actions
- direct set-page access when the provider supplies a set ID

### Raw + graded copies
Copies can now be tracked separately:
- Raw
- Grader
- Grade
- Certification number
- Condition
- Cost basis
- Binder / storage location

### Binder manager
Create physical collection locations such as:
- Main Binder
- Trade Binder
- Son's Binder
- Toploader Box
- Graded Slab Case

Moving or renaming a binder keeps its card assignments.

### Duplicate Center
The Vault now finds cards with multiple owned copies and surfaces them for trade/sell decisions.

### Master Set Lab
For Pokémon sets, Set Explorer can:
- search live sets
- load the live card checklist
- calculate unique owned cards
- calculate completion percentage
- show missing cards
- add missing cards directly
- open individual card details

Other TCGs can use the same set/checklist UI when their providers are connected.


## New in v1.0 — Rip Sessions + Pull Analytics

### 2GEN Rip Lab
Create an opening session for:
- loose packs
- tins
- ETBs
- collection boxes
- booster bundles
- booster boxes
- any sealed TCG product

Each session tracks:
- game
- product
- number of packs
- opening cost
- pull list
- current pull market value
- hit count
- hit-value threshold
- cards logged
- ROI
- sets represented

### Scan / identify workflow
The camera can capture a card image on-device.
The app does NOT pretend it can identify the card automatically yet.

After capture, you search live card data and choose the correct match manually.
This gives us a safe workflow now while preserving a clear path to real computer-vision matching later.

### Pull → Vault
A finished rip session can add all logged pulls directly into your collection.

### Set progress
Pull rows can show the set completion impact when set-total data is available.

### Product → Rip Session
Opening sealed inventory from:
- Smart Product Pages
- Sealed Vault

can immediately start a new Rip Session with the product cost already carried over.

### Session export
Each rip can be exported as JSON for backups, analysis, or future creator/content workflows.


## New in v1.1 — Dashboard Pro

VaultSignal now includes a full analytics workspace.

### Portfolio snapshots
The app saves one local portfolio snapshot per day and keeps up to 365 snapshots.

Dashboard Pro shows:
- current vault value
- tracked cost
- gain/loss vs cost basis
- 30-day portfolio trend
- snapshot growth
- manual snapshot button

The trend reflects values stored in VaultSignal. It is only as current as the market fields available to the app.

### Asset allocation
See:
- singles vs sealed
- value by TCG/game

### Spending analytics
The purchase log is summarized into a six-month spending chart.

### Position analytics
Strongest and weakest card positions compare:
current card market field vs your recorded cost basis.

They are NOT presented as day-to-day gainers/losers because the current frontend does not yet have reliable historical card-price feeds.

### Vault Data Health
A transparent organization/completeness score based on:
- cost-basis coverage
- binder/storage locations
- sealed cost/value tracking
- binder organization
- purchase history
- backup freshness

This is NOT an investment rating.

### Set analytics
See your most complete tracked sets and jump into Master Set Lab.

### Rip analytics
Compare opening-session:
- cost
- pull value
- ROI
- pack count
- card count


## New in v1.2 — Smart Scanner + Collector Automation

### Rapid batch intake
Smart Scanner now supports a queue so you can work through a stack of cards before committing them to the Vault.

Workflow:

1. Capture a card photo if useful.
2. Search live card data by name/card number.
3. Choose the correct card.
4. Queue it.
5. Review quantity, cost and suggested binder.
6. Add the full batch to the Vault.

### Duplicate detection
Before a queued card is added, VaultSignal checks your current collection and flags:
- whether you already own the card
- how many copies are already tracked

When a queued card matches an existing raw card in the same binder/condition, batch commit can merge the quantity instead of creating unnecessary duplicate rows.

### Set-gap detection
If live set-total metadata is available, the scanner flags a card as:
- missing from set
- already owned / duplicate
- new to the Vault

### Binder suggestion
The scanner suggests the binder that already contains the most cards from the same set, then the same TCG, with your preferred binder used as a tie-breaker.

You can change the binder before committing.

### Grading review flag
The scanner can flag a card for **manual grading review** using:
- current market-value threshold
- rarity text

It does NOT claim to inspect centering, corners, edges, surface, authenticity, or physical condition from the phone image.

### Rip Session integration
If a Rip Session is active, committing a scan batch can optionally add the same cards to that opening session as pulls.

### Privacy / accuracy
Captured images remain local to the browser in this build.
The app does not upload or falsely auto-identify them.


## New in v1.3 — Auto Identify Beta

The camera workflow can now go beyond manual search.

### How it works

1. Take or choose a clear card photo.
2. Tap **Auto Identify Beta**.
3. Tesseract.js reads visible printed text locally in the browser.
4. VaultSignal extracts likely name / card-number clues.
5. Those clues are searched against the live Pokémon card data source.
6. Possible matches are ranked with a match score.
7. You confirm the exact card before adding it.

### Market value

After a live card match is found, VaultSignal shows the available:
- market field
- low field

These are live provider fields when available, not demo prices.

They are market references, not guaranteed sale prices. Real value can differ by:
- condition
- exact variant/printing
- language
- grading
- marketplace
- fees
- current buyer demand

### Important accuracy rule

The app will NOT automatically commit a card solely because OCR thinks it recognized it.

The user must confirm the exact printing.

This is deliberate because visually similar Pokémon printings can have very different values.

### Privacy

The selected card photo remains on the device for OCR in this build.
The OCR library is loaded from a CDN and processes the image in-browser.
Only extracted text is used for live card lookup.

### Best scan conditions

For better Auto Identify results:
- one card at a time
- fill most of the frame
- avoid sleeve glare
- keep the card flat
- use bright even light
- keep the name and collector number readable


## New in v1.4 — Market Pulse

### Refresh Vault Prices
Market Pulse can refresh supported live Pokémon cards already in your Vault.

For each supported card it:
- fetches current live card data
- updates the card's market / low fields
- updates the same card inside the Vault, wishlist, price alerts, rip sessions and scan queue
- stores a local price snapshot
- records the refresh job

### Local price history
VaultSignal keeps up to 365 daily price points per card.

Price history starts when:
- you search live card data
- Smart Scanner returns live matches
- Auto Identify returns ranked live matches
- Set Explorer loads live cards
- Rip Session card search returns live matches
- you run Refresh Vault Prices

### Market movement
Snapshot gainers / decliners compare your two latest saved market points.

This is intentionally NOT labeled as a full marketplace daily-gainer feed.
It only represents price snapshots collected by your own VaultSignal app.

### Price targets
Your existing card price alerts are surfaced inside Market Pulse with:
- current market field
- target value
- target-hit status
- amount above/below the target

### Card history page
Choose any tracked card to see:
- current market
- previous snapshot
- latest snapshot %
- tracked-period %
- local price trend chart
- recent saved price points

### Public API pacing
Bulk Vault refresh intentionally checks supported cards one at a time with light pacing instead of aggressively hammering the public card API.

### Accuracy
Market values are reference fields from the connected card-data source when available.
They are not guaranteed sale values and can differ by exact printing, condition, grading, marketplace, fees and buyer demand.


## New in v1.5 — 2GEN Trade Lab

Trade Lab replaces the basic trade journal with a real deal-building workflow.

### Build your side
Add directly from:
- raw/graded cards in your Vault
- sealed products in your Vault
- duplicate-card suggestions
- manual items
- cash adjustments

### Build their side
Add from:
- your wishlist
- live Pokémon card search
- manual items
- cash adjustments

### Reference-value balance
Trade Lab calculates:
- total value you give
- total value you receive
- dollar difference
- reference balance percentage
- Balanced / Close / Review / Wide-gap label

This is a **reference-value tool**, not a declaration that a trade is objectively fair.

A collector may reasonably accept a value difference because of:
- condition
- grading
- exact printing / variant
- liquidity
- scarcity
- personal collection goals
- transaction fees
- local availability

### Duplicate suggestions
Trade Lab surfaces cards where your Vault has more than one copy so extras are easy to add to a deal.

### Wishlist integration
Wishlist cards can be added directly to the receive side.

### Live incoming-card search
Search current Pokémon card data from inside Trade Lab and add a live result to the receive side.

### Proposals vs completed trades
You can:
- save a deal as Proposed
- copy a clean text summary
- complete the deal and automatically update your Vault

When a trade is completed:
- linked outgoing cards/sealed items are reduced
- linked incoming cards are added to your preferred binder
- received wishlist cards are removed from the wishlist

### Price freshness
When local price-history data exists, Trade Lab shows how recently that item's price was captured.


## New in v1.6 — 2GEN Sell Lab

Sell Lab turns collection tracking into a complete sell-side workflow.

### Pick inventory from your Vault
Sell Lab can load:
- raw cards
- graded cards
- sealed products
- duplicate-card suggestions

### Profit calculator
Enter:
- quantity
- asking price
- cost basis
- marketplace fee %
- fixed fee
- shipping
- supplies

Sell Lab calculates:
- gross sale amount
- estimated fees
- net proceeds
- tracked profit
- ROI
- break-even price per item

### Marketplace presets
Included planning presets:
- Local / Cash
- eBay
- TCGplayer
- Whatnot
- Card Show
- Other

These are deliberately labeled as estimates because actual marketplace fees can change and can vary by seller/category/options.

### Sale Queue
Draft an item before it sells.

Nothing is removed from the Vault while an item is only queued.

### Listing copy
Queued items can generate simple listing text using the card/product details already stored in VaultSignal.

### Complete sale
When you mark a queued item as Sold:
- linked Vault inventory is reduced
- the sale is saved to history
- gross / net / profit data is preserved
- net proceeds are represented in the purchase/cash-flow log
- portfolio analytics can update

### Seller analytics
Sell Lab and Dashboard Pro can now show:
- sales count
- units sold
- gross sales
- net proceeds
- tracked profit
- estimated fees


## New in v1.7 — 2GEN Family + Creator Hub

### Multiple collector profiles
VaultSignal can now keep one household app while separating ownership between collectors.

Examples:
- Household
- Dad
- Son
- Trade Inventory
- Personal Collection

Each collector profile gets:
- card count
- sealed count
- tracked value
- duplicate count

Cards and sealed products can be moved between collectors without changing the household total.

### Family duplicate transfers
If one collector owns multiple copies, a single extra copy can be transferred to another collector with one tap.

This is deliberately different from Trade Lab because no sale/trade event is created.

### Giveaway Locker
Reserve cards or sealed products for creator/community giveaways.

Statuses:
- Reserved
- Ready
- Sent

When a giveaway is marked Sent, the reserved quantity is removed from Vault inventory.

### Creator Content Queue
Turn collection activity into content planning.

You can:
- add manual content ideas
- push a Rip Session directly into the queue
- mark ideas Ready to edit
- mark content Posted
- save notes and planned dates

### Collector showcase export
Each family member can export a JSON showcase containing their assigned cards/sealed inventory.
This is groundwork for a future public web showcase/share page.

### Offline-first
These features work locally and do not require Supabase.

When cloud sync is available again, family memberships and shared household access can be moved into the cloud layer.


## New in v1.8 — 2GEN Action Center

VaultSignal now has one place that answers:

**“What should I do next?”**

Action Center builds a prioritized feed from the data already inside the app.

### High / medium / low priorities

It can surface:

- card price targets that are currently hit
- hot Restock Radar watches
- hobby budget overages / low remaining budget
- stale Vault backups
- stale Vault price refreshes
- sets close to completion
- grading submissions that may need follow-up
- queued sale drafts with negative projected profit
- older sale drafts
- saved trade proposals
- giveaways that are Ready
- long-reserved giveaway items
- creator content whose planned date has passed
- content marked Ready to edit
- high-priority stock watches that have no sightings yet

### Daily Brief

The top four current actions appear as a Daily Brief.

The Home screen also shows the top three actions, so the user does not have to search through every tool to know what matters.

### Smart routing

Each action can jump directly to the relevant area:

- Market Pulse
- Stock Finder
- Budget
- Settings / Backup
- Set Explorer
- Grading
- Sell Lab
- Trade Lab
- 2GEN Family + Creator Hub

### Hide for 7 days

Actions are computed from live local state, so instead of permanently deleting them the user can hide an action for seven days.

The Action Center can restore all hidden actions at any time.

### Important limitation

This version is an **in-app action system**.

It refreshes when VaultSignal is opened/used.

It does not pretend to deliver true background push notifications while the browser/PWA is closed. True push alerts will require a backend notification service / service-worker push architecture.


## New in v1.9 — 2GEN Watchtower

Action Center answers “What should I do next?”

Watchtower adds a second layer:

**“What happened that I should not miss?”**

### Persistent alert inbox

Watchtower turns supported Action Center conditions into saved notifications.

Examples:
- price target hit
- hot stock watch
- hobby budget warning
- stale backup
- price refresh due
- set close to completion
- grading follow-up
- unprofitable sale draft
- trade proposal follow-up
- giveaway ready
- creator-content follow-up

Unlike a normal dashboard card, the alert remains in the Watchtower inbox until the user reads or clears it.

### Duplicate-alert protection

Watchtower fingerprints each alert condition so it does not recreate the exact same message every time the app renders.

If the underlying detail changes, a new alert can be generated.

### Browser notification support

The user can optionally request browser/PWA notification permission.

When supported, Watchtower can show best-effort browser notifications for newly detected collector alerts.

Important:
- this is NOT yet true remote push
- it does not promise scheduled alerts while the app is fully closed
- it depends on browser/PWA notification support
- server-triggered push still requires backend functions + a push subscription store

### Preferences

Watchtower supports:
- master on/off
- high-priority-only mode
- category toggles for Market, Stock, Budget, Safety, Sets, Grading, Selling, Trading and Creator
- mark all read
- rebuild current alerts
- clear inbox

### Home badge

Unread/high-priority Watchtower counts now appear on the Home screen.


## New in v2.0 — Showcase Studio / Collection Passport

VaultSignal now reaches its first 2.0 milestone with a privacy-safe collector showcase system.

### Collection Passport
Each local collector profile can have a public-facing collector view containing:
- collector name / role
- card count
- sealed count
- optional tracked collection value
- featured cards
- wishlist / hunt list
- available duplicate cards
- sealed collection
- set completion progress

### Featured cards
Choose up to 9 featured cards manually.

If no cards are selected, VaultSignal automatically uses the collector's highest tracked-value cards.

### Privacy controls
The showcase can independently hide:
- collection value
- wishlist
- trade duplicates
- sealed products
- set progress

Public exports intentionally exclude:
- cost basis
- grading certification numbers
- addresses
- ZIP / postal code
- purchase history
- private notes
- account data
- cloud credentials

### Standalone HTML export
Showcase Studio can generate a complete standalone `.html` collector page.

That file:
- needs no backend
- can be opened directly in a browser
- can be uploaded later to a public profile host
- uses only the public-facing showcase payload

### Share summary
On supported phones, Web Share can share a clean collector summary.
Otherwise the summary can be copied.

### Data export
A matching privacy-filtered JSON export is also available.

## Reliability fixes included in v2.0

### Rip Session double-finish guard
A finished Rip Session can no longer be added to the Vault again accidentally.

### Sealed opening navigation
Declining to start a new Rip Session no longer jumps back into a previously active Rip Session.


## v3.0 — the major jump

Version 3 turns VaultSignal from a collection tracker into a more complete collector decision system.

## Universal Live Card Network

Live card search is now provider-adapter based instead of Pokémon-only.

Connected in this build:

- Pokémon — Pokémon TCG API
- Disney Lorcana — Lorcast
- Magic: The Gathering — Scryfall
- Yu-Gi-Oh! — YGOPRODeck

One Piece, Sports and other games remain available for manual/demo tracking until a provider that fits the app's reliability/licensing requirements is connected.

All provider data is normalized into the same internal card shape so Vault, Trade Lab, Sell Lab, Watchtower, Dashboard Pro and price history can work across games.

### Provider-specific care

Yu-Gi-Oh! image URLs are intentionally not hotlinked in this GitHub Pages build because YGOPRODeck asks developers not to continuously hotlink their image CDN.

## Multi-TCG Market Pulse

Bulk Vault price refresh can now update supported cards from multiple connected providers instead of only Pokémon.

The app keeps local price snapshots exactly as before.

## Multi-TCG Smart Scanner

Smart Scanner now has a game selector.

Manual Identify and OCR-assisted Auto Identify can search:

- Pokémon
- Lorcana
- Magic
- Yu-Gi-Oh!

The user still confirms the exact printing before adding it.

## Multi-TCG Rip Sessions

A Rip Session now searches the live provider that matches the session's game when one is connected.

This is especially useful for 2GEN RIPS opening Pokémon and Lorcana.

## Multi-TCG Trade Lab

The incoming-card search inside Trade Lab now includes a game selector and uses the universal provider layer.

## VaultIQ

VaultIQ is a transparent personalized collector-fit engine.

It combines:

- wishlist status
- card price targets
- current reference market price
- an entered deal price
- copies already owned
- set completion
- remaining monthly hobby budget
- a configurable cash reserve
- stock-watch priority
- Restock Radar
- observed sealed prices
- sealed quantity already owned

It produces a 0–100 **Collector Fit** score with every adjustment explained.

It is deliberately NOT presented as an investment recommendation or guaranteed-profit score.

### Next Hunt Plan

VaultIQ ranks wishlist cards and stock watches and creates a simple next-buy plan that fits inside the user's spendable hobby budget.

### Acquisition Queue

Users can move a card/product from broad wishlist/watch status into a focused acquisition queue:

- Watching
- Ready
- Acquired
- Skipped

### Deal Check

Any live card search result now has an **IQ** button.

Open it, enter the price being offered, and VaultIQ recalculates the personalized fit score using that exact price.


## v4.0 — Product Command

Product inventory is now a first-class part of VaultSignal.

### Product identity
Each retail/sealed product can track:
- TCG
- set / release
- product type
- UPC / barcode
- primary SKU / item number
- retailer-specific item IDs
- release date
- pack count
- MSRP / reference retail
- target / max buy price
- desired sealed quantity
- minimum keep-on-hand quantity
- notes

Product Command search indexes product names, sets, UPCs, SKUs and retailer item IDs.

### Retail Inventory Board
Watched products can be viewed in one board with:
- latest known stock state
- most recent store
- sighting age
- observed price
- owned vs desired quantity
- VaultIQ product score

Only inventory observations actually stored by VaultSignal are shown.

### Retailer inventory observations
Product pages group the latest observation per store and show:
- stock status
- quantity when known
- price
- source
- freshness
- transparent 2GEN confidence

Confidence is an in-app heuristic based on source, freshness and confirmations. It is not guaranteed store inventory.

### Stock history + observed restock patterns
Product Command preserves the underlying stock timeline and summarizes the weekdays/dayparts where in-stock sightings have occurred.

The pattern is observational only. It does not claim a store will restock at those times.

### Sealed inventory lots
Owned product inventory now supports separate lots with:
- quantity
- cost each
- tracked value each
- retailer/source
- purchase date
- storage location
- linked product ID
- UPC
- SKU

### Product movement
Purchase, inventory, opening and sale activity is brought into one product movement timeline.

### Direct workflows
Every product can jump directly into:
- Restock Radar
- Stock Finder / Hunt Mode
- Stock Report
- Purchase log
- Sealed inventory
- Rip Sessions
- VaultIQ

### Dashboard + Action Center
Dashboard Pro now includes product inventory totals.

Action Center can surface a product when you still need units and:
- a recent sighting exists, or
- an observed price meets your max-buy target.

### Backward compatibility
Older sealed/product data is migrated locally while keeping the existing browser storage key, reducing the risk of losing an existing VaultSignal collection during the v4 update.


## v5.0 — Real Inventory Engine

This release changes Stock Finder from a manual-observation-first workflow into an automatic inventory-search architecture.

### Search flow

1. Enter/select a Product Command product.
2. Use ZIP or phone location.
3. Set radius.
4. Choose retailers.
5. Tap **SEARCH REAL INVENTORY**.
6. VaultSignal sends the product name plus UPC/SKU/retailer IDs when available to the secure inventory backend.
7. Results come back normalized into one UI.

Manual stock sightings remain optional community intelligence. They are no longer required for the app's inventory-search workflow.

## Secure backend

The ZIP now contains `/inventory-worker`, a Cloudflare Worker implementation.

Retailer secrets are never placed in GitHub Pages.

The public app talks to:

- `/health`
- `/inventory`

The first official connector implemented is Best Buy.

## Best Buy official connector

The Worker supports:

- product keyword search
- exact Best Buy SKU lookup
- UPC matching when supplied
- pricing
- product image/link
- near-real-time store availability by ZIP
- low-stock flag
- store address
- distance
- pickup eligibility

The Worker filters the returned Best Buy stores to the radius chosen inside VaultSignal.

Best Buy's availability response does not provide a shelf quantity, so VaultSignal displays **Not provided** instead of guessing.

## Retailer checks

Target, Walmart, GameStop and other selected retailers can still appear as clearly labeled `RETAILER CHECK` handoffs when no supported official inventory feed is connected.

These are not represented as in-stock results.

## Source trust

Every automatic result now carries:

- provider
- official API vs retailer-check source type
- checked time
- source confidence
- price when available
- quantity only when actually supplied
- distance when available
- provider attribution

## Product Command integration

Each Product Command product has a new:

**SEARCH LIVE INVENTORY**

action.

It automatically sends:

- product name
- TCG
- UPC
- SKU
- saved Best Buy SKU / retailer ID
- ZIP
- radius

Inventory results are automatically linked back to Product Command so stock history and retail intelligence can use them.

## Inventory search history

VaultSignal keeps the last 50 searches locally with:

- query
- TCG
- ZIP
- radius
- retailers
- result count
- providers
- checked time

## Connection diagnostics

Tools → Settings now includes:

- backend URL
- connection test
- provider capability matrix
- live API vs retailer-check labels

## Important accuracy rule

VaultSignal v5 never converts an unsupported retailer link into a fake stock status.

If a provider cannot supply verified inventory through a supported connector, it is shown as a retailer check instead.


## v7.0 — Inventory Pulse

The Stock tab is now fully area-first.

### Nearby Inventory Radar
Enter ZIP + radius, select TCGs and tap **SCAN MY AREA**.

The app runs broad discovery searches against connected authorized inventory sources for:
- Pokémon
- Disney Lorcana
- Magic: The Gathering
- Yu-Gi-Oh!
- One Piece

Verified results are grouped by physical store.

### Store drill-down
Tap a store to see every verified product returned there, including:
- product
- TCG
- price
- retailer SKU
- in-stock / low-stock state
- pickup flag when supplied
- checked time
- source confidence
- retailer/cart links

### Hunt Score
Every verified store gets a 0–100 Hunt Score based on:
- distance
- number of verified products
- saved watch matches
- saved target-price hits
- low-stock urgency

This is a collector prioritization score, not a probability that stock will still be there.

### Inventory Pulse
The app keeps lightweight snapshots of up to 12 recent area scans.

It can surface:
- newly detected products
- price drops / changes
- new low-stock flags
- products not returned by the latest scan

“Not returned” is deliberately not labeled sold out.

### Smart refresh
Optional smart refresh runs when the Stock tab is opened and the previous scan is older than the chosen threshold.

This is not background push monitoring; the browser/app must be opened.

### Favorite stores
Verified stores can be starred. Favorites sort ahead of non-favorites.

### Accuracy protections
Retailer-check handoffs:
- do not show fake distance
- do not show confidence
- do not count as verified inventory
- do not enter Product Command stock history
- cannot be saved as verified inventory snapshots

### Existing exact-product search
The original exact product search remains available as a secondary section under the Stock tab.


## v7.1 — Scanner Live Value Hotfix
The Smart Scanner camera flow has been rebuilt for Android/PWA use:
- dedicated rear-camera and Gallery buttons
- input reset before/after capture
- large phone photos resized before OCR
- automatic identification immediately after capture
- OCR contrast preprocessing
- jsDelivr → unpkg OCR loader fallback
- top candidate printings refreshed from the live provider before displaying the best market reference
- exact printing still requires collector confirmation

Live scanner providers: Pokémon, Lorcana, Magic and Yu-Gi-Oh!. The shown value is a provider market/reference field, not a guaranteed sale value; physical condition, exact variant, finish, language and grading matter.


## v7.2 — Direct Android Camera Fix

The previous scanner relied on an HTML file/camera picker. Some Android installed PWAs do not launch the camera from that hidden picker.

v7.2 switches the main scanner button to the browser camera API (`getUserMedia`).

### New camera flow
- **TAKE CARD PHOTO** opens a live rear-camera view inside VaultSignal.
- Android asks for Camera permission the first time.
- A card-shaped guide helps frame the card.
- Tap the large shutter button.
- VaultSignal captures the video frame, closes the camera, OCRs the image, identifies candidates and retrieves the connected provider's market-reference fields.
- Gallery remains available as fallback.

### Permission fallback
If camera access is denied, the scanner shows permission help with Android steps and still allows Gallery input.

The app must run on HTTPS. GitHub Pages satisfies this requirement.


## v7.2.1 — Android permission-flow camera fix

v7.2 could close its own camera modal when Android displayed the Camera permission prompt, because the PWA may briefly trigger a visibility change while the system dialog is open.

v7.2.1 removes that behavior.

Changes:
- camera stays open while Android permission prompt is displayed
- camera stream waits for video metadata before enabling capture
- Retry camera button added
- rear-camera constraints still fall back to any available camera
- Gallery fallback remains available


## v7.3 — Smart Card Recognition Fix

The camera worked in v7.2.1, but it captured the entire camera frame instead of the card outline. This made the card too small for OCR and caused clear cards to return “No Pokémon match.”

v7.3 changes the recognition pipeline:

- the card guide is now shaped like a trading card
- only the area inside the card guide is captured
- the card name, attack/text area and collector-number/footer are enlarged for OCR
- OCR contrast is strengthened
- Pokémon matching now uses:
  - collector number
  - exact OCR name
  - fuzzy/wildcard name prefixes
  - HP clues
  - attack names
- Pokémon results now include HP and attacks for better scoring
- the best candidate is refreshed from the live provider before the market-reference value is shown
- provider errors are no longer silently mistaken for “no match”

The value remains a provider market/reference value. The scanner cannot determine physical condition, authenticity, exact foil pattern on every printing, or professional grade from a single photo.


## v7.4 — PriceCharting-first pricing

The Smart Scanner now has a dedicated PriceCharting pricing layer.

Pricing order:
1. **PriceCharting** — primary current guide when the secure API connector is configured.
2. Existing game-specific provider — secondary/fallback reference.
3. Collector confirms the exact printing before saving.

Displayed PriceCharting guide fields:
- Ungraded
- Grade 9
- PSA 10
- BGS 10

Main scanner game coverage:
- Pokémon
- Lorcana
- Magic
- Yu-Gi-Oh!
- One Piece

One Piece uses PriceCharting for its current scanner pricing path.

The PriceCharting token must be stored only as the Cloudflare Worker secret:

`PRICECHARTING_API_TOKEN`

### Camera change
The camera darkens everything outside the centered green trading-card frame and labels the frame **PLACE ENTIRE CARD HERE**. Only that area is cropped for OCR.

### Important
PriceCharting's official API requires a paid subscription. The connector is built and ready, but PriceCharting values will not populate until the account token is added to the Worker.


## v7.5 — Scanner Command Center

### Centering fix
The card guide is now explicitly locked to:
- `left: 50%`
- `top: 50%`
- `translate(-50%, -50%)`

The prior `inset:auto!important` rule was overriding the left position on some Android PWA layouts, which caused the guide to appear partly off-screen.

### Next scanner phase
- camera zoom control when the device exposes browser zoom capability
- flashlight/torch control when supported
- PriceCharting-first pricing command center
- game-specific pricing sources shown as fallback/secondary references
- recent successful scan history (last 20)
- Scan Another button
- centered frame remains the exact OCR crop region

PriceCharting still requires its secure API token for PriceCharting values. Without it, game-specific providers remain the fallback and the app does not invent PriceCharting prices.


## v7.5.1 — Android card-frame centering hotfix

The v7.5 centering patch still contained `inset:auto!important` after the `left:50%` and `top:50%` declarations. The CSS shorthand reset those positions back to `auto`, leaving the frame in the same off-screen location.

v7.5.1:
- removes the conflicting `inset` shorthand
- adds a final high-specificity `left:50% / top:50% / translate(-50%,-50%)` override
- cache-busts `styles.css`, `config.js`, and `app.js`
- bumps the PWA service-worker cache


## v8.0 — VaultSignal rebrand + Signal Center
- Full VaultSignal product rebrand
- Original vector app icon
- 2GEN RIPS retained as endorsement
- Blue / platinum / signal-gold visual system
- Faint VaultSignal watermark under the UI
- Existing local Vault data preserved
- Signal Center unifies Inventory Pulse, unread collector alerts, scanner history and Action Center priorities


## v9.0 — Inventory Command

Inventory tracking is now a first-class core of VaultSignal, not an add-on.

### One master inventory
Inventory Command combines:
- individual raw cards
- graded cards
- sealed products
- physical storage locations
- cost basis
- tracked/current reference value
- quantity on hand
- UPC / SKU / product linking

### Operational controls
- unified inventory totals
- cost basis and tracked-value totals
- inventory data-health completeness
- cards/sealed grouped by physical location
- minimum-on-hand tracking
- desired-quantity tracking
- replenishment queue
- attention queue for missing cost/value/location/identifiers
- quick physical count corrections
- guided location/all-inventory audit
- inventory adjustment ledger
- unified CSV export

### Signal Center integration
Inventory Command can surface operational signals such as:
- products below minimum inventory
- products below desired quantity
- missing storage locations
- missing cost basis
- missing reference values

These are inventory-management signals, not investment recommendations.

### Architecture principle
VaultSignal should not force collectors to use separate apps for:
inventory + card scanning + market references + sealed products + store hunting + collection management + selling + trading + rip sessions.

The same owned inventory remains connected to all of those workflows.


## v10.0 — Premium + Android/iOS launch foundation

### Premium target
VaultSignal Premium target price: **$4.99/month**.

### Free tier
Free stays useful:
- collection + sealed Vault
- manual inventory
- basic live card search
- exact product / retailer search
- 3 live scanner/value lookups per day

### Premium tier
Premium is designed around time-saving, intelligence and operational tools:
- unlimited live scanner/value lookups
- Nearby Inventory Radar + Inventory Pulse
- Inventory Command Pro
- Signal Center
- VaultIQ
- Market Pulse
- Dashboard Pro
- Trade Lab + Sell Lab
- Showcase Studio
- future secure cloud sync / multi-device

### Development Premium Preview
`config.js` currently uses:

`premiumPreview: true`

This keeps all paid tools available while VaultSignal is still being built and tested.

This MUST be `false` before production store release.

### Android + iOS
The `/native-launch` folder now contains:
- Capacitor config starter
- subscription product definition
- entitlement contract
- store release checklist
- Android/iOS architecture notes

Production mobile billing must use Google Play Billing / Apple StoreKit and secure receipt / transaction verification. Public JavaScript gating alone is not sufficient payment security.


## v10.1 — UX + Inventory Radar correction

- Collector Tools is now a dashboard only; tapping a tool opens its own screen with Back to Tools.
- Premium cards show `$4.99/mo`, and the tools dashboard has a clear `$4.99 / month` Premium banner.
- Backend connectivity is no longer mislabeled as live inventory.
- Inventory Radar separates verified live sources from retailer-check mode.
- SCAN MY AREA automatically discovers nearby physical retailers.
- Unsupported chains get direct retailer-site availability buttons and map buttons.
- VaultSignal never labels those retailer checks as verified stock.


## v10.2 — Retailer Discovery Fix
- searches map data by retailer name, brand and operator
- tries multiple Overpass endpoints
- falls back to Nominatim chain-location searches
- keeps retailer availability buttons usable even if mapped-store count is zero
- adds Check Retailers Now directly under Stock summary
- does not label retailer handoffs as verified stock


## v10.3 — Stock Intelligence Network

VaultSignal Inventory Radar is being designed to feel like a professional paid stock-monitoring service rather than a generic retailer search.

### Fast scan
The app now makes one `/area-scan` request.
The Cloudflare Worker performs ZIP geocoding, nearby-store discovery and every configured authorized inventory lookup in parallel.

### Store stock feed
Verified live results are grouped by store and show:
- store
- distance
- freshness
- products returned
- price
- SKU / UPC
- status / low-stock flag
- pickup eligibility where available
- exact quantity when the provider supplies it
- direct product / cart actions

### Accuracy rule
VaultSignal never invents shelf quantity. If the provider does not expose a count, it says `Not supplied`.

### What still requires retailer access
A Discord-style stock service is only as precise as its data feeds.
Best Buy becomes a real live provider when `BESTBUY_API_KEY` is connected.
Target, Walmart, GameStop and other retailer-check sources still require supported authorized live integrations before VaultSignal can truthfully display exact store products and quantities.


## v10.4 — Stock Command

VaultSignal's Stock experience is now structured like a professional inventory-monitoring service.

### Precision scanning
Area scans automatically include:
- the selected TCG category queries
- up to 8 enabled Stock Watches / watched Product Command products

This means users do not have to type the same products every time.

### Store discovery
The Worker now supports two store-discovery modes:

1. **Google Places** — optional production connector using the server-side secret:
   `GOOGLE_PLACES_API_KEY`
2. **OpenStreetMap development fallback** — used only while a production places provider is not configured.

The OSM fallback query was widened to relevant retail shop categories and then filtered to supported retailer families. This is more robust than relying only on exact chain-name tags.

### Commercial launch note
Public OpenStreetMap services are a development fallback, not the long-term commercial store locator for a paid subscription app. Before scaled launch, configure a production places provider.

### Stock Command
The Stock screen now shows:
- live inventory feed count
- store-discovery mode
- number of active product watches
- scan speed
- watched products included in the current scan

Live product inventory still requires authorized retailer inventory sources.


## v10.5 — Live Drops Alert Network

VaultSignal now has an alert-first online product feed: new listings, restocks detected between refreshes, price drops, in-stock sealed products, watch matches, monitor health and direct buy links. A starter network of public specialty TCG storefront feeds runs in parallel without requiring a separate API key per store. This is online product intelligence; exact local shelf quantity remains limited to authorized retailer inventory sources.


## v10.6 — Local Stock Broker

VaultSignal now has a dedicated Local Stock Checker designed around the same user goal as premium TCG stock-check communities:

`exact product → ZIP → nearby stores → retailer count / availability`

### Connected local-stock sources
The broker can combine:
- Best Buy official near-real-time store availability
- one licensed/partner local-inventory feed through a generic connector

### Generic partner connector
Cloudflare secrets:
- `LOCAL_STOCK_PROVIDER_URL`
- `LOCAL_STOCK_PROVIDER_TOKEN` (optional)

Once a compatible inventory partner is connected, the app does not need another frontend rebuild. `/local-stock` and `/area-scan` automatically merge that provider with the existing official connectors.

### Quantity handling
- Exact quantity is shown only when a source actually provides it.
- Availability-only sources are labeled as such.
- Untracked inventory is never converted into a fake zero.

### Why this architecture
There is no single public shopper API that gives arbitrary Target/Walmart/GameStop shelf counts. A commercial product needs a provider/retailer adapter layer rather than hard-coding fragile private endpoints into the mobile app.


## v10.7 — Watch Engine

VaultSignal now has the server-side monitoring architecture needed for a paid restock-alert experience.

### What it does
- syncs up to 8 exact Stock Watches to the Worker
- stores watch profiles in Cloudflare KV
- scheduled monitoring compares new stock against the previous server snapshot
- creates alerts for RESTOCK, QUANTITY UP and PRICE DROP
- keeps an alert inbox on the server
- pulls those alerts into Stock and Signal Center
- can show device notifications while the PWA is active

### Cloudflare setup
Bind a KV namespace as:

`VAULTSIGNAL_ALERTS`

Recommended development Cron Trigger:

`*/2 * * * *`

The first scheduled pass creates the baseline and deliberately does not fire false "new stock" alerts.

### Mobile launch
The server can retain detections while the app is closed. True instant delivery while the Android/iOS app is fully closed still needs the native FCM/APNs push bridge, which is a separate delivery layer.

### Production security
v10.7 uses a random installation ID/token during development. Before commercial launch these endpoints should be attached to authenticated VaultSignal accounts and server-verified Premium entitlements.


## v11.0 — Holy Grail Command Center

This release stops treating VaultSignal like a pile of tools and starts presenting it as one collector operating system.

### Home is now a command center
The old oversized grid of tool buttons has been replaced with six primary jobs:
- Find Stock
- Live Drops
- Scan & Value
- Search Market
- My Vault
- All Tools

### Today's Signals
VaultSignal merges server Watch Engine alerts, watched Live Drops and Action Center priorities into one ranked queue. The priority number is a workflow score based on watch match, alert type and freshness; it is not an investment rating.

### Source Health
The home screen clearly separates:
- Watch Engine status
- Live Drops source status
- Local inventory feed status
- card/value provider coverage
- camera scanner readiness

### Collection intelligence
Cards, sealed inventory, product tracking, cost basis and portfolio history are summarized together rather than behaving like disconnected mini-apps.

### Premium value
Premium remains targeted at $4.99/month and is now positioned around automation/time savings: 24/7 Watch Engine, Local Stock Checker, unlimited scanning, Signal Center, Inventory Command, VaultIQ, Market Pulse and Dashboard Pro.

### Worker `/system-status`
A new public health endpoint returns only non-secret connection state so the app can show accurate source readiness without exposing credentials.


## v12.0 — Launch Candidate
This package is the first build organized around store release rather than feature accumulation. Fresh installs start with an empty Vault, first-run onboarding explains permissions and Premium without forcing either, Settings contains a Launch Center, and legal/support/data-deletion pages are part of the public bundle.

The test package intentionally keeps `premiumPreview: true`. Do not simply flip it off and submit: native Apple/Google billing and secure server entitlement verification are still required before charging users. Use `config.production.example.js` and `/native-launch/RELEASE-RUNBOOK.md` for the production switch.
