// ─────────────────────────────────────────────────────────────────────────────
// COACH AUTH — browser authentication module
//
// Manages the JWT session token for the coach portal. Exposes window.COACH_AUTH.
//
// Storage: sessionStorage under key 'ps_coach_token'.
//   sessionStorage (not localStorage) because:
//   - Token is cleared automatically when the browser tab / session closes.
//   - Multiple independent sessions in separate tabs (e.g. coach reviewing two
//     clients at once) are isolated — each tab has its own sessionStorage.
//   - No persistent cross-session state in Phase 4.
//
// Token decoding: JWT payload is base64url-decoded in the browser without
//   importing a library. Signature verification is the server's responsibility.
//   The client only uses the decoded payload for UI state (name, expiry check).
//
// API base: '' (same origin). Works in local Netlify dev and production without
//   configuration changes.
//
// Sign-out UI:
//   index.html includes a button with id="js-signout". COACH_AUTH attaches a
//   click handler to it on DOMContentLoaded and shows/hides it based on auth state.
//
// Generic by design: token payload carries role, not programme type. Future
//   module roles (nutrition coach, sport coach, self-tracking client) are
//   accommodated by a role-aware extension of this module, not a rewrite.
//
// Video module guard rail: COACH_AUTH.getToken() returns the token that the
//   future video upload module will include in its Authorization header when
//   requesting signed S3/GCS URLs from the coach API.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  var TOKEN_KEY = 'ps_coach_token';
  var API_BASE  = '';  // same-origin; no trailing slash

  // ── JWT payload decoder ────────────────────────────────────────────────────
  // Decodes the base64url payload section without verifying the signature.
  // Signature verification always happens server-side via jsonwebtoken.
  function decodePayload(token) {
    try {
      var parts = token.split('.');
      if (parts.length !== 3) return null;
      // base64url → base64 (pad to multiple of 4)
      var b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      var pad = b64.length % 4;
      if (pad) b64 += '==='.slice(pad);
      return JSON.parse(atob(b64));
    } catch (_) {
      return null;
    }
  }

  // ── Token storage ──────────────────────────────────────────────────────────
  function getToken() {
    try { return sessionStorage.getItem(TOKEN_KEY); }
    catch (_) { return null; }
  }

  function setToken(token) {
    try { sessionStorage.setItem(TOKEN_KEY, token); }
    catch (_) {}
  }

  function clearToken() {
    try { sessionStorage.removeItem(TOKEN_KEY); }
    catch (_) {}
  }

  // ── Coach identity ─────────────────────────────────────────────────────────
  // Reads the JWT payload and returns the decoded coach object if the token is
  // present and not expired. Returns null otherwise (and clears an expired token).
  function getCoach() {
    var token = getToken();
    if (!token) return null;
    var payload = decodePayload(token);
    if (!payload) { clearToken(); return null; }
    // Check client-side expiry (server also enforces this)
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      clearToken();
      return null;
    }
    return payload;
  }

  function isAuthenticated() {
    return getCoach() !== null;
  }

  // ── API calls ──────────────────────────────────────────────────────────────

  /**
   * Sign in with email + password.
   * Stores the returned JWT in sessionStorage.
   * Returns { token, coach } on success; throws an Error on failure.
   */
  function login(email, password) {
    return fetch(API_BASE + '/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: email, password: password }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) {
            throw new Error(data.error || ('Login failed (' + res.status + ')'));
          }
          setToken(data.token);
          return data;
        });
      });
  }

  /**
   * Sign out. Clears the local token and calls POST /api/auth/logout.
   * The logout call is best-effort — if it fails, the token is still cleared.
   * Returns a Promise that always resolves.
   */
  function logout() {
    var token = getToken();
    clearToken();
    if (!token) return Promise.resolve();
    return fetch(API_BASE + '/api/auth/logout', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + token,
      },
    }).catch(function () { /* best-effort */ });
  }

  /**
   * Return an Authorization header object for use with fetch().
   * Returns null if not authenticated.
   *
   * Usage:
   *   var headers = COACH_AUTH.authHeaders();
   *   if (!headers) { redirect to login; return; }
   *   fetch('/api/clients', { headers: headers });
   */
  function authHeaders() {
    var token = getToken();
    if (!token) return null;
    return {
      'Authorization': 'Bearer ' + token,
      'Content-Type':  'application/json',
    };
  }

  // ── Sign-out button wiring ─────────────────────────────────────────────────
  // Attaches a click handler to #js-signout and shows/hides it based on auth state.
  // Called from DOMContentLoaded and from COACH_APP after each route dispatch.
  function updateSignoutButton() {
    var btn = document.getElementById('js-signout');
    if (!btn) return;
    btn.style.display = isAuthenticated() ? '' : 'none';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('js-signout');
    if (!btn) return;
    btn.addEventListener('click', function () {
      logout().then(function () {
        location.replace('#login');
      });
    });
    updateSignoutButton();
  });

  // ── Public API ─────────────────────────────────────────────────────────────
  window.COACH_AUTH = {
    getToken:            getToken,
    setToken:            setToken,
    clearToken:          clearToken,
    getCoach:            getCoach,
    isAuthenticated:     isAuthenticated,
    login:               login,
    logout:              logout,
    authHeaders:         authHeaders,
    updateSignoutButton: updateSignoutButton,
  };

})();
