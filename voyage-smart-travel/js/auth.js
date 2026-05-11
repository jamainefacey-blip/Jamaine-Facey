/* ─────────────────────────────────────────────────────────────────────────────
   VST — Auth Module (window.VSTAuth)
   Supabase-backed auth. Maintains the existing VSTAuth API surface.
   Requires: supabase CDN + js/supabase-client.js loaded first.
   ───────────────────────────────────────────────────────────────────────────── */

window.VSTAuth = (function () {
  'use strict';

  var sb = window.VSTSupabase;

  /* ── Internal state ──────────────────────────────────────────────── */
  var _cachedUser    = null;
  var _cachedSession = null;
  var _initialized   = false;
  var _initQueue     = [];
  var _listeners     = [];

  /* ── Bootstrap: load session from storage, then listen ──────────── */
  if (sb) {
    sb.auth.getSession().then(function (res) {
      var session    = res.data && res.data.session;
      _cachedSession = session || null;
      _cachedUser    = session ? session.user : null;
      _initialized   = true;
      _initQueue.forEach(function (fn) { try { fn(_cachedUser); } catch (e) {} });
      _initQueue = [];
    });

    sb.auth.onAuthStateChange(function (event, session) {
      _cachedSession = session || null;
      _cachedUser    = session ? session.user : null;
      if (_initialized) { _notifyListeners(_cachedUser); }
    });
  } else {
    _initialized = true;
  }

  function _notifyListeners(user) {
    _listeners.forEach(function (fn) { try { fn(user); } catch (e) {} });
  }

  /* ── whenReady: run fn after initial session hydration ──────────── */
  function whenReady(fn) {
    if (_initialized) { fn(_cachedUser); }
    else { _initQueue.push(fn); }
  }

  /* ── Sync accessors (populated after first hydration tick) ──────── */
  function getCachedUser()  { return _cachedUser; }
  function isLoggedIn()     { return !!_cachedUser; }
  function getToken()       { return _cachedSession ? _cachedSession.access_token : null; }

  /* ── Async session ───────────────────────────────────────────────── */
  function getSession() {
    if (!sb) return Promise.resolve(null);
    return sb.auth.getSession().then(function (res) {
      return res.data.session || null;
    });
  }

  /* ── Sign up ─────────────────────────────────────────────────────── */
  function signUp(email, password, name) {
    if (!sb) return Promise.reject(new Error('Auth not available'));
    return sb.auth.signUp({
      email:    email,
      password: password,
      options:  { data: { full_name: name, display_name: name } },
    }).then(function (res) {
      if (res.error) throw res.error;
      return res.data.user;
    });
  }

  /* Alias for backward compat */
  function register(email, password, fullName) {
    return signUp(email, password, fullName);
  }

  /* ── Sign in ─────────────────────────────────────────────────────── */
  function signIn(email, password) {
    if (!sb) return Promise.reject(new Error('Auth not available'));
    return sb.auth.signInWithPassword({ email: email, password: password })
      .then(function (res) {
        if (res.error) throw res.error;
        return res.data.user;
      });
  }

  /* Alias for backward compat */
  function login(email, password) { return signIn(email, password); }

  /* ── Google OAuth ────────────────────────────────────────────────── */
  function signInWithGoogle() {
    if (!sb) return Promise.reject(new Error('Auth not available'));
    return sb.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: window.location.origin + '/profile' },
    }).then(function (res) {
      if (res.error) throw res.error;
      return res;
    });
  }

  /* ── Sign out ────────────────────────────────────────────────────── */
  function signOut() {
    if (!sb) return Promise.resolve();
    return sb.auth.signOut().then(function () {
      _cachedUser    = null;
      _cachedSession = null;
      _notifyListeners(null);
    });
  }

  /* Alias for backward compat */
  function logout() { return signOut(); }

  /* ── Get remote user ─────────────────────────────────────────────── */
  function getMe() {
    if (!sb) return Promise.reject(new Error('Auth not available'));
    return sb.auth.getUser().then(function (res) {
      if (res.error) throw res.error;
      return res.data.user;
    });
  }

  /* ── Patch user metadata ─────────────────────────────────────────── */
  function patchMe(patch) {
    if (!sb) return Promise.reject(new Error('Auth not available'));
    return sb.auth.updateUser({ data: patch }).then(function (res) {
      if (res.error) throw res.error;
      _cachedUser = res.data.user;
      _notifyListeners(_cachedUser);
      return res.data.user;
    });
  }

  /* ── Protected route helper ──────────────────────────────────────── */
  function requireAuth(redirectTo) {
    redirectTo = redirectTo || '/login';
    return new Promise(function (resolve) {
      whenReady(function (user) {
        if (!user) {
          var returnTo = encodeURIComponent(window.location.pathname);
          window.location.href = redirectTo + '?return=' + returnTo;
        } else {
          resolve(user);
        }
      });
    });
  }

  /* ── Auth state listener ─────────────────────────────────────────── */
  function onAuthChange(fn) {
    _listeners.push(fn);
  }

  /* ── Tier helpers (kept for backward compat) ─────────────────────── */
  var TIER_ORDER = { GUEST: 0, PREMIUM: 1, VOYAGE_ELITE: 2 };

  function tierAtLeast(user, tier) {
    if (!user) return false;
    return (TIER_ORDER[user.tier] || 0) >= (TIER_ORDER[tier] || 0);
  }

  function tierLabel(tier) {
    return { GUEST: 'Guest', PREMIUM: 'Premium', VOYAGE_ELITE: 'Voyage Elite' }[tier] || tier;
  }

  function tierBadgeClass(tier) {
    return { GUEST: 'tier-guest', PREMIUM: 'tier-premium', VOYAGE_ELITE: 'tier-elite' }[tier] || '';
  }

  return {
    whenReady:       whenReady,
    getSession:      getSession,
    getCachedUser:   getCachedUser,
    isLoggedIn:      isLoggedIn,
    getToken:        getToken,
    signUp:          signUp,
    register:        register,
    signIn:          signIn,
    login:           login,
    signInWithGoogle: signInWithGoogle,
    signOut:         signOut,
    logout:          logout,
    getMe:           getMe,
    patchMe:         patchMe,
    requireAuth:     requireAuth,
    onAuthChange:    onAuthChange,
    tierAtLeast:     tierAtLeast,
    tierLabel:       tierLabel,
    tierBadgeClass:  tierBadgeClass,
  };

})();
