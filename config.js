/*
  VaultSignal public configuration.

  CLOUD ACCOUNTS:
  supabaseUrl and supabaseAnonKey are PUBLIC client settings, not secret service-role keys.
  Never place a Supabase service-role key in GitHub Pages.

  IMPORTANT:
  GitHub Pages is public. Never place private API keys, passwords, payment secrets,
  retailer partner secrets, or admin tokens in this file.

  Private retailer/pricing credentials belong in the secure Worker backend.
*/
window.TWOGEN_CONFIG = {
  inventoryApiBase: "https://2gen-vault-inventory.willingpaige.workers.dev",
  supabaseUrl: "",
  supabaseAnonKey: "",
  premiumMonthlyPrice: 4.99,
  premiumProductId: "vaultsignal_premium_monthly",
  premiumPreview: true,
  releaseChannel: "vaultgraph-preview",
  premiumEntitlementApiBase: "",
  supportEmail: "",
  supportUrl: "",
  privacyUrl: "./privacy.html",
  termsUrl: "./terms.html",
  dataDeletionUrl: "./privacy.html#deletion",
  appVersion: "16.0.0"
};
