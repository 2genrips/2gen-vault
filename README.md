# 2GEN Vault — Action Center v1.8 (GitHub Pages)

**2GEN Vault by 2GEN RIPS**  
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

2GEN Vault now includes a full analytics workspace.

### Portfolio snapshots
The app saves one local portfolio snapshot per day and keeps up to 365 snapshots.

Dashboard Pro shows:
- current vault value
- tracked cost
- gain/loss vs cost basis
- 30-day portfolio trend
- snapshot growth
- manual snapshot button

The trend reflects values stored in 2GEN Vault. It is only as current as the market fields available to the app.

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
Before a queued card is added, 2GEN Vault checks your current collection and flags:
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
4. 2GEN Vault extracts likely name / card-number clues.
5. Those clues are searched against the live Pokémon card data source.
6. Possible matches are ranked with a match score.
7. You confirm the exact card before adding it.

### Market value

After a live card match is found, 2GEN Vault shows the available:
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
2GEN Vault keeps up to 365 daily price points per card.

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
It only represents price snapshots collected by your own 2GEN Vault app.

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
Queued items can generate simple listing text using the card/product details already stored in 2GEN Vault.

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
2GEN Vault can now keep one household app while separating ownership between collectors.

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

2GEN Vault now has one place that answers:

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

It refreshes when 2GEN Vault is opened/used.

It does not pretend to deliver true background push notifications while the browser/PWA is closed. True push alerts will require a backend notification service / service-worker push architecture.
