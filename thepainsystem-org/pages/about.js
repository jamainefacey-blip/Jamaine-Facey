function AboutPage() {
  return `
  <div class="page-content">

    <section class="page-hero">
      <div class="container">
        <span class="label">About</span>
        <h1>The Pain System</h1>
        <p>An infrastructure-first approach to building ventures that solve real problems at scale.</p>
      </div>
    </section>

    <!-- Mission & Vision -->
    <section class="section section--alt">
      <div class="container">
        <div class="grid grid--2">
          <div>
            <span class="label">Mission</span>
            <h3>Eliminate the infrastructure tax on builders</h3>
            <p style="color: var(--color-text-muted); margin-top: var(--space-4);">
              Every venture faces the same foundational challenges: payments, distribution, compliance, deployment.
              The Pain System provides these layers as shared infrastructure so product teams can focus entirely
              on the problem they set out to solve.
            </p>
          </div>
          <div>
            <span class="label">Vision</span>
            <h3>A composable operating system for ventures</h3>
            <p style="color: var(--color-text-muted); margin-top: var(--space-4);">
              We see a future where launching a commercially viable product is an act of creativity — not
              an exercise in reinventing infrastructure. Pain System is the platform that makes this possible,
              from first prototype to global distribution.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Principles -->
    <section class="section">
      <div class="container">
        ${Components.SectionHeader('Principles', 'What Drives Us', 'The core beliefs that shape every architectural decision and governance policy within the Pain System.')}

        <div class="grid grid--3">
          ${Components.Card('&#8594;', 'Open Architecture', 'Every layer is modular and independently deployable. Ventures choose the components they need without inheriting complexity they don\'t.')}
          ${Components.Card('&#8594;', 'Venture-First', 'Infrastructure exists to serve products, not the other way around. If a layer doesn\'t directly accelerate a venture, it doesn\'t belong in the system.')}
          ${Components.Card('&#8594;', 'Earned Graduation', 'Products move from Hangar to Showroom through quality gates — not politics. Standards are transparent, measurable, and consistently applied.')}
          ${Components.Card('&#8594;', 'Community Ownership', 'The Hangar is community-powered. Builders contribute, review, and improve each other\'s work within a shared framework of standards.')}
          ${Components.Card('&#8594;', 'Revenue Transparency', 'The Spider Strategy ledger records every transaction. Revenue, fees, and net outcomes are tracked at the system level.')}
          ${Components.Card('&#8594;', 'Long-Term Thinking', 'We optimise for durable ventures, not rapid extraction. Architecture decisions favour longevity, maintainability, and responsible growth.')}
        </div>
      </div>
    </section>

    <!-- Timeline -->
    <section class="section section--alt">
      <div class="container">
        ${Components.SectionHeader('Journey', 'Milestones', 'Key moments in the development of the Pain System ecosystem.')}

        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-date">Foundation</div>
            <h4>System Architecture Defined</h4>
            <p>The six-layer architecture was formalised: AI Lab, Hangar, Showroom, Distribution OS, Commerce Layer, and Governance. Each layer assigned clear boundaries and responsibilities.</p>
          </div>
          <div class="timeline-item">
            <div class="timeline-date">Infrastructure</div>
            <h4>Commerce Layer Built</h4>
            <p>Stripe-powered commerce engine deployed with licensing, subscription management, and the Spider Strategy revenue ledger.</p>
          </div>
          <div class="timeline-item">
            <div class="timeline-date">Incubation</div>
            <h4>First Ventures Enter the Hangar</h4>
            <p>Voyage Smart Travel and Fraud Help Index begin development on Pain System infrastructure, validating the incubation model.</p>
          </div>
          <div class="timeline-item">
            <div class="timeline-date">Present</div>
            <h4>Ecosystem Expansion</h4>
            <p>The Pain System umbrella takes shape with governance standards, partnership frameworks, and the public-facing ecosystem site.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Leadership Model -->
    <section class="section">
      <div class="container">
        ${Components.SectionHeader('Leadership', 'Governance-Led Organisation', 'Pain System is governed by principles and process — not personality. Decision-making is distributed across councils with clear mandates.')}

        <div class="grid grid--2">
          <div class="card">
            <h3>Council Structure</h3>
            <p>Strategic decisions are made by the Enterprise Council, composed of domain experts across technology, commerce, and venture development. No single point of authority.</p>
          </div>
          <div class="card">
            <h3>Standards-Based Promotion</h3>
            <p>Ventures graduate from Hangar to Showroom based on objective quality gates — code quality, commercial viability, user validation, and compliance readiness.</p>
          </div>
        </div>
      </div>
    </section>

    ${Components.CTABanner(
      'Explore the Architecture',
      'See how the six layers of the Pain System work together.',
      'View Architecture',
      '#/architecture'
    )}

  </div>`;
}

Router.register('/about', AboutPage);
