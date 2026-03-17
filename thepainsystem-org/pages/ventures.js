function VenturesPage() {
  return `
  <div class="page-content">

    <section class="page-hero">
      <div class="container">
        <span class="label">Ventures</span>
        <h1>Portfolio</h1>
        <p>Products built on Pain System infrastructure. Each venture uses shared layers for AI, commerce, and distribution.</p>
      </div>
    </section>

    <!-- Active Ventures -->
    <section class="section section--alt">
      <div class="container">
        ${Components.SectionHeader('Active', 'Current Ventures', 'Products at various stages of the incubation and commercialisation pipeline.')}

        <div class="grid grid--2">
          <div class="card venture-card">
            <span class="venture-status venture-status--active">Active</span>
            <span class="label">Travel &middot; AI-Powered</span>
            <h3>Voyage Smart Travel</h3>
            <p style="margin-bottom: var(--space-4);">Intelligent travel planning and booking platform. Uses AI Lab models for personalised itinerary generation, dynamic pricing analysis, and real-time travel optimisation.</p>
            <h4 style="font-size: var(--text-sm); margin-bottom: var(--space-3);">Pain System Layers Used</h4>
            <ul style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
              <li style="font-size: var(--text-xs); background: rgba(233,69,96,0.12); color: var(--color-accent); padding: var(--space-1) var(--space-3); border-radius: 100px;">AI Lab</li>
              <li style="font-size: var(--text-xs); background: rgba(233,69,96,0.12); color: var(--color-accent); padding: var(--space-1) var(--space-3); border-radius: 100px;">Commerce Layer</li>
              <li style="font-size: var(--text-xs); background: rgba(233,69,96,0.12); color: var(--color-accent); padding: var(--space-1) var(--space-3); border-radius: 100px;">Distribution OS</li>
            </ul>
          </div>

          <div class="card venture-card">
            <span class="venture-status venture-status--incubation">Incubation</span>
            <span class="label">FinTech &middot; Consumer Protection</span>
            <h3>Fraud Help Index</h3>
            <p style="margin-bottom: var(--space-4);">Consumer fraud awareness and prevention tool. Aggregates known fraud patterns, provides risk scoring, and connects victims with resolution pathways.</p>
            <h4 style="font-size: var(--text-sm); margin-bottom: var(--space-3);">Pain System Layers Used</h4>
            <ul style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
              <li style="font-size: var(--text-xs); background: rgba(233,69,96,0.12); color: var(--color-accent); padding: var(--space-1) var(--space-3); border-radius: 100px;">AI Lab</li>
              <li style="font-size: var(--text-xs); background: rgba(233,69,96,0.12); color: var(--color-accent); padding: var(--space-1) var(--space-3); border-radius: 100px;">Hangar</li>
              <li style="font-size: var(--text-xs); background: rgba(233,69,96,0.12); color: var(--color-accent); padding: var(--space-1) var(--space-3); border-radius: 100px;">Governance</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Pipeline -->
    <section class="section">
      <div class="container">
        ${Components.SectionHeader('Pipeline', 'Incubation to Commercialisation', 'Every Pain System venture follows the same transparent path from idea to market.')}

        <div class="grid grid--3">
          <div class="card" style="text-align: center;">
            <div class="card-icon" style="margin: 0 auto var(--space-4);">01</div>
            <h3>Hangar Entry</h3>
            <p>Venture proposal is accepted into the Hangar. The team gets access to shared infrastructure, AI Lab tooling, and community review.</p>
          </div>
          <div class="card" style="text-align: center;">
            <div class="card-icon" style="margin: 0 auto var(--space-4);">02</div>
            <h3>Quality Gates</h3>
            <p>The venture builds towards defined standards: code quality, user validation, commercial viability, and compliance readiness. Progress is tracked transparently.</p>
          </div>
          <div class="card" style="text-align: center;">
            <div class="card-icon" style="margin: 0 auto var(--space-4);">03</div>
            <h3>Showroom Promotion</h3>
            <p>Once all gates are passed, the Governance Council reviews and promotes the venture to the Showroom for commercial distribution.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Venture Criteria -->
    <section class="section section--alt">
      <div class="container">
        ${Components.SectionHeader('Criteria', 'What We Look For', 'Pain System ventures share common attributes that align with the ecosystem\'s goals.')}

        <div class="grid grid--2">
          <div class="gov-block">
            <h3>Venture Fit</h3>
            <ul>
              <li>Solves a genuine, measurable problem</li>
              <li>Benefits from shared infrastructure layers</li>
              <li>Has a viable path to commercial sustainability</li>
              <li>Can be built with the current architecture stack</li>
            </ul>
          </div>
          <div class="gov-block">
            <h3>Team & Commitment</h3>
            <ul>
              <li>Committed to open architecture principles</li>
              <li>Willing to build within governance standards</li>
              <li>Engaged with the Hangar community process</li>
              <li>Focused on long-term value, not rapid extraction</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    ${Components.CTABanner(
      'Propose a Venture',
      'Have an idea that fits the Pain System architecture? Get in touch.',
      'Contact Us',
      '#/contact'
    )}

  </div>`;
}

Router.register('/ventures', VenturesPage);
