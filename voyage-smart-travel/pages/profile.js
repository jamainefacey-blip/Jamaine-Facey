/* ─────────────────────────────────────────────────────────────────────────────
   VST — Profile Page
   Tier-gated display: GUEST sees basic info + locked sections.
   PREMIUM sees accessibility + SOS contacts.
   VOYAGE_ELITE sees everything + elite features.
   ───────────────────────────────────────────────────────────────────────────── */

window.renderProfile = function () {
  var A = window.VSTAuth;

  if (!A.isLoggedIn()) {
    return '<section class="section"><div class="section-inner section-inner--narrow">'
      + '<div class="card card-dark" style="text-align:center;padding:48px 24px;">'
      + '<p style="color:var(--text-muted);margin-bottom:20px;">Sign in to view your profile.</p>'
      + '<a class="btn btn-primary" href="#auth" data-route="auth">Sign In</a>'
      + '</div></div></section>';
  }

  var user = A.getCachedUser();
  if (!user) {
    return '<section class="section"><div class="section-inner section-inner--narrow">'
      + '<div class="card card-dark"><p style="color:var(--text-muted);">Loading profile…</p></div>'
      + '</div></section>';
  }

  var tier       = user.tier || 'GUEST';
  var identity   = user.identity || {};
  var prefs      = user.preferences || {};
  var access     = user.accessibility || {};
  var sos        = user.sos_contacts || [];
  var history    = user.travel_history || {};
  var painGuard  = user.pain_guard || {};
  var isPremium  = A.tierAtLeast(user, 'PREMIUM');
  var isElite    = A.tierAtLeast(user, 'VOYAGE_ELITE');

  var displayName = identity.preferred_name || identity.full_name || identity.email || 'Traveller';
  var tierLabel   = A.tierLabel(tier);
  var tierClass   = A.tierBadgeClass(tier);

  /* ── Header ───────────────────────────────────────────────────────────────── */
  var header = '<div class="profile-header">'
    + '<div class="profile-avatar" aria-hidden="true">' + (displayName[0] || 'V').toUpperCase() + '</div>'
    + '<div class="profile-header-info">'
    +   '<h2 class="profile-name">' + _esc(displayName) + '</h2>'
    +   '<p class="profile-email">' + _esc(identity.email || '') + '</p>'
    +   '<span class="tier-badge ' + tierClass + '">' + tierLabel + '</span>'
    +   (isElite ? '<span class="tier-elite-mark">&#9733; Voyage Elite</span>' : '')
    + '</div>'
    + '<button class="btn btn-ghost profile-logout-btn" id="profile-logout">Sign Out</button>'
    + '</div>';

  /* ── Basic info ───────────────────────────────────────────────────────────── */
  var basicInfo = _section('Account', [
    _row('Full name',     _esc(identity.full_name || '—')),
    _row('Email',         _esc(identity.email || '—') + (identity.email_verified ? ' <span class="profile-verified">verified</span>' : '')),
    _row('Phone',         identity.phone ? _esc(identity.phone) : '<span class="profile-muted">Not set</span>'),
    _row('Nationality',   identity.nationality || '<span class="profile-muted">Not set</span>'),
    _row('Tier',          '<span class="tier-badge ' + tierClass + '">' + tierLabel + '</span>'),
    _row('Member since',  _fmtDate(user.created_at)),
    _row('Last login',    user.last_login_at ? _fmtDate(user.last_login_at) : '<span class="profile-muted">This session</span>'),
  ]);

  /* ── Preferences ──────────────────────────────────────────────────────────── */
  var prefsSection = _section('Travel Preferences', [
    _row('Home airport',    prefs.home_airport || '<span class="profile-muted">Not set</span>'),
    _row('Cabin class',     _fmtEnum(prefs.cabin_class || 'ECONOMY')),
    _row('Currency',        prefs.currency || 'GBP'),
    _row('Seat preference', _fmtEnum(prefs.seat_preference || 'NO_PREFERENCE')),
    _row('Meal preference', _fmtEnum(prefs.meal_preference || 'STANDARD')),
    _row('Locale',          prefs.locale || 'en-GB'),
  ]);

  /* ── Travel history stats ─────────────────────────────────────────────────── */
  var historySection = '<div class="profile-section">'
    + '<h3 class="profile-section-title">Travel History</h3>'
    + '<div class="profile-stats">'
    + _stat(history.total_trips || 0, 'Trips')
    + _stat(history.total_nights || 0, 'Nights')
    + _stat((history.countries_visited || []).length, 'Countries')
    + _stat('£' + ((history.total_spend_gbp || 0)).toLocaleString(), 'Spent')
    + (isPremium ? _stat(Math.round(history.carbon_kg_total || 0) + 'kg', 'Carbon') : '')
    + (isPremium ? _stat(Math.round(history.carbon_kg_offset || 0) + 'kg', 'Offset') : '')
    + '</div>'
    + '</div>';

  /* ── Booking History ─────────────────────────────────────────────────────── */
  var bookingSection = '<div class="profile-section" id="profile-booking-history">'
    + '<h3 class="profile-section-title">Booking History</h3>'
    + '<p class="profile-muted profile-bookings-loading">Loading bookings\u2026</p>'
    + '</div>';

  /* ── Accessibility (PREMIUM+) ─────────────────────────────────────────────── */
  var accessSection;
  if (isPremium) {
    accessSection = _section('Accessibility Needs', [
      _row('Mobility',        _fmtEnum(access.mobility || 'NONE')),
      _row('Vision',          _fmtEnum(access.vision   || 'NONE')),
      _row('Hearing',         _fmtEnum(access.hearing  || 'NONE')),
      _row('Cognitive support', access.cognitive ? 'Yes' : 'No'),
      _row('Requires carer',  access.requires_carer ? 'Yes' : 'No'),
      _row('Notes',           access.additional_notes || '<span class="profile-muted">None</span>'),
    ]);
  } else {
    accessSection = _lockedSection('Accessibility Needs', 'PREMIUM');
  }

  /* ── SOS Contacts (PREMIUM+) ──────────────────────────────────────────────── */
  var sosSection;
  if (isPremium) {
    var sosRows = sos.length === 0
      ? '<p class="profile-empty">No SOS contacts configured. Add emergency contacts so Ava can alert them if you trigger an SOS.</p>'
      : sos.map(function (c, i) {
          return '<div class="profile-sos-contact">'
            + '<div class="profile-sos-num">' + (i + 1) + '</div>'
            + '<div class="profile-sos-details">'
            +   '<strong>' + _esc(c.name) + '</strong>'
            +   ' <span class="profile-muted">' + _fmtEnum(c.relationship) + '</span><br>'
            +   '<span>' + _esc(c.phone) + '</span>'
            +   (c.email ? ' &middot; ' + _esc(c.email) : '')
            +   '<br><span class="profile-sos-consent' + (c.consent_given ? ' profile-verified' : '') + '">'
            +     (c.consent_given ? '&#10003; Consent given' : '&#9888; Consent pending')
            +   '</span>'
            + '</div>'
            + '</div>';
        }).join('');
    sosSection = '<div class="profile-section">'
      + '<h3 class="profile-section-title">SOS Contacts'
      + ' <span class="profile-section-count">' + sos.length + '/5</span></h3>'
      + sosRows
      + '</div>';
  } else {
    sosSection = _lockedSection('SOS Emergency Contacts', 'PREMIUM');
  }

  /* ── Pain Guard (PREMIUM+) ────────────────────────────────────────────────── */
  var painSection;
  if (isPremium) {
    painSection = _section('Pain Guard', [
      _row('Enrolled',        painGuard.enrolled ? '<span class="profile-verified">Active</span>' : '<span class="profile-muted">Not enrolled</span>'),
      _row('Active tasks',    String(painGuard.active_task_count || 0)),
      _row('Handoff required', painGuard.handoff_required ? '<span class="profile-alert">Yes</span>' : 'No'),
    ]);
  } else {
    painSection = _lockedSection('Pain Guard', 'PREMIUM');
  }

  /* ── Eco Dashboard (VOYAGE_ELITE) ────────────────────────────────────────── */
  var ecoSection = '';
  if (isElite && window.VSTEco) {
    var carbonTotal   = Math.round(history.carbon_kg_total   || 0);
    var carbonOffset  = Math.round(history.carbon_kg_offset  || 0);
    var carbonNet     = Math.max(0, carbonTotal - carbonOffset);
    var offsetCount   = Math.floor(carbonOffset / 150); /* proxy: each 150 kg = 1 offset purchase */
    var badge         = window.VSTEco.badgeForCount(offsetCount);
    var offsetCostNet = (carbonNet * 0.015).toFixed(2);
    var progressPct   = Math.round((badge.progress || 0) * 100);

    var badgeHtml = badge.id
      ? '<span class="eco-badge eco-badge--' + badge.id.toLowerCase() + '">' + badge.label + '</span>'
      : '<span class="eco-badge eco-badge--none">No badge yet</span>';

    var nextMilestone = badge.next_count
      ? '<div class="eco-progress-wrap">'
          + '<div class="eco-progress-label">'
          +   'Progress to ' + badge.next + ' (' + offsetCount + '/' + badge.next_count + ' offsets)'
          + '</div>'
          + '<div class="eco-progress-bar"><div class="eco-progress-fill" style="width:' + progressPct + '%"></div></div>'
          + '</div>'
      : '<p class="eco-progress-label">Maximum tier — Platinum achieved.</p>';

    ecoSection = '<div class="profile-section eco-dashboard">'
      + '<h3 class="profile-section-title">Carbon Dashboard</h3>'
      + '<div class="eco-stats">'
      +   '<div class="eco-stat"><div class="eco-stat-value">' + carbonTotal.toLocaleString('en-GB') + '<span class="eco-stat-unit">kg</span></div><div class="eco-stat-label">Total CO₂</div></div>'
      +   '<div class="eco-stat eco-stat--offset"><div class="eco-stat-value">' + carbonOffset.toLocaleString('en-GB') + '<span class="eco-stat-unit">kg</span></div><div class="eco-stat-label">Offset</div></div>'
      +   '<div class="eco-stat eco-stat--net"><div class="eco-stat-value">' + carbonNet.toLocaleString('en-GB') + '<span class="eco-stat-unit">kg</span></div><div class="eco-stat-label">Net remaining</div></div>'
      +   '<div class="eco-stat"><div class="eco-stat-value">£' + offsetCostNet + '</div><div class="eco-stat-label">Cost to neutralise</div></div>'
      + '</div>'
      + '<div class="eco-badge-row">'
      +   '<span class="eco-badge-label">Current badge:</span> ' + badgeHtml
      + '</div>'
      + nextMilestone
      + '</div>';
  } else if (isPremium && !isElite) {
    ecoSection = _lockedSection('Carbon Dashboard', 'VOYAGE_ELITE');
  }

  /* ── Elite features banner ────────────────────────────────────────────────── */
  var eliteBanner = isElite ? '<div class="profile-elite-banner">'
    + '<span class="profile-elite-icon">&#9733;</span>'
    + '<div>'
    +   '<strong>Voyage Elite</strong>'
    +   '<p>You have access to concierge support, voice SOS callbacks, WhatsApp notifications, and the full carbon dashboard.</p>'
    + '</div>'
    + '</div>' : '';

  /* ── Guest upgrade CTA ────────────────────────────────────────────────────── */
  var upgradeCta = !isPremium ? '<div class="profile-upgrade-cta">'
    + '<h4>Unlock the full VST experience</h4>'
    + '<p>Upgrade to <strong>Premium</strong> for live Ava intelligence, SOS contacts, fare alerts, Pain Guard, and WhatsApp notifications.</p>'
    + '<a class="btn btn-primary" href="#contact" data-route="contact">Upgrade to Premium</a>'
    + '</div>' : '';

  return '<section class="section"><div class="section-inner section-inner--narrow">'
    + '<div class="profile-page" id="profile-page">'
    + header
    + eliteBanner
    + basicInfo
    + prefsSection
    + historySection
    + bookingSection
    + ecoSection
    + accessSection
    + sosSection
    + painSection
    + upgradeCta
    + '</div>'
    + '</div></section>';
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function _esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function _fmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }); }
  catch (e) { return iso.slice(0, 10); }
}
function _fmtEnum(str) {
  return String(str || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
}
function _row(label, value) {
  return '<div class="profile-row"><span class="profile-row-label">' + label + '</span><span class="profile-row-value">' + value + '</span></div>';
}
function _stat(value, label) {
  return '<div class="profile-stat"><div class="profile-stat-value">' + value + '</div><div class="profile-stat-label">' + label + '</div></div>';
}
function _section(title, rows) {
  return '<div class="profile-section"><h3 class="profile-section-title">' + title + '</h3><div class="profile-rows">' + rows.join('') + '</div></div>';
}
function _lockedSection(title, requiredTier) {
  var label = { PREMIUM: 'Premium', VOYAGE_ELITE: 'Voyage Elite' }[requiredTier] || requiredTier;
  return '<div class="profile-section profile-section--locked">'
    + '<h3 class="profile-section-title">' + title + ' <span class="profile-locked-badge">&#128274; ' + label + '</span></h3>'
    + '<p class="profile-locked-msg">Upgrade to <strong>' + label + '</strong> to access this section.</p>'
    + '</div>';
}

/* ── Booking history renderer (called from router after async fetch) ─────── */
window.renderProfileBookings = function (bookings) {
  var title = '<h3 class="profile-section-title">Booking History'
    + ' <span class="profile-section-count">' + (bookings ? bookings.length : 0) + '</span></h3>';

  if (!bookings || bookings.length === 0) {
    return '<div class="profile-section" id="profile-booking-history">'
      + title
      + '<p class="profile-empty">No bookings yet. Plan your first trip to get started.</p>'
      + '</div>';
  }

  var STATUS_LABEL = { CONFIRMED: 'Confirmed', PENDING: 'Pending', CANCELLED: 'Cancelled' };
  var STATUS_CLASS = { CONFIRMED: 'booking-status--confirmed', PENDING: 'booking-status--pending', CANCELLED: 'booking-status--cancelled' };
  var CURRENCY_SYMBOL = { GBP: '£', USD: '$', EUR: '€', AED: 'AED ' };

  var cards = bookings.map(function (b) {
    var statusLabel = STATUS_LABEL[b.status] || b.status;
    var statusClass = STATUS_CLASS[b.status] || '';
    var symbol      = CURRENCY_SYMBOL[b.currency] || b.currency + ' ';
    var route       = (b.origin ? _esc(b.origin) + ' \u2192 ' : '') + _esc(b.destination);
    var dates       = _esc(b.departure_date) + (b.return_date ? ' \u2013 ' + _esc(b.return_date) : '');
    var flight      = b.carrier ? _esc(b.carrier) + (b.flight_number ? ' \xb7 ' + _esc(b.flight_number) : '') : '';

    var ecoHtml = '';
    if (b.co2_per_person_kg && b.eco_grade) {
      var gradeClass = window.VSTEco ? window.VSTEco.ecoGradeClass(b.eco_grade) : '';
      ecoHtml = '<span class="booking-card-eco">'
        + '<span class="eco-grade-badge ' + gradeClass + '">' + b.eco_grade + '</span>'
        + ' ' + b.co2_per_person_kg.toLocaleString('en-GB') + ' kg CO₂/person'
        + '</span>';
    }

    return '<div class="booking-card">'
      + '<div class="booking-card-header">'
      +   '<div class="booking-card-route">' + route + '</div>'
      +   '<span class="booking-status-badge ' + statusClass + '">' + statusLabel + '</span>'
      + '</div>'
      + '<div class="booking-card-meta">'
      +   (flight ? '<span class="booking-card-flight">' + flight + '</span>' : '')
      +   '<span class="booking-card-dates">' + dates + '</span>'
      +   '<span class="booking-card-price">' + symbol + (b.price || 0).toLocaleString('en-GB') + '</span>'
      + '</div>'
      + (ecoHtml ? '<div class="booking-card-eco-row">' + ecoHtml + '</div>' : '')
      + '<div class="booking-card-ref">Ref: ' + _esc(b.confirmation_ref) + '</div>'
      + '</div>';
  }).join('');

  return '<div class="profile-section" id="profile-booking-history">'
    + title
    + '<div class="profile-booking-list">' + cards + '</div>'
    + '</div>';
};
