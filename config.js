/*
  2GEN Vault public configuration.

  IMPORTANT:
  GitHub Pages is public. Never place private API keys, passwords, payment secrets,
  retailer partner secrets, or admin tokens in this file.

  When we add a secure inventory backend later, paste only its PUBLIC base URL here.
  Example:
    inventoryApiBase: "https://api.yourdomain.com"

  Expected inventory endpoint:
    GET {inventoryApiBase}/inventory?zip=28752&radius=25&q=prismatic&game=Pokemon&retailers=Target,Walmart

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
  inventoryApiBase: "",
  appVersion: "0.4.0"
};
