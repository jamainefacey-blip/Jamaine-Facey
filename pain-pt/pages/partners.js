/* Pain PT — Partners */
window.renderPartners = function () {
  const C = window.PPTComponents;
  return `
    ${C.renderPageHero({ eyebrow: 'Partners', title: 'Work with us<br>to deliver <span>better coaching</span>', sub: 'Pain PT partners with coaches, gym partners, and referral sources who share a commitment to structured, honest, safe training.' })}
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Partnership Types', title: 'Who we work with', centered: true })}
        <div class="partner-grid">
          ${C.renderPartnerCard({ iconName: 'users',     name: 'Coaching Partners',      desc: 'Personal trainers, strength and conditioning coaches, and fitness professionals who want to align with a structured coaching framework — or refer clients who need more specialist programming support.' })}
          ${C.renderPartnerCard({ iconName: 'building',  name: 'Gym & Facility Partners', desc: 'Gyms, private training studios, and leisure centres that want to offer members access to a structured online coaching resource alongside their in-person facility.' })}
          ${C.renderPartnerCard({ iconName: 'handshake', name: 'Referral Partners',       desc: 'Physiotherapists, sports therapists, and healthcare professionals who refer clients returning to training after injury or illness. We close the gap between clinical rehabilitation and independent training.' })}
          ${C.renderPartnerCard({ iconName: 'globe',     name: 'Content & Beta Partners', desc: 'Fitness content creators, community managers, and early adopters who want to engage with the Pain PT system ahead of full platform launch and provide structured feedback.' })}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({ eyebrow: 'For Physios & Sports Therapists', title: 'The gap between rehab and independent training' })}
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">One of the most vulnerable points in a client's recovery is the transition from clinical rehabilitation to independent training. Clinical discharge often precedes full training readiness — and clients return to training without the structure to do it safely.</p>
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:24px;">Pain PT works with physiotherapy and sports therapy practices to provide structured return-to-training programming for discharged patients — maintaining communication with the clinical team where appropriate.</p>
            ${C.renderCheckList([
              'Return-to-training plans designed around clinical discharge criteria',
              'Communication channel with referring physiotherapist for relevant cases',
              'Clear escalation pathway if a client reports symptoms during training',
              'Referral arrangement — formal structure for partner practices',
            ])}
          </div>
          <div class="two-col-visual">
            ${C.renderCallout('<strong>We are not physiotherapy.</strong> Pain PT provides training programming — not clinical rehabilitation. We work alongside clinical teams, not instead of them. All return-to-training plans require clinical sign-off before commencement.', 'gold', 'shield')}
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
          sub:   'Tell us about your organisation and what you are trying to achieve for clients. We will respond within three business days.',
          primaryCTA:   { label: 'Partner Enquiry',  href: '#contact', route: 'contact' },
          secondaryCTA: { label: 'Beta Access',      href: '#contact', route: 'contact' },
        })}
      </div>
    </section>`;
};
