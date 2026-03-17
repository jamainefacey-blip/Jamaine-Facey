/* ─────────────────────────────────────────────────────────────────────────────
   Voyage Smart Travel — Reusable Components
   Pure vanilla JS. Returns HTML strings. No framework.
   ───────────────────────────────────────────────────────────────────────────── */

window.VSTComponents = (function () {

  /* ── SVG icon library ────────────────────────────────────────────────────── */
  const icons = {
    shield:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    map:          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
    alert:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    check:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    phone:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.26a2 2 0 0 1 1.97-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l1.21-1.21a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    mail:         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    globe:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    users:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    star:         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    lock:         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    accessibility:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><path d="M4 13h16"/><path d="M8 13v8"/><path d="M16 13v8"/><path d="M8 13l2-4h4l2 4"/></svg>`,
    building:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/><line x1="15" y1="9" x2="15" y2="21"/></svg>`,
    compass:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
    heart:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    wifi:         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
    zap:          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    eye:          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    arrow:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
    handshake:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`,
    clock:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    chat:         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  };

  /* ── Shared icon getter ──────────────────────────────────────────────────── */
  function icon(name) {
    return icons[name] || icons.compass;
  }

  /* ── renderSectionHeader ─────────────────────────────────────────────────── */
  function renderSectionHeader({ eyebrow = '', title = '', sub = '', centered = false } = {}) {
    return `
      <div class="section-header${centered ? ' centered' : ''}">
        ${eyebrow ? `<p class="section-eyebrow">${eyebrow}</p>` : ''}
        <h2 class="section-title">${title}</h2>
        ${sub ? `<p class="section-sub">${sub}</p>` : ''}
      </div>`;
  }

  /* ── renderHero ──────────────────────────────────────────────────────────── */
  function renderHero({ eyebrow = '', title = '', sub = '', primaryCTA = null, secondaryCTA = null } = {}) {
    const primaryBtn = primaryCTA
      ? `<a href="${primaryCTA.href}" data-route="${primaryCTA.route || ''}" class="btn btn-primary btn-lg">${primaryCTA.label} <span>${icon('arrow')}</span></a>`
      : '';
    const secondaryBtn = secondaryCTA
      ? `<a href="${secondaryCTA.href}" data-route="${secondaryCTA.route || ''}" class="btn btn-outline btn-lg">${secondaryCTA.label}</a>`
      : '';
    return `
      <section class="hero">
        <div class="hero-inner">
          ${eyebrow ? `<div class="hero-eyebrow">${icon('compass')}${eyebrow}</div>` : ''}
          <h1 class="hero-title">${title}</h1>
          ${sub ? `<p class="hero-subtitle">${sub}</p>` : ''}
          ${(primaryBtn || secondaryBtn) ? `<div class="hero-actions">${primaryBtn}${secondaryBtn}</div>` : ''}
        </div>
      </section>`;
  }

  /* ── renderPageHero ──────────────────────────────────────────────────────── */
  function renderPageHero({ eyebrow = '', title = '', sub = '', badge = null } = {}) {
    return `
      <div class="page-hero">
        <div class="page-hero-inner">
          ${eyebrow ? `<p class="section-eyebrow">${eyebrow}</p>` : ''}
          ${badge ? `<div class="mb-16">${renderBadge(badge.text, badge.variant)}</div>` : ''}
          <h1 class="page-hero-title">${title}</h1>
          ${sub ? `<p class="page-hero-sub">${sub}</p>` : ''}
        </div>
      </div>`;
  }

  /* ── renderCard ──────────────────────────────────────────────────────────── */
  function renderCard({ iconName = 'compass', title = '', body = '', variant = '' } = {}) {
    return `
      <div class="card${variant ? ' card-' + variant : ''}">
        <div class="card-icon">${icon(iconName)}</div>
        <h3 class="card-title">${title}</h3>
        <p class="card-body">${body}</p>
      </div>`;
  }

  /* ── renderStatBlock ─────────────────────────────────────────────────────── */
  function renderStatBlock(stats = []) {
    const items = stats.map(s => `
      <div class="stat-item">
        <div class="stat-value">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      </div>`).join('');
    return `<div class="stat-block">${items}</div>`;
  }

  /* ── renderCTABanner ─────────────────────────────────────────────────────── */
  function renderCTABanner({ title = '', sub = '', primaryCTA = null, secondaryCTA = null } = {}) {
    const primaryBtn = primaryCTA
      ? `<a href="${primaryCTA.href}" data-route="${primaryCTA.route || ''}" class="btn btn-primary btn-lg">${primaryCTA.label} <span>${icon('arrow')}</span></a>`
      : '';
    const secondaryBtn = secondaryCTA
      ? `<a href="${secondaryCTA.href}" data-route="${secondaryCTA.route || ''}" class="btn btn-outline">${secondaryCTA.label}</a>`
      : '';
    return `
      <div class="cta-banner">
        <div class="cta-banner-inner">
          <h2 class="cta-banner-title">${title}</h2>
          ${sub ? `<p class="cta-banner-sub">${sub}</p>` : ''}
          <div class="hero-actions">${primaryBtn}${secondaryBtn}</div>
        </div>
      </div>`;
  }

  /* ── renderBadge ─────────────────────────────────────────────────────────── */
  function renderBadge(text, variant = 'gold') {
    return `<span class="badge badge-${variant}">${text}</span>`;
  }

  /* ── renderStepList ──────────────────────────────────────────────────────── */
  function renderStepList(steps = []) {
    const items = steps.map((s, i) => `
      <li class="step-item">
        <div class="step-num">${i + 1}</div>
        <div class="step-content">
          <div class="step-title">${s.title}</div>
          <div class="step-body">${s.body}</div>
        </div>
      </li>`).join('');
    return `<ol class="step-list">${items}</ol>`;
  }

  /* ── renderCheckList ─────────────────────────────────────────────────────── */
  function renderCheckList(items = []) {
    const rows = items.map(item => `
      <li class="check-item">
        <div class="check-dot">${icon('check')}</div>
        <span>${item}</span>
      </li>`).join('');
    return `<ul class="check-list">${rows}</ul>`;
  }

  /* ── renderCallout ───────────────────────────────────────────────────────── */
  function renderCallout(text, variant = 'gold', iconName = 'shield') {
    return `
      <div class="callout callout-${variant}">
        <div class="callout-icon">${icon(iconName)}</div>
        <div>${text}</div>
      </div>`;
  }

  /* ── renderFeatureRow ────────────────────────────────────────────────────── */
  function renderFeatureRow({ iconName = 'compass', title = '', desc = '' } = {}) {
    return `
      <div class="feature-row">
        <div class="feature-row-icon">${icon(iconName)}</div>
        <div class="feature-row-text">
          <div class="feature-row-title">${title}</div>
          <div class="feature-row-desc">${desc}</div>
        </div>
      </div>`;
  }

  /* ── renderTrustStrip ────────────────────────────────────────────────────── */
  function renderTrustStrip(items = []) {
    const parts = items.map((item, i) => {
      const divider = i < items.length - 1 ? `<div class="trust-divider"></div>` : '';
      return `
        <div class="trust-item">
          ${icon(item.icon || 'check')}
          <span><strong>${item.value}</strong> ${item.label}</span>
        </div>
        ${divider}`;
    }).join('');
    return `
      <div class="trust-strip">
        <div class="trust-strip-inner">${parts}</div>
      </div>`;
  }

  /* ── renderPartnerCard ───────────────────────────────────────────────────── */
  function renderPartnerCard({ iconName = 'building', name = '', desc = '' } = {}) {
    return `
      <div class="partner-card">
        <div class="partner-icon">${icon(iconName)}</div>
        <div class="partner-info">
          <div class="partner-name">${name}</div>
          <div class="partner-desc">${desc}</div>
        </div>
      </div>`;
  }

  /* ── renderInfoRow ───────────────────────────────────────────────────────── */
  function renderInfoRow({ iconName = 'check', label = '', value = '' } = {}) {
    return `
      <div class="info-row">
        <div class="info-icon">${icon(iconName)}</div>
        <div class="info-text">
          <div class="info-label">${label}</div>
          <div class="info-value">${value}</div>
        </div>
      </div>`;
  }

  /* ── renderA11yItem ──────────────────────────────────────────────────────── */
  function renderA11yItem({ title = '', desc = '' } = {}) {
    return `
      <div class="a11y-item">
        <div class="a11y-dot"></div>
        <div>
          <div class="a11y-title">${title}</div>
          <div class="a11y-desc">${desc}</div>
        </div>
      </div>`;
  }

  /* ── renderFooter ────────────────────────────────────────────────────────── */
  function renderFooter() {
    return `
      <div class="footer-inner">
        <div class="footer-top">
          <div class="footer-brand">
            <a class="brand" href="#home" data-route="home">
              <span class="brand-mark">VST</span>
              <span class="brand-name">Voyage Smart Travel</span>
            </a>
            <p class="footer-brand-desc">The trusted platform for solo travellers. Safety-first, accessibility-led, confidence-built.</p>
          </div>
          <div class="footer-col">
            <div class="footer-col-title">Platform</div>
            <ul class="footer-links">
              <li><a href="#features"      data-route="features">Features</a></li>
              <li><a href="#safety"        data-route="safety">Safety</a></li>
              <li><a href="#accessibility" data-route="accessibility">Accessibility</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <div class="footer-col-title">Company</div>
            <ul class="footer-links">
              <li><a href="#about"    data-route="about">About</a></li>
              <li><a href="#partners" data-route="partners">Partners</a></li>
              <li><a href="#contact"  data-route="contact">Contact</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <div class="footer-col-title">Connect</div>
            <ul class="footer-links">
              <li><a href="mailto:hello@voyagesmarttravel.com">Email Us</a></li>
              <li><a href="#contact" data-route="contact">Support</a></li>
              <li><a href="#partners" data-route="partners">Partner With Us</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p class="footer-legal">&copy; 2025 Voyage Smart Travel. All rights reserved.</p>
          <p class="footer-legal">
            <a href="#contact" data-route="contact">Privacy Policy</a>
            &nbsp;&middot;&nbsp;
            <a href="#contact" data-route="contact">Terms of Use</a>
          </p>
        </div>
      </div>`;
  }

  /* ── initComponents ──────────────────────────────────────────────────────── */
  function initComponents() {
    // Render footer
    const footerEl = document.getElementById('site-footer');
    if (footerEl) footerEl.innerHTML = renderFooter();

    // Hamburger toggle
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => {
        const isOpen = hamburger.classList.toggle('open');
        mobileMenu.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
        mobileMenu.setAttribute('aria-hidden', String(!isOpen));
      });
    }

    // Close mobile menu on link click
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (link && mobileMenu) {
        mobileMenu.classList.remove('open');
        hamburger && hamburger.classList.remove('open');
        hamburger && hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /* ── Public API ──────────────────────────────────────────────────────────── */
  return {
    icon,
    renderSectionHeader,
    renderHero,
    renderPageHero,
    renderCard,
    renderStatBlock,
    renderCTABanner,
    renderBadge,
    renderStepList,
    renderCheckList,
    renderCallout,
    renderFeatureRow,
    renderTrustStrip,
    renderPartnerCard,
    renderInfoRow,
    renderA11yItem,
    renderFooter,
    initComponents,
  };

})();
