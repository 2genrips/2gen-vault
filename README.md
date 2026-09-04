# VaultSignal Android + iOS Launch Foundation

VaultSignal currently runs as a PWA/GitHub Pages web app. The production Android and iOS releases should use one shared web codebase wrapped with Capacitor.

## Store product
- Product ID: `vaultsignal_premium_monthly`
- Price target: **$4.99/month**
- Entitlement: `premium`

## Required native pieces before release

### Android
- Capacitor Android shell
- Camera permissions
- Google Play Billing subscription purchase
- Restore/query purchases
- Receipt / purchase-token verification through secure backend
- Play Store signing + listing

### iOS
- Capacitor iOS shell
- Camera usage description
- StoreKit auto-renewable subscription
- Restore purchases
- Transaction verification through secure backend
- App Store signing + listing

## Entitlement flow

1. User purchases VaultSignal Premium through Apple or Google.
2. Native billing layer receives the store transaction / purchase token.
3. Native layer sends proof to VaultSignal backend.
4. Backend validates with the platform and stores the user's entitlement.
5. App receives a verified Premium entitlement.
6. High-value backend endpoints also check Premium server-side.

Do not trust a public JavaScript flag as production payment security.

## Development mode

`config.js` currently has:

`premiumPreview: true`

This intentionally unlocks Premium features while the app is still being built and tested.

**Before store release, set this to `false`.**

## Premium feature strategy

Free remains useful:
- collection + sealed Vault
- basic card search
- manual inventory
- exact product/retailer search
- 3 live scanner/value lookups per day

Premium $4.99/month:
- unlimited live scanner/value lookups
- Nearby Inventory Radar + Inventory Pulse
- Inventory Command audits / ledger / replenishment
- Signal Center
- VaultIQ
- Market Pulse
- Dashboard Pro
- Trade Lab + Sell Lab
- Showcase Studio
- future secure cloud sync / multi-device
