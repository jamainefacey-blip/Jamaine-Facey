/* ─────────────────────────────────────────────────────────────────────────────
   VST — Supabase Client
   Must be loaded AFTER the Supabase CDN script.
   CDN: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js
   ───────────────────────────────────────────────────────────────────────────── */

window.VSTSupabase = (function () {
  'use strict';

  var SUPABASE_URL      = 'https://ovmlmregvcekbvoctywe.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bWxtcmVndmNla2J2b2N0eXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDkwMzUsImV4cCI6MjA5MTY4NTAzNX0.jyO9_5vdojpHXBIqB4Q1OZsFnAXNDq58lrqolQU3Gtk';

  if (!window.supabase) {
    console.error('[VST] Supabase CDN not loaded. Auth will not work.');
    return null;
  }

  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession:     true,
      autoRefreshToken:   true,
      detectSessionInUrl: true,
    },
  });
})();
