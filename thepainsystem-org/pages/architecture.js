function ArchitecturePage() {
  return `
  <div class="page-content">

    <section class="page-hero">
      <div class="container">
        <span class="label">Architecture</span>
        <h1>System Architecture</h1>
        <p>Six integrated layers forming a complete venture operating system. Each layer is independent, composable, and purpose-built.</p>
      </div>
    </section>

    <!-- Architecture Diagram -->
    <section class="section section--alt">
      <div class="container">
        ${Components.SectionHeader('Overview', 'The Stack', 'From research and experimentation at the top to governance and compliance at the base.')}

        <div class="arch-diagram">
          <div class="arch-layer">
            <div class="arch-layer-num">01</div>
            <div class="arch-layer-content">
              <h4>AI Lab</h4>
              <p>Research, model experimentation, and intelligence layer</p>
            </div>
          </div>
          <div class="arch-connector">&#9661;</div>

          <div class="arch-layer">
            <div class="arch-layer-num">02</div>
            <div class="arch-layer-content">
              <h4>Hangar</h4>
              <p>Community incubation and early-stage venture development</p>
            </div>
          </div>
          <div class="arch-connector">&#9661;</div>

          <div class="arch-layer">
            <div class="arch-layer-num">03</div>
            <div class="arch-layer-content">
              <h4>Showroom</h4>
              <p>Commercial marketplace for validated, market-ready products</p>
            </div>
          </div>
          <div class="arch-connector">&#9661;</div>

          <div class="arch-layer">
            <div class="arch-layer-num">04</div>
            <div class="arch-layer-content">
              <h4>Distribution OS</h4>
              <p>Deployment, delivery, and operations infrastructure</p>
            </div>
          </div>
          <div class="arch-connector">&#9661;</div>

          <div class="arch-layer">
            <div class="arch-layer-num">05</div>
            <div class="arch-layer-content">
              <h4>Commerce Layer</h4>
              <p>Payments, licensing, subscriptions, and revenue ledger</p>
            </div>
          </div>
          <div class="arch-connector">&#9661;</div>

          <div class="arch-layer">
            <div class="arch-layer-num">06</div>
            <div class="arch-layer-content">
              <h4>Governance</h4>
              <p>Standards, quality gates, compliance, and council oversight</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Layer Details -->
    <section class="section">
      <div class="container">
        ${Components.SectionHeader('Deep Dive', 'Layer by Layer', 'What each component of the architecture is responsible for and how it connects to the rest of the system.')}

        <div class="pillar-detail">
          <h3><span>01</span> AI Lab</h3>
          <p>The intelligence layer of the Pain System. AI Lab provides the research and experimentation environment where models are developed, tested, and refined before being integrated into ventures.</p>
          <ul>
            <li>Model experimentation and benchmarking</li>
            <li>Data pipeline management</li>
            <li>Inference API endpoints for ventures</li>
            <li>A/B testing and evaluation frameworks</li>
            <li>Responsible AI guidelines enforcement</li>
            <li>Shared training infrastructure</li>
          </ul>
        </div>

        <div class="pillar-detail">
          <h3><span>02</span> Hangar</h3>
          <p>The community incubation space. Early-stage ventures build and iterate here using shared infrastructure, peer review, and standardised tooling. The Hangar is where ideas become prototypes and prototypes become candidates for commercialisation.</p>
          <ul>
            <li>Shared development environment</li>
            <li>Community code review and feedback</li>
            <li>Standardised project scaffolding</li>
            <li>Pre-built integrations with AI Lab</li>
            <li>Progress tracking against quality gates</li>
            <li>Peer collaboration and knowledge sharing</li>
          </ul>
        </div>

        <div class="pillar-detail">
          <h3><span>03</span> Showroom</h3>
          <p>The commercial marketplace. Products that pass the Hangar quality gates are promoted to the Showroom, where they are presented to buyers, enterprise customers, and distribution partners.</p>
          <ul>
            <li>Product catalogue and presentation</li>
            <li>Enterprise buyer discovery</li>
            <li>Demo and trial management</li>
            <li>Commercial licensing terms</li>
            <li>Revenue tracking via Spider Strategy</li>
            <li>Customer onboarding workflows</li>
          </ul>
        </div>

        <div class="pillar-detail">
          <h3><span>04</span> Distribution OS</h3>
          <p>The deployment and delivery backbone. Distribution OS handles the operational logistics of getting products from the Showroom to end users — reliably, at scale, across channels.</p>
          <ul>
            <li>Automated deployment pipelines</li>
            <li>Multi-channel distribution</li>
            <li>CDN and edge delivery</li>
            <li>Monitoring and observability</li>
            <li>Rollback and incident response</li>
            <li>Usage analytics and reporting</li>
          </ul>
        </div>

        <div class="pillar-detail">
          <h3><span>05</span> Commerce Layer</h3>
          <p>The financial engine. Handles all payment processing, subscription management, license issuance, and revenue recording. Every transaction writes to the Spider Strategy ledger for full transparency.</p>
          <ul>
            <li>Stripe-powered checkout and billing</li>
            <li>Subscription lifecycle management</li>
            <li>License generation and validation</li>
            <li>Webhook-driven payment confirmation</li>
            <li>Spider Strategy revenue ledger</li>
            <li>Fee calculation and net revenue tracking</li>
          </ul>
        </div>

        <div class="pillar-detail">
          <h3><span>06</span> Governance</h3>
          <p>The integrity layer. Governance defines the standards, quality gates, and compliance requirements that every venture and system component must meet. Enforced by the Enterprise Council.</p>
          <ul>
            <li>Quality gate definitions and criteria</li>
            <li>Code and product standards</li>
            <li>Compliance and ethics framework</li>
            <li>Council review and decision records</li>
            <li>Transparent promotion process</li>
            <li>Open architecture principles</li>
          </ul>
        </div>

      </div>
    </section>

    <!-- How They Connect -->
    <section class="section section--alt">
      <div class="container">
        ${Components.SectionHeader('Data Flow', 'How the Layers Connect', 'The architecture is designed for a natural downward flow — from research to revenue.')}

        <div class="grid grid--2">
          <div class="card">
            <h3>Incubation Path</h3>
            <p>Ventures start in the <strong>Hangar</strong> using <strong>AI Lab</strong> capabilities. They iterate until they meet the <strong>Governance</strong> quality gates, at which point they're promoted to the <strong>Showroom</strong>.</p>
          </div>
          <div class="card">
            <h3>Commercial Path</h3>
            <p>Showroom products are delivered via <strong>Distribution OS</strong>, monetised through the <strong>Commerce Layer</strong>, and tracked in the <strong>Spider Strategy</strong> ledger. Every step is auditable.</p>
          </div>
        </div>
      </div>
    </section>

    ${Components.CTABanner(
      'See It in Action',
      'Explore the ventures currently built on this architecture.',
      'View Ventures',
      '#/ventures'
    )}

  </div>`;
}

Router.register('/architecture', ArchitecturePage);
