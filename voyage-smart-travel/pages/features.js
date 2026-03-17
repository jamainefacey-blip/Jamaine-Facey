/* ─────────────────────────────────────────────────────────────────────────────
   Voyage Smart Travel — Features Page
   ───────────────────────────────────────────────────────────────────────────── */

window.renderFeatures = function () {
  const C = window.VSTComponents;

  const coreFeatures = [
    {
      iconName: 'shield',
      title: 'Verified Safety Network',
      body:  'Access only to independently verified stays, tours, and transport operators. Every listing carries a transparent safety score based on assessor findings — not self-reported data.',
    },
    {
      iconName: 'map',
      title: 'Offline Maps & Destination Packs',
      body:  'Download complete destination packs before you travel. Maps, emergency contacts, safe routes, medical facilities, and local advisories — accessible with no data connection.',
    },
    {
      iconName: 'zap',
      title: 'Real-Time Travel Alerts',
      body:  'Destination-specific alerts for civil unrest, weather events, infrastructure failures, and local safety changes. Reviewed by our safety team before reaching your device.',
    },
    {
      iconName: 'phone',
      title: '24/7 Live Emergency Support',
      body:  'One-tap access to a trained safety coordinator in 14 languages. For genuine emergencies and for moments when you just need to talk to a real person.',
    },
    {
      iconName: 'accessibility',
      title: 'Accessibility Filters & Guides',
      body:  'Filter the entire network by your accessibility requirements. Accommodation, transport, tours, and activities — all assessed against declared accessibility provisions.',
    },
    {
      iconName: 'lock',
      title: 'Personal Travel Monitoring',
      body:  'Securely share your itinerary with our monitoring team or nominated contacts. Automated check-in reminders and missed check-in escalation give you a safety net.',
    },
  ];

  const howItWorks = [
    {
      title: 'Tell us where you are going and what matters to you',
      body:  'Set your destination, travel dates, and accessibility or safety requirements. You see only partners that meet your criteria — no manual filtering through listings that do not apply.',
    },
    {
      title: 'Choose from independently verified options',
      body:  'Every accommodation, tour, and transport option you see has been assessed. Safety scores, accessibility details, and traveller intelligence are displayed upfront — not hidden in reviews.',
    },
    {
      title: 'Travel with real-time support active',
      body:  'Once your trip is active, live alerts, offline data, and emergency support are all running in the background. Your safety coordinator knows your itinerary if you need them.',
    },
  ];

  const platformDetails = [
    { iconName: 'globe',  title: 'Web & mobile access',           desc: 'Access the platform from any device. The mobile experience is optimised for offline use and emergency situations.' },
    { iconName: 'wifi',   title: 'Full offline capability',        desc: 'Core safety features — maps, emergency contacts, safe routes, and SOS — function without data connection once downloaded.' },
    { iconName: 'heart',  title: 'Emergency contact sharing',      desc: 'Designate trusted contacts who receive automated updates and emergency alerts if your monitoring check-in is missed.' },
    { iconName: 'star',   title: 'Traveller intelligence reports', desc: 'Contribute and access real conditions from verified travellers. Structured, moderated, and acted upon — not a forum.' },
  ];

  return `
    ${C.renderPageHero({
      eyebrow: 'Features',
      title:   'Every feature built for<br><span>the solo traveller</span>',
      sub:     'No dashboards. No points schemes. No features designed to increase booking volume. Every tool on this platform exists to make your journey safer and more confident.',
    })}

    <!-- Core features grid -->
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow:  'Core Features',
          title:    'What the platform gives you',
          centered: true,
        })}
        <div class="card-grid">
          ${coreFeatures.map(f => C.renderCard(f)).join('')}
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow: 'How It Works',
          title:   'From planning to<br><span>arriving home safely</span>',
          sub:     'Three stages. Every stage designed around what matters to a solo traveller.',
        })}
        ${C.renderStepList(howItWorks)}
      </div>
    </section>

    <!-- Offline & platform -->
    <section class="section">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({
              eyebrow: 'Platform Details',
              title:   'Built for real travel<br>conditions',
            })}
            ${platformDetails.map(d => C.renderFeatureRow(d)).join('')}
          </div>
          <div class="two-col-visual">
            ${C.renderCallout(
              '<strong>Offline-first design.</strong><br><br>We design every safety-critical feature to work without data. Connectivity is a bonus, not a dependency. If you are in a remote region with no signal, everything you need to stay safe is already on your device.',
              'gold',
              'wifi'
            )}
            <div class="mt-24">
              ${C.renderCallout(
                '<strong>No backend dependency for emergencies.</strong> SOS, maps, emergency contacts, and safe routes are stored locally. The app does not need to reach a server to help you when you are in trouble.',
                'green',
                'shield'
              )}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Feature comparison -->
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow:  'Why Choose Voyage Smart Travel',
          title:    'What we do that<br>others <span>do not</span>',
          centered: true,
        })}
        <div class="card-grid">
          <div class="card card-accent">
            <h3 class="card-title mb-16">What we do</h3>
            ${C.renderCheckList([
              'Independent safety verification of every partner',
              'Offline-capable emergency features',
              'Accessibility filtering with audited claims',
              'Live human emergency support',
              'Real-time alerts reviewed by safety team',
              'Traveller intelligence that feeds into assessments',
            ])}
          </div>
          <div class="card card-dark">
            <h3 class="card-title mb-16" style="color:var(--text-muted)">What mainstream platforms do</h3>
            ${C.renderCheckList([
              'Self-reported safety information from hosts',
              'No offline emergency capability',
              'Accessibility icons with no verification',
              'Automated support bots',
              'Travel advisories copied from government websites',
              'Star ratings with no safety weighting',
            ])}
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'See the network available to you',
          sub:   'Start with your destination and let us show you what verified solo travel looks like in practice.',
          primaryCTA:   { label: 'Get Started', href: '#contact', route: 'contact' },
          secondaryCTA: { label: 'View Safety Standards', href: '#safety', route: 'safety' },
        })}
      </div>
    </section>`;
};
