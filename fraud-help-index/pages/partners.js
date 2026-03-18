/* Fraud Help Index — Partners Page */
window.renderPartners = function () {
  const C = window.FHIComponents;
  return `
    ${C.renderPageHero({
      eyebrow: 'Partners & Agencies',
      title:   'Who we work with<br>to <span>protect victims</span>',
      sub:     'Fraud Help Index partners with government agencies, consumer protection organisations, cybersecurity groups, and victim support services to keep the directory accurate, current, and comprehensive.',
    })}
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Organisation Types', title: 'Who is in the directory', centered: true })}
        <div class="partner-grid">
          ${C.renderPartnerCard({ iconName: 'building', name: 'Government Agencies',               desc: 'National fraud reporting authorities, financial regulators, law enforcement bodies, and government consumer protection organisations. Indexed by country and jurisdiction.' })}
          ${C.renderPartnerCard({ iconName: 'shield',   name: 'Consumer Protection Organisations', desc: 'Independent consumer advocates, trading standards bodies, and watchdog organisations that support fraud victims and pursue systemic action against fraud networks.' })}
          ${C.renderPartnerCard({ iconName: 'lock',     name: 'Cybersecurity Groups',              desc: 'Organisations that track cyber-enabled fraud, phishing infrastructure, and criminal networks. Including NCSC, IC3, and sector-specific cyber units.' })}
          ${C.renderPartnerCard({ iconName: 'users',    name: 'Victim Support Services',           desc: 'Charities, support lines, and professional services that help fraud victims with the emotional, financial, and practical recovery process beyond the initial report.' })}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({ eyebrow: 'For Organisations', title: 'List your service in the directory' })}
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">
              If your organisation provides fraud reporting, victim support, or consumer protection services, you can apply to be listed in the Fraud Help Index. Listing is free for verified, non-commercial public interest organisations.
            </p>
            ${C.renderCheckList([
              'Organisation must be a legitimate regulatory, law enforcement, consumer protection, or victim support body',
              'Commercial services — legal firms, insurance products, recovery companies — are not eligible for free listing',
              'Listings include: organisation name, contact details, reporting scope, jurisdiction, and accessibility information',
              'All listings are reviewed quarterly for accuracy and continued legitimacy',
              'Press and media organisations can request a press pack and agency data for editorial use',
            ])}
            <div class="mt-24">
              <a href="#contact" data-route="contact" class="btn btn-primary">Apply for Listing ${C.icon('arrow')}</a>
            </div>
          </div>
          <div class="two-col-visual">
            ${C.renderStatBlock([
              { value: '2,400+', label: 'Agencies currently listed' },
              { value: '190+',   label: 'Countries represented' },
              { value: 'Free',   label: 'For public interest organisations' },
              { value: 'Q/A',    label: 'Quarterly accuracy review' },
            ])}
            <div class="mt-24">
              ${C.renderCallout('<strong>Commercial services are not listed.</strong> We do not list fee-charging fraud recovery companies, legal firms, or financial products. The directory exists to connect victims with legitimate authorities — not commercial intermediaries.', 'gold', 'lock')}
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Key UK Agencies', title: 'Essential reporting contacts', sub: 'Most UK fraud victims should begin with one of these agencies. Full international directory available via the contact form.' })}
        ${[
          { iconName: 'shield',   label: 'Action Fraud',          value: '0300 123 2040 · actionfraud.police.uk · National fraud and cybercrime reporting centre. Report any fraud that has already occurred.' },
          { iconName: 'building', label: 'Financial Conduct Authority (FCA)', value: 'fca.org.uk/consumers/report-scam · For investment scams and unauthorised financial firms. Check the FCA Register before investing.' },
          { iconName: 'lock',     label: 'CIFAS',                  value: 'cifas.org.uk · Protective registration for identity fraud victims. Adds a flag to your credit file to prevent fraudulent applications.' },
          { iconName: 'globe',    label: 'NCSC Phishing Reporting', value: 'report@phishing.gov.uk · Forward suspicious emails to this address. Texts: 7726. NCSC also maintains the Suspicious Email Reporting Service.' },
          { iconName: 'users',    label: 'Citizens Advice',         value: '0808 223 1133 · citizensadvice.org.uk · Free advice on fraud, consumer rights, and recovery steps. Also reports to Trading Standards.' },
        ].map(r => C.renderInfoRow(r)).join('')}
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Cannot find the right agency?',
          sub:   'Describe your situation and we will identify the correct reporting route for your fraud type and jurisdiction.',
          primaryCTA:   { label: 'Get Help Finding the Right Agency', href: '#contact', route: 'contact' },
        })}
      </div>
    </section>`;
};
