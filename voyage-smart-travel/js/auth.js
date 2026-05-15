/* ─────────────────────────────────────────────────────────────────────────────
   VST — Auth Module (window.VSTAuth)
   Manages JWT token, current user state, and API calls for auth endpoints.
   Token stored in sessionStorage — cleared when browser tab closes.
   ───────────────────────────────────────────────────────────────────────────── */

window.VSTAuth = (function () {
  'use strict';

  var TOKEN_KEY = 'vst_auth_token';
  var USER_KEY  = 'vst_auth_user';
  var BASE      = '';   /* same origin — routes handled by server/Vercel */

  /* ── Token storage ───────────────────────────────────────────────────────── */
  function getToken() {
    try { return sessionStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
  }

  function setSession(token, user) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) { /* storage unavailable */ }
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch (e) {}
  }

  function getCachedUser() {
    try {
      var raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function isLoggedIn() { return !!getToken(); }

  /* ── Fetch helper ────────────────────────────────────────────────────────── */
  function apiFetch(method, path, body) {
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    var token = getToken();
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body)  opts.body = JSON.stringify(body);
    return fetch(BASE + path, opts).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw Object.assign(new Error(data.message || 'Request failed'), { code: data.error, status: res.status });
        return data;
      });
    });
  }

  /* ── Auth actions ────────────────────────────────────────────────────────── */
  function register(email, password, fullName, termsAccepted) {
    return apiFetch('POST', '/v1/users/register', {
      email: email, password: password,
      full_name: fullName, terms_accepted: termsAccepted,
    }).then(function (data) {
      setSession(data.token, data.user);
      _notifyChange();
      return data.user;
    });
  }

  function login(email, password) {
    return apiFetch('POST', '/v1/users/login', { email: email, password: password })
      .then(function (data) {
        setSession(data.token, data.user);
        _notifyChange();
        return data.user;
      });
  }

  function logout() {
    clearSession();
    _notifyChange();
  }

  function getMe() {
    return apiFetch('GET', '/v1/users/me').then(function (user) {
      try { sessionStorage.setItem(USER_KEY, JSON.stringify(user)); } catch (e) {}
      return user;
    });
  }

  function patchMe(patch) {
    return apiFetch('PATCH', '/v1/users/me', patch).then(function (user) {
      try { sessionStorage.setItem(USER_KEY, JSON.stringify(user)); } catch (e) {}
      _notifyChange();
      return user;
    });
  }

  /* ── Change listeners (for nav updates) ─────────────────────────────────── */
  var _listeners = [];
  function onAuthChange(fn) { _listeners.push(fn); }
  function _notifyChange() { _listeners.forEach(function (fn) { try { fn(getCachedUser()); } catch (e) {} }); }

  /* ── Tier helpers ────────────────────────────────────────────────────────── */
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
    isLoggedIn:       isLoggedIn,
    getToken:         getToken,
    getCachedUser:    getCachedUser,
    register:         register,
    login:            login,
    logout:           logout,
    getMe:            getMe,
    patchMe:          patchMe,
    onAuthChange:     onAuthChange,
    tierAtLeast:      tierAtLeast,
    tierLabel:        tierLabel,
    tierBadgeClass:   tierBadgeClass,
  };

})();
