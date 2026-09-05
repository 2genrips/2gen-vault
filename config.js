/*
  VaultSignal public configuration.

  CLOUD ACCOUNTS:
  supabaseUrl and supabasePublishableKey are PUBLIC client settings, not secret server keys.
  The legacy supabaseAnonKey field remains as a compatibility fallback during Supabase's key transition.
  Never place a Supabase secret/service-role key in GitHub Pages.

  WEB PUSH:
  webPushPublicKey is the PUBLIC VAPID key only. The matching private VAPID key belongs
  in Supabase Edge Function secrets, never in this file.

  IMPORTANT:
  GitHub Pages is public. Never place private API keys, passwords, payment secrets,
  retailer partner secrets, admin tokens, service-role keys, or VAPID private keys here.
*/
window.TWOGEN_CONFIG = {
  inventoryApiBase: "https://2gen-vault-inventory.willingpaige.workers.dev",
  supabaseUrl: "",
  supabasePublishableKey: "",
  supabaseAnonKey: "",
  webPushPublicKey: "",
  premiumMonthlyPrice: 4.99,
  premiumProductId: "vaultsignal_premium_monthly",
  premiumPreview: true,
  releaseChannel: "live-community-preview",
  premiumEntitlementApiBase: "",
  supportEmail: "",
  supportUrl: "",
  privacyUrl: "./privacy.html",
  termsUrl: "./terms.html",
  dataDeletionUrl: "./privacy.html#deletion",
  appVersion: "18.0.0"
};
