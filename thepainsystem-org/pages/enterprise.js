function EnterprisePage() {
  return `
  <div class="page-content">

    <section class="page-hero">
      <div class="container">
        <span class="label">Enterprise</span>
        <h1>Enterprise &amp; Partnerships</h1>
        <p>Strategic partnerships, council membership, and integration opportunities with the Pain System ecosystem.</p>
      </div>
    </section>

    <!-- Enterprise Overview -->
    <section class="section section--alt">
      <div class="container">
        ${Components.SectionHeader('Overview', 'What We Offer Partners', 'Pain System provides infrastructure, distribution, and a curated pipeline of ventures — enterprise partners gain access to all three.')}

        <div class="grid grid--3">
          ${Components.Card('&#9670;', 'Venture Access', 'Early access to Showroom-ready products. Review, evaluate, and integrate validated ventures before they reach the open market.')}
          ${Components.Card('&#9670;', 'Infrastructure Integration', 'Connect your existing systems to Pain System layers — AI Lab models, Commerce APIs, Distribution OS pipelines.')}
          ${Components.Card('&#9670;', 'Council Participation', 'Join the Enterprise Council. Influence standards, review quality gates, and contribute to the governance of the ecosystem.')}
        </div>
      </div>
    </section>

    <!-- Council -->
    <section class="section">
      <div class="container">
        ${Components.SectionHeader('Council', 'The Enterprise Council', 'The governing body responsible for strategic direction, standards enforcement, and partnership oversight.')}

        <div class="grid grid--2">
          <div class="card">
            <h3>Structure</h3>
            <p>The Enterprise Council is composed of domain experts across technology, commerce, venture development, and compliance. Members serve defined terms and operate under a clear mandate.</p>
            <ul style="margin-top: var(--space-4);">
              <li class="pillar-detail" style="border: none; padding: var(--space-1) 0; padding-left: var(--space-4); position: relative; color: var(--color-text-muted); font-size: var(--text-sm);">Technology & Architecture oversight</li>
              <li class="pillar-detail" style="border: none; padding: var(--space-1) 0; padding-left: var(--space-4); position: relative; color: var(--color-text-muted); font-size: var(--text-sm);">Commerce & Revenue governance</li>
              <li class="pillar-detail" style="border: none; padding: var(--space-1) 0; padding-left: var(--space-4); position: relative; color: var(--color-text-muted); font-size: var(--text-sm);">Venture pipeline review</li>
              <li class="pillar-detail" style="border: none; padding: var(--space-1) 0; padding-left: var(--space-4); position: relative; color: var(--color-text-muted); font-size: var(--text-sm);">Compliance & Ethics enforcement</li>
            </ul>
          </div>
          <div class="card">
            <h3>Responsibilities</h3>
            <p>The Council reviews venture promotions, approves partnership agreements, maintains the governance framework, and ensures every system decision aligns with long-term ecosystem health.</p>
            <ul style="margin-top: var(--space-4);">
              <li class="pillar-detail" style="border: none; padding: var(--space-1) 0; padding-left: var(--space-4); position: relative; color: var(--color-text-muted); font-size: var(--text-sm);">Quality gate assessments</li>
              <li class="pillar-detail" style="border: none; padding: var(--space-1) 0; padding-left: var(--space-4); position: relative; color: var(--color-text-muted); font-size: var(--text-sm);">Partnership due diligence</li>
              <li class="pillar-detail" style="border: none; padding: var(--space-1) 0; padding-left: var(--space-4); position: relative; color: var(--color-text-muted); font-size: var(--text-sm);">Standards evolution</li>
              <li class="pillar-detail" style="border: none; padding: var(--space-1) 0; padding-left: var(--space-4); position: relative; color: var(--color-text-muted); font-size: var(--text-sm);">Dispute resolution</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Partnership Tiers -->
    <section class="section section--alt">
      <div class="container">
        ${Components.SectionHeader('Partnerships', 'Partnership Models', 'Multiple engagement levels designed for different organisational needs and commitment levels.')}

        <div class="grid grid--3">
          <div class="tier-card">
            <span class="label">Tier 1</span>
            <h3>Observer</h3>
            <p>Stay informed on ecosystem developments and venture pipeline progress.</p>
            <ul>
              <li>Quarterly ecosystem reports</li>
              <li>Venture pipeline visibility</li>
              <li>Standards documentation access</li>
              <li>Community event invitations</li>
            </ul>
          </div>
          <div class="tier-card">
            <span class="label">Tier 2</span>
            <h3>Integrator</h3>
            <p>Connect your systems with Pain System infrastructure and access Showroom products.</p>
            <ul>
              <li>Everything in Observer</li>
              <li>API integration access</li>
              <li>Early Showroom product previews</li>
              <li>Dedicated integration support</li>
            </ul>
          </div>
          <div class="tier-card">
            <span class="label">Tier 3</span>
            <h3>Council Partner</h3>
            <p>Shape the future of the ecosystem with a seat on the Enterprise Council.</p>
            <ul>
              <li>Everything in Integrator</li>
              <li>Enterprise Council membership</li>
              <li>Standards and governance input</li>
              <li>Strategic venture co-development</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Integration -->
    <section class="section">
      <div class="container">
        ${Components.SectionHeader('Integration', 'Integration Opportunities', 'Pain System layers are designed for external connectivity. Here\'s where partners typically integrate.')}

        <div class="grid grid--2">
          <div class="card">
            <h3>AI Lab Integration</h3>
            <p>Access trained models, inference APIs, and experimentation frameworks. Bring your own data or use AI Lab's shared research outputs to power your applications.</p>
          </div>
          <div class="card">
            <h3>Commerce Layer Integration</h3>
            <p>Plug into the payment, licensing, and subscription infrastructure. Use the Spider Strategy ledger for transparent revenue tracking across partner boundaries.</p>
          </div>
          <div class="card">
            <h3>Distribution OS Integration</h3>
            <p>Leverage the deployment and delivery pipeline for your own products. Multi-channel distribution, CDN, monitoring, and rollback — all available via API.</p>
          </div>
          <div class="card">
            <h3>Showroom Listing</h3>
            <p>Submit qualified products to the Showroom for distribution through the Pain System marketplace. Products must pass governance quality gates.</p>
          </div>
        </div>
      </div>
    </section>

    ${Components.CTABanner(
      'Start a Conversation',
      'Explore which partnership model fits your organisation.',
      'Contact Us',
      '#/contact'
    )}

  </div>`;
}

Router.register('/enterprise', EnterprisePage);
