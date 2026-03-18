/* Fraud Help Index — Prevention Page */
window.renderPrevention = function () {
  const C = window.FHIComponents;

  const steps = [
    { title: 'Verify before you transfer', body: 'Never send money to someone who contacted you first. If your bank calls about fraud, hang up and call the number on the back of your card. Legitimate banks will never ask you to move money to a "safe account".' },
    { title: 'Use the FCA Register for investments', body: 'Before investing with any firm, check the FCA Register at register.fca.org.uk. If they are not on the register — or they are on the FCA warning list — do not proceed.' },
    { title: 'Enable multi-factor authentication', body: 'Enable 2FA on all financial accounts, email, and social media. If a fraudster has your password but cannot get past 2FA, they cannot access your account.' },
    { title: 'Slow down on urgency', body: 'Urgency is the fraudster\'s primary tool. "Act now or lose your account." "Limited time." "Police are on their way." Any communication that creates artificial urgency should be treated as a red flag immediately.' },
    { title: 'Check before you click', body: 'Hover over links before clicking. Check the full URL — not just the visible text. Phishing URLs often include misspellings (arnazon.com, hm-revenue.com) designed to look legitimate at a glance.' },
    { title: 'Use protective registration', body: 'If your identity has been compromised or you are at high risk, register with CIFAS for protective registration. This adds a flag to your credit file that triggers additional checks before credit is issued in your name.' },
  ];

  const redFlags = [
    'You are asked to send money urgently to a "safe account"',
    'An unsolicited caller knows your name and basic account details',
    'You are offered an investment with guaranteed returns or unusually high yields',
    'A social media contact you have never met in person asks for money',
    'A delivery company asks for payment before releasing a parcel',
    'You receive an email with a link to "verify" your account or "confirm" a transaction',
    'A caller claims to be police or HMRC and asks you not to tell your bank',
    'A new online partner asks you to invest in cryptocurrency on their behalf',
  ];

  return `
    ${C.renderPageHero({
      eyebrow: 'Fraud Prevention',
      title:   'Recognise it.<br><span>Refuse it. Report it.</span>',
      sub:     'Prevention is simpler than recovery. These are the behaviours that stop fraud before it happens — and the red flags that signal it is already underway.',
    })}
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Six Prevention Principles', title: 'What to do <span>before</span> fraud happens' })}
        ${C.renderStepList(steps)}
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({ eyebrow: 'Red Flags', title: 'Stop. These are warning signs.' })}
            ${C.renderCheckList(redFlags)}
          </div>
          <div class="two-col-visual">
            ${C.renderCallout('<strong>The 72-hour rule.</strong><br><br>If fraud has already happened, every hour counts. Report within 72 hours for the best chance of recovery. Do not wait to gather "more evidence" — report what you know now and add more later.', 'gold', 'clock')}
            <div class="mt-24">
              ${C.renderCallout('If you feel you are being pressured or confused by a caller right now — hang up. It is always safe to end the call. You can call back on a number you trust.', 'green', 'phone')}
            </div>
            <div class="mt-24">
              <a href="#contact" data-route="contact" class="btn btn-primary w-full">Report Fraud Now ${C.icon('arrow')}</a>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'After Fraud Happens', title: 'Immediate steps to take', centered: true })}
        ${C.renderStepList([
          { title: 'Contact your bank immediately', body: 'Call the number on the back of your card — not any number provided in a suspicious message. Ask them to freeze the account and initiate a recall if funds were transferred.' },
          { title: 'Report to your national fraud authority', body: 'In the UK: Action Fraud (0300 123 2040). In the US: FTC at reportfraud.ftc.gov. In Australia: Scamwatch. See the full directory for other countries.' },
          { title: 'Secure your accounts', body: 'Change passwords, enable 2FA, and check for any accounts or credit applications you do not recognise. Check your credit file via Experian, Equifax, or TransUnion.' },
          { title: 'Seek victim support', body: 'Fraud causes significant emotional harm. Victim Support (UK), Citizens Advice, and the National Debtline can all help with the recovery process beyond the financial loss.' },
        ])}
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Already been defrauded?',
          sub:   'Use the directory to find the right reporting route for your situation. Time matters — act now.',
          primaryCTA:   { label: 'Report Fraud',      href: '#contact',     route: 'contact' },
          secondaryCTA: { label: 'Browse Fraud Types', href: '#fraud-types', route: 'fraud-types' },
        })}
      </div>
    </section>`;
};
