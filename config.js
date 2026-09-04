/*
  2GEN Vault public configuration.

  CLOUD ACCOUNTS:
  supabaseUrl and supabaseAnonKey are PUBLIC client settings, not secret service-role keys.
  Never place a Supabase service-role key in GitHub Pages.

  IMPORTANT:
  GitHub Pages is public. Never place private API keys, passwords, payment secrets,
  retailer partner secrets, or admin tokens in this file.

  When we add a secure inventory backend later, paste only its PUBLIC base URL here.
  Example:
    inventoryApiBase: "https://api.yourdomain.com"

  v5 Real Inventory Engine endpoints:
    GET {inventoryApiBase}/health
    GET {inventoryApiBase}/inventory?zip=28752&radius=25&q=prismatic&game=Pokemon&retailers=Best%20Buy,Target

  The v5 ZIP includes a Cloudflare Worker backend in /inventory-worker.
  Put private retailer keys in Worker secrets — NEVER in this public config file.

  Expected JSON response:
  {
    "results": [
      {
        "id": "unique-id",
        "retailer": "Target",
        "store": "Target - Example",
        "address": "123 Main St",
        "distanceMiles": 3.4,
        "product": "Example Elite Trainer Box",
        "game": "Pokemon",
        "price": 49.99,
        "status": "in_stock",
        "quantity": 4,
        "updatedAt": "2026-09-03T20:00:00Z",
        "url": "https://..."
      }
    ]
  }
*/
window.TWOGEN_CONFIG = {
  inventoryApiBase: "https://2gen-vault-inventory.willingpaige.workers.dev",
  supabaseUrl: "",
  supabaseAnonKey: "",
  appVersion: "7.2.1"
};
