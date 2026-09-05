(() => {
  'use strict';
  const cfg = window.TWOGEN_CONFIG || {};
  // Supabase is transitioning from legacy anon keys to publishable keys.
  // Keep the existing cloud.js contract working while allowing the current key format.
  if (!String(cfg.supabaseAnonKey || '').trim() && String(cfg.supabasePublishableKey || '').trim()) {
    cfg.supabaseAnonKey = cfg.supabasePublishableKey;
  }
})();
