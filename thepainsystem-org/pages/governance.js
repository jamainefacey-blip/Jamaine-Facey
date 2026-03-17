function GovernancePage() {
  return `
  <div class="page-content">

    <section class="page-hero">
      <div class="container">
        <span class="label">Governance</span>
        <h1>Standards &amp; Governance</h1>
        <p>The principles, processes, and quality gates that maintain integrity across the Pain System ecosystem.</p>
      </div>
    </section>

    <!-- Governance Model -->
    <section class="section section--alt">
      <div class="container">
        ${Components.SectionHeader('Model', 'How We Govern', 'Pain System governance is transparent, standards-based, and distributed. No single authority makes unilateral decisions.')}

        <div class="grid grid--3">
          ${Components.Card('&#9670;', 'Council-Led', 'Strategic decisions are made by the Enterprise Council — a body of domain experts with defined mandates and term limits.')}
          ${Components.Card('&#9670;', 'Standards-Driven', 'Every policy, quality gate, and promotion decision is anchored in documented, measurable standards. Nothing is discretionary.')}
          ${Components.Card('&#9670;', 'Transparent Process', 'Decisions, reviews, and gate assessments are recorded and accessible. The governance layer is itself auditable.')}
        </div>
      </div>
    </section>

    <!-- Quality Gates -->
    <section class="section">
      <div class="container">
        ${Components.SectionHeader('Quality Gates', 'Hangar to Showroom Criteria', 'Ventures must pass every gate before being promoted to commercial distribution.')}

        <div class="grid grid--2">
          <div class="gov-block">
            <h3>Technical Standards</h3>
            <ul>
              <li>Codebase passes automated quality checks</li>
              <li>Test coverage meets minimum threshold</li>
              <li>Security review completed with no critical findings</li>
              <li>Architecture aligns with Pain System layer contracts</li>
              <li>Documentation meets completeness requirements</li>
            </ul>
          </div>
          <div class="gov-block">
            <h3>Commercial Viability</h3>
            <ul>
              <li>Defined pricing model validated against market</li>
              <li>Revenue pathway documented and feasible</li>
              <li>Customer acquisition strategy articulated</li>
              <li>Unit economics are sustainable</li>
              <li>Integration with Commerce Layer verified</li>
            </ul>
          </div>
          <div class="gov-block">
            <h3>User Validation</h3>
            <ul>
              <li>Minimum viable user testing completed</li>
              <li>Core user journeys validated with real feedback</li>
              <li>Retention or engagement metrics meet threshold</li>
              <li>Accessibility standards met</li>
              <li>Performance benchmarks within acceptable range</li>
            </ul>
          </div>
          <div class="gov-block">
            <h3>Compliance Readiness</h3>
            <ul>
              <li>Data handling compliant with relevant regulations</li>
              <li>Privacy policy and terms of service in place</li>
              <li>Third-party dependency audit completed</li>
              <li>Responsible AI guidelines followed (if applicable)</li>
              <li>Incident response plan documented</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Standards -->
    <section class="section section--alt">
      <div class="container">
        ${Components.SectionHeader('Principles', 'Ecosystem Standards', 'The foundational rules that every component, layer, and venture in the Pain System must uphold.')}

        <div class="grid grid--3">
          <div class="gov-block">
            <h3>Open Architecture</h3>
            <p>Every layer must be modular and independently deployable. No hidden dependencies. Ventures choose what they need.</p>
          </div>
          <div class="gov-block">
            <h3>Revenue Transparency</h3>
            <p>All transactions flow through the Spider Strategy ledger. Revenue, fees, and net outcomes are tracked and auditable at every level.</p>
          </div>
          <div class="gov-block">
            <h3>Earned Promotion</h3>
            <p>No venture advances based on relationships or politics. Promotion from Hangar to Showroom is objective, gate-based, and documented.</p>
          </div>
          <div class="gov-block">
            <h3>Community Respect</h3>
            <p>The Hangar is a shared space. Contributions, reviews, and feedback must be constructive, respectful, and aligned with ecosystem goals.</p>
          </div>
          <div class="gov-block">
            <h3>Long-Term Value</h3>
            <p>Architecture and business decisions favour durability over speed. We build for the long term and resist short-term extraction.</p>
          </div>
          <div class="gov-block">
            <h3>Responsible AI</h3>
            <p>AI Lab outputs must meet ethical guidelines. Model use is documented, biases are tracked, and human oversight is maintained.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Ethics -->
    <section class="section">
      <div class="container">
        ${Components.SectionHeader('Ethics', 'Compliance & Ethics', 'Beyond technical standards, the Pain System upholds a commitment to ethical operation and responsible growth.')}

        <div class="grid grid--2">
          <div class="card">
            <h3>Data Ethics</h3>
            <p>Ventures within the Pain System must handle user data responsibly, comply with applicable data protection regulations, and maintain clear privacy policies. Data minimisation is the default.</p>
          </div>
          <div class="card">
            <h3>Fair Commerce</h3>
            <p>Pricing must be transparent and fair. The Commerce Layer enforces consistent fee structures. The Spider Strategy ledger ensures all parties can verify revenue splits.</p>
          </div>
        </div>
      </div>
    </section>

    ${Components.CTABanner(
      'Partner with Integrity',
      'Learn about enterprise partnerships built on these standards.',
      'Enterprise & Partnerships',
      '#/enterprise'
    )}

  </div>`;
}

Router.register('/governance', GovernancePage);
