/* Pain PT — Accessibility */
window.renderAccessibility = function () {
  const C = window.PPTComponents;
  return `
    ${C.renderPageHero({ eyebrow: 'Accessibility', title: 'Clear. Navigable.<br><span>Built for every device.</span>', sub: 'Pain PT is built mobile-first with a clean section hierarchy, strong contrast, and simple navigation that works on any device, any network, any user.' })}
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Platform Accessibility', title: 'How we build', centered: true })}
        <div class="a11y-grid">
          ${[
            { title: 'Mobile-first design', desc: 'Every page is designed for mobile first. Clean layout, large tap targets, and no horizontal scrolling. Works on every device size.' },
            { title: 'Strong visual hierarchy', desc: 'Clear heading structure, section labels, and visual separation make it easy to navigate the content without reading everything.' },
            { title: 'High contrast throughout', desc: 'Text and UI elements meet WCAG 2.1 AA contrast standards. Readable in bright sunlight and on older devices.' },
            { title: 'Keyboard navigable', desc: 'All interactive elements are accessible by keyboard. Visible focus states on every interactive component.' },
            { title: 'Screen reader compatible', desc: 'Semantic HTML, logical heading order, and ARIA labels ensure compatibility with assistive technologies.' },
            { title: 'No auto-playing content', desc: 'Nothing plays, moves, or animates without user action. Respects system preferences for reduced motion.' },
          ].map(a => C.renderA11yItem(a)).join('')}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Training Accessibility', title: 'Programmes built around you', sub: 'Training plans are built around your actual starting point — not an assumed baseline. Adaptations for injury history, limited equipment, and time constraints are standard.' })}
        ${C.renderCheckList([
          'Training plans adaptable to gym, home, or minimal equipment settings',
          'Programmes designed around your available time — not ideal training frequency',
          'Injury history and movement limitations assessed before any programme begins',
          'Return-to-training programmes for clients coming back after breaks or illness',
          'Clear language throughout — no assumed knowledge of training terminology',
          'All coaching communication available by text or email — no requirement to call',
        ])}
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Built to work for you',
          sub:   'If any part of the platform or coaching process is not working for your situation — tell us. We adapt.',
          primaryCTA: { label: 'Start Coaching', href: '#contact', route: 'contact' },
        })}
      </div>
    </section>`;
};
