/* {{VENTURE_NAME}} — Safety / Our Approach */
/* REPLACE: Rename this file and its window.render* function if you renamed the page
   (e.g. safety.js → approach.js, window.renderSafety → window.renderApproach).
   Update the script tag in index.html and the ROUTES map in router.js. */
window.renderSafety = function () {
  const C = window.VentureComponents; /* REPLACE: window.{{VENTURE_SLUG}}Components */
  return `
    ${C.renderPageHero({
      eyebrow: '{{NAV_SAFETY}}',
      /* REPLACE: Update page hero title and sub. */
      title: '{{SAFETY_HERO_TITLE}}<br><span>{{SAFETY_HERO_TITLE_2}}</span>',
      sub: '{{SAFETY_HERO_SUB}}',
    })}
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow: '{{SAFETY_SECTION_EYEBROW}}',
          title: '{{SAFETY_SECTION_TITLE}}',
          centered: true,
        })}
        <div class="card-grid">
          /* REPLACE: Replace with 3–4 real safety/approach cards. */
          ${C.renderCard({ iconName: 'shield', title: '{{SAFETY_CARD_1_TITLE}}', desc: '{{SAFETY_CARD_1_DESC}}' })}
          ${C.renderCard({ iconName: 'eye',    title: '{{SAFETY_CARD_2_TITLE}}', desc: '{{SAFETY_CARD_2_DESC}}' })}
          ${C.renderCard({ iconName: 'zap',    title: '{{SAFETY_CARD_3_TITLE}}', desc: '{{SAFETY_CARD_3_DESC}}' })}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({
              eyebrow: '{{SAFETY_DETAIL_EYEBROW}}',
              title: '{{SAFETY_DETAIL_TITLE}}',
            })}
            /* REPLACE: Replace with real body copy. 1–2 paragraphs. */
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">{{SAFETY_DETAIL_BODY_P1}}</p>
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:24px;">{{SAFETY_DETAIL_BODY_P2}}</p>
            ${C.renderCheckList([
              /* REPLACE: Replace with real check-list items. */
              '{{SAFETY_CHECK_1}}',
              '{{SAFETY_CHECK_2}}',
              '{{SAFETY_CHECK_3}}',
              '{{SAFETY_CHECK_4}}',
            ])}
          </div>
          <div class="two-col-visual">
            ${C.renderCallout(
              /* REPLACE: Update callout. Honest scope boundary or key commitment. */
              '<strong>{{SAFETY_CALLOUT_BOLD}}.</strong> {{SAFETY_CALLOUT_BODY}}',
              'gold',
              'shield'
            )}
            <div class="mt-24">
              <a href="#contact" data-route="contact" class="btn btn-outline w-full">${C.icon('arrow')} {{CTA_LABEL}}</a>
            </div>
          </div>
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
