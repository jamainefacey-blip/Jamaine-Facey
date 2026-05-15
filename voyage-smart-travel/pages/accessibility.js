/* ─────────────────────────────────────────────────────────────────────────────
   Voyage Smart Travel — Accessibility Page
   ───────────────────────────────────────────────────────────────────────────── */

window.renderAccessibility = function () {
  const C = window.VSTComponents;

  const accessibilityCategories = [
    {
      title: 'Mobility & Wheelchair Access',
      desc:  'Step-free access routes, lift dimensions, turning circle clearances, accessible bathroom specifications, and adapted bed heights — all assessed and documented by our team.',
    },
    {
      title: 'Visual Impairment Support',
      desc:  'Large-print information, Braille materials, high-contrast signage, guide dog welcome confirmation, and orientation support availability — verified for every applicable property.',
    },
    {
      title: 'Hearing & Deaf Traveller Provisions',
      desc:  'Visual fire alarms, hearing loop availability, vibrating alarm options, BSL / ASL communication support, and text-based emergency alternatives documented per property.',
    },
    {
      title: 'Cognitive & Neurodiverse Travel Needs',
      desc:  'Quiet room availability, sensory-friendly environments, clear signage, staff awareness training, and predictable routines — increasingly important and consistently underserved.',
    },
    {
      title: 'Chronic Condition & Medical Needs',
      desc:  'Proximity to medical facilities, refrigeration for medication, accessibility of pharmacies, dialysis centre locations, and allergy-aware catering — mapped per destination.',
    },
    {
      title: 'Mental Health & Anxiety Support',
      desc:  'Solo travel with anxiety or mental health conditions carries specific needs. We document quiet hours, private spaces, check-in flexibility, and partner staff awareness training.',
    },
  ];

  const platformA11yFeatures = [
    { iconName: 'accessibility', title: 'Granular accessibility filters', desc: 'Over 40 specific accessibility criteria. Filter by what you actually need — not a single checkbox labelled "accessible".' },
    { iconName: 'check',         title: 'Audited accessibility claims',   desc: 'We do not publish accessibility information that has not been verified. If we have not confirmed it, it does not appear.' },
    { iconName: 'map',           title: 'Accessible route mapping',       desc: 'Routes mapped for wheelchair and mobility aid use, with step counts, gradient information, and surface types documented.' },
    { iconName: 'users',         title: 'Disability travel guides',       desc: 'Destination guides written with disabled travellers — covering every aspect of arrival, navigation, accommodation, and departure.' },
    { iconName: 'phone',         title: 'Accessible emergency support',   desc: 'Emergency support available via voice, text, and BSL/ASL video relay. We do not restrict emergency access to a single communication channel.' },
    { iconName: 'star',          title: 'Disabled traveller intelligence', desc: 'Accessibility reports from verified disabled travellers feed directly into our assessment data — current, relevant, and experience-based.' },
  ];

  const commitments = [
    'We only publish accessibility information we have independently verified',
    'Our accessibility assessments are conducted using the same rigour as safety assessments',
    'Disabled travellers are involved in the design of our assessment criteria',
    'We do not accept "accessible room available on request" as a meaningful accessibility provision',
    'Properties that cannot evidence their accessibility claims are not listed',
    'We review accessibility claims when conditions change — renovation, ownership change, or traveller report',
    'Our platform interface meets WCAG 2.1 AA standards',
  ];

  return `
    ${C.renderPageHero({
      eyebrow: 'Accessibility',
      title:   'Travel without<br><span>barriers</span>',
      sub:     'Accessibility is not a filter we added later. It is built into how we vet every partner, write every guide, and develop every feature on this platform.',
    })}

    <!-- Why accessibility matters here -->
    <section class="section">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({
              eyebrow: 'Why This Matters',
              title:   'The gap in accessible<br>solo travel',
            })}
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">
              One in five adults has a disability. The proportion of solo travellers with disabilities, chronic conditions, or complex access needs is significant and growing. The platforms designed to help them book travel still largely treat accessibility as an optional filter with unverified data.
            </p>
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">
              Arriving at an "accessible" property to find the lift is broken, the accessible bathroom is across the building, or the staff have no awareness training is not just inconvenient — for many travellers, it ends the trip.
            </p>
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:24px;">
              We take a different position: accessibility information we publish is information we have verified. If we have not confirmed it, it does not appear on the listing.
            </p>
            ${C.renderCallout(
              '<strong>Our standard:</strong> If a property claims to be accessible, we verify every specific claim before it appears in our accessibility filters.',
              'gold',
              'accessibility'
            )}
          </div>
          <div class="two-col-visual">
            ${C.renderStatBlock([
              { value: '40+',  label: 'Accessibility criteria assessed' },
              { value: '100%', label: 'Claims independently verified' },
              { value: '6',    label: 'Disability categories covered' },
              { value: '62',   label: 'Countries with accessible listings' },
            ])}
          </div>
        </div>
      </div>
    </section>

    <!-- Accessibility categories -->
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow:  'Accessibility Coverage',
          title:    'Categories we assess and filter',
          sub:      'Each category has specific, documented criteria that partners must meet to appear in that filter.',
          centered: true,
        })}
        <div class="a11y-grid">
          ${accessibilityCategories.map(a => C.renderA11yItem(a)).join('')}
        </div>
      </div>
    </section>

    <!-- Platform accessibility features -->
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow:  'Platform Features',
          title:    'Tools designed for<br><span>accessible travel</span>',
          centered: true,
        })}
        <div class="card-grid">
          ${platformA11yFeatures.map(f => C.renderCard(f)).join('')}
        </div>
      </div>
    </section>

    <!-- Our commitments -->
    <section class="section section-alt">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({
              eyebrow: 'Our Commitments',
              title:   'Standards we hold ourselves to',
            })}
            ${C.renderCheckList(commitments)}
          </div>
          <div class="two-col-visual">
            ${C.renderCallout(
              '<strong>Working with disability travel organisations.</strong><br><br>Our accessibility criteria are developed in collaboration with disability travel advocates and organisations. We review and update criteria annually based on community feedback and evolving standards.',
              'blue',
              'users'
            )}
            <div class="mt-24">
              <a href="#partners" data-route="partners" class="btn btn-outline w-full">Accessibility Partner Opportunities ${C.icon('arrow')}</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Find your next trip',
          sub:   'Set your accessibility requirements and see verified options across 62 countries. No guesswork. No surprises on arrival.',
          primaryCTA:   { label: 'Get Started', href: '#contact',  route: 'contact' },
          secondaryCTA: { label: 'View All Features', href: '#features', route: 'features' },
        })}
      </div>
    </section>`;
};
