/* ─────────────────────────────────────────────────────────────────────────────
   VST — Supabase Client
   Exposes window.VST_SUPABASE — the initialized Supabase client.

   SETUP: Replace SUPABASE_ANON_KEY below with your actual anon key from:
   https://app.supabase.com/project/ovmlmregvcekbvoctywe/settings/api
   ───────────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var SUPABASE_URL  = 'https://ovmlmregvcekbvoctywe.supabase.co';
  var SUPABASE_ANON = window.__VST_SUPABASE_ANON__ || 'SUPABASE_ANON_KEY_REPLACE_ME';

  function init() {
    if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
      console.error('[VST] Supabase JS SDK not loaded. Check script order.');
      return;
    }
    window.VST_SUPABASE = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  /* ── Auth helpers ────────────────────────────────────────────────────────── */
  window.VSTSupaAuth = {
    /* Sign up with email + password, creates profile via DB trigger */
    signUp: function (email, password, fullName) {
      return window.VST_SUPABASE.auth.signUp({
        email: email,
        password: password,
        options: { data: { full_name: fullName } }
      });
    },

    /* Sign in with email + password */
    signIn: function (email, password) {
      return window.VST_SUPABASE.auth.signInWithPassword({ email: email, password: password });
    },

    /* Sign out */
    signOut: function () {
      return window.VST_SUPABASE.auth.signOut();
    },

    /* Get current session */
    getSession: function () {
      return window.VST_SUPABASE.auth.getSession();
    },

    /* Get current user (sync, from cached session) */
    getUser: async function () {
      var s = await window.VST_SUPABASE.auth.getSession();
      return s.data && s.data.session ? s.data.session.user : null;
    },

    /* Subscribe to auth state changes */
    onAuthChange: function (cb) {
      return window.VST_SUPABASE.auth.onAuthStateChange(cb);
    },

    /* Reset password email */
    resetPassword: function (email) {
      return window.VST_SUPABASE.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login.html?mode=reset'
      });
    },

    /* Update password (after reset flow) */
    updatePassword: function (newPassword) {
      return window.VST_SUPABASE.auth.updateUser({ password: newPassword });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
