/* ─────────────────────────────────────────────────────────────────────────────
   Voyage Smart Travel — Safety Page
   ───────────────────────────────────────────────────────────────────────────── */

window.renderSafety = function () {
  const C = window.VSTComponents;

  const verificationSteps = [
    {
      title: 'Application & documentation review',
      body:  'Partners submit detailed documentation including safety policies, incident history, accessibility provisions, staffing ratios, and emergency response procedures. Incomplete or inconsistent submissions are returned immediately.',
    },
    {
      title: 'Independent on-site assessment',
      body:  'A qualified safety assessor visits the property or operation in person. They verify physical safety features, test emergency systems, confirm accessibility provisions, and interview staff on protocols. Remote assessments are not accepted for accommodation partners.',
    },
    {
      title: 'Traveller intelligence cross-reference',
      body:  'We cross-reference assessment findings with intelligence from verified travellers who have visited the property. Discrepancies between assessed conditions and traveller reports trigger a mandatory re-assessment.',
    },
    {
      title: 'Ongoing monitoring & re-verification',
      body:  'Verification is not a one-time event. Partners are re-assessed annually, triggered by traveller reports, or immediately following any safety incident. Properties that fail re-verification are delisted within 24 hours.',
    },
  ];

  const emergencyFeatures = [
    { iconName: 'phone', label: '24/7 Live Emergency Line', value: 'Direct connection to a trained safety coordinator — not a script, not a bot. Available in 14 languages for destinations in our network.' },
    { iconName: 'zap',   label: 'In-App SOS Alert',         value: 'One-tap SOS sends your GPS coordinates, accommodation details, and emergency contact to our coordination team and your nominated emergency contact simultaneously.' },
    { iconName: 'map',   label: 'Safe Route Guidance',      value: 'Real-time routing to the nearest verified safe location — hospital, police station, embassy, or pre-verified accommodation — even without mobile data.' },
    { iconName: 'wifi',  label: 'Offline Emergency Data',   value: 'Emergency contacts, local emergency numbers, nearest medical facilities, and your accommodation details are stored offline before each trip.' },
  ];

  const networkStandards = [
    'All accommodation partners independently verified — not self-reported',
    'Safety assessments conducted by qualified third-party assessors',
    'Properties re-assessed annually as a minimum',
    'Any safety incident triggers immediate review and temporary suspension',
    'Solo traveller security provisions specifically assessed (door locks, lighting, location, check-in process)',
    'Female solo traveller and LGBTQ+ traveller safety provisions separately evaluated',
    'Staff emergency training verified on-site',
  ];

  return `
    ${C.renderPageHero({
      eyebrow: 'Safety',
      title:   'Your safety is<br><span>the product</span>',
      sub:     'Not a feature. Not a section of the app. The central purpose of every decision we make — from which partners we accept to how we build our alert systems.',
    })}

    <!-- How verification works -->
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow: 'Partner Verification',
          title:   'How we verify every<br><span>partner in our network</span>',
          sub:     'Our verification process is independent, rigorous, and ongoing. Partners cannot pay their way in. They earn their place — and keep it by maintaining standards.',
        })}
        ${C.renderStepList(verificationSteps)}
      </div>
    </section>

    <!-- Network standards -->
    <section class="section section-alt">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({
              eyebrow: 'Network Standards',
              title:   'What every partner<br>must meet',
            })}
            ${C.renderCheckList(networkStandards)}
          </div>
          <div class="two-col-visual">
            ${C.renderStatBlock([
              { value: '100%', label: 'Partners independently verified' },
              { value: '24h',  label: 'Max response on incident reports' },
              { value: '98%',  label: 'Incident-free journey rate' },
              { value: '14',   label: 'Languages covered by live support' },
            ])}
            <div class="mt-24">
              ${C.renderCallout(
                'Properties that fail re-verification are delisted within 24 hours. No exceptions. No grace periods for commercial partners.',
                'green',
                'shield'
              )}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Emergency support -->
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow:  'Emergency Support',
          title:    'When you need us, <span>we are there</span>',
          sub:      'Every feature in this section works without mobile data once downloaded. Because emergencies rarely happen with a strong signal.',
          centered: true,
        })}
        <div class="card-grid">
          ${emergencyFeatures.map(f => `
            <div class="card">
              <div class="card-icon">${C.icon(f.iconName)}</div>
              <h3 class="card-title">${f.label}</h3>
              <p class="card-body">${f.value}</p>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- Real-time alerts -->
    <section class="section section-alt">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-visual">
            ${C.renderCallout(
              '<strong>Real-time travel intelligence.</strong><br><br>We monitor civil unrest indicators, weather events, infrastructure disruptions, and local safety reports across all 62 countries in our network — continuously, not on a publication schedule.',
              'gold',
              'alert'
            )}
            <div class="mt-24">
              ${C.renderCallout(
                '<strong>Alert thresholds are set by our safety team, not by automated systems.</strong> A human reviews the alert before it reaches you.',
                'blue',
                'eye'
              )}
            </div>
          </div>
          <div class="two-col-text">
            ${C.renderSectionHeader({
              eyebrow: 'Live Travel Alerts',
              title:   'Ahead of the news,<br>not behind it',
            })}
            ${C.renderFeatureRow({ iconName: 'alert',  title: 'Destination-specific alerts',     desc: 'Alerts scoped to the exact region you are travelling in — not country-wide generic warnings that may not apply to your location.' })}
            ${C.renderFeatureRow({ iconName: 'zap',    title: 'Proactive push notifications',    desc: 'You are notified before conditions deteriorate, not after. We alert at early warning stage, giving you time to act.' })}
            ${C.renderFeatureRow({ iconName: 'map',    title: 'Alternative route suggestions',   desc: 'When an alert is issued, alternative verified routes and safe accommodations are surfaced immediately alongside the alert.' })}
            ${C.renderFeatureRow({ iconName: 'lock',   title: 'Personal travel monitoring',      desc: 'Optional travel monitoring lets you share your itinerary securely. Our team monitors your route against live conditions.' })}
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Travel knowing someone has your back',
          sub:   'Voyage Smart Travel safety features are available from the moment you start planning. Get started and see the network available to you.',
          primaryCTA:   { label: 'Get Started', href: '#contact',  route: 'contact' },
          secondaryCTA: { label: 'View Features', href: '#features', route: 'features' },
        })}
      </div>
    </section>`;
};
