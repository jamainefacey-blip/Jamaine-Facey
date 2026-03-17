function HomePage() {
  return `
  <div class="page-content">

    <!-- Hero -->
    <section class="hero">
      <div class="hero-content">
        <span class="label">Venture Infrastructure</span>
        <h1>The Pain System</h1>
        <p>An open architecture for building, launching, and scaling venture-grade products. From incubation to commercial distribution.</p>
        <div class="hero-actions">
          <a href="#/architecture" class="btn btn--primary">Explore the Architecture</a>
          <a href="#/ventures" class="btn btn--outline">View Ventures</a>
        </div>
      </div>
    </section>

    <!-- Overview -->
    <section class="section section--alt">
      <div class="container">
        ${Components.SectionHeader('What We Build', 'Infrastructure for Ventures', 'Pain System provides the foundational layers that product teams need — from AI research tooling to commercial distribution — so ventures can focus on solving real problems.')}

        <div class="grid grid--3">
          ${Components.Card('&#9670;', 'Open Architecture', 'A modular, composable system where every layer is independent yet integrated. Build with the pieces you need.')}
          ${Components.Card('&#9672;', 'Venture-First Design', 'Every component exists to serve ventures. From prototype to production, the system accelerates the path to market.')}
          ${Components.Card('&#9671;', 'Community-Driven', 'The Hangar incubation layer invites builders to develop, test, and refine ideas with shared infrastructure support.')}
        </div>
      </div>
    </section>

    <!-- Architecture Snapshot -->
    <section class="section">
      <div class="container">
        ${Components.SectionHeader('Architecture', 'Six Integrated Layers', 'Each layer of the Pain System handles a distinct responsibility — together they form a complete venture operating system.')}

        <div class="grid grid--3">
          ${Components.Card('01', 'AI Lab', 'Research, experimentation, and model development environment. The intelligence layer behind Pain System ventures.')}
          ${Components.Card('02', 'Hangar', 'Community incubation space. Early-stage ventures build, iterate, and validate with shared tooling and peer review.')}
          ${Components.Card('03', 'Showroom', 'Commercial marketplace. Validated products graduate from the Hangar and are presented to buyers and enterprise partners.')}
          ${Components.Card('04', 'Distribution OS', 'Deployment, delivery, and operations layer. Handles the logistics of getting products to users at scale.')}
          ${Components.Card('05', 'Commerce Layer', 'Payments, licensing, subscriptions, and revenue infrastructure. Every transaction tracked in the Spider Strategy ledger.')}
          ${Components.Card('06', 'Governance', 'Standards, quality gates, compliance, and the council structure that maintains system integrity.')}
        </div>
      </div>
    </section>

    <!-- Featured Ventures -->
    <section class="section section--alt">
      <div class="container">
        ${Components.SectionHeader('Ventures', 'Active Portfolio', 'Products built on Pain System infrastructure, progressing through the incubation and commercialisation pipeline.')}

        <div class="grid grid--2">
          ${Components.VentureCard(
            'Voyage Smart Travel',
            'Active',
            'venture-status--active',
            'Travel &middot; AI-Powered',
            'Intelligent travel planning and booking platform. Uses AI Lab models for personalised itinerary generation, dynamic pricing analysis, and real-time travel optimisation.'
          )}
          ${Components.VentureCard(
            'Fraud Help Index',
            'Incubation',
            'venture-status--incubation',
            'FinTech &middot; Consumer Protection',
            'Consumer fraud awareness and prevention tool. Aggregates known fraud patterns, provides risk scoring, and connects victims with resolution pathways.'
          )}
        </div>
      </div>
    </section>

    <!-- CTA -->
    ${Components.CTABanner(
      'Build With Us',
      'Explore partnership models, submit a venture proposal, or learn more about the architecture.',
      'Get in Touch',
      '#/contact'
    )}

  </div>`;
}

Router.register('/', HomePage);
