/* ═══════════════════════════════════════════════════════════════════
   VST Safety Engine — Interactive Layer v1
   Score dashboard · Country search · Alert panel · Tab navigation
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var DATA = window.VSTSafetyData;
  if (!DATA) return;

  var LS_KEY = 'vst_safety_prefs_v1';

  /* ── Persist / restore user preferences ─────────────────────────── */
  function getPrefs() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function savePrefs(obj) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); }
    catch (e) {}
  }

  /* ── Utility ─────────────────────────────────────────────────────── */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function riskLabel(n) {
    return ['', 'Very Low', 'Low', 'Moderate', 'High', 'Very High'][n] || '—';
  }
  function riskClass(n) {
    return ['', 'risk-1', 'risk-2', 'risk-3', 'risk-4', 'risk-5'][n] || '';
  }
  function scoreGrade(n) {
    if (n >= 85) return { grade: 'A', cls: 'grade-a' };
    if (n >= 70) return { grade: 'B', cls: 'grade-b' };
    if (n >= 55) return { grade: 'C', cls: 'grade-c' };
    return { grade: 'D', cls: 'grade-d' };
  }

  /* ── Build country card ──────────────────────────────────────────── */
  function buildCountryCard(c) {
    var adv = c.advisory;
    var g = scoreGrade(c.safetyScore);
    var risks = [
      { label: 'Crime', val: c.risk.crime },
      { label: 'Health', val: c.risk.health },
      { label: 'Natural Disaster', val: c.risk.naturalDisaster },
      { label: 'Political', val: c.risk.politicalStability }
    ];
    var riskHtml = risks.map(function (r) {
      return '<div class="risk-row">' +
        '<span class="risk-label">' + r.label + '</span>' +
        '<div class="risk-pips" aria-label="' + riskLabel(r.val) + '">' +
          [1,2,3,4,5].map(function (i) {
            return '<span class="pip' + (i <= r.val ? ' pip-on pip-' + r.val : '') + '"></span>';
          }).join('') +
        '</div>' +
        '<span class="risk-text ' + riskClass(r.val) + '">' + riskLabel(r.val) + '</span>' +
      '</div>';
    }).join('');

    var alertHtml = c.alerts.map(function (a) {
      return '<div class="card-alert card-alert-' + a.level + '">' +
        '<span class="card-alert-dot"></span>' + a.text +
      '</div>';
    }).join('');

    return '<article class="safety-card reveal-item" data-region="' + c.region + '" data-id="' + c.id + '">' +
      '<div class="sc-header">' +
        '<div class="sc-flag-wrap">' +
          '<span class="sc-flag" aria-hidden="true">' + c.flag + '</span>' +
          '<div class="sc-advisory" style="background:' + adv.color + '22; border-color:' + adv.color + '44; color:' + adv.color + '">' +
            '<span class="advisory-dot" style="background:' + adv.color + '"></span>' + adv.label +
          '</div>' +
        '</div>' +
        '<div class="sc-score-wrap">' +
          '<div class="sc-score ' + g.cls + '" aria-label="Safety score ' + c.safetyScore + ' out of 100">' +
            '<span class="sc-score-num">' + c.safetyScore + '</span>' +
            '<span class="sc-score-grade">' + g.grade + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<h3 class="sc-name">' + c.flag + ' ' + c.name + '</h3>' +
      '<p class="sc-city">' + c.city + '</p>' +
      '<div class="sc-indices">' +
        '<div class="sc-index" title="Women\'s Safety Index">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M12 12v8M9 17h6"/></svg>' +
          '<div class="sc-index-bar"><div class="sc-index-fill" style="width:' + c.womensIndex + '%;background:var(--teal)"></div></div>' +
          '<span class="sc-index-num" style="color:var(--teal)">' + c.womensIndex + '</span>' +
        '</div>' +
        '<div class="sc-index" title="LGBTQ+ Safety Index">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
          '<div class="sc-index-bar"><div class="sc-index-fill" style="width:' + c.lgbtqIndex + '%;background:var(--gold)"></div></div>' +
          '<span class="sc-index-num" style="color:var(--gold)">' + c.lgbtqIndex + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="sc-risks">' + riskHtml + '</div>' +
      (alertHtml ? '<div class="sc-alerts">' + alertHtml + '</div>' : '') +
      '<div class="sc-emergency">' +
        '<button type="button" class="sc-emergency-btn" data-id="' + c.id + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.56-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
          'Emergency Contacts' +
        '</button>' +
      '</div>' +
    '</article>';
  }

  /* ── Build emergency modal ───────────────────────────────────────── */
  function openEmergencyModal(country) {
    var ec = country.emergencyContacts;
    var mf = country.medicalFacilities;
    var mfHtml = mf.map(function (f) {
      return '<div class="mf-row">' +
        '<div class="mf-info">' +
          '<span class="mf-name">' + f.name + '</span>' +
          '<span class="mf-city">' + f.city + ' · ' + f.tier + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    var modal = document.createElement('div');
    modal.className = 'emergency-modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Emergency contacts for ' + country.name);
    modal.innerHTML =
      '<div class="emergency-modal">' +
        '<button type="button" class="modal-close" aria-label="Close">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
        '<div class="modal-flag">' + country.flag + '</div>' +
        '<h2 class="modal-title">' + country.name + ' — Emergency Contacts</h2>' +
        '<div class="modal-contacts">' +
          '<a class="contact-row" href="tel:' + ec.police + '">' +
            '<span class="contact-icon contact-police">🚔</span>' +
            '<span class="contact-label">Police</span>' +
            '<span class="contact-num">' + ec.police + '</span>' +
          '</a>' +
          '<a class="contact-row" href="tel:' + ec.ambulance + '">' +
            '<span class="contact-icon contact-amb">🚑</span>' +
            '<span class="contact-label">Ambulance</span>' +
            '<span class="contact-num">' + ec.ambulance + '</span>' +
          '</a>' +
          '<a class="contact-row" href="tel:' + ec.fire + '">' +
            '<span class="contact-icon contact-fire">🚒</span>' +
            '<span class="contact-label">Fire</span>' +
            '<span class="contact-num">' + ec.fire + '</span>' +
          '</a>' +
          '<a class="contact-row" href="tel:' + ec.embassy + '">' +
            '<span class="contact-icon contact-emb">🏛️</span>' +
            '<span class="contact-label">Embassy (UK)</span>' +
            '<span class="contact-num">' + ec.embassy + '</span>' +
          '</a>' +
        '</div>' +
        '<div class="modal-hospital">' +
          '<p class="modal-section-label">Nearest International Hospital</p>' +
          '<div class="hospital-card">' +
            '<span class="hospital-icon">🏥</span>' +
            '<div>' +
              '<p class="hospital-name">' + ec.hospitalName + '</p>' +
              '<a class="hospital-phone" href="tel:' + ec.hospitalPhone + '">' + ec.hospitalPhone + '</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="modal-facilities">' +
          '<p class="modal-section-label">Medical Facilities</p>' +
          mfHtml +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    requestAnimationFrame(function () { modal.classList.add('open'); });

    var closeBtn = modal.querySelector('.modal-close');
    function close() {
      modal.classList.remove('open');
      setTimeout(function () { modal.remove(); }, 300);
      document.body.style.overflow = '';
    }
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) close();
    });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  /* ── Render global alerts ────────────────────────────────────────── */
  function renderAlerts(container) {
    if (!container) return;
    container.innerHTML = DATA.GLOBAL_ALERTS.map(function (a) {
      var icon = a.level === 'critical' ? '🔴' : a.level === 'warn' ? '🟡' : 'ℹ️';
      return '<div class="alert-item alert-' + a.level + '">' +
        '<div class="alert-header">' +
          '<span class="alert-icon">' + icon + '</span>' +
          '<div class="alert-meta">' +
            '<span class="alert-region">' + a.region + '</span>' +
            '<span class="alert-date">' + a.updated + '</span>' +
          '</div>' +
        '</div>' +
        '<p class="alert-title">' + a.title + '</p>' +
        '<p class="alert-body">' + a.body + '</p>' +
      '</div>';
    }).join('');
  }

  /* ── Render tips ─────────────────────────────────────────────────── */
  function renderTips(container, categoryKey) {
    if (!container) return;
    var cat = DATA.TIPS_BY_CATEGORY[categoryKey];
    if (!cat) return;
    container.innerHTML = '<ul class="tips-list">' +
      cat.tips.map(function (t) {
        return '<li class="tips-item"><span class="tips-check" aria-hidden="true">✓</span>' + t + '</li>';
      }).join('') +
    '</ul>';
  }

  /* ── Render score dashboard ──────────────────────────────────────── */
  function renderDashboard() {
    var total = DATA.COUNTRIES.length;
    var safe = DATA.COUNTRIES.filter(function (c) { return c.advisory.code === 'green'; }).length;
    var caution = DATA.COUNTRIES.filter(function (c) { return c.advisory.code === 'yellow'; }).length;
    var highCaution = DATA.COUNTRIES.filter(function (c) { return c.advisory.code === 'orange'; }).length;
    var avgScore = Math.round(DATA.COUNTRIES.reduce(function (s, c) { return s + c.safetyScore; }, 0) / total);

    var counters = [
      { id: 'dash-safe',       target: safe,       label: 'Safe destinations',  color: '#00d4aa' },
      { id: 'dash-caution',    target: caution,    label: 'Exercise caution',   color: '#f59e0b' },
      { id: 'dash-highcaution',target: highCaution,label: 'High caution',       color: '#f97316' },
      { id: 'dash-avgscore',   target: avgScore,   label: 'Avg safety score',   color: '#c9a84c' }
    ];

    counters.forEach(function (c) {
      var el = document.getElementById(c.id);
      if (!el) return;
      var start = 0;
      var duration = 1200;
      var startTime = null;
      function step(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(ease * c.target);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* ── Filter countries ────────────────────────────────────────────── */
  function applyFilter(region, search, grid) {
    var cards = qsa('.safety-card', grid);
    var searchLow = (search || '').toLowerCase().trim();
    cards.forEach(function (card) {
      var matchRegion = !region || region === 'all' || card.dataset.region === region;
      var name = card.querySelector('.sc-name') ? card.querySelector('.sc-name').textContent.toLowerCase() : '';
      var city = card.querySelector('.sc-city') ? card.querySelector('.sc-city').textContent.toLowerCase() : '';
      var matchSearch = !searchLow || name.includes(searchLow) || city.includes(searchLow);
      card.style.display = (matchRegion && matchSearch) ? '' : 'none';
    });
  }

  /* ── Main init ───────────────────────────────────────────────────── */
  function init() {
    var prefs = getPrefs();

    /* Dashboard counters */
    renderDashboard();

    /* Render country grid */
    var grid = qs('.safety-grid');
    if (grid) {
      grid.innerHTML = DATA.COUNTRIES.map(buildCountryCard).join('');

      /* Emergency modal buttons */
      grid.addEventListener('click', function (e) {
        var btn = e.target.closest('.sc-emergency-btn');
        if (!btn) return;
        var country = DATA.COUNTRIES.find(function (c) { return c.id === btn.dataset.id; });
        if (country) openEmergencyModal(country);
      });

      /* Scroll-reveal re-trigger */
      if (window.VSTReveal) window.VSTReveal();
    }

    /* Global alert panel */
    renderAlerts(qs('.alerts-panel'));

    /* Region filter buttons */
    var filterBtns = qsa('.safety-filter-btn');
    var activeRegion = prefs.region || 'all';
    filterBtns.forEach(function (btn) {
      if (btn.dataset.region === activeRegion) btn.classList.add('active');
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeRegion = btn.dataset.region;
        savePrefs(Object.assign(getPrefs(), { region: activeRegion }));
        applyFilter(activeRegion, searchInput ? searchInput.value : '', grid);
      });
    });

    /* Search */
    var searchInput = qs('#safety-search');
    if (searchInput) {
      searchInput.value = prefs.search || '';
      applyFilter(activeRegion, searchInput.value, grid);
      searchInput.addEventListener('input', function () {
        savePrefs(Object.assign(getPrefs(), { search: searchInput.value }));
        applyFilter(activeRegion, searchInput.value, grid);
      });
    } else {
      applyFilter(activeRegion, '', grid);
    }

    /* Tips tabs */
    var tipsBtns = qsa('.tips-tab-btn');
    var tipsContent = qs('.tips-content');
    var activeTab = prefs.tipsTab || 'solo';

    function activateTipsTab(key) {
      tipsBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.category === key); });
      renderTips(tipsContent, key);
      savePrefs(Object.assign(getPrefs(), { tipsTab: key }));
    }

    tipsBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { activateTipsTab(btn.dataset.category); });
    });
    activateTipsTab(activeTab);

    /* Advisory legend tooltips (hover/focus) */
    qsa('.advisory-legend-item').forEach(function (item) {
      item.setAttribute('tabindex', '0');
    });

    /* Animate score rings */
    qsa('.score-ring-fill').forEach(function (ring) {
      var target = parseInt(ring.dataset.score, 10) || 0;
      var circumference = 2 * Math.PI * 36;
      ring.style.strokeDasharray = circumference;
      ring.style.strokeDashoffset = circumference;
      setTimeout(function () {
        ring.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)';
        ring.style.strokeDashoffset = circumference - (target / 100) * circumference;
      }, 300);
    });
  }

  /* ── Boot after DOM ready ────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
