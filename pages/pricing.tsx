import Link from 'next/link';
import Layout from '../components/vst/Layout';

const PLANS = [
  {
    name: 'Starter',
    price: '0',
    cadence: 'Free forever',
    badge: null,
    featured: false,
    features: [
      'Up to 5 active travellers',
      'Policy-enforced booking',
      'Basic approval workflow',
      'Email notifications',
      'Standard expense reporting',
      { text: 'Ava AI assistant', na: true },
      { text: 'Custom approval tiers', na: true },
      { text: 'Duty-of-care alerts', na: true },
      { text: 'Priority support', na: true },
    ],
    cta: 'Start Free',
    ctaHref: '/signup',
    ctaStyle: 'secondary',
  },
  {
    name: 'Business',
    price: '49',
    cadence: 'per seat / month',
    badge: 'Most popular',
    featured: true,
    features: [
      'Unlimited travellers',
      'Policy-enforced booking',
      'Multi-tier approvals',
      'Real-time spend reporting',
      'Duty-of-care monitoring',
      'Ava AI assistant',
      'Preferred supplier routing',
      'Department-level reporting',
      { text: 'Dedicated account manager', na: true },
    ],
    cta: 'Start Free Trial',
    ctaHref: '/signup',
    ctaStyle: 'primary',
  },
  {
    name: 'Enterprise',
    price: '299',
    cadence: 'flat / month',
    badge: null,
    featured: false,
    features: [
      'Unlimited seats',
      'All Business features',
      'Custom travel policy engine',
      'SSO / directory integration',
      'Custom reporting exports',
      'Dedicated account manager',
      'SLA-backed support',
      'UK data residency option',
      'Framework procurement support',
    ],
    cta: 'Book a Demo',
    ctaHref: '/demo',
    ctaStyle: 'secondary',
  },
];

const FAQ = [
  {
    q: 'Is there a contract or lock-in?',
    a: 'No. Starter is free with no time limit. Business and Enterprise are billed monthly and you can cancel at any time.',
  },
  {
    q: 'What counts as a "seat"?',
    a: 'A seat is an active user account in your organisation — someone who can log in, book travel, or manage approvals.',
  },
  {
    q: 'Can I upgrade or downgrade mid-month?',
    a: 'Yes. Plan changes take effect on your next billing cycle. You can downgrade from Business to Starter at any time.',
  },
  {
    q: 'Is the Enterprise price really flat?',
    a: 'Yes. £299/month covers unlimited seats, unlimited trips. No per-booking fees, no seat caps.',
  },
  {
    q: 'Do you offer public sector pricing?',
    a: 'Yes. Enterprise can be structured for public sector procurement. Contact us to discuss framework-compatible pricing.',
  },
];

type Feature = string | { text: string; na: boolean };

export default function Pricing() {
  return (
    <Layout
      title="Pricing"
      description="Voyage Smart Travels pricing — Starter free, Business £49/seat/month, Enterprise £299/month flat."
    >
      <section className="vst-page-hero">
        <div className="vst-container">
          <span className="vst-label vst-page-hero__label">Pricing</span>
          <h1 className="vst-h1 vst-page-hero__title" style={{ marginTop: 8, marginBottom: 16 }}>
            Simple, honest pricing
          </h1>
          <p className="vst-lead vst-page-hero__sub">
            No per-booking fees. No hidden charges. Start free and scale when you're ready.
          </p>
        </div>
      </section>

      <section className="vst-section">
        <div className="vst-container">
          <div className="vst-pricing-grid">
            {PLANS.map(p => (
              <div key={p.name} className={`vst-plan ${p.featured ? 'vst-plan--featured' : ''}`}>
                {p.badge && <div className="vst-plan__badge">{p.badge}</div>}
                <div className="vst-plan__name">{p.name}</div>
                <div className="vst-plan__price">
                  {p.price === '0' ? 'Free' : <><sup>£</sup>{p.price}</>}
                </div>
                <div className="vst-plan__cadence">{p.cadence}</div>
                <ul className="vst-plan__features">
                  {p.features.map((f: Feature) => {
                    const isObj = typeof f === 'object';
                    return (
                      <li key={isObj ? f.text : f} className={isObj && f.na ? 'na' : ''}>
                        {isObj ? f.text : f}
                      </li>
                    );
                  })}
                </ul>
                <Link
                  href={p.ctaHref}
                  className={`vst-btn vst-btn--full ${p.ctaStyle === 'primary' ? 'vst-btn--primary' : 'vst-btn--secondary'}`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--vst-muted)', marginTop: 24 }}>
            All prices exclude VAT. Business trial includes 14 days of full access. No credit card required.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="vst-section vst-section--alt">
        <div className="vst-container">
          <div className="vst-section-head vst-section-head--center">
            <span className="vst-label">FAQ</span>
            <h2 className="vst-h2">Common questions</h2>
          </div>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {FAQ.map((f, i) => (
              <div key={i} style={{
                padding: '24px 0',
                borderBottom: i < FAQ.length - 1 ? '1px solid var(--vst-border)' : 'none',
              }}>
                <div style={{ fontWeight: 700, color: 'var(--vst-navy)', marginBottom: 8, fontSize: 15 }}>{f.q}</div>
                <div style={{ fontSize: 14, color: 'var(--vst-muted)', lineHeight: 1.65 }}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="vst-cta-banner">
        <div className="vst-container">
          <h2 className="vst-cta-banner__title">Not sure which plan is right?</h2>
          <p className="vst-cta-banner__sub">Talk to us. We'll help you find the right fit for your team.</p>
          <div className="vst-cta-banner__btns">
            <Link href="/demo" className="vst-btn vst-btn--primary vst-btn--lg">Book a Demo</Link>
            <Link href="/signup" className="vst-btn vst-btn--ghost-light vst-btn--lg">Start Free</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
