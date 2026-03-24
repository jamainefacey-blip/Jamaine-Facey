import Link from 'next/link';
import Layout from '../components/vst/Layout';

const COMPLIANCE_ITEMS = [
  {
    icon: '📋',
    title: 'Policy enforcement at booking',
    body: 'Travel policies are applied at the point of search — not as a post-booking check. Travellers only see options that comply. Edge cases are flagged and routed for approval before anything is confirmed.',
  },
  {
    icon: '✅',
    title: 'Configurable approval workflows',
    body: 'Define who approves what, based on trip type, cost, destination, or traveller role. Single-tier or multi-tier workflows, set once and applied consistently across the organisation.',
  },
  {
    icon: '⚠️',
    title: 'Spend limit alerts',
    body: 'Budget thresholds at department, cost centre, or individual level. Alerts trigger when spend trends toward limits — before the limit is breached, not after.',
  },
  {
    icon: '🌍',
    title: 'Duty of care monitoring',
    body: 'VST tracks active trips in real time. When disruptions, delays, or safety events affect travellers in your organisation, relevant managers are notified automatically — without manual tracking.',
  },
  {
    icon: '📁',
    title: 'Full audit trail',
    body: 'Every booking, approval, override, and expense record is logged with timestamp and user attribution. Audit-ready reports available on demand. Suitable for internal review and external audit requirements.',
  },
  {
    icon: '🔒',
    title: 'Data handling and privacy',
    body: 'VST is built for UK data residency requirements. Traveller data is processed and stored in line with UK GDPR. Data retention controls are available at organisational level.',
  },
];

export default function Compliance() {
  return (
    <Layout
      title="Compliance"
      description="How Voyage Smart Travels handles travel policy compliance, spend controls, duty of care, and audit requirements."
    >
      <section className="vst-page-hero">
        <div className="vst-container">
          <span className="vst-label vst-page-hero__label">Compliance</span>
          <h1 className="vst-h1 vst-page-hero__title" style={{ marginTop: 8, marginBottom: 16 }}>
            Compliance that actually works
          </h1>
          <p className="vst-lead vst-page-hero__sub">
            Policy enforcement, spend oversight, duty of care, and full audit trail — built in, not bolted on.
          </p>
        </div>
      </section>

      {/* Main compliance features */}
      <section className="vst-section">
        <div className="vst-container">
          <div className="vst-section-head">
            <span className="vst-label">What's covered</span>
            <h2 className="vst-h2">Every compliance angle, addressed</h2>
          </div>
          <div style={{ border: '1px solid var(--vst-border)', borderRadius: 16, overflow: 'hidden' }}>
            {COMPLIANCE_ITEMS.map((item, i) => (
              <div key={item.title} className="vst-comp-item" style={{
                borderBottom: i < COMPLIANCE_ITEMS.length - 1 ? '1px solid var(--vst-border)' : 'none',
              }}>
                <div className="vst-comp-icon">{item.icon}</div>
                <div>
                  <div className="vst-comp-title">{item.title}</div>
                  <div className="vst-comp-body">{item.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Public sector suitability */}
      <section className="vst-section vst-section--alt">
        <div className="vst-container">
          <div style={{ maxWidth: 680 }}>
            <span className="vst-label">Public Sector</span>
            <h2 className="vst-h2">Suitable for public sector compliance requirements</h2>
            <p className="vst-lead" style={{ marginTop: 12 }}>
              VST is designed with the spending controls, audit requirements, and accountability expectations of UK public bodies in mind.
            </p>
            <ul className="vst-checklist mt-8">
              <li>Configurable approval tiers to match your authority matrix</li>
              <li>Spend limit enforcement aligned to procurement rules</li>
              <li>Full audit trail accessible by finance and compliance teams</li>
              <li>UK GDPR-aligned data handling with no third-country transfers by default</li>
              <li>Commercial terms compatible with framework procurement routes</li>
            </ul>
            <div style={{ marginTop: 12, padding: '12px 16px', background: '#FEF9EF', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 14, color: '#92400E' }}>
              VST does not claim specific regulatory certifications. We make commercially reasonable claims about our compliance posture. Speak with us directly to assess suitability for your specific requirements.
            </div>
            <div className="mt-8">
              <Link href="/demo" className="vst-btn vst-btn--primary">
                Speak to our team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ava + compliance */}
      <section className="vst-section">
        <div className="vst-container">
          <div className="vst-section-head">
            <span className="vst-label">Ava — Compliance Intelligence</span>
            <h2 className="vst-h2">Ava supports compliance — it doesn't override it</h2>
          </div>
          <div className="vst-grid-3">
            {[
              { title: 'Policy flag, not policy bypass', body: 'Ava surfaces non-compliant options with context — it highlights the issue and routes to the right person. It cannot override a policy rule.' },
              { title: 'Spend anomaly detection', body: 'Ava identifies unusual spend patterns and alerts managers. This supplements human review — it doesn\'t replace it.' },
              { title: 'Audit-readable explanations', body: 'When Ava recommends or flags something, the reasoning is logged and readable by compliance and audit teams.' },
            ].map(c => (
              <div key={c.title} className="vst-card">
                <div className="vst-ava-chip">Ava</div>
                <div className="vst-card__title">{c.title}</div>
                <div className="vst-card__body">{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="vst-cta-banner">
        <div className="vst-container">
          <h2 className="vst-cta-banner__title">See our compliance controls in detail</h2>
          <p className="vst-cta-banner__sub">Book a demo and we'll walk through the policy and approval configuration for your organisation.</p>
          <div className="vst-cta-banner__btns">
            <Link href="/demo" className="vst-btn vst-btn--primary vst-btn--lg">Book a Demo</Link>
            <Link href="/pricing" className="vst-btn vst-btn--ghost-light vst-btn--lg">View Pricing</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
