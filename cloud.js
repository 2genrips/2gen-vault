(() => {
  'use strict';

  const cfg = window.TWOGEN_CONFIG || {};
  const cloud = {
    configured: false,
    client: null,
    user: null,
    profile: null,
    ready: false
  };

  function configured() {
    return Boolean((cfg.supabaseUrl || '').trim() && (cfg.supabaseAnonKey || '').trim());
  }

  async function loadLibrary() {
    if (window.supabase?.createClient) return window.supabase;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Could not load the cloud library.'));
      document.head.appendChild(s);
    });
    if (!window.supabase?.createClient) throw new Error('Cloud library did not initialize.');
    return window.supabase;
  }

  async function init() {
    cloud.configured = configured();
    if (!cloud.configured) {
      cloud.ready = true;
      window.dispatchEvent(new CustomEvent('twogen-cloud-ready'));
      return cloud;
    }

    try {
      const lib = await loadLibrary();
      cloud.client = lib.createClient(cfg.supabaseUrl.trim(), cfg.supabaseAnonKey.trim(), {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });

      const { data } = await cloud.client.auth.getSession();
      cloud.user = data.session?.user || null;
      if (cloud.user) await fetchProfile();

      cloud.client.auth.onAuthStateChange(async (_event, session) => {
        cloud.user = session?.user || null;
        cloud.profile = null;
        if (cloud.user) await fetchProfile();
        window.dispatchEvent(new CustomEvent('twogen-auth-changed', { detail: { user: cloud.user } }));
      });

      cloud.ready = true;
      window.dispatchEvent(new CustomEvent('twogen-cloud-ready'));
    } catch (err) {
      cloud.ready = true;
      cloud.error = err instanceof Error ? err.message : 'Cloud initialization failed.';
      window.dispatchEvent(new CustomEvent('twogen-cloud-ready'));
    }

    return cloud;
  }

  async function fetchProfile() {
    if (!cloud.client || !cloud.user) return null;
    const { data, error } = await cloud.client
      .from('profiles')
      .select('*')
      .eq('id', cloud.user.id)
      .maybeSingle();
    if (error) return null;
    cloud.profile = data || null;
    return cloud.profile;
  }

  async function signUp(email, password, displayName) {
    if (!cloud.client) throw new Error('Cloud is not configured.');
    const redirectTo = window.location.origin + window.location.pathname;
    const { data, error } = await cloud.client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { display_name: displayName || 'Collector' }
      }
    });
    if (error) throw error;
    if (data.user && displayName) {
      await cloud.client.from('profiles').upsert({
        id: data.user.id,
        display_name: displayName,
        updated_at: new Date().toISOString()
      });
    }
    return data;
  }

  async function signIn(email, password) {
    if (!cloud.client) throw new Error('Cloud is not configured.');
    const { data, error } = await cloud.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    cloud.user = data.user || null;
    if (cloud.user) await fetchProfile();
    return data;
  }

  async function sendMagicLink(email) {
    if (!cloud.client) throw new Error('Cloud is not configured.');
    const { error } = await cloud.client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname
      }
    });
    if (error) throw error;
    return true;
  }

  async function signOut() {
    if (!cloud.client) return;
    const { error } = await cloud.client.auth.signOut();
    if (error) throw error;
    cloud.user = null;
    cloud.profile = null;
  }

  async function saveProfile(displayName, homeZip) {
    if (!cloud.client || !cloud.user) throw new Error('Sign in first.');
    const payload = {
      id: cloud.user.id,
      display_name: displayName || 'Collector',
      home_zip: homeZip || null,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await cloud.client.from('profiles').upsert(payload).select().single();
    if (error) throw error;
    cloud.profile = data;
    return data;
  }

  async function publishStockReport(report) {
    if (!cloud.client || !cloud.user) throw new Error('Sign in to publish a community report.');
    const payload = {
      user_id: cloud.user.id,
      store: report.store,
      product: report.product,
      game: report.game || 'Pokemon',
      status: report.status,
      quantity: Number(report.qty) || 0,
      price: Number(report.price) || 0,
      notes: report.notes || '',
      zip: report.zip || null,
      lat: typeof report.lat === 'number' ? report.lat : null,
      lon: typeof report.lon === 'number' ? report.lon : null,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await cloud.client.from('stock_reports').insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  async function fetchCommunityReports({ zip = '', game = '', product = '', hours = 48, limit = 80 } = {}) {
    if (!cloud.client) return [];
    let q = cloud.client
      .from('stock_reports')
      .select('id,user_id,store,product,game,status,quantity,price,notes,zip,lat,lon,created_at,updated_at')
      .gte('updated_at', new Date(Date.now() - hours * 3600000).toISOString())
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (zip) q = q.eq('zip', zip);
    if (game) q = q.eq('game', game);
    if (product) q = q.ilike('product', `%${product}%`);

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async function confirmReport(reportId, kind) {
    if (!cloud.client || !cloud.user) throw new Error('Sign in to confirm reports.');
    const { data, error } = await cloud.client
      .from('stock_confirmations')
      .upsert({
        report_id: reportId,
        user_id: cloud.user.id,
        kind,
        updated_at: new Date().toISOString()
      }, { onConflict: 'report_id,user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function fetchConfirmationCounts(reportIds) {
    if (!cloud.client || !reportIds?.length) return {};
    const { data, error } = await cloud.client
      .from('stock_confirmations')
      .select('report_id,kind')
      .in('report_id', reportIds);
    if (error) throw error;
    const out = {};
    for (const row of data || []) {
      out[row.report_id] ||= { still: 0, gone: 0 };
      if (row.kind === 'still') out[row.report_id].still += 1;
      if (row.kind === 'gone') out[row.report_id].gone += 1;
    }
    return out;
  }

  async function saveVaultBackup(state) {
    if (!cloud.client || !cloud.user) throw new Error('Sign in to sync your vault.');
    const { data, error } = await cloud.client
      .from('vault_backups')
      .upsert({
        user_id: cloud.user.id,
        payload: state,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function loadVaultBackup() {
    if (!cloud.client || !cloud.user) throw new Error('Sign in to restore your vault.');
    const { data, error } = await cloud.client
      .from('vault_backups')
      .select('payload,updated_at')
      .eq('user_id', cloud.user.id)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  Object.assign(window, {
    TWOGEN_CLOUD: cloud,
    twogenCloudInit: init,
    twogenCloudSignUp: signUp,
    twogenCloudSignIn: signIn,
    twogenCloudMagicLink: sendMagicLink,
    twogenCloudSignOut: signOut,
    twogenCloudSaveProfile: saveProfile,
    twogenCloudPublishStockReport: publishStockReport,
    twogenCloudFetchReports: fetchCommunityReports,
    twogenCloudConfirmReport: confirmReport,
    twogenCloudFetchConfirmationCounts: fetchConfirmationCounts,
    twogenCloudSaveBackup: saveVaultBackup,
    twogenCloudLoadBackup: loadVaultBackup
  });

  init();
})();
