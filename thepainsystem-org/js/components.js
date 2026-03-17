/**
 * Pain System — Shared UI Components
 */

function SiteHeader() {
  return `
  <header class="site-header">
    <div class="container">
      <a href="#/" class="site-logo">Pain<span>System</span></a>
      <nav class="site-nav" id="site-nav">
        <a href="#/">Home</a>
        <a href="#/about">About</a>
        <a href="#/architecture">Architecture</a>
        <a href="#/ventures">Ventures</a>
        <a href="#/governance">Governance</a>
        <a href="#/enterprise">Enterprise</a>
        <a href="#/contact">Contact</a>
      </nav>
      <button class="mobile-toggle" id="mobile-toggle" aria-label="Toggle navigation">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>`;
}

function SiteFooter() {
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="site-logo">Pain<span>System</span></div>
          <p>Building the infrastructure layer for venture-scale products. Open architecture, community-driven, commercially proven.</p>
        </div>
        <div class="footer-col">
          <h4>Platform</h4>
          <a href="#/architecture">Architecture</a>
          <a href="#/ventures">Ventures</a>
          <a href="#/governance">Governance</a>
        </div>
        <div class="footer-col">
          <h4>Organisation</h4>
          <a href="#/about">About</a>
          <a href="#/enterprise">Enterprise</a>
          <a href="#/contact">Contact</a>
        </div>
        <div class="footer-col">
          <h4>Ventures</h4>
          <a href="#/ventures">Voyage Smart Travel</a>
          <a href="#/ventures">Fraud Help Index</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; ${new Date().getFullYear()} Pain System. All rights reserved.</span>
        <span>Open Architecture &middot; Venture Infrastructure</span>
      </div>
    </div>
  </footer>`;
}

function SectionHeader(label, title, subtitle) {
  return `
  <div class="section-header">
    ${label ? `<span class="label">${label}</span>` : ''}
    <h2>${title}</h2>
    ${subtitle ? `<p>${subtitle}</p>` : ''}
  </div>`;
}

function Card(icon, title, text) {
  return `
  <div class="card">
    <div class="card-icon">${icon}</div>
    <h3>${title}</h3>
    <p>${text}</p>
  </div>`;
}

function VentureCard(name, status, statusClass, category, description) {
  return `
  <div class="card venture-card">
    <span class="venture-status ${statusClass}">${status}</span>
    <span class="label">${category}</span>
    <h3>${name}</h3>
    <p>${description}</p>
  </div>`;
}

function CTABanner(title, subtitle, btnText, btnHref) {
  return `
  <section class="cta-banner">
    <div class="container">
      <h2>${title}</h2>
      <p>${subtitle}</p>
      <a href="${btnHref}" class="btn btn--primary">${btnText}</a>
    </div>
  </section>`;
}

window.Components = { SiteHeader, SiteFooter, SectionHeader, Card, VentureCard, CTABanner };
