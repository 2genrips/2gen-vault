# 2GEN Vault Real Inventory Worker v5

This is the secure backend for automatic retailer inventory searches.

## Why this exists

GitHub Pages is public. A retailer API key placed in `config.js` or `app.js` can be copied by anyone.

This Worker keeps private retailer credentials on the server side. 2GEN Vault receives only normalized inventory results.

## Connected in v5

### Best Buy — official live API connector

Best Buy's official developer API supports:

- product lookup
- current pricing fields
- store information
- near-real-time in-store availability for a SKU near a ZIP code

The Worker does **not** invent quantity because Best Buy's in-store availability response does not provide a shelf quantity.

### Target / Walmart / GameStop / other supported retailer buttons

These are labeled `RETAILER CHECK`, not `LIVE API`.

They open the retailer's own product/availability experience. The Worker does not scrape hidden site endpoints or claim these retailers have stock when it cannot verify it through an authorized source.

## Required secret

`BESTBUY_API_KEY`

Create a Best Buy developer key through the official Best Buy Developer portal, then save it as a **Cloudflare Worker secret**.

Never paste that key into the GitHub Pages repository.

## Cloudflare dashboard deployment

You can deploy this without installing software:

1. Create a Cloudflare account.
2. Go to **Workers & Pages**.
3. Create a Worker named `2gen-vault-inventory`.
4. Paste the contents of `src/index.js` into the Worker editor and deploy.
5. Open **Settings → Variables and Secrets**.
6. Add the secret:
   - Name: `BESTBUY_API_KEY`
   - Value: your Best Buy developer API key
7. Add variable:
   - `ALLOWED_ORIGIN`
   - `https://2genrips.github.io`
8. Deploy again.
9. Copy the Worker URL, such as:
   - `https://2gen-vault-inventory.<your-subdomain>.workers.dev`
10. In the main app's `config.js`, set:
   - `inventoryApiBase: "YOUR WORKER URL"`
11. Commit `config.js` to GitHub Pages.
12. Open 2GEN Vault → Tools → Settings → **Test connection**.

## Endpoints

### `GET /health`

Reports the backend version and provider connector status.

### `GET /inventory`

Example:

`/inventory?q=Prismatic%20Evolutions%20ETB&zip=28752&radius=50&retailers=Best%20Buy,Target`

The frontend may also pass:

- `game`
- `productId`
- `upc`
- `sku`
- `bestBuySku`

If a Product Command entry has a saved Best Buy SKU, exact-SKU availability is preferred over keyword matching.

## Security

- CORS can be restricted with `ALLOWED_ORIGIN`.
- Retailer keys remain Worker secrets.
- No secrets are returned to the browser.
- Best Buy responses are cached only briefly (120 seconds).
- The app displays Best Buy attribution when Best Buy data is shown.

## Accuracy

Inventory changes quickly. A result means the provider reported that availability at the time shown.

2GEN Vault always displays:
- provider/source
- checked time
- low-stock flag when supplied
- distance
- price when supplied
- whether quantity is actually known

Unknown quantities stay unknown.
