/* ─────────────────────────────────────────────────────────────────────────────
   VST — Auth Page (Login / Register)
   ───────────────────────────────────────────────────────────────────────────── */

window.renderAuth = function () {
  var C = window.VSTComponents;

  return C.renderPageHero({
    eyebrow: 'Your Account',
    title:   'Sign in to VST',
    sub:     'Access your profile, saved trips, and Ava intelligence personalised to your tier.',
  }) + `

  <section class="section">
    <div class="section-inner section-inner--narrow">

      <!-- Auth tabs -->
      <div class="auth-tabs" id="auth-tabs">
        <button class="auth-tab auth-tab--active" data-tab="login">Sign In</button>
        <button class="auth-tab" data-tab="register">Create Account</button>
      </div>

      <!-- Demo hint -->
      <div class="auth-demo-hint">
        <span class="auth-demo-label">Demo accounts:</span>
        <code>demo@voyage.test</code> (Premium) &nbsp;&middot;&nbsp;
        <code>elite@voyage.test</code> (Voyage Elite) &nbsp;&middot;&nbsp;
        Password: <code>voyage123</code>
      </div>

      <!-- Sign In form -->
      <div class="card card-dark auth-card" id="auth-login-panel">
        <h3 class="auth-card-title">Sign In</h3>
        <div class="auth-error" id="login-error" style="display:none;"></div>
        <form id="login-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="login-email">Email address</label>
            <input class="form-input" type="email" id="login-email" placeholder="you@example.com" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label class="form-label" for="login-password">Password</label>
            <input class="form-input" type="password" id="login-password" placeholder="Your password" required autocomplete="current-password" />
          </div>
          <button type="submit" class="form-submit" id="login-submit">Sign In</button>
        </form>
      </div>

      <!-- Register form -->
      <div class="card card-dark auth-card" id="auth-register-panel" style="display:none;">
        <h3 class="auth-card-title">Create your account</h3>
        <div class="auth-error" id="register-error" style="display:none;"></div>
        <form id="register-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="reg-name">Full name</label>
            <input class="form-input" type="text" id="reg-name" placeholder="Your name" autocomplete="name" />
          </div>
          <div class="form-group">
            <label class="form-label" for="reg-email">Email address <span class="form-required">*</span></label>
            <input class="form-input" type="email" id="reg-email" placeholder="you@example.com" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label class="form-label" for="reg-password">Password <span class="form-required">*</span></label>
            <input class="form-input" type="password" id="reg-password" placeholder="Min. 8 characters" required autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label class="access-check">
              <input type="checkbox" id="reg-terms" />
              <span class="access-check-box" aria-hidden="true"></span>
              I accept the <a href="#contact" data-route="contact" class="auth-link">Terms of Service</a> and Privacy Policy <span class="form-required">*</span>
            </label>
          </div>
          <button type="submit" class="form-submit" id="register-submit">Create Account</button>
        </form>
        <p class="auth-tier-note">New accounts start on the <strong>Guest</strong> tier. Upgrade to Premium or Voyage Elite to unlock SOS, live Ava intelligence, and fare alerts.</p>
      </div>

    </div>
  </section>`;
};
