/* ─────────────────────────────────────────────────────────────────────────────
   Voyage Smart Travel — Home Page
   ───────────────────────────────────────────────────────────────────────────── */

window.renderHome = function () {
  const C = window.VSTComponents;

  /* Hero */
  const hero = C.renderHero({
    eyebrow: 'The Solo Travel Platform',
    title: 'Travel with confidence.<br><span>Every journey. Everywhere.</span>',
    sub: 'Voyage Smart Travel gives solo travellers the tools, verified network, and real-time support to explore the world safely — including travellers with accessibility needs.',
    primaryCTA:   { label: 'Get Started', href: '#contact',  route: 'contact' },
    secondaryCTA: { label: 'See Features', href: '#features', route: 'features' },
  });

  /* Trust strip */
  const trust = C.renderTrustStrip([
    { icon: 'shield', value: '10,000+', label: 'verified stays' },
    { icon: 'globe',  value: '62',      label: 'countries covered' },
    { icon: 'star',   value: '4.9★',    label: 'average safety rating' },
    { icon: 'clock',  value: '24/7',    label: 'emergency support' },
  ]);

  /* Core features */
  const featCards = [
    C.renderCard({ iconName: 'shield',  title: 'Safety-First Network',  body: 'Every accommodation in our network is independently verified for safety standards, solo-traveller suitability, and accessibility compliance.' }),
    C.renderCard({ iconName: 'map',     title: 'Offline Maps & Alerts', body: 'Download destination guides before you leave. Receive real-time travel alerts, local advisories, and route changes directly to your device — no signal required.' }),
    C.renderCard({ iconName: 'accessibility', title: 'Accessibility Built In', body: 'Filter stays, tours, and transport by your specific accessibility needs. We partner only with providers who meet verifiable accessibility standards.' }),
  ];

  /* Safety callout */
  const safetyCallout = C.renderCallout(
    '<strong>Your safety is a product feature, not a footnote.</strong> Every decision we make — from partner onboarding to real-time alert thresholds — is driven by the safety of the person travelling alone.',
    'gold',
    'shield'
  );

  /* Stats */
  const stats = C.renderStatBlock([
    { value: '10K+', label: 'Verified stays globally' },
    { value: '62',   label: 'Countries in our network' },
    { value: '98%',  label: 'Incident-free journeys' },
    { value: '24/7', label: 'Live emergency support' },
  ]);

  /* Accessibility feature rows */
  const a11yFeatures = [
    C.renderFeatureRow({ iconName: 'accessibility', title: 'Accessibility filters', desc: 'Wheelchair access, hearing loops, visual impairment support, and more — filter by what matters to you.' }),
    C.renderFeatureRow({ iconName: 'check',         title: 'Verified accessibility claims', desc: 'We do not rely on self-reporting. Partner properties are independently assessed against declared accessibility features.' }),
    C.renderFeatureRow({ iconName: 'users',         title: 'Disability travel guides', desc: 'Destination-specific guides written with input from disabled travellers — covering transport, accommodation, and local navigation.' }),
  ];

  /* CTA Banner */
  const cta = C.renderCTABanner({
    title: 'Ready to travel smarter?',
    sub:   'Join the growing community of solo travellers using Voyage Smart Travel to explore with real confidence.',
    primaryCTA:   { label: 'Get Started Free', href: '#contact',  route: 'contact' },
    secondaryCTA: { label: 'Learn About Safety', href: '#safety', route: 'safety' },
  });

  return `
    ${hero}

    ${trust}

    <!-- Core features section -->
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow:  'Why Voyage Smart Travel',
          title:    'Built for the traveller who goes <span>alone</span>',
          sub:      'We fill the gap that mainstream travel platforms ignore — the specific needs of solo travellers, particularly those travelling with disabilities or in unfamiliar regions.',
          centered: true,
        })}
        <div class="card-grid">
          ${featCards.join('')}
        </div>
      </div>
    </section>

    <!-- Safety positioning section -->
    <section class="section section-alt">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({
              eyebrow: 'Safety-Led Design',
              title:   'Your safety is the <span>product</span>',
              sub:     'We do not bolt safety on after the fact. Every feature, every partner, every alert threshold is designed around one question: does this keep solo travellers safer?',
            })}
            ${safetyCallout}
            <div class="mt-32">
              <a href="#safety" data-route="safety" class="btn btn-primary">Explore Safety Features ${C.icon('arrow')}</a>
            </div>
          </div>
          <div class="two-col-visual">
            ${stats}
          </div>
        </div>
      </div>
    </section>

    <!-- Accessibility section -->
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow: 'Accessibility-First',
          title:   'Travel without <span>barriers</span>',
          sub:     'Accessibility is not a filter option we added later. It is built into how we vet every partner, write every guide, and develop every feature.',
        })}
        <div>
          ${a11yFeatures.join('')}
        </div>
        <div class="mt-32">
          <a href="#accessibility" data-route="accessibility" class="btn btn-outline">Full Accessibility Overview ${C.icon('arrow')}</a>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section section-alt">
      <div class="section-inner">
        ${cta}
      </div>
    </section>`;
};
