// ─────────────────────────────────────────────────────────────────────────────
// LOGIN VIEW — renders the coach sign-in form
//
// Self-registers the 'login' route via COACH_APP.registerRoute('login', render).
// Called by coach-app.js dispatch() whenever the hash is #login and the coach
// is not authenticated.
//
// Responsibilities:
//   - Render the sign-in form into #view
//   - Handle form submission via COACH_AUTH.login(email, password)
//   - On success: redirect to #clients (the auth guard will then allow it)
//   - On failure: display the error message returned by the API
//
// This view does NOT check authentication state itself — that is the auth
// guard's job in coach-app.js. If an authenticated coach somehow reaches this
// view, the auth guard in dispatch() will redirect to #clients before render()
// is ever called.
//
// CSS classes follow the c-login__ namespace (defined in coach.css).
//
// Generic by design: the login view is not rehab-specific. It works for any
// programme type or coach role. A future self-service login for multiple coaches
// or module-specific portals reuses this view unchanged.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // ── Utility: safe HTML escape ──────────────────────────────────────────────
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  function render(route) {
    var el = document.getElementById('view');
    if (!el) return;

    el.innerHTML =
      '<div class="c-login">' +
        '<div class="c-login__card">' +
          '<div class="c-login__brand">' +
            '<span class="c-login__logo" aria-hidden="true">MR PT</span>' +
            '<h1 class="c-login__title">Coach Portal</h1>' +
          '</div>' +
          '<form id="js-login-form" class="c-login__form" novalidate>' +
            '<div class="c-login__field">' +
              '<label class="c-login__label" for="js-email">Email</label>' +
              '<input class="c-login__input" type="email" id="js-email" name="email"' +
                ' autocomplete="email" required placeholder="coach@example.com" />' +
            '</div>' +
            '<div class="c-login__field">' +
              '<label class="c-login__label" for="js-password">Password</label>' +
              '<input class="c-login__input" type="password" id="js-password"' +
                ' name="password" autocomplete="current-password" required />' +
            '</div>' +
            '<div id="js-login-error" class="c-login__error" role="alert"' +
              ' aria-live="polite" style="display:none"></div>' +
            '<button class="c-login__submit" type="submit">Sign in</button>' +
          '</form>' +
        '</div>' +
      '</div>';

    var form      = document.getElementById('js-login-form');
    var errorEl   = document.getElementById('js-login-error');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var email     = document.getElementById('js-email').value.trim();
      var password  = document.getElementById('js-password').value;
      var submitBtn = form.querySelector('.c-login__submit');

      if (!email || !password) {
        errorEl.textContent = 'Please enter your email and password.';
        errorEl.style.display = '';
        return;
      }

      // Disable form during request
      submitBtn.disabled     = true;
      submitBtn.textContent  = 'Signing in\u2026';
      errorEl.style.display  = 'none';

      if (typeof COACH_AUTH === 'undefined') {
        errorEl.textContent   = 'Authentication module not loaded. Please refresh the page.';
        errorEl.style.display = '';
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Sign in';
        return;
      }

      COACH_AUTH.login(email, password)
        .then(function () {
          // Auth guard in coach-app.js will allow #clients now
          location.replace('#clients');
        })
        .catch(function (err) {
          errorEl.textContent   = err.message || 'Sign in failed. Check your credentials.';
          errorEl.style.display = '';
          submitBtn.disabled    = false;
          submitBtn.textContent = 'Sign in';
          // Clear password field on failure (do not re-populate for security)
          var pwdInput = document.getElementById('js-password');
          if (pwdInput) pwdInput.value = '';
        });
    });
  }

  // ── Self-register ─────────────────────────────────────────────────────────
  if (typeof COACH_APP !== 'undefined') {
    COACH_APP.registerRoute('login', render);
  } else {
    console.error('[view-login] COACH_APP not found. Check script load order in index.html.');
  }

})();
