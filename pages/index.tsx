import Link from 'next/link';
import Layout from '../components/vst/Layout';

const BENEFITS = [
  {
    icon: '✈',
    title: 'Smarter Booking',
    body: 'Ava surfaces the best-value options across rail, air, and accommodation — aligned to your travel policy, not just price.',
  },
  {
    icon: '✓',
    title: 'Built-in Compliance',
    body: 'Policy rules enforced at the point of booking. No more post-trip exceptions, approvals backlog, or audit headaches.',
  },
  {
    icon: '£',
    title: 'Expense Visibility',
    body: 'Real-time spend reporting. Reconcile travel costs against budget lines without spreadsheets or manual exports.',
  },
  {
    icon: '⚑',
    title: 'Duty of Care',
    body: 'Know where your people are. Receive alerts for disruptions, delays, and safety incidents affecting active travellers.',
  },
];

const SECTORS = ['SMEs', 'Public Sector', 'Procurement Teams', 'Ops & Finance', 'Travel Managers'];

export default function Home() {
  return (
    <Layout>
      {/* Hero */}
      <section className="vst-hero">
        <div className="vst-container">
          <div className="vst-hero__content">
            <div className="vst-hero__eyebrow">
              ✦ Meet Ava — your AI travel assistant
            </div>
            <h1 className="vst-hero__title">
              Business travel, <em>managed properly</em>
            </h1>
            <p className="vst-hero__sub">
              Voyage Smart Travels gives UK SMEs and public sector teams a smarter way to book, manage, and report on business travel. Less admin, more oversight, full compliance.
            </p>
            <div className="vst-hero__ctas">
              <Link href="/signup" className="vst-btn vst-btn--primary vst-btn--lg">
                Start Free
              </Link>
              <Link href="/demo" className="vst-btn vst-btn--ghost-light vst-btn--lg">
                Book a Demo
              </Link>
            </div>

            <div className="vst-hero__stats">
              <div>
                <div className="vst-hero__stat-num">40%</div>
                <div className="vst-hero__stat-label">avg time saved on booking</div>
              </div>
              <div>
                <div className="vst-hero__stat-num">100%</div>
                <div className="vst-hero__stat-label">policy-compliant by default</div>
              </div>
              <div>
                <div className="vst-hero__stat-num">1 platform</div>
                <div className="vst-hero__stat-label">for booking, approvals & reporting</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="vst-trust">
        <div className="vst-container">
          <div className="vst-trust__inner">
            <span className="vst-trust__item"><span className="icon">✓</span> UK-based</span>
            <span className="vst-trust__item"><span className="icon">✓</span> Public sector ready</span>
            <span className="vst-trust__item"><span className="icon">✓</span> GDPR compliant</span>
            <span className="vst-trust__item"><span className="icon">✓</span> No long-term contract required</span>
            <span className="vst-trust__item"><span className="icon">✓</span> Free tier available</span>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <section className="vst-section">
        <div className="vst-container">
          <div className="vst-section-head vst-section-head--center">
            <span className="vst-label">Why VST</span>
            <h2 className="vst-h2">Everything your team needs. Nothing it doesn't.</h2>
            <p className="vst-lead">
              Built around how UK organisations actually manage travel — not how a US enterprise platform assumes they do.
            </p>
          </div>
          <div className="vst-grid-2">
            {BENEFITS.map(b => (
              <div key={b.title} className="vst-card vst-card--shadow">
                <div className="vst-card__icon">{b.icon}</div>
                <div className="vst-card__title">{b.title}</div>
                <div className="vst-card__body">{b.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ava section */}
      <section className="vst-section vst-section--alt">
        <div className="vst-container">
          <div style={{ maxWidth: 640 }}>
            <span className="vst-label">Ava — AI Assistant</span>
            <h2 className="vst-h2">Your travel manager, always on</h2>
            <p className="vst-lead" style={{ marginTop: 12 }}>
              Ava handles the routine so your team doesn't have to. From finding policy-compliant options to flagging spend anomalies, she works quietly in the background — surfacing the right information at the right moment.
            </p>
            <ul className="vst-checklist mt-8">
              <li>Recommends travel options based on policy, budget, and preference</li>
              <li>Flags non-compliant bookings before they're confirmed</li>
              <li>Summarises spend by department, trip type, or traveller</li>
              <li>Alerts managers to duty-of-care events automatically</li>
            </ul>
            <div className="mt-8">
              <Link href="/how-it-works" className="vst-btn vst-btn--primary">
                See how Ava works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section className="vst-section vst-section--dark">
        <div className="vst-container">
          <div className="vst-section-head vst-section-head--center">
            <span className="vst-label">Who it's for</span>
            <h2 className="vst-h2">Built for the way UK teams work</h2>
            <p className="vst-lead">
              Whether you're an SME with 20 travelling employees or a public sector team managing supplier visits and site inspections — VST fits without a lengthy implementation.
            </p>
          </div>
          <div className="vst-grid-4" style={{ maxWidth: 700, margin: '0 auto' }}>
            {SECTORS.map(s => (
              <div key={s} style={{
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: 8,
                padding: '14px 16px',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                textAlign: 'center',
              }}>
                {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="vst-section">
        <div className="vst-container">
          <div className="vst-section-head vst-section-head--center">
            <span className="vst-label">Pricing</span>
            <h2 className="vst-h2">Free to start. Scales with you.</h2>
            <p className="vst-lead">No per-booking fees. No surprise charges.</p>
          </div>
          <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/pricing" className="vst-btn vst-btn--primary vst-btn--lg">
              View all plans
            </Link>
            <Link href="/demo" className="vst-btn vst-btn--secondary vst-btn--lg">
              Talk to us first
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="vst-cta-banner">
        <div className="vst-container">
          <h2 className="vst-cta-banner__title">Ready to take control of business travel?</h2>
          <p className="vst-cta-banner__sub">
            Set up in minutes. No credit card required. Cancel any time.
          </p>
          <div className="vst-cta-banner__btns">
            <Link href="/signup" className="vst-btn vst-btn--primary vst-btn--lg">Start Free</Link>
            <Link href="/demo" className="vst-btn vst-btn--ghost-light vst-btn--lg">Book Demo</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
