/* {{VENTURE_NAME}} — About */
window.renderAbout = function () {
  const C = window.VentureComponents; /* REPLACE: window.{{VENTURE_SLUG}}Components */
  return `
    ${C.renderPageHero({
      eyebrow: 'About',
      /* REPLACE: Update page hero title and sub. */
      title: '{{ABOUT_HERO_TITLE}}<br><span>{{ABOUT_HERO_TITLE_2}}</span>',
      sub: '{{ABOUT_HERO_SUB}}',
    })}
    <section class="section">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({
              eyebrow: 'Our Mission',
              /* REPLACE: Mission section title */
              title: '{{MISSION_TITLE}}',
            })}
            /* REPLACE: Replace with real mission copy — 2 paragraphs. */
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">{{MISSION_BODY_P1}}</p>
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:24px;">{{MISSION_BODY_P2}}</p>
            ${C.renderCallout(
              /* REPLACE: Update callout copy. Use bold for key phrase. */
              '<strong>{{CALLOUT_BOLD}}.</strong> {{CALLOUT_BODY}}',
              'gold',
              'eye'
            )}
          </div>
          <div class="two-col-visual">
            ${C.renderStatBlock([
              /* REPLACE: Replace with 4 real stats relevant to the mission. */
              { value: '{{ABOUT_STAT_A_VALUE}}', label: '{{ABOUT_STAT_A_LABEL}}' },
              { value: '{{ABOUT_STAT_B_VALUE}}', label: '{{ABOUT_STAT_B_LABEL}}' },
              { value: '{{ABOUT_STAT_C_VALUE}}', label: '{{ABOUT_STAT_C_LABEL}}' },
              { value: '{{ABOUT_STAT_D_VALUE}}', label: '{{ABOUT_STAT_D_LABEL}}' },
            ])}
          </div>
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow: 'Our Values',
          title: 'What we stand for',
          centered: true,
        })}
        <div class="card-grid">
          /* REPLACE: Replace with 4 real value cards. */
          ${C.renderCard({ iconName: 'shield', title: '{{VALUE_1_TITLE}}', desc: '{{VALUE_1_DESC}}' })}
          ${C.renderCard({ iconName: 'eye',    title: '{{VALUE_2_TITLE}}', desc: '{{VALUE_2_DESC}}' })}
          ${C.renderCard({ iconName: 'zap',    title: '{{VALUE_3_TITLE}}', desc: '{{VALUE_3_DESC}}' })}
          ${C.renderCard({ iconName: 'users',  title: '{{VALUE_4_TITLE}}', desc: '{{VALUE_4_DESC}}' })}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: '{{CTA_BANNER_TITLE}}',
          sub:   '{{CTA_BANNER_SUB}}',
          primaryCTA: { label: '{{CTA_LABEL}}', href: '#contact', route: 'contact' },
        })}
      </div>
    </section>`;
};
