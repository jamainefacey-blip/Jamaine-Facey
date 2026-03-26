import Link from 'next/link';
import Layout from '../components/vst/Layout';

const WHY_VST = [
  {
    headline: 'One platform for the whole journey',
    body: 'Search, book, approve, report — no tool-switching, no shadow systems, no manual reconciliation at month end.',
  },
  {
    headline: 'Built around UK travel patterns',
    body: 'Rail-first search, GDS air access, UK hotel inventory — and a policy engine that mirrors how British organisations actually run.',
  },
  {
    headline: 'Fast to deploy. No project required.',
    body: 'Connect your team in hours, not weeks. No implementation partner, no data migration, no six-month rollout.',
  },
];

const AVA_FEATURES = [
  'Surfaces the most policy-compliant, cost-effective options first',
  'Flags non-compliant selections before they are confirmed',
  'Summarises trip spend by traveller, department, or cost centre',
  'Sends real-time alerts for delays, cancellations, and safety events',
  'Answers expense queries and produces itemised summaries on demand',
];

const COMPLIANCE_POINTS = [
  {
    icon: '✓',
    title: 'Policy enforced at point of booking',
    body: 'Rules applied in real time — class restrictions, advance-purchase windows, preferred suppliers — before confirmation, not after.',
  },
  {
    icon: '⚑',
    title: 'Approval workflows built in',
    body: 'Single or multi-stage approvals configured to your org chart. Managers notified instantly. No email chains required.',
  },
  {
    icon: '≡',
    title: 'Full audit trail',
    body: 'Every booking, change, and approval recorded. Export-ready for internal audit or public sector reporting requirements.',
  },
  {
    icon: '£',
    title: 'Real-time budget visibility',
    body: 'Live spend against budget lines, by team or project. No waiting for month-end exports or finance reconciliation runs.',
  },
];

const SECTORS = [
  { label: 'SMEs', desc: 'Replace ad-hoc booking with a managed process — without enterprise pricing or a six-month setup.' },
  { label: 'Public Sector', desc: 'Meet Crown Commercial Service procurement standards and public reporting obligations.' },
  { label: 'Procurement Teams', desc: 'Enforce preferred supplier agreements and capture savings data automatically.' },
  { label: 'Ops & Finance', desc: 'Reconcile travel spend against cost centres without manual data entry or export runs.' },
  { label: 'Travel Managers', desc: 'Manage duty-of-care obligations and real-time traveller tracking from a single dashboard.' },
];

const BENEFITS = [
  {
    icon: '✈',
    title: 'Smarter booking',
    body: 'Rail-first search with air, hotel, and ground transport in one flow. Policy applied before results are shown — not as an afterthought.',
  },
  {
    icon: '✓',
    title: 'Approval workflows',
    body: 'Single or multi-stage approvals, configured to your structure. Managers notified instantly. No chasing email threads.',
  },
  {
    icon: '£',
    title: 'Expense visibility',
    body: 'Real-time spend reporting by traveller, team, or project. Reconcile against budgets without waiting for month-end.',
  },
  {
    icon: '⚑',
    title: 'Duty of care',
    body: 'Know where your people are. Automated alerts for disruptions and safety incidents affecting anyone on an active booking.',
  },
];

const GAINS = [
  { num: '40%', label: 'average time saved on trip booking' },
  { num: '£0', label: 'per-booking fees on core plans' },
  { num: '100%', label: 'policy-compliant by default' },
  { num: '1', label: 'platform for booking, approvals & reporting' },
];

const PRICING_TIERS = [
  { name: 'Free', price: '0', cadence: 'forever', note: 'Up to 5 travellers', featured: false },
  { name: 'Team', price: '79', cadence: 'per month', note: 'Up to 25 travellers', featured: true },
  { name: 'Pro', price: '199', cadence: 'per month', note: 'Unlimited travellers', featured: false },
];

export default function Home() {
  return (
    <Layout>

      {/* ── 1. Hero ───────────────────────────────────────────────────────── */}
      <section className="vst-hero">
        <div className="vst-container">
          <div className="vst-hero__content">
            <div className="vst-hero__eyebrow">
              ✦ Powered by Ava — your AI travel assistant
            </div>
            <h1 className="vst-hero__title">
              Business travel,<br /><em>managed properly</em>
            </h1>
            <p className="vst-hero__sub">
              Voyage Smart Travels gives UK SMEs and public sector teams a single platform to book, approve, and report on business travel. Policy-compliant by default. No per-booking fees. No implementation project.
            </p>
            <div className="vst-hero__ctas">
              <Link href="/signup" className="vst-btn vst-btn--primary vst-btn--lg">
                Start for free
              </Link>
              <Link href="/demo" className="vst-btn vst-btn--ghost-light vst-btn--lg">
                Book a demo
              </Link>
            </div>
            <div className="vst-hero__stats">
              {GAINS.map(g => (
                <div key={g.label}>
                  <div className="vst-hero__stat-num">{g.num}</div>
                  <div className="vst-hero__stat-label">{g.label}</div>
                </div>
              ))}
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
            <span className="vst-trust__item"><span className="icon">✓</span> No long-term contract</span>
            <span className="vst-trust__item"><span className="icon">✓</span> Free tier available</span>
          </div>
        </div>
      </div>

      {/* ── 2. Why VST ────────────────────────────────────────────────────── */}
      <section className="vst-section">
        <div className="vst-container">
          <div className="vst-section-head">
            <span className="vst-label">Why VST</span>
            <h2 className="vst-h2">
              Everything your team needs.<br />Nothing it doesn&apos;t.
            </h2>
            <p className="vst-lead">
              Built around how UK organisations actually manage travel — not how a US enterprise platform assumes they do.
            </p>
          </div>
          <div className="vst-grid-3">
            {WHY_VST.map(w => (
              <div key={w.headline} className="vst-card vst-card--shadow">
                <div className="vst-card__title" style={{ fontSize: '1.0625rem', marginBottom: 10 }}>
                  {w.headline}
                </div>
                <div className="vst-card__body">{w.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Ava ────────────────────────────────────────────────────────── */}
      <section className="vst-section vst-section--alt">
        <div className="vst-container">
          <div style={{ maxWidth: 640 }}>
            <span className="vst-ava-chip">Ava — AI Travel Assistant</span>
            <h2 className="vst-h2">Your travel manager, always on</h2>
            <p className="vst-lead" style={{ marginTop: 16 }}>
              Ava handles the routine so your team doesn&apos;t have to. From surfacing policy-compliant options to flagging anomalous spend, she works in the background — quietly, accurately, without supervision.
            </p>
            <ul className="vst-checklist" style={{ marginTop: 28 }}>
              {AVA_FEATURES.map(f => <li key={f}>{f}</li>)}
            </ul>
            <div style={{ marginTop: 32 }}>
              <Link href="/how-it-works" className="vst-btn vst-btn--primary">
                See how Ava works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Compliance / oversight ─────────────────────────────────────── */}
      <section className="vst-section">
        <div className="vst-container">
          <div className="vst-section-head">
            <span className="vst-label">Compliance &amp; oversight</span>
            <h2 className="vst-h2">Policy enforced. Approvals streamlined. Audit ready.</h2>
            <p className="vst-lead">
              VST closes the gap between travel policy and actual booking behaviour — at the point of booking, not after the fact.
            </p>
          </div>
          <div style={{ border: '1px solid var(--vst-border)', borderRadius: 'var(--vst-radius-lg)', overflow: 'hidden' }}>
            {COMPLIANCE_POINTS.map(c => (
              <div key={c.title} className="vst-comp-item">
                <div className="vst-comp-icon">{c.icon}</div>
                <div>
                  <div className="vst-comp-title">{c.title}</div>
                  <div className="vst-comp-body">{c.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32 }}>
            <Link href="/compliance" className="vst-btn vst-btn--secondary">
              Full compliance overview
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. Sector relevance ───────────────────────────────────────────── */}
      <section className="vst-section vst-section--dark">
        <div className="vst-container">
          <div className="vst-section-head vst-section-head--center">
            <span className="vst-label">Who it&apos;s for</span>
            <h2 className="vst-h2">Built for the way UK teams work</h2>
            <p className="vst-lead">
              Whether you&apos;re an SME with 20 travelling staff or a public sector body managing supplier visits — VST fits without a lengthy implementation.
            </p>
          </div>
          <div className="vst-grid-3" style={{ maxWidth: 900, margin: '0 auto' }}>
            {SECTORS.map(s => (
              <div
                key={s.label}
                style={{
                  background: 'rgba(255,255,255,.06)',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 'var(--vst-radius-lg)',
                  padding: '24px',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.65 }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Benefits / operating gains ─────────────────────────────────── */}
      <section className="vst-section">
        <div className="vst-container">
          <div className="vst-section-head vst-section-head--center">
            <span className="vst-label">Operating gains</span>
            <h2 className="vst-h2">Less admin. Better oversight. Real savings.</h2>
            <p className="vst-lead">
              VST replaces the patchwork of booking sites, email approvals, and spreadsheet reports with a single managed process.
            </p>
          </div>
          <div className="vst-grid-2" style={{ marginBottom: 40 }}>
            {BENEFITS.map(b => (
              <div key={b.title} className="vst-card vst-card--shadow">
                <div className="vst-card__icon">{b.icon}</div>
                <div className="vst-card__title">{b.title}</div>
                <div className="vst-card__body">{b.body}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link href="/business-travel" className="vst-btn vst-btn--secondary vst-btn--lg">
              See all capabilities
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. Pricing teaser ─────────────────────────────────────────────── */}
      <section className="vst-section vst-section--alt">
        <div className="vst-container">
          <div className="vst-section-head vst-section-head--center">
            <span className="vst-label">Pricing</span>
            <h2 className="vst-h2">Free to start. Scales with you.</h2>
            <p className="vst-lead">
              No per-booking fees. No hidden charges. Transparent flat-rate plans with a fully functional free tier.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', marginBottom: 40 }}>
            {PRICING_TIERS.map(p => (
              <div
                key={p.name}
                style={{
                  background: '#fff',
                  border: p.featured ? '2px solid var(--vst-blue)' : '1.5px solid var(--vst-border)',
                  borderRadius: 'var(--vst-radius-lg)',
                  padding: '28px 32px',
                  minWidth: 200,
                  maxWidth: 260,
                  flex: '1 1 200px',
                  boxShadow: p.featured ? '0 8px 32px rgba(37,99,235,.15)' : 'none',
                  position: 'relative',
                }}
              >
                {p.featured && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--vst-blue)', color: '#fff',
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em',
                    padding: '4px 14px', borderRadius: 100, whiteSpace: 'nowrap',
                  }}>
                    Most popular
                  </div>
                )}
                <div className="vst-plan__name">{p.name}</div>
                <div className="vst-plan__price"><sup>£</sup>{p.price}</div>
                <div className="vst-plan__cadence">{p.cadence}</div>
                <div style={{ fontSize: 13, color: 'var(--vst-muted)', marginBottom: 20 }}>{p.note}</div>
                <Link
                  href="/pricing"
                  className={`vst-btn vst-btn--full${p.featured ? ' vst-btn--primary' : ' vst-btn--secondary'}`}
                >
                  View plan
                </Link>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link href="/pricing" className="vst-btn vst-btn--secondary">
              Compare all plans in detail
            </Link>
          </div>
        </div>
      </section>

      {/* ── 8. Final CTA ──────────────────────────────────────────────────── */}
      <div className="vst-cta-banner">
        <div className="vst-container">
          <h2 className="vst-cta-banner__title">Ready to take control of business travel?</h2>
          <p className="vst-cta-banner__sub">
            Set up in minutes. No credit card required. Cancel any time.
          </p>
          <div className="vst-cta-banner__btns">
            <Link href="/signup" className="vst-btn vst-btn--primary vst-btn--lg">Start for free</Link>
            <Link href="/demo" className="vst-btn vst-btn--ghost-light vst-btn--lg">Book a demo</Link>
          </div>
        </div>
      </div>

    </Layout>
  );
}
