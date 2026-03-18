/* Fraud Help Index — About Page */
window.renderAbout = function () {
  const C = window.FHIComponents;
  return `
    ${C.renderPageHero({
      eyebrow: 'About Fraud Help Index',
      title:   'Independent. Free.<br><span>Built for victims.</span>',
      sub:     'No affiliation with banks, insurers, or government. No advertising. No registration. Just the right information, fast.',
    })}
    <section class="section">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({ eyebrow: 'Our Mission', title: 'The problem we are solving' })}
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">
              When fraud happens, every minute counts. The 72-hour window after a financial fraud incident is critical for recovery. But navigating reporting systems — which authority? which form? which bank department? — costs victims that time.
            </p>
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">
              Fraud Help Index exists to eliminate that friction. We maintain a structured, current, and cross-referenced directory of every legitimate reporting route, consumer protection agency, and victim support service across 190+ countries.
            </p>
            ${C.renderCallout('<strong>We are not a reporting authority.</strong> We do not investigate fraud. We direct victims to the correct body that does. Our value is in the quality and currency of that directory.', 'blue', 'compass')}
          </div>
          <div class="two-col-visual">
            ${C.renderStatBlock([
              { value: '2,400+', label: 'Agencies indexed' },
              { value: '190+',   label: 'Countries covered' },
              { value: '2022',   label: 'Year founded' },
              { value: 'Free',   label: 'Always. No ads. No registration.' },
            ])}
          </div>
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Our Values', title: 'What we stand for', centered: true })}
        <div class="card-grid">
          ${C.renderCard({ iconName: 'lock',    title: 'Independent',  body: 'No commercial relationships with reporting agencies, banks, or legal firms. We list an agency because it is legitimate — not because it pays to be listed.' })}
          ${C.renderCard({ iconName: 'users',   title: 'Victim-first', body: 'Every design decision is made from the perspective of someone who has just been defrauded. Clarity, speed, and emotional accessibility come before everything else.' })}
          ${C.renderCard({ iconName: 'eye',     title: 'Accurate',     body: 'Agency listings are reviewed quarterly. Contact details, jurisdictions, and reporting procedures are verified. We remove agencies that become inactive or inaccurate.' })}
          ${C.renderCard({ iconName: 'globe',   title: 'Global',       body: 'Fraud is not a local problem. Our index covers agencies across 190+ countries, with English-language guidance and local-language links where available.' })}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'If you have been defrauded, report it now',
          sub:   'Time is critical. Use the directory to find the right authority and report within the 72-hour window for the best chance of recovery.',
          primaryCTA:   { label: 'Find Reporting Route', href: '#contact',     route: 'contact' },
          secondaryCTA: { label: 'Browse Fraud Types',   href: '#fraud-types', route: 'fraud-types' },
        })}
      </div>
    </section>`;
};
