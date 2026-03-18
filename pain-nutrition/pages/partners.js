/* Pain Nutrition — Partners */
window.renderPartners = function () {
  const C = window.PNComponents;
  return `
    ${C.renderPageHero({ eyebrow: 'Partners', title: 'Work with us<br>to <span>improve nutrition access</span>', sub: 'We partner with coaches, wellness professionals, fitness organisations, and content collaborators to extend practical nutrition guidance to more people.' })}
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Partnership Types', title: 'Who we work with', centered: true })}
        <div class="partner-grid">
          ${C.renderPartnerCard({ iconName: 'users',     name: 'Personal Trainers & Coaches',     desc: 'Fitness coaches who want to offer their clients structured nutrition guidance without overstepping into clinical dietitian territory. We provide the education framework; you provide the coaching relationship.' })}
          ${C.renderPartnerCard({ iconName: 'heart',     name: 'Wellness Professionals',          desc: 'Physiotherapists, sports therapists, and wellbeing practitioners who want to add practical nutrition education to their client offering — with clear scope boundaries maintained.' })}
          ${C.renderPartnerCard({ iconName: 'book',      name: 'Nutrition Content Collaborators', desc: 'Qualified nutrition professionals, registered dietitians, and evidence-based nutrition communicators who want to contribute content, review materials, or co-develop guides.' })}
          ${C.renderPartnerCard({ iconName: 'building',  name: 'Gym & Facility Partners',         desc: 'Gyms, leisure centres, and fitness facilities that want to provide members with a reliable, evidence-informed nutrition education resource as part of their member offering.' })}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({ eyebrow: 'For Coaches', title: 'Extend your offer without extending your scope' })}
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">Many personal trainers and coaches are asked nutrition questions they are not qualified to answer clinically. Pain Nutrition gives you a structured education resource to direct clients to — one that is honest about its limits and makes appropriate referrals.</p>
            ${C.renderCheckList([
              'Client-facing nutrition education content you can confidently direct clients to',
              'Meal planning frameworks that complement training programmes without creating dependency',
              'Clear scope delineation — we never present as clinical dietitian services',
              'Co-branded partnership options for established coaching businesses',
              'Referral arrangement for coaching clients you send to the platform',
            ])}
            <div class="mt-24">
              <a href="#contact" data-route="contact" class="btn btn-primary">Partner Enquiry ${C.icon('arrow')}</a>
            </div>
          </div>
          <div class="two-col-visual">
            ${C.renderCallout('<strong>Content integrity commitment.</strong><br><br>All Pain Nutrition content is reviewed against current evidence-based nutritional guidance. We do not publish content that promotes fad diets, unsupported supplementation, or approaches that conflict with NHS or BDA guidance.', 'gold', 'eye')}
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Interested in working together?',
          sub:   'Tell us about your organisation and what you are looking to offer clients. We will find the right partnership model.',
          primaryCTA:   { label: 'Partner Enquiry', href: '#contact', route: 'contact' },
          secondaryCTA: { label: 'Our Approach',    href: '#safety',  route: 'safety' },
        })}
      </div>
    </section>`;
};
