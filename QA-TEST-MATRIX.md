# VaultSignal Launch QA Matrix

## Install / first run
- Fresh install has **zero fake owned cards**.
- Onboarding opens once and can be skipped/reopened.
- Manual ZIP works without precise-location permission.
- Camera and notifications are not requested before the related user action.

## Core free workflow
- Card search works for every connected TCG.
- Add/remove/update Vault card.
- Add/open/update sealed product.
- Backup export/import round trip.
- Free scanner limit resets on local calendar day.

## Premium
- Purchase success unlocks only after verified entitlement.
- Failed/cancelled purchase remains Free.
- Restore purchases works on reinstall/second device.
- Expired/cancelled entitlement relocks Premium after verification refresh.
- Premium server endpoints reject unverified access before launch.

## Watch Engine
- Watch sync succeeds.
- Cron updates `lastMonitorAt`.
- First pass creates baseline without fake restock alerts.
- Real transition creates RESTOCK / QUANTITY UP / PRICE DROP.
- Delete server Watch data removes profile/snapshot/alerts.

## Inventory
- Unknown quantity never renders as zero.
- Retailer handoff is never labeled verified stock.
- Source + freshness visible on verified results.
- 10/25/50/100 mile searches behave correctly.

## Scanner
- Android/iOS camera opens from user gesture.
- Camera overlay centered in portrait.
- Gallery fallback works.
- Bad/no-match photo fails gracefully.

## Store review
- Privacy/Terms/Support URLs public.
- Support contact works.
- Premium price/period visible before purchase.
- Restore purchases visible.
- Data deletion controls visible.
- No development/Premium Preview messaging in production binary.
