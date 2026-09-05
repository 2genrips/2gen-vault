# VaultSignal Privacy / Store Disclosure Data Map

| Data | Why | Default storage | Shared externally? | User control |
|---|---|---|---|---|
| Collection/sealed records | Vault tracking | Device | No by default | Export / reset |
| ZIP + radius | Local inventory | Device + Watch profile when synced | Worker / mapping / inventory sources as needed | Edit / delete Watch data |
| Precise location | Optional nearby search | Device/session | Mapping lookup when user invokes it | OS permission / manual ZIP fallback |
| Watched product names + max price | 24/7 alerts | Worker KV | Inventory/feed providers receive search queries | Delete server Watch data |
| Watch snapshots | Change detection | Worker KV ~14 days | No advertising use | Delete Watch data |
| Watch alert inbox | Alerts | Worker KV ~45 days + device | No advertising use | Delete Watch data |
| Card scan image | Identification | Device/browser workflow | Current design does not intentionally upload image to VaultSignal Worker | Clear scanner / OS photo controls |
| Card/product search terms | Search/value features | Request/cache as applicable | Card/retailer/provider APIs | Stop using feature / clear app data |
| Purchase entitlement | Premium | Apple/Google + secure verifier | Store platform + entitlement backend | Restore/manage subscription |

Re-check this map against every SDK and production integration before answering App Store Privacy or Google Play Data Safety forms.
