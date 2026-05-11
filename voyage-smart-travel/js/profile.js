/* ─────────────────────────────────────────────────────────────────────────────
   VST — Profile Module
   Requires: js/supabase-client.js loaded first (window.VST_SUPABASE)
   ───────────────────────────────────────────────────────────────────────────── */

window.VSTProfile = (function () {
  'use strict';

  function db() { return window.VST_SUPABASE; }

  /* ── Profile CRUD ────────────────────────────────────────────────────────── */
  async function loadProfile() {
    var user = await window.VSTSupaAuth.getUser();
    if (!user) return null;
    var { data, error } = await db()
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error && error.code !== 'PGRST116') console.error('[VST] loadProfile:', error);
    return data;
  }

  async function updateProfile(updates) {
    var user = await window.VSTSupaAuth.getUser();
    if (!user) throw new Error('Not authenticated');
    var { data, error } = await db()
      .from('user_profiles')
      .upsert({ id: user.id, ...updates })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /* ── Avatar upload ───────────────────────────────────────────────────────── */
  async function uploadAvatar(file) {
    var user = await window.VSTSupaAuth.getUser();
    if (!user) throw new Error('Not authenticated');
    var ext  = file.name.split('.').pop();
    var path = user.id + '/avatar.' + ext;

    var { error: uploadErr } = await db()
      .storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadErr) throw uploadErr;

    var { data } = db().storage.from('avatars').getPublicUrl(path);
    var avatarUrl = data.publicUrl + '?t=' + Date.now();

    await updateProfile({ avatar_url: avatarUrl });
    return avatarUrl;
  }

  /* ── Travel stats ────────────────────────────────────────────────────────── */
  async function loadTravelStats() {
    var user = await window.VSTSupaAuth.getUser();
    if (!user) return null;
    var { data, error } = await db()
      .from('travel_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (error && error.code !== 'PGRST116') console.error('[VST] loadTravelStats:', error);
    return data || { total_trips: 0, countries_visited: 0, co2_saved_kg: 0, eco_grade: 'C' };
  }

  /* ── Saved trips ─────────────────────────────────────────────────────────── */
  async function loadSavedTrips(limit) {
    var user = await window.VSTSupaAuth.getUser();
    if (!user) return [];
    var query = db()
      .from('saved_trips')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (limit) query = query.limit(limit);
    var { data, error } = await query;
    if (error) console.error('[VST] loadSavedTrips:', error);
    return data || [];
  }

  async function saveTrip(tripData) {
    var user = await window.VSTSupaAuth.getUser();
    if (!user) throw new Error('Not authenticated');
    var { data, error } = await db()
      .from('saved_trips')
      .insert({ user_id: user.id, ...tripData })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteTrip(tripId) {
    var user = await window.VSTSupaAuth.getUser();
    if (!user) throw new Error('Not authenticated');
    var { error } = await db()
      .from('saved_trips')
      .delete()
      .eq('id', tripId)
      .eq('user_id', user.id);
    if (error) throw error;
  }

  /* ── Booking history ─────────────────────────────────────────────────────── */
  async function loadBookingHistory(limit) {
    var user = await window.VSTSupaAuth.getUser();
    if (!user) return [];
    var query = db()
      .from('booking_history')
      .select('*, saved_trips(destination, start_date, end_date)')
      .eq('user_id', user.id)
      .order('booked_at', { ascending: false });
    if (limit) query = query.limit(limit);
    var { data, error } = await query;
    if (error) console.error('[VST] loadBookingHistory:', error);
    return data || [];
  }

  /* ── Travel preferences ──────────────────────────────────────────────────── */
  async function updatePreferences(prefs) {
    return updateProfile({ travel_preferences: prefs });
  }

  /* ── Eco grade color ─────────────────────────────────────────────────────── */
  function ecoGradeColor(grade) {
    var map = { 'A+': '#00d4aa', 'A': '#00d4aa', 'B': '#c9a84c', 'C': '#f59e0b', 'D': '#ef4444', 'F': '#dc2626' };
    return map[grade] || '#8899b0';
  }

  /* ── Format date ─────────────────────────────────────────────────────────── */
  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /* ── Eco score bar ───────────────────────────────────────────────────────── */
  function ecoBar(score) {
    var pct   = Math.max(0, Math.min(100, score || 0));
    var color = pct >= 70 ? '#00d4aa' : pct >= 40 ? '#c9a84c' : '#ef4444';
    return '<div style="height:4px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden;">'
      + '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:2px;transition:width 0.6s;"></div>'
      + '</div>';
  }

  return {
    loadProfile,
    updateProfile,
    uploadAvatar,
    loadTravelStats,
    loadSavedTrips,
    saveTrip,
    deleteTrip,
    loadBookingHistory,
    updatePreferences,
    ecoGradeColor,
    fmtDate,
    ecoBar
  };
})();
