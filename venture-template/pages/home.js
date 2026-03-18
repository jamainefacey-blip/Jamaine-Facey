/* REPLACE: Rename to match your venture — e.g. "Voyage Smart Travel — Home" */
/* {{VENTURE_NAME}} — Home */
window.renderHome = function () {
  const C = window.VentureComponents; /* REPLACE: window.{{VENTURE_SLUG}}Components */
  return `
    ${C.renderHero({
      eyebrow: '{{TAGLINE}}',
      /* REPLACE: Update hero title. Use <br> and <span> for emphasis. */
      title: '{{HERO_TITLE_LINE_1}}<br><span>{{HERO_TITLE_LINE_2}}</span>',
      /* REPLACE: Update hero sub-heading. One or two sentences. No hype. */
      sub: '{{HERO_SUB}}',
      /* REPLACE: Update CTA labels and routes. */
      primaryCTA:   { label: '{{CTA_LABEL}}',   href: '#contact',  route: 'contact' },
      secondaryCTA: { label: '{{CTA_SECONDARY}}', href: '#features', route: 'features' },
    })}
    ${C.renderTrustStrip([
      /* REPLACE: Replace with 4 real trust signals. Keep labels short. */
      { value: '{{STAT_1_VALUE}}', label: '{{STAT_1_LABEL}}' },
      { value: '{{STAT_2_VALUE}}', label: '{{STAT_2_LABEL}}' },
      { value: '{{STAT_3_VALUE}}', label: '{{STAT_3_LABEL}}' },
      { value: '{{STAT_4_VALUE}}', label: '{{STAT_4_LABEL}}' },
    ])}
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow: '{{SECTION_1_EYEBROW}}',
          /* REPLACE: Section title */
          title: '{{SECTION_1_TITLE}}',
          centered: true,
        })}
        <div class="card-grid">
          /* REPLACE: Replace with 3 real feature cards. */
          ${C.renderCard({
            iconName: 'star',
            title: '{{FEATURE_1_TITLE}}',
            desc: '{{FEATURE_1_DESC}}',
          })}
          ${C.renderCard({
            iconName: 'shield',
            title: '{{FEATURE_2_TITLE}}',
            desc: '{{FEATURE_2_DESC}}',
          })}
          ${C.renderCard({
            iconName: 'zap',
            title: '{{FEATURE_3_TITLE}}',
            desc: '{{FEATURE_3_DESC}}',
          })}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({
              eyebrow: '{{SECTION_2_EYEBROW}}',
              title: '{{SECTION_2_TITLE}}',
            })}
            /* REPLACE: Replace with real body content. */
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">{{SECTION_2_BODY_P1}}</p>
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:24px;">{{SECTION_2_BODY_P2}}</p>
            ${C.renderCheckList([
              /* REPLACE: Replace with 4 real check-list items. */
              '{{CHECK_1}}',
              '{{CHECK_2}}',
              '{{CHECK_3}}',
              '{{CHECK_4}}',
            ])}
          </div>
          <div class="two-col-visual">
            ${C.renderStatBlock([
              /* REPLACE: Replace with 4 real stats. */
              { value: '{{STAT_A_VALUE}}', label: '{{STAT_A_LABEL}}' },
              { value: '{{STAT_B_VALUE}}', label: '{{STAT_B_LABEL}}' },
              { value: '{{STAT_C_VALUE}}', label: '{{STAT_C_LABEL}}' },
              { value: '{{STAT_D_VALUE}}', label: '{{STAT_D_LABEL}}' },
            ])}
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderCTABanner({
          /* REPLACE: Update CTA banner copy and links. */
          title: '{{CTA_BANNER_TITLE}}',
          sub:   '{{CTA_BANNER_SUB}}',
          primaryCTA:   { label: '{{CTA_LABEL}}',    href: '#contact',  route: 'contact' },
          secondaryCTA: { label: '{{CTA_SECONDARY}}', href: '#features', route: 'features' },
        })}
      </div>
    </section>`;
};
