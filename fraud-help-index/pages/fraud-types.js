/* Fraud Help Index — Fraud Types Page */
window.renderFraudTypes = function () {
  const C = window.FHIComponents;

  const types = [
    { name: 'Authorised Push Payment (APP) Fraud', desc: 'You were tricked into authorising a bank transfer to a fraudster posing as a trusted entity — a bank, solicitor, supplier, or HMRC. Mandatory bank reimbursement applies in the UK for losses reported within 13 months.', action: 'Report to your bank immediately, then Action Fraud (UK) or your national financial fraud authority.', risk: 'high' },
    { name: 'Investment Fraud', desc: 'Fake trading platforms, cryptocurrency scams, unregulated investment schemes, and clone firms impersonating legitimate financial institutions. FCA maintains a live warning list.', action: 'Report to the FCA (UK), SEC (US), ASIC (AU), or your national financial regulator.', risk: 'high' },
    { name: 'Romance Fraud', desc: 'Fraudsters form online relationships to build emotional trust before requesting money transfers, gift cards, or cryptocurrency. Often linked to organised criminal networks overseas.', action: 'Report to Action Fraud. Specialist support from Victim Support and the National Crime Agency.', risk: 'high' },
    { name: 'Identity Theft', desc: 'Your personal information — name, date of birth, address, financial details — has been used without consent to open accounts, take out credit, or commit fraud in your name.', action: 'Report to Action Fraud, your bank, credit reference agencies (Experian, Equifax, TransUnion), and CIFAS for protective registration.', risk: 'high' },
    { name: 'Phishing & Smishing', desc: 'Fraudulent emails (phishing) or text messages (smishing) impersonating banks, delivery companies, HMRC, or government bodies to steal credentials or payment details.', action: 'Forward phishing emails to report@phishing.gov.uk (UK). Report smishing to 7726. Report to Action Fraud if money was lost.', risk: 'medium' },
    { name: 'Purchase Fraud', desc: 'You paid for goods or services online that were never delivered, did not exist, or did not match the listing. Common on social media marketplaces and auction sites.', action: 'Report to Action Fraud. Contact your bank for a chargeback if paid by card. Report the listing to the platform.', risk: 'medium' },
    { name: 'Impersonation Fraud', desc: 'Fraudsters impersonating police, HMRC, banks, or utilities demand urgent payment or personal information. Legitimate organisations will never do this.', action: 'Hang up and call the organisation back on a number from their official website. Report to Action Fraud.', risk: 'medium' },
    { name: 'Courier Fraud', desc: 'Follows impersonation fraud — a courier arrives to collect your bank card or cash after a fraudster poses as your bank or police. A common target for older adults.', action: 'Report to Action Fraud and your local police. Your bank will also want to be notified immediately.', risk: 'medium' },
    { name: 'Cryptocurrency Fraud', desc: 'Fake exchanges, rug pulls, NFT scams, and pig butchering schemes. Cryptocurrency fraud is growing rapidly and recovery of funds is extremely difficult.', action: 'Report to Action Fraud (UK), FBI IC3 (US), or your national authority. Also report to the crypto platform if still accessible.', risk: 'high' },
    { name: 'Mandate Fraud', desc: 'A fraudster intercepts or impersonates a supplier, solicitor, or employer to redirect a legitimate payment to their account. Often targets businesses and property transactions.', action: 'Report to Action Fraud. Contact your bank immediately to attempt to recall the payment. Report to police if significant losses.', risk: 'medium' },
    { name: 'Council Tax or Benefits Fraud', desc: 'Someone has fraudulently claimed benefits, council tax reductions, or government payments using your identity or a false identity.', action: 'Report to the DWP (dwp.gov.uk), your local council, or the National Benefit Fraud Hotline: 0800 854 440.', risk: 'low' },
    { name: 'Doorstep Fraud', desc: 'Unsolicited callers offer services — roofing, driveways, gardening — take payment for work not done or grossly overpriced. Often targets elderly or vulnerable adults.', action: 'Report to Action Fraud and your local police. Trading Standards can also investigate: 0808 223 1133.', risk: 'low' },
  ];

  return `
    ${C.renderPageHero({
      eyebrow: 'Fraud Types',
      title:   'Identify your fraud.<br><span>Find the right route.</span>',
      sub:     'Every fraud type has a specific reporting authority and recovery pathway. Identify what happened to find the correct next step.',
    })}
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow: 'Global Fraud Index',
          title:   'Common fraud types and where to report them',
          sub:     'Listed by volume. Every entry includes who to report to and what to do first. UK-primary with global agency links.',
        })}
        ${C.renderCallout('If you are in immediate danger or believe a crime is in progress — call 999 (UK) or your national emergency number. Do not wait to use this directory.', 'red', 'alert')}
        <div style="margin-top: 24px; display: flex; flex-direction: column; gap: 12px;">
          ${types.map(t => C.renderFraudTypeCard(t)).join('')}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Not sure which type applies to you?',
          sub:   'Use the contact form to describe what happened. We will help you identify the correct fraud category and reporting route.',
          primaryCTA:   { label: 'Get Help',       href: '#contact',    route: 'contact' },
          secondaryCTA: { label: 'View Prevention', href: '#prevention', route: 'prevention' },
        })}
      </div>
    </section>`;
};
