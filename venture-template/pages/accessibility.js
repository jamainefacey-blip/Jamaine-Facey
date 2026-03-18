/* {{VENTURE_NAME}} — Accessibility */
window.renderAccessibility = function () {
  const C = window.VentureComponents; /* REPLACE: window.{{VENTURE_SLUG}}Components */
  return `
    ${C.renderPageHero({
      eyebrow: 'Accessibility',
      title: 'Clear. Navigable.<br><span>Built for every device.</span>',
      /* REPLACE: Update sub to reflect venture-specific context. */
      sub: '{{VENTURE_NAME}} is built mobile-first with strong contrast, simple navigation, and a clean layout that works on any device, any network, any user.',
    })}
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Platform Accessibility', title: 'How we build', centered: true })}
        <div class="a11y-grid">
          /* REPLACE: These 6 items are standard across all ventures — update if needed. */
          ${[
            { title: 'Mobile-first design',       desc: 'Every page is designed for mobile first. Clean layout, large tap targets, and no horizontal scrolling.' },
            { title: 'Strong visual hierarchy',   desc: 'Clear heading structure, section labels, and visual separation make it easy to navigate without reading everything.' },
            { title: 'High contrast throughout',  desc: 'Text and UI elements meet WCAG 2.1 AA contrast standards. Readable in bright sunlight and on older devices.' },
            { title: 'Keyboard navigable',        desc: 'All interactive elements are accessible by keyboard. Visible focus states on every interactive component.' },
            { title: 'Screen reader compatible',  desc: 'Semantic HTML, logical heading order, and ARIA labels ensure compatibility with assistive technologies.' },
            { title: 'No auto-playing content',   desc: 'Nothing plays, moves, or animates without user action. Respects system preferences for reduced motion.' },
          ].map(a => C.renderA11yItem(a)).join('')}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow: '{{ACCESSIBILITY_SECTION_EYEBROW}}',
          /* REPLACE: Update section title and sub for venture-specific content accessibility. */
          title: '{{ACCESSIBILITY_SECTION_TITLE}}',
          sub:   '{{ACCESSIBILITY_SECTION_SUB}}',
        })}
        ${C.renderCheckList([
          /* REPLACE: Replace with 4–6 real content-accessibility commitments specific to this venture. */
          '{{A11Y_CONTENT_CHECK_1}}',
          '{{A11Y_CONTENT_CHECK_2}}',
          '{{A11Y_CONTENT_CHECK_3}}',
          '{{A11Y_CONTENT_CHECK_4}}',
          '{{A11Y_CONTENT_CHECK_5}}',
          '{{A11Y_CONTENT_CHECK_6}}',
        ])}
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Built to work for you',
          sub:   'If any part of the platform or service is not working for your situation — tell us. We adapt.',
          primaryCTA: { label: '{{CTA_LABEL}}', href: '#contact', route: 'contact' },
        })}
      </div>
    </section>`;
};
