# VaultSignal v12 Release Runbook

## Release strategy
Launch the first native version **without requiring a VaultSignal account**. Collection data stays local-first, purchases restore through Apple/Google, and the Watch Engine uses the per-installation profile already built. This reduces launch friction and avoids account-deletion review requirements until true cloud accounts are deliberately enabled.

## Before creating store binaries
1. Set a real public `supportEmail` or `supportUrl`.
2. Host and review `privacy.html`, `terms.html`, and `support.html` on the production web origin.
3. Set `premiumPreview: false` and `releaseChannel: "production"`.
4. Connect native StoreKit / Play Billing bridge for product `vaultsignal_premium_monthly`.
5. Connect secure receipt/transaction verification and set `premiumEntitlementApiBase`.
6. Gate Premium server endpoints using the verified entitlement.
7. Test purchase, restore, expiration, cancellation and reinstall.
8. Build signed Android + iOS release binaries.
9. Complete store privacy/data disclosures from `PRIVACY-DATA-MAP.md`.
10. Run every case in `QA-TEST-MATRIX.md`.

## Do not ship while Launch Center shows a BLOCKER
Quality items such as additional local-stock providers can continue improving after launch, but billing, entitlement verification, support contact, legal pages and production configuration are release blockers.
