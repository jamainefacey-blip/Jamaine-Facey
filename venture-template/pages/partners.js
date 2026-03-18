/* {{VENTURE_NAME}} — Partners */
window.renderPartners = function () {
  const C = window.VentureComponents; /* REPLACE: window.{{VENTURE_SLUG}}Components */
  return `
    ${C.renderPageHero({
      eyebrow: 'Partners',
      /* REPLACE: Update page hero title and sub. */
      title: 'Work with us<br>to deliver <span>{{PARTNERS_HERO_VALUE}}</span>',
      sub: '{{PARTNERS_HERO_SUB}}',
    })}
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Partnership Types', title: 'Who we work with', centered: true })}
        <div class="partner-grid">
          /* REPLACE: Replace with 4 real partner types for this venture. */
          ${C.renderPartnerCard({ iconName: 'users',     name: '{{PARTNER_1_NAME}}', desc: '{{PARTNER_1_DESC}}' })}
          ${C.renderPartnerCard({ iconName: 'building',  name: '{{PARTNER_2_NAME}}', desc: '{{PARTNER_2_DESC}}' })}
          ${C.renderPartnerCard({ iconName: 'handshake', name: '{{PARTNER_3_NAME}}', desc: '{{PARTNER_3_DESC}}' })}
          ${C.renderPartnerCard({ iconName: 'globe',     name: '{{PARTNER_4_NAME}}', desc: '{{PARTNER_4_DESC}}' })}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({
              eyebrow: '{{PARTNERS_DETAIL_EYEBROW}}',
              title: '{{PARTNERS_DETAIL_TITLE}}',
            })}
            /* REPLACE: Replace with real body copy about partnership value. */
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">{{PARTNERS_DETAIL_BODY_P1}}</p>
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:24px;">{{PARTNERS_DETAIL_BODY_P2}}</p>
            ${C.renderCheckList([
              /* REPLACE: Replace with 4 real partnership benefits. */
              '{{PARTNER_CHECK_1}}',
              '{{PARTNER_CHECK_2}}',
              '{{PARTNER_CHECK_3}}',
              '{{PARTNER_CHECK_4}}',
            ])}
          </div>
          <div class="two-col-visual">
            ${C.renderCallout(
              /* REPLACE: Update callout. Scope boundary, referral note, or key commitment. */
              '<strong>{{PARTNER_CALLOUT_BOLD}}.</strong> {{PARTNER_CALLOUT_BODY}}',
              'gold',
              'shield'
            )}
            <div class="mt-24">
              <a href="#contact" data-route="contact" class="btn btn-outline w-full">Partner Enquiry ${C.icon('arrow')}</a>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Interested in working together?',
          sub:   '{{PARTNERS_CTA_SUB}}',
          primaryCTA:   { label: 'Partner Enquiry', href: '#contact', route: 'contact' },
          secondaryCTA: { label: '{{CTA_LABEL}}',   href: '#contact', route: 'contact' },
        })}
      </div>
    </section>`;
};
