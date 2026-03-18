/* Fraud Help Index — Home Page */
window.renderHome = function () {
  const C = window.FHIComponents;

  return `
    ${C.renderHero({
      eyebrow: 'Global Fraud Reporting Directory',
      title:   'Fraud happened.<br><span>Here is what to do next.</span>',
      sub:     'Fraud Help Index is the independent, free directory connecting victims with the right authority, support service, or reporting route — wherever you are in the world.',
      primaryCTA:   { label: 'Report Fraud Now',  href: '#contact',     route: 'contact' },
      secondaryCTA: { label: 'Browse Fraud Types', href: '#fraud-types', route: 'fraud-types' },
    })}

    ${C.renderTrustStrip([
      { icon: 'globe',  value: '190+',  label: 'countries covered' },
      { icon: 'search', value: '2,400+', label: 'agencies indexed' },
      { icon: 'users',  value: '1 in 8', label: 'adults affected by fraud annually' },
      { icon: 'shield', value: 'Free',   label: 'always — no registration required' },
    ])}

    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow:  'What We Do',
          title:    'Find the right reporting route<br>in <span>under 60 seconds</span>',
          sub:      'Fraud victims lose time and money searching for who to contact. We index every legitimate reporting authority, agency, and victim support service — filtered by country, fraud type, and your situation.',
          centered: true,
        })}
        <div class="card-grid">
          ${C.renderCard({ iconName: 'search',  title: 'Report Fraud',    body: 'Find the correct authority to report your specific fraud type — by country, by category, by urgency. No guessing. No wrong turns.' })}
          ${C.renderCard({ iconName: 'book',    title: 'Understand Your Options', body: 'Know what happens after you report. What to expect from the process, what evidence you need, and what support is available to you.' })}
          ${C.renderCard({ iconName: 'shield',  title: 'Protect Yourself', body: 'Prevention guides, scam alerts, and verification tools to help you identify fraud before it happens — and secure yourself after it does.' })}
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({
              eyebrow: 'Why It Matters',
              title:   'Most fraud goes<br><span>unreported</span>',
            })}
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">
              Globally, an estimated 45% of fraud incidents are never reported. The most common reason: victims do not know where to report, or assume nothing will be done. Both are addressable.
            </p>
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:24px;">
              Fraud Help Index removes the barrier. We maintain a continuously updated directory of reporting agencies, consumer protection bodies, financial regulators, and victim support organisations across 190+ countries.
            </p>
            ${C.renderCallout(
              '<strong>Every report matters.</strong> Even when individual recovery is unlikely, reports feed into national intelligence that targets fraud networks. The agency you report to may not recover your money — but your report may prevent someone else from losing theirs.',
              'gold', 'shield'
            )}
          </div>
          <div class="two-col-visual">
            ${C.renderStatBlock([
              { value: '£1.2B',  label: 'Lost to fraud in the UK in 2024' },
              { value: '3.8M',   label: 'Fraud reports filed globally per year' },
              { value: '45%',    label: 'Never reported — because victims did not know where to go' },
              { value: '72h',    label: 'Critical window to report financial fraud for best chance of recovery' },
            ])}
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow:  'Common Fraud Types',
          title:    'Where do you need help?',
          centered: true,
        })}
        <div class="card-grid" style="grid-template-columns: 1fr;">
          ${C.renderFraudTypeCard({ name: 'Authorised Push Payment (APP) Fraud', desc: 'You were tricked into sending money to a fraudster. Banks now have mandatory reimbursement obligations in the UK — but only if reported within 13 months.', action: 'Report to your bank immediately, then to Action Fraud →', risk: 'high' })}
          ${C.renderFraudTypeCard({ name: 'Investment Scams', desc: 'Fake investment platforms, crypto scams, and Ponzi schemes. Often advertised via social media. FCA maintains a warning list of unauthorised firms.', action: 'Report to the FCA and Action Fraud →', risk: 'high' })}
          ${C.renderFraudTypeCard({ name: 'Romance Fraud', desc: 'Relationships formed online to build trust before requesting money. Often run by organised criminal networks. Recovery is difficult but reporting is essential.', action: 'Report to Action Fraud — specialist support available →', risk: 'medium' })}
        </div>
        <div class="mt-24" style="text-align:center;">
          <a href="#fraud-types" data-route="fraud-types" class="btn btn-outline">View All Fraud Types ${C.icon('arrow')}</a>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Do not wait. Report now.',
          sub:   'The sooner fraud is reported, the better the chance of recovery and the greater the intelligence value for stopping the next victim.',
          primaryCTA:   { label: 'Report Fraud',       href: '#contact',     route: 'contact' },
          secondaryCTA: { label: 'Browse Fraud Types', href: '#fraud-types', route: 'fraud-types' },
        })}
      </div>
    </section>`;
};
