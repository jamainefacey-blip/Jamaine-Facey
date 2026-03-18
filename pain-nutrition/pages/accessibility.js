/* Pain Nutrition — Accessibility */
window.renderAccessibility = function () {
  const C = window.PNComponents;
  return `
    ${C.renderPageHero({ eyebrow: 'Accessibility', title: 'Nutrition guidance<br><span>for everyone</span>', sub: 'Accessible by design — not as an afterthought. Simple structure, clear contrast, and plain language throughout.' })}
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Design Standards', title: 'How we build for accessibility', centered: true })}
        <div class="a11y-grid">
          ${[
            { title: 'Plain English throughout', desc: 'All guidance is written at a reading level accessible to a broad general audience. Technical nutrition terms are explained when used.' },
            { title: 'High contrast design', desc: 'Text and background colour combinations meet WCAG 2.1 AA contrast standards across all pages and components.' },
            { title: 'Large, readable text', desc: 'Minimum 16px base font size. Body text at 14px minimum. Line height optimised for comfortable reading on all devices.' },
            { title: 'Mobile-first layout', desc: 'Every page is designed for mobile first. No pinching, no horizontal scrolling, no text that requires zooming to read.' },
            { title: 'Screen reader compatible', desc: 'Semantic HTML structure, meaningful headings, and ARIA labels ensure compatibility with assistive technologies.' },
            { title: 'No auto-playing content', desc: 'No animations or media play without user action. Respects prefers-reduced-motion system settings.' },
          ].map(a => C.renderA11yItem(a)).join('')}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Inclusive Nutrition Guidance', title: 'Guidance that works across different needs' })}
        ${C.renderCheckList([
          'Guidance designed for diverse cultural food traditions — not defaulting to Western European food norms',
          'Budget-aware frameworks that do not assume access to specialist or expensive ingredients',
          'Family guidance that accommodates mixed dietary requirements within a single household',
          'Content written to be useful for people with limited cooking equipment or kitchen access',
          'No assumption of physical activity level — guidance for sedentary, active, and rehabilitation contexts',
          'Clear referral pathways for conditions requiring clinical nutritional support',
        ])}
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Accessible support, where you are',
          sub:   'If any part of this platform is not working for you — tell us. We take accessibility seriously and want to know when something falls short.',
          primaryCTA:   { label: 'Get Started', href: '#contact', route: 'contact' },
        })}
      </div>
    </section>`;
};
