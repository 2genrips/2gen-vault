# 2GEN Vault — Restock Radar v0.7 (GitHub Pages)

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
