/* Fraud Help Index — Accessibility Page */
window.renderAccessibility = function () {
  const C = window.FHIComponents;
  return `
    ${C.renderPageHero({
      eyebrow: 'Accessibility',
      title:   'Reporting fraud should be<br><span>accessible to everyone</span>',
      sub:     'Fraud targets the vulnerable. Our directory and reporting tools are designed to work for every user, regardless of ability, device, or digital confidence.',
    })}
    <section class="section">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({ eyebrow: 'Design Standards', title: 'How we build for accessibility' })}
            <div class="a11y-grid">
              ${[
                { title: 'WCAG 2.1 AA compliance', desc: 'All pages meet or exceed WCAG 2.1 Level AA. Colour contrast, heading structure, and interactive element labelling are all verified.' },
                { title: 'Screen reader compatible', desc: 'Semantic HTML, ARIA labels, and logical focus order ensure the site is fully navigable by screen reader users.' },
                { title: 'Large, readable typography', desc: 'Base font size 16px. All body text at minimum 14px. Comfortable line height and spacing throughout.' },
                { title: 'Mobile-first, keyboard-navigable', desc: 'Fully operable by keyboard alone. All interactive elements have visible focus states.' },
                { title: 'No auto-playing content', desc: 'No animations, carousels, or media that play without user action. Motion-reduced mode respected.' },
                { title: 'Simple, clear language', desc: 'Plain English throughout. Reading level suitable for a broad audience. Legal and technical terms explained where unavoidable.' },
              ].map(a => C.renderA11yItem(a)).join('')}
            </div>
          </div>
          <div class="two-col-visual">
            ${C.renderCallout('<strong>Fraud disproportionately targets older adults, people with disabilities, and those in vulnerable circumstances.</strong><br><br>Our platform is designed with these users at the centre — not as an afterthought.', 'gold', 'accessibility')}
            <div class="mt-24">
              ${C.renderStatBlock([
                { value: 'AA',  label: 'WCAG 2.1 standard met' },
                { value: '14+', label: 'Languages for linked agencies' },
                { value: '100%', label: 'Keyboard navigable' },
                { value: 'Free', label: 'No registration, no barriers' },
              ])}
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Reporting Channels', title: 'Multiple ways to report fraud', sub: 'Not every victim can use a web form. We list every available reporting channel for each authority.', centered: true })}
        <div class="card-grid">
          ${C.renderCard({ iconName: 'phone', title: 'Telephone reporting', body: 'Every listed agency includes telephone contact numbers. Action Fraud: 0300 123 2040. Available Monday–Friday, 8am–8pm. Typetalk/Relay UK available.' })}
          ${C.renderCard({ iconName: 'chat',  title: 'Online reporting',    body: 'Online reporting portals for all major agencies. Accessible on any device. No account creation required for initial reports on most platforms.' })}
          ${C.renderCard({ iconName: 'mail',  title: 'Written and postal',  body: 'For those unable to report by phone or online — written reporting routes and postal addresses are listed for applicable agencies.' })}
        </div>
        <div class="mt-24">
          ${C.renderCallout('<strong>Relay UK</strong> — if you cannot use a voice phone, call Action Fraud via Relay UK by dialling 18001 0300 123 2040. The service is free and connects you to a live operator.', 'blue', 'phone')}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Vulnerable Adult Support', title: 'If you are supporting someone who has been defrauded' })}
        ${C.renderCheckList([
          'You can report fraud on behalf of someone else — you do not need to be the victim to make a report',
          'Action Fraud accepts third-party reports — family members, carers, and social workers can all report on behalf of a victim',
          'Age UK (0800 678 1602) provides specialist support for older adults affected by fraud',
          'Citizens Advice (0808 223 1133) can help navigate the reporting and recovery process',
          'Victim Support provides free, confidential support regardless of whether the fraud has been reported to police',
          'If an older or vulnerable adult is at immediate risk — call 999',
        ])}
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Need help reporting?',
          sub:   'If you need assistance navigating the directory or are unsure which route applies to your situation, use the contact form and we will guide you.',
          primaryCTA:   { label: 'Get Help', href: '#contact', route: 'contact' },
          secondaryCTA: { label: 'Fraud Types Directory', href: '#fraud-types', route: 'fraud-types' },
        })}
      </div>
    </section>`;
};
