/* ─────────────────────────────────────────────────────────────────────────────
   Voyage Smart Travel — Partners Page
   ───────────────────────────────────────────────────────────────────────────── */

window.renderPartners = function () {
  const C = window.VSTComponents;

  const partnerTypes = [
    {
      iconName: 'building',
      name: 'Accommodation Partners',
      desc: 'Hotels, guesthouses, hostels, and serviced apartments that meet our independent safety and accessibility verification standards. Listings carry transparent safety scores and accessibility documentation.',
    },
    {
      iconName: 'globe',
      name: 'Tourism Boards & Destination Organisations',
      desc: 'National and regional tourism bodies who want to make their destination meaningfully accessible to solo travellers — particularly those with safety or accessibility requirements that standard platforms do not address.',
    },
    {
      iconName: 'compass',
      name: 'Tour Operators & Experience Providers',
      desc: 'Guided tours, day experiences, and activity operators who meet our solo traveller safety standards and can evidence accessibility provisions. We do not list operators who have not been assessed.',
    },
    {
      iconName: 'users',
      name: 'Local Guides & Safety Advisors',
      desc: 'Qualified local guides with verified safety training who provide on-the-ground intelligence, emergency support coverage, and traveller assistance in our network destinations.',
    },
  ];

  const accommodationBenefits = [
    'Access to a growing network of safety-conscious and accessibility-focused travellers',
    'Transparent safety score that builds credibility with discerning solo travellers',
    'Listed in accessibility filters for specific criteria you have verified',
    'Priority placement in search for travellers with matching requirements',
    'Partner intelligence dashboard showing traveller feedback and assessment findings',
    'Annual re-verification that demonstrates ongoing commitment to standards',
  ];

  const tourismBenefits = [
    'Destination profile with verified accommodation and experience listings',
    'Accessibility destination guide development in collaboration with our team',
    'Solo traveller intelligence — who is coming, what they need, where gaps exist',
    'Direct channel to safety-conscious travellers not well served by mainstream platforms',
    'Co-developed content that positions your destination as genuinely accessible',
  ];

  const verificationProcess = [
    {
      title: 'Submit your application',
      body:  'Complete the partner application including your safety documentation, accessibility provisions, and evidence of current standards. We review all submissions within 10 business days.',
    },
    {
      title: 'Independent assessment',
      body:  'A qualified assessor reviews your documentation and conducts an on-site assessment for accommodation and experience providers. Remote assessment applies only to certain destination organisation partnerships.',
    },
    {
      title: 'Score assignment and listing',
      body:  'Verified partners receive a transparent safety score and specific accessibility classifications based on assessment findings. Your listing appears only in filters matching verified provisions.',
    },
    {
      title: 'Ongoing partnership and monitoring',
      body:  'Annual re-verification, traveller intelligence reports, and a partner dashboard keep you informed and listed. You are notified immediately of any traveller reports that trigger a review.',
    },
  ];

  return `
    ${C.renderPageHero({
      eyebrow: 'Partners',
      title:   'Join the trusted<br><span>travel network</span>',
      sub:     'We partner with accommodation providers, tourism boards, operators, and local guides who share a genuine commitment to solo traveller safety and accessibility.',
    })}

    <!-- Partner types -->
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow:  'Partnership Types',
          title:    'Who we work with',
          sub:      'We do not work with every provider who applies. Partners earn their place through the same independent verification process that every listing on our platform undergoes.',
          centered: true,
        })}
        <div class="partner-grid">
          ${partnerTypes.map(p => C.renderPartnerCard(p)).join('')}
        </div>
      </div>
    </section>

    <!-- Benefits section -->
    <section class="section section-alt">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({
              eyebrow: 'For Accommodation Providers',
              title:   'Why verified partners<br>see real results',
            })}
            ${C.renderCheckList(accommodationBenefits)}
            <div class="mt-32">
              <a href="#contact" data-route="contact" class="btn btn-primary">Apply as an Accommodation Partner ${C.icon('arrow')}</a>
            </div>
          </div>
          <div class="two-col-visual">
            ${C.renderCallout(
              '<strong>The Voyage Smart Travel traveller is not a mainstream booking platform user.</strong><br><br>They travel alone, they research thoroughly, and they make decisions based on verified safety and accessibility information — not star ratings or price alone. Being listed on our platform signals something to this audience that a booking platform listing cannot replicate.',
              'gold',
              'star'
            )}
          </div>
        </div>
      </div>
    </section>

    <!-- Tourism boards -->
    <section class="section">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-visual">
            ${C.renderStatBlock([
              { value: '62',   label: 'Countries in the network' },
              { value: '10K+', label: 'Solo travellers monthly' },
              { value: '68%',  label: 'Have accessibility requirements' },
              { value: '4.9★', label: 'Average network safety rating' },
            ])}
            <div class="mt-24">
              <a href="#contact" data-route="contact" class="btn btn-outline w-full">Tourism Board Enquiry ${C.icon('arrow')}</a>
            </div>
          </div>
          <div class="two-col-text">
            ${C.renderSectionHeader({
              eyebrow: 'For Tourism Boards',
              title:   'Position your destination<br>for the solo traveller',
            })}
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:24px;">
              Solo travel is one of the fastest-growing travel segments. A significant proportion of solo travellers have accessibility requirements that standard destination marketing does not address. Voyage Smart Travel gives tourism organisations a direct channel to this audience — with verified, credible positioning that generic campaigns cannot produce.
            </p>
            ${C.renderCheckList(tourismBenefits)}
          </div>
        </div>
      </div>
    </section>

    <!-- Verification process -->
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow: 'The Process',
          title:   'How partnership verification works',
          sub:     'The same rigour we apply to protecting travellers applies to admitting partners. Standards are not negotiated.',
        })}
        ${C.renderStepList(verificationProcess)}
        ${C.renderCallout(
          '<strong>Commercial relationships do not affect placement or safety scores.</strong> Partners pay a verification fee that covers assessment costs. It does not purchase rankings, featured placement, or favourable scoring. Our safety assessors operate independently from our commercial team.',
          'blue',
          'lock'
        )}
      </div>
    </section>

    <!-- CTA -->
    <section class="section">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Ready to join the network?',
          sub:   'Start with an enquiry. Tell us about your property, operation, or organisation and we will walk you through the verification process.',
          primaryCTA:   { label: 'Partner Enquiry', href: '#contact', route: 'contact' },
          secondaryCTA: { label: 'View Safety Standards', href: '#safety', route: 'safety' },
        })}
      </div>
    </section>`;
};
