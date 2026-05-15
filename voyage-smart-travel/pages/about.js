/* ─────────────────────────────────────────────────────────────────────────────
   Voyage Smart Travel — About Page
   ───────────────────────────────────────────────────────────────────────────── */

window.renderAbout = function () {
  const C = window.VSTComponents;

  const values = [
    {
      iconName: 'shield',
      title: 'Safety before conversion',
      body:  'We will never recommend a partner, destination, or route because it performs well commercially. Safety data drives every recommendation. If a property does not pass our verification process, it does not appear on the platform — full stop.',
    },
    {
      iconName: 'accessibility',
      title: 'Accessible by default',
      body:  'Accessibility is not a section of the app. It is the baseline. We design every feature with disabled travellers in mind first, then expand outward. This produces better outcomes for all users.',
    },
    {
      iconName: 'eye',
      title: 'Radical transparency',
      body:  'We publish our partner verification criteria, our safety incident reporting methodology, and our accessibility assessment standards. If you want to know how we make decisions, we show you.',
    },
    {
      iconName: 'users',
      title: 'Community-verified intelligence',
      body:  'Safety conditions change. A property that was excellent last year may have new ownership, reduced staffing, or changed access routes. Our community of verified travellers keeps real-time intelligence accurate.',
    },
  ];

  const whatMakesDiff = [
    'We do not accept advertising or sponsored placements from accommodation providers',
    'Our safety ratings are based on independent verification, not self-reported data',
    'Accessibility claims are audited, not just declared',
    'Emergency support is live — real people, not automated response trees',
    'We cover regions that mainstream travel platforms ignore entirely',
  ];

  return `
    ${C.renderPageHero({
      eyebrow: 'About Voyage Smart Travel',
      title:   'We exist because solo travel<br><span>should feel safe</span>',
      sub:     'Not stressful. Not a compromise. Not something you do despite the risk. Safe, genuinely — from the first search to the moment you land home.',
    })}

    <!-- Origin / mission -->
    <section class="section">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({
              eyebrow: 'Why We Exist',
              title:   'The gap nobody was filling',
            })}
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">
              Solo travel has been growing consistently for over a decade. The profile of the solo traveller has shifted — older, more diverse, increasingly including people with disabilities, chronic conditions, and complex accessibility needs. The platforms have not kept pace.
            </p>
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">
              Mainstream booking platforms were built for group and leisure travel. They bolt safety and accessibility features on as afterthoughts. Their verification processes are largely self-reported. Their emergency support is automated.
            </p>
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:24px;">
              Voyage Smart Travel was built to do the opposite — to start from safety, to centre accessibility, and to build a platform that earns genuine trust.
            </p>
            ${C.renderCallout(
              '<strong>Our mission:</strong> Make solo travel safe, accessible, and genuinely confident for every traveller — regardless of ability, experience, or destination.',
              'gold',
              'compass'
            )}
          </div>
          <div class="two-col-visual">
            ${C.renderStatBlock([
              { value: '2022', label: 'Founded' },
              { value: '62',   label: 'Countries covered' },
              { value: '10K+', label: 'Verified partners' },
              { value: '98%',  label: 'Incident-free journeys' },
            ])}
          </div>
        </div>
      </div>
    </section>

    <!-- Values -->
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow:  'Our Values',
          title:    'What we stand for',
          sub:      'These are not a marketing exercise. They are the principles that determine which partners we accept, which features we build, and which compromises we refuse.',
          centered: true,
        })}
        <div class="card-grid">
          ${values.map(v => C.renderCard(v)).join('')}
        </div>
      </div>
    </section>

    <!-- What makes us different -->
    <section class="section">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({
              eyebrow: 'What Makes Us Different',
              title:   'Standards most platforms<br>do not apply',
            })}
            ${C.renderCheckList(whatMakesDiff)}
          </div>
          <div class="two-col-visual">
            ${C.renderCallout(
              '<strong>Not a directory. A trust platform.</strong><br><br>Any directory can list properties. We verify them. Any platform can show accessibility icons. We audit the claims. The difference is the standard we hold ourselves to — and our partners to.',
              'blue',
              'lock'
            )}
            <div class="mt-24">
              <a href="#safety" data-route="safety" class="btn btn-primary mt-16">How Safety Verification Works ${C.icon('arrow')}</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Travel with us',
          sub:   'Whether you are planning your first solo trip or your fiftieth, Voyage Smart Travel is built to give you the confidence to go further.',
          primaryCTA:   { label: 'Get Started', href: '#contact',  route: 'contact' },
          secondaryCTA: { label: 'See Features', href: '#features', route: 'features' },
        })}
      </div>
    </section>`;
};
