# 2GEN Vault — Collector OS (GitHub Pages)

**2GEN Vault by 2GEN RIPS**  
**Two Generations. One Collection.**

This is the easy-to-deploy GitHub Pages build. No npm, Codespaces, Android Studio, APK, or GitHub Actions are required for normal updates.

## Files to upload to the ROOT of your GitHub repository

- `index.html`
- `styles.css`
- `app.js`
- `config.js`
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
