# VaultSignal — Product Roadmap

## Current build: v10.2 Retailer Discovery Fix

Hunt Mode, confidence-scored reports, store confirmations, and Find → Buy → Track are now built into the Pages frontend.

## The goal
Create a collector operating system instead of another simple portfolio app.

## Core pillars

1. **Find it**
   - Nearby stores
   - Live inventory connectors
   - Restock watches
   - Online-stock watches
   - Price thresholds
   - Retailer search
   - Community-confirmed reports

2. **Own it**
   - Singles
   - Sealed products
   - Bind ers / storage locations
   - Quantity / condition
   - Cost basis
   - Set completion
   - Grading submissions

3. **Understand it**
   - Market value
   - Historical charts
   - Purchase history
   - Profit / loss
   - Monthly hobby budget
   - Trade value journal
   - Marketplace comparisons

4. **Use it**
   - Smart card scanner
   - Wishlist / chase list
   - Opening log
   - Pull log
   - Sell / trade workflows
   - CSV / backup / cloud sync

5. **Connect**
   - Optional community stock reports
   - Trusted report scoring
   - Friend/family vaults
   - Creator hub
   - Collection showcase
   - Local card shop support

## Secure cloud phase
Needed for:
- shared/community stock reports
- retailer partner credentials
- push alerts
- user accounts
- premium subscriptions
- cross-device sync
- private collection backups
- smart image recognition

GitHub Pages remains the frontend; the cloud service becomes the secure data layer.


## v0.6 completed
- Cloud account architecture
- Supabase authentication
- Community stock-report sharing
- Per-user stock confirmations
- Private vault cloud backup
- Row-level security policies
- Guest-mode fallback


## v0.7 completed
- Restock Radar scoring
- Product watch details
- Retailer comparison based on observed data
- Hot Drops ranking
- Watch priority + desired quantity
- Better nearby store metadata


## v0.8 completed
- Smart sealed-product database
- Dedicated product detail pages
- MSRP + target buy price
- Inventory sightings tied to products
- Product-to-Restock-Radar workflow
- Sealed holdings tied to product pages
- Opening log/history
- Inventory/community report -> product page
- Custom product creation


## v0.9 completed
- Full card detail pages
- Raw vs graded copy tracking
- Grader / grade / cert tracking
- Physical binder manager
- Duplicate Center
- Live Pokémon set search
- Live Pokémon master-set checklist
- Unique owned / missing / completion %
- Set-to-card detail workflow


## v1.0 completed
- Rip Session tracker
- Opening cost vs pull-value analytics
- Hit threshold / hit count
- Per-session ROI
- Camera capture + manual live identification workflow
- Pull-to-Vault workflow
- Set-progress impact
- Smart Product / Sealed Vault -> Rip Session
- Session export


## v1.1 completed
- Daily portfolio snapshots
- Portfolio trend chart
- Singles vs sealed allocation
- Value by TCG
- Six-month spending chart
- Strongest / weakest positions vs cost basis
- Most valuable card positions
- Set completion analytics
- Rip-session leaderboard
- Vault Data Health score
- Backup freshness tracking


## v1.2 completed
- Batch scanner queue
- Live card matching workflow
- Duplicate detection
- Set-gap / missing-card flags
- Binder suggestions
- Configurable grading-review threshold
- Queue cost/binder/quantity review
- Smart merge into existing collection entries
- Optional scanner -> active Rip Session flow


## v1.3 completed
- On-device OCR-assisted card identification
- Ranked Pokémon card candidates
- Card-number hint extraction
- Match-confidence scoring
- User confirmation before commit
- Live market / low display after identification
- Manual identify fallback retained


## v1.4 completed
- Bulk Vault price refresh
- Daily card price snapshots
- Local 30-point card charts
- Snapshot gainers / decliners
- Price-target dashboard
- Refresh-job history
- Price propagation through collection / wishlist / alerts / rip sessions / scanner queue
- Card-detail snapshot movement


## v1.5 completed
- Two-sided Trade Lab builder
- Vault card + sealed outgoing selection
- Duplicate trade suggestions
- Wishlist incoming selection
- Live Pokémon incoming-card search
- Cash/manual adjustments
- Reference-value fairness analysis
- Shareable trade summary
- Proposed / Completed trade history
- Completed trade -> automatic Vault inventory update


## v1.6 completed
- Sell Lab
- Vault inventory selling workflow
- Duplicate sale suggestions
- Fee / shipping / supply calculator
- Net-profit and ROI calculation
- Break-even price calculator
- Marketplace planning presets
- Sale Queue
- Listing-copy generator
- Sold item -> automatic Vault inventory decrement
- Sales / profit history
- Dashboard Pro seller-performance panel


## v1.7 completed
- Multiple local collector profiles
- Per-collector card/sealed ownership
- Family inventory transfers
- Duplicate transfers between collectors
- Giveaway Locker
- Giveaway inventory decrement on sent
- 2GEN RIPS Content Queue
- Rip Session -> Content Queue
- Collector showcase export


## v1.8 completed
- Prioritized Action Center
- Daily collector brief
- Home action preview
- Price-target-hit actions
- Restock Radar actions
- Budget actions
- Backup / market-refresh freshness actions
- Near-complete-set actions
- Grading follow-up actions
- Sale / trade follow-up actions
- Giveaway / creator-content actions
- Direct routing to the correct tool
- 7-day action snooze


## v1.9 completed
- Persistent Watchtower notification inbox
- Action-to-alert conversion
- Duplicate-alert fingerprinting
- Unread / high-priority counts
- Category notification preferences
- High-priority-only mode
- Browser/PWA notification permission flow
- Best-effort local browser alerts
- Service-worker notification click handling
- Home Watchtower preview


## v2.0 completed
- Collection Passport
- Per-collector showcase preview
- Up to 9 featured cards
- Automatic fallback featured holdings
- Privacy toggles
- Wishlist / hunt list showcase
- Trade-duplicate showcase
- Sealed showcase
- Set-progress showcase
- Standalone HTML profile export
- Privacy-filtered JSON export
- Mobile Web Share summary
- Rip Session double-finish bug fix
- Sealed opening stale-navigation bug fix


## v3.0 completed
- Universal normalized card-provider layer
- Live Pokémon search
- Live Lorcana search + pricing
- Live Magic search + pricing
- Live Yu-Gi-Oh! search + print reference pricing
- Multi-provider Market Pulse refresh
- Multi-TCG Smart Scanner selector
- Multi-TCG OCR-assisted candidate search
- Multi-TCG Rip Session search
- Multi-TCG Trade Lab incoming search
- VaultIQ collector-fit scoring engine
- Deal Check with entered offer price
- Personalized budget fit
- Duplicate-copy penalty
- Wishlist / target boosts
- Set-completion context
- Restock Radar / sealed-product scoring
- Next Hunt Plan
- Acquisition Queue


## v4.0 completed
- Product Command Center
- UPC / barcode tracking
- SKU / item-number tracking
- Retailer-specific product IDs
- Desired sealed quantity and inventory gaps
- Retail Inventory Board
- Store quantity / price / status / freshness
- Transparent report-confidence scoring
- Product stock history
- Observed weekday/daypart restock patterns
- Sealed inventory lots
- Retailer + purchase-date lot metadata
- Product movement timeline
- Product-aware stock reports
- Product search by UPC/SKU/retailer ID
- Product Command -> Hunt Mode
- Product Command -> VaultIQ
- Dashboard Pro product analytics
- Action Center product opportunities


## v5.0 completed
- Real Inventory Engine frontend
- Secure backend contract
- Cloudflare Worker backend included
- Backend health/provider diagnostics
- Official Best Buy API connector
- Best Buy product keyword lookup
- Best Buy exact SKU lookup
- Best Buy UPC lookup
- Near-real-time Best Buy in-store availability
- Radius filtering
- Low-stock handling
- Explicit unknown quantity handling
- Retailer-site fallback checks for unsupported connectors
- Automatic Product Command identifier handoff
- Product Command -> Search Live Inventory
- Inventory result normalization/deduplication
- Source type / checked time / confidence
- Inventory search history
- Best Buy attribution support
- No-retailer-secret GitHub Pages architecture


## v7.0 completed
- ZIP/radius-first Nearby Inventory Radar
- broad multi-TCG area discovery
- verified inventory grouped by store
- store inventory drill-down
- Hunt Score
- saved-watch matches at store level
- target-price-hit awareness
- favorite stores
- Inventory Pulse change detection
- last 12 area scan snapshots
- smart refresh when Stock opens
- exact product search preserved
- retailer-check accuracy protections


## v8.0 completed
- VaultSignal master rebrand
- original vector icon and manifest branding
- faint brand watermark
- automatic old-label migration without data loss
- Signal Center unified collector feed
- inventory + alert + scanner + action signals


## v9.0 completed
- Inventory Command first-class tool
- unified cards + sealed inventory
- physical storage-location rollups
- cost basis + tracked-value rollups
- minimum on-hand and desired-quantity replenishment
- inventory attention queue
- physical count correction
- guided inventory audits
- movement / adjustment ledger
- unified inventory CSV
- Inventory Command signals fed into Signal Center


## v10.0 completed
- $4.99/month Premium product strategy
- Free vs Premium feature architecture
- Premium Center
- development Premium Preview
- 3 free live scanner lookups/day design
- unlimited scanner Premium entitlement
- premium gating foundation
- Android / iOS Capacitor launch starter
- Google Play / StoreKit product contract
- secure entitlement flow documentation
- mobile store release checklist


## v10.1 completed
- dedicated tool detail screens
- $4.99/mo premium labels
- backend vs live-inventory status separation
- automatic nearby retailer checks
- verified stock remains source-grounded only


## v10.2 completed
- stronger nearby retailer discovery
- immediate retailer check buttons
- map lookup fallback
