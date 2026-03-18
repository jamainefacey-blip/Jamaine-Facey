/* {{VENTURE_NAME}} — Features */
/* REPLACE: Rename this file and its window.render* function if you renamed the page
   (e.g. features.js → offering.js, window.renderFeatures → window.renderOffering).
   Update the script tag in index.html and the ROUTES map in router.js. */
window.renderFeatures = function () {
  const C = window.VentureComponents; /* REPLACE: window.{{VENTURE_SLUG}}Components */
  return `
    ${C.renderPageHero({
      eyebrow: '{{NAV_FEATURES}}',
      /* REPLACE: Update page hero title and sub. */
      title: '{{FEATURES_HERO_TITLE}}<br><span>{{FEATURES_HERO_TITLE_2}}</span>',
      sub: '{{FEATURES_HERO_SUB}}',
    })}
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow: '{{FEATURES_SECTION_EYEBROW}}',
          title: '{{FEATURES_SECTION_TITLE}}',
          centered: true,
        })}
        <div class="card-grid card-grid-3">
          /* REPLACE: Replace with up to 6 real feature cards. Remove any extras. */
          ${C.renderCard({ iconName: 'star',      title: '{{FEATURE_1_TITLE}}', desc: '{{FEATURE_1_DESC}}' })}
          ${C.renderCard({ iconName: 'shield',    title: '{{FEATURE_2_TITLE}}', desc: '{{FEATURE_2_DESC}}' })}
          ${C.renderCard({ iconName: 'zap',       title: '{{FEATURE_3_TITLE}}', desc: '{{FEATURE_3_DESC}}' })}
          ${C.renderCard({ iconName: 'users',     title: '{{FEATURE_4_TITLE}}', desc: '{{FEATURE_4_DESC}}' })}
          ${C.renderCard({ iconName: 'globe',     title: '{{FEATURE_5_TITLE}}', desc: '{{FEATURE_5_DESC}}' })}
          ${C.renderCard({ iconName: 'clock',     title: '{{FEATURE_6_TITLE}}', desc: '{{FEATURE_6_DESC}}' })}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow: 'How It Works',
          title: '{{HOW_IT_WORKS_TITLE}}',
          centered: true,
        })}
        ${C.renderStepList([
          /* REPLACE: Replace with 3–5 real steps. */
          { step: '01', title: '{{STEP_1_TITLE}}', desc: '{{STEP_1_DESC}}' },
          { step: '02', title: '{{STEP_2_TITLE}}', desc: '{{STEP_2_DESC}}' },
          { step: '03', title: '{{STEP_3_TITLE}}', desc: '{{STEP_3_DESC}}' },
        ])}
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: '{{CTA_BANNER_TITLE}}',
          sub:   '{{CTA_BANNER_SUB}}',
          primaryCTA:   { label: '{{CTA_LABEL}}',    href: '#contact',  route: 'contact' },
          secondaryCTA: { label: 'Learn More', href: '#about', route: 'about' },
        })}
      </div>
    </section>`;
};
