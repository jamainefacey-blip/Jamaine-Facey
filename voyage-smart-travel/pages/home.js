/* ─────────────────────────────────────────────────────────────────────────────
   VST — Homepage
   Universal Travel Operating System. Premium rebuild.
   ───────────────────────────────────────────────────────────────────────────── */

window.renderHome = function () {
  var C = window.VSTComponents;

  /* ── SVG icons (inline, homepage-specific) ────────────────────────────── */
  var icons = {
    plane:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>',
    train:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="16" rx="3"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="19" x2="12" y2="21"/><line x1="8" y1="11" x2="16" y2="11"/><circle cx="8.5" cy="15.5" r="1.5"/><circle cx="15.5" cy="15.5" r="1.5"/></svg>',
    hotel:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    ship:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v6"/><polyline points="12 3 12 9"/><line x1="8" y1="6" x2="16" y2="6"/></svg>',
    bus:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-4.3c.3-2.7.2-6.1.2-6.1A1.86 1.86 0 0 0 20.2 6H3.8A1.86 1.86 0 0 0 2 7.6s-.1 3.4.2 6.1C2.5 16.3 3 18 3 18h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
    sos:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    briefcase:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    backpack: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z"/><path d="M9 6V4a3 3 0 0 1 6 0v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>',
    family:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    diamond:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"/></svg>',
    pulse:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    bell:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    signal:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="6" x2="1" y2="18"/><line x1="6" y1="3" x2="6" y2="21"/><line x1="11" y1="8" x2="11" y2="16"/><line x1="16" y1="5" x2="16" y2="19"/><line x1="21" y1="10" x2="21" y2="14"/></svg>',
    support:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="14.83" y1="9.17" x2="18.36" y2="5.64"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>',
    eye:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    path:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="5" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="19" cy="19" r="3"/><path d="M5 8v3a4 4 0 0 0 4 4h2"/><line x1="19" y1="8" x2="19" y2="16"/></svg>',
  };

  function ico(name) {
    return icons[name] || C.icon('compass');
  }

  /* ── 1. HERO ──────────────────────────────────────────────────────────── */
  var hero = `
    <section class="hp-hero">
      <div class="hp-hero-grid" aria-hidden="true"></div>

      <div class="hp-hero-inner">

        <!-- OS badge -->
        <div class="hp-hero-badge">
          <span class="hp-hero-badge-dot"></span>
          Universal Travel Operating System
        </div>

        <!-- Headline -->
        <h1 class="hp-hero-h1">
          One platform.<br>
          <span class="hp-hero-accent">Every journey.</span>
        </h1>

        <p class="hp-hero-sub">
          Plan, book, and manage travel across flights, trains, hotels, cruises, and local transport
          — built for every traveller, with safety and accessibility at its core.
        </p>

        <!-- CTAs -->
        <div class="hp-hero-actions">
          <a href="#trip-request" data-route="trip-request" class="hp-btn-primary">
            Start planning
            <span class="hp-btn-arrow">${ico('plane')}</span>
          </a>
          <a href="#features" data-route="features" class="hp-btn-ghost">
            How it works
          </a>
        </div>

        <!-- Safety signal -->
        <div class="hp-hero-safety">
          <span class="hp-sos-pulse" aria-hidden="true"></span>
          ${ico('sos')}
          <span>Built-in safety &amp; SOS support &mdash; active on every journey</span>
        </div>

      </div>

      <!-- Visual element: transport orbit -->
      <div class="hp-hero-visual" aria-hidden="true">
        <div class="hp-orbit">
          <div class="hp-orbit-ring hp-orbit-ring--1"></div>
          <div class="hp-orbit-ring hp-orbit-ring--2"></div>
          <div class="hp-orbit-center">${ico('path')}</div>
          <div class="hp-orbit-node hp-orbit-node--1">${ico('plane')}</div>
          <div class="hp-orbit-node hp-orbit-node--2">${ico('train')}</div>
          <div class="hp-orbit-node hp-orbit-node--3">${ico('hotel')}</div>
          <div class="hp-orbit-node hp-orbit-node--4">${ico('ship')}</div>
        </div>
      </div>

    </section>`;

  /* ── 2. TRIP PLANNER (Interaction Layer) ─────────────────────────────── */
  var planner = `
    <div class="hp-planner-wrap">
      <div class="hp-planner">

        <!-- Tabs -->
        <div class="hp-planner-tabs" id="hp-planner-tabs">
          <button class="hp-planner-tab active" data-tab="flights">
            <span class="hp-planner-tab-icon">${ico('plane')}</span>
            Flights
          </button>
          <button class="hp-planner-tab" data-tab="trains">
            <span class="hp-planner-tab-icon">${ico('train')}</span>
            Trains
          </button>
          <button class="hp-planner-tab" data-tab="hotels">
            <span class="hp-planner-tab-icon">${ico('hotel')}</span>
            Hotels
          </button>
          <button class="hp-planner-tab" data-tab="cruises">
            <span class="hp-planner-tab-icon">${ico('ship')}</span>
            Cruises
          </button>
        </div>

        <!-- Fields row -->
        <div class="hp-planner-form" id="hp-planner-form">
          <div class="hp-planner-field">
            <label class="hp-planner-label" for="hp-plan-from">From</label>
            <input class="hp-planner-input" type="text" id="hp-plan-from" placeholder="City or airport" autocomplete="off" />
          </div>
          <div class="hp-planner-field">
            <label class="hp-planner-label" for="hp-plan-to">To</label>
            <input class="hp-planner-input" type="text" id="hp-plan-to" placeholder="Destination" autocomplete="off" />
          </div>
          <div class="hp-planner-field hp-planner-field--date">
            <label class="hp-planner-label" for="hp-plan-depart">Depart</label>
            <input class="hp-planner-input" type="date" id="hp-plan-depart" />
          </div>
          <div class="hp-planner-field hp-planner-field--date" id="hp-plan-return-field">
            <label class="hp-planner-label" for="hp-plan-return">Return</label>
            <input class="hp-planner-input" type="date" id="hp-plan-return" />
          </div>
          <div class="hp-planner-field hp-planner-field--pax">
            <label class="hp-planner-label" for="hp-plan-pax">Travellers</label>
            <input class="hp-planner-input" type="number" id="hp-plan-pax" value="1" min="1" max="50" />
          </div>
          <button class="hp-planner-submit" id="hp-planner-submit">
            Plan my trip
          </button>
        </div>

        <!-- Extras row: one-way toggle + traveller type -->
        <div class="hp-planner-extras">
          <label class="hp-planner-oneway">
            <input type="checkbox" id="hp-plan-oneway" />
            <span class="hp-planner-oneway-track" aria-hidden="true"></span>
            One-way trip
          </label>
          <div class="hp-planner-extras-sep" aria-hidden="true"></div>
          <label class="hp-planner-label hp-planner-extras-label" for="hp-plan-traveller-type">I&rsquo;m travelling as</label>
          <select class="hp-planner-input hp-planner-extras-select" id="hp-plan-traveller-type">
            <option value="">Any traveller type</option>
            <option value="solo">Solo</option>
            <option value="family">Family</option>
            <option value="business">Business</option>
            <option value="disabled">Accessibility needs</option>
            <option value="luxury">Luxury / VIP</option>
            <option value="backpacker">Backpacker</option>
          </select>
        </div>

      </div>
    </div>`;

  /* ── 3. BUILT FOR HOW YOU TRAVEL ─────────────────────────────────────── */
  var travelTypes = [
    { icon: 'briefcase', title: 'Business travel',       desc: 'Policy-aware booking, duty-of-care tracking, and expense-ready itineraries.' },
    { icon: 'eye',       title: 'Solo travellers',       desc: 'Safety tools, verified stays, and real-time support for those travelling alone.' },
    { icon: 'family',   title: 'Families',              desc: 'Multi-traveller booking, child-friendly filters, and shared itinerary management.' },
    { icon: 'backpack', title: 'Backpacking',            desc: 'Budget filters, hostel search, flexible dates, and overland route planning.' },
    { icon: 'accessibility', title: 'Accessibility-first', desc: 'Adaptive interface, verified accessibility, and inclusive planning from the start.' },
    { icon: 'diamond',  title: 'Luxury & VIP',          desc: 'Premium inventory, concierge-level curation, and priority service on demand.' },
  ];

  var typeCards = travelTypes.map(function (t) {
    return `
      <div class="hp-type-card">
        <div class="hp-type-icon">${ico(t.icon)}</div>
        <h3 class="hp-type-title">${t.title}</h3>
        <p class="hp-type-desc">${t.desc}</p>
      </div>`;
  }).join('');

  var travelTypesSection = `
    <section class="section hp-types-section">
      <div class="section-inner">
        <div class="hp-section-label">Built for every traveller</div>
        <h2 class="hp-section-h2">
          Built for how <span>you</span> travel
        </h2>
        <p class="hp-section-sub">
          One system. Six travel realities. No compromises.
        </p>
        <div class="hp-types-grid">
          ${typeCards}
        </div>
      </div>
    </section>`;

  /* ── 4. SAFETY / SOS ─────────────────────────────────────────────────── */
  var safetyFeatures = [
    { icon: 'sos',     title: 'One-tap SOS',           desc: 'Trigger an emergency alert from anywhere. Your location, contacts, and itinerary are shared instantly.' },
    { icon: 'signal',  title: 'Real-time monitoring',  desc: 'Destination risk levels, civil unrest alerts, and weather events — tracked before and during your journey.' },
    { icon: 'bell',    title: 'Proactive travel alerts',desc: 'Receive advisories before they escalate. Know what is happening at your destination before you arrive.' },
    { icon: 'support', title: '24/7 assistance',       desc: 'Live human support on every tier. Not a chatbot. A real response when it matters most.' },
  ];

  var safetyCards = safetyFeatures.map(function (f) {
    return `
      <div class="hp-safety-card">
        <div class="hp-safety-icon">${ico(f.icon)}</div>
        <h4 class="hp-safety-title">${f.title}</h4>
        <p class="hp-safety-desc">${f.desc}</p>
      </div>`;
  }).join('');

  var safetySection = `
    <section class="hp-safety-section">
      <div class="section-inner">
        <div class="hp-safety-layout">

          <div class="hp-safety-left">
            <div class="hp-sos-badge">
              <span class="hp-sos-pulse-lg" aria-hidden="true"></span>
              ${ico('sos')}
              <span>Safety core — always on</span>
            </div>
            <h2 class="hp-safety-h2">
              Travel smarter.<br>Travel <span>safer.</span>
            </h2>
            <p class="hp-safety-sub">
              Safety is not an add-on. It is the operating layer underneath every booking,
              every route, and every destination on VST. When something goes wrong,
              you are never alone.
            </p>
            <a href="#safety" data-route="safety" class="hp-btn-primary hp-btn-primary--sm">
              Explore safety features ${C.icon('arrow')}
            </a>
          </div>

          <div class="hp-safety-right">
            <div class="hp-safety-grid">
              ${safetyCards}
            </div>
          </div>

        </div>
      </div>
    </section>`;

  /* ── 5. ACCESSIBILITY LAYER ──────────────────────────────────────────── */
  var a11yItems = [
    { title: 'Adaptive interface',    desc: 'Screen reader support, high-contrast modes, adjustable text, and keyboard-first navigation across the full platform.' },
    { title: 'Verified accessibility', desc: 'Every partner accommodation and transport provider is independently assessed — not self-declared — against accessibility standards.' },
    { title: 'Inclusive planning',    desc: 'Filter all search results by your specific needs: wheelchair access, hearing support, visual assistance, dietary requirements.' },
    { title: 'Assistive guidance',   desc: 'Step-by-step navigation guides, audio descriptions, and simplified booking flows — built for the traveller, not the platform.' },
  ];

  var a11yCards = a11yItems.map(function (item) {
    return `
      <div class="hp-a11y-item">
        <div class="hp-a11y-dot"></div>
        <div>
          <div class="hp-a11y-title">${item.title}</div>
          <div class="hp-a11y-desc">${item.desc}</div>
        </div>
      </div>`;
  }).join('');

  var a11ySection = `
    <section class="section">
      <div class="section-inner">
        <div class="hp-a11y-layout">

          <div class="hp-a11y-left">
            <div class="hp-section-label">Accessibility-first architecture</div>
            <h2 class="hp-section-h2">
              Accessibility built in —<br><span>not added later.</span>
            </h2>
            <p class="hp-section-sub hp-a11y-sub">
              Most platforms treat accessibility as an afterthought. VST treats it as
              the architectural foundation. It shapes every product decision from day one.
            </p>
            <a href="#accessibility" data-route="accessibility" class="hp-btn-ghost hp-btn-ghost--accent">
              Full accessibility overview ${C.icon('arrow')}
            </a>
          </div>

          <div class="hp-a11y-right">
            <div class="hp-a11y-items">
              ${a11yCards}
            </div>
          </div>

        </div>
      </div>
    </section>`;

  /* ── 6. UNIVERSAL TRANSPORT LAYER ────────────────────────────────────── */
  var transports = [
    { icon: 'plane', label: 'Flights' },
    { icon: 'train', label: 'Trains' },
    { icon: 'hotel', label: 'Hotels' },
    { icon: 'ship',  label: 'Cruises' },
    { icon: 'bus',   label: 'Local transport' },
  ];

  var transportItems = transports.map(function (t) {
    return `
      <div class="hp-transport-item">
        <div class="hp-transport-icon">${ico(t.icon)}</div>
        <span class="hp-transport-label">${t.label}</span>
      </div>`;
  }).join(`<div class="hp-transport-divider" aria-hidden="true">&middot;</div>`);

  var transportSection = `
    <div class="hp-transport-section">
      <div class="section-inner">
        <p class="hp-transport-eyebrow">One ecosystem. Every mode of travel.</p>
        <div class="hp-transport-bar">
          ${transportItems}
        </div>
      </div>
    </div>`;

  /* ── 7. HOW IT WORKS ─────────────────────────────────────────────────── */
  var howSteps = [
    { n: '01', title: 'Plan',   desc: 'Search across all travel types in one place. Set dates, preferences, and accessibility requirements once.' },
    { n: '02', title: 'Book',   desc: 'Confirm with verified providers. Policy and safety checks run automatically before you pay.' },
    { n: '03', title: 'Manage', desc: 'Track your journey in real time. Receive alerts, trigger SOS if needed, and share your itinerary with trusted contacts.' },
  ];

  var howCards = howSteps.map(function (s) {
    return `
      <div class="hp-step">
        <div class="hp-step-num">${s.n}</div>
        <h3 class="hp-step-title">${s.title}</h3>
        <p class="hp-step-desc">${s.desc}</p>
      </div>`;
  }).join('');

  var howSection = `
    <section class="section section-alt">
      <div class="section-inner">
        <div class="hp-section-label hp-section-label--center">Three steps. Total control.</div>
        <h2 class="hp-section-h2 hp-section-h2--center">How it works</h2>
        <div class="hp-steps">
          ${howCards}
        </div>
      </div>
    </section>`;

  /* ── 8. TRUST / STATS ────────────────────────────────────────────────── */
  var trustStats = [
    { value: '10K+', label: 'Verified stays globally' },
    { value: '62',   label: 'Countries in network' },
    { value: '98%',  label: 'Incident-free journeys' },
    { value: '24/7', label: 'Live emergency support' },
  ];

  var trustItems = trustStats.map(function (s) {
    return `
      <div class="hp-trust-stat">
        <div class="hp-trust-value">${s.value}</div>
        <div class="hp-trust-label">${s.label}</div>
      </div>`;
  }).join('');

  var trustSection = `
    <div class="hp-trust-section">
      <div class="section-inner">
        <div class="hp-trust-bar">
          ${trustItems}
        </div>
      </div>
    </div>`;

  /* ── 9. FINAL CTA ────────────────────────────────────────────────────── */
  var finalCTA = `
    <section class="hp-final-cta">
      <div class="hp-final-cta-inner">
        <div class="hp-final-cta-badge">
          ${ico('path')}
          Your next journey starts here
        </div>
        <h2 class="hp-final-cta-h2">
          Start planning your next journey —<br>
          <span>safely, simply, in one place.</span>
        </h2>
        <div class="hp-final-cta-actions">
          <a href="#trip-request" data-route="trip-request" class="hp-btn-primary hp-btn-primary--lg">
            Start planning ${C.icon('arrow')}
          </a>
          <a href="#contact" data-route="contact" class="hp-btn-ghost hp-btn-ghost--light">
            Get in touch
          </a>
        </div>
      </div>
    </section>`;

  /* ── Assemble ─────────────────────────────────────────────────────────── */
  return `
    ${hero}
    ${planner}
    ${travelTypesSection}
    ${safetySection}
    ${a11ySection}
    ${transportSection}
    ${howSection}
    ${trustSection}
    ${finalCTA}`;
};
