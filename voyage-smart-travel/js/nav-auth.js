/* ─────────────────────────────────────────────────────────────────────────────
   VST — Nav Auth Injection
   Injects auth-aware buttons into #nav-auth and #nav-mobile-auth placeholders.
   Requires: js/auth.js loaded first.
   ───────────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  function getInitial(user) {
    if (!user) return '?';
    var name = (user.user_metadata && user.user_metadata.full_name) ||
               (user.user_metadata && user.user_metadata.display_name) ||
               user.email || '';
    return name.charAt(0).toUpperCase() || '?';
  }

  function getDisplayName(user) {
    if (!user) return '';
    return (user.user_metadata && user.user_metadata.full_name) ||
           (user.user_metadata && user.user_metadata.display_name) ||
           user.email.split('@')[0] || '';
  }

  function renderLoggedOut(slot, mobileSlot) {
    if (slot) {
      slot.innerHTML =
        '<a class="nav-link nav-auth-signin" href="/login">Sign in</a>' +
        '<a class="nav-cta" href="/register">Join free</a>';
    }
    if (mobileSlot) {
      mobileSlot.innerHTML =
        '<a class="nav-mobile-link" href="/login">Sign in</a>' +
        '<a class="nav-mobile-link nav-mobile-cta" href="/register">Join free</a>';
    }
  }

  function renderLoggedIn(slot, mobileSlot, user) {
    var initial     = getInitial(user);
    var displayName = getDisplayName(user);

    if (slot) {
      slot.innerHTML =
        '<div class="nav-user">' +
          '<a class="nav-user-avatar" href="/profile" aria-label="Your profile" title="' + displayName + '">' + initial + '</a>' +
          '<a class="nav-user-name" href="/profile">' + displayName + '</a>' +
          '<button class="nav-sign-out" id="nav-signout-btn" aria-label="Sign out">Sign out</button>' +
        '</div>';

      var btn = document.getElementById('nav-signout-btn');
      if (btn) {
        btn.addEventListener('click', function () {
          VSTAuth.signOut().then(function () {
            window.location.href = '/';
          });
        });
      }
    }

    if (mobileSlot) {
      mobileSlot.innerHTML =
        '<a class="nav-mobile-link" href="/profile">My Profile</a>' +
        '<button class="nav-mobile-link nav-mobile-signout" id="nav-mobile-signout-btn">Sign out</button>';

      var mobileBtn = document.getElementById('nav-mobile-signout-btn');
      if (mobileBtn) {
        mobileBtn.addEventListener('click', function () {
          VSTAuth.signOut().then(function () {
            window.location.href = '/';
          });
        });
      }
    }
  }

  function updateNav(user) {
    var slot       = document.getElementById('nav-auth');
    var mobileSlot = document.getElementById('nav-mobile-auth');

    if (user) {
      renderLoggedIn(slot, mobileSlot, user);
    } else {
      renderLoggedOut(slot, mobileSlot);
    }
  }

  /* Run once auth is hydrated, then keep listening */
  if (window.VSTAuth) {
    VSTAuth.whenReady(function (user) {
      updateNav(user);
    });
    VSTAuth.onAuthChange(function (user) {
      updateNav(user);
    });
  }
})();
