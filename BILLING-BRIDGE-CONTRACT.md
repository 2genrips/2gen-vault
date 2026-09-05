# VaultSignal Native Billing Bridge Contract

The web app already calls:
- `window.VaultSignalBilling.purchase("vaultsignal_premium_monthly")`
- `window.VaultSignalBilling.restore()`

The native Android/iOS shell must perform the real store transaction, send proof to a secure verification backend, and only after server verification dispatch:

```js
window.dispatchEvent(new CustomEvent('vaultsignal:native-entitlement', {
  detail: {
    verified: true,
    serverVerified: true,
    productId: 'vaultsignal_premium_monthly',
    source: 'app-store-or-play',
    expiresAt: 'ISO-8601-or-null'
  }
}));
```

The app rejects the event unless both `verified` and `serverVerified` are true. This is still not sufficient to protect paid backend resources by itself: the Worker must also verify Premium entitlement before serving Premium-only server endpoints.
