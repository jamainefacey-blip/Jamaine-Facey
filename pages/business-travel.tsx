import Link from 'next/link';
import Layout from '../components/vst/Layout';

const OUTCOMES = [
  {
    role: 'Travel Managers',
    icon: '🗂',
    points: [
      'Single dashboard for all bookings across the organisation',
      'Policy enforcement without manual review of every booking',
      'Supplier performance and spend reporting built in',
      'Traveller tracking and duty-of-care alerts',
    ],
  },
  {
    role: 'Finance & Ops',
    icon: '📊',
    points: [
      'Real-time spend by department, cost centre, or trip type',
      'Automated reconciliation — no end-of-month data gathering',
      'Budget alerts before limits are breached',
      'Clean audit trail for every transaction',
    ],
  },
  {
    role: 'SME Leadership',
    icon: '🏢',
    points: [
      'Full visibility without being in every approval chain',
      'Travel policy that enforces itself',
      'No dedicated travel team required to operate it',
      'Scales from 5 to 500 travellers without process change',
    ],
  },
  {
    role: 'Procurement',
    icon: '📋',
    points: [
      'Preferred supplier routing built into booking flow',
      'Spend data to support supplier negotiation and review',
      'Category-level reporting for travel as a managed cost',
      'Policy compliance data to evidence controlled spend',
    ],
  },
];

const PROBLEMS = [
  { label: 'Booking tools employees ignore', solution: 'Policy-enforced booking inside a single, simple interface' },
  { label: 'Expense claims filed weeks later', solution: 'Automatic expense records created at point of booking' },
  { label: 'Approval chains that slow everything down', solution: 'Within-policy trips auto-approved; exceptions fast-tracked' },
  { label: 'No idea where your people are', solution: 'Live trip status with automated disruption alerts' },
  { label: 'Month-end data reconciliation headaches', solution: 'Real-time spend reporting, always up to date' },
];

export default function BusinessTravel() {
  return (
    <Layout
      title="Business Travel"
      description="How Voyage Smart Travels transforms business travel management for UK SMEs, travel managers, and public sector teams."
    >
      <section className="vst-page-hero">
        <div className="vst-container">
          <span className="vst-label vst-page-hero__label">Business Travel</span>
          <h1 className="vst-h1 vst-page-hero__title" style={{ marginTop: 8, marginBottom: 16 }}>
            A better way to manage business travel at scale
          </h1>
          <p className="vst-lead vst-page-hero__sub">
            Whether you're managing 10 trips a month or 1,000, VST removes the operational overhead without removing the oversight.
          </p>
        </div>
      </section>

      {/* Problems / Solutions */}
      <section className="vst-section">
        <div className="vst-container">
          <div className="vst-section-head">
            <span className="vst-label">The problems VST solves</span>
            <h2 className="vst-h2">Built around what actually goes wrong</h2>
          </div>
          <div style={{ border: '1px solid var(--vst-border)', borderRadius: 16, overflow: 'hidden' }}>
            {PROBLEMS.map((p, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 0,
                borderBottom: i < PROBLEMS.length - 1 ? '1px solid var(--vst-border)' : 'none',
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                  <div style={{
                    flex: '1 1 240px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    borderRight: '1px solid var(--vst-border)',
                  }}>
                    <span style={{ color: '#EF4444', fontSize: 16, marginTop: 2 }}>✕</span>
                    <span style={{ fontSize: 15, color: 'var(--vst-text)', fontWeight: 500 }}>{p.label}</span>
                  </div>
                  <div style={{
                    flex: '1 1 240px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    background: 'var(--vst-bg-alt)',
                  }}>
                    <span style={{ color: '#059669', fontSize: 16, marginTop: 2, fontWeight: 700 }}>✓</span>
                    <span style={{ fontSize: 15, color: 'var(--vst-text)' }}>{p.solution}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes by role */}
      <section className="vst-section vst-section--alt">
        <div className="vst-container">
          <div className="vst-section-head vst-section-head--center">
            <span className="vst-label">Value by role</span>
            <h2 className="vst-h2">The right outcome for every stakeholder</h2>
          </div>
          <div className="vst-grid-2">
            {OUTCOMES.map(o => (
              <div key={o.role} className="vst-card vst-card--shadow">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 24 }}>{o.icon}</span>
                  <div className="vst-h3">{o.role}</div>
                </div>
                <ul className="vst-checklist">
                  {o.points.map(p => <li key={p}>{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Public sector */}
      <section className="vst-section">
        <div className="vst-container">
          <div style={{ maxWidth: 680 }}>
            <span className="vst-label">Public Sector</span>
            <h2 className="vst-h2">Procurement-friendly and policy-ready</h2>
            <p className="vst-lead" style={{ marginTop: 12 }}>
              VST is designed with public sector procurement realities in mind. Straightforward commercial structure, transparent data handling, and a compliance posture that supports responsible spend decisions.
            </p>
            <ul className="vst-checklist mt-8">
              <li>Flat monthly pricing — no variable per-booking fees</li>
              <li>Full audit trail for every booking and approval</li>
              <li>UK data residency options available</li>
              <li>Suitable for framework procurement routes</li>
              <li>Ava assists with policy adherence, not autonomy over spend</li>
            </ul>
            <div className="mt-8">
              <Link href="/demo" className="vst-btn vst-btn--primary">
                Talk to our public sector team
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="vst-cta-banner">
        <div className="vst-container">
          <h2 className="vst-cta-banner__title">Start managing travel properly</h2>
          <p className="vst-cta-banner__sub">Free tier available. No implementation project required.</p>
          <div className="vst-cta-banner__btns">
            <Link href="/signup" className="vst-btn vst-btn--primary vst-btn--lg">Start Free</Link>
            <Link href="/pricing" className="vst-btn vst-btn--ghost-light vst-btn--lg">View Pricing</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
