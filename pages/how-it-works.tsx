import Link from 'next/link';
import Layout from '../components/vst/Layout';

const STEPS = [
  {
    num: '01',
    title: 'Connect your organisation',
    desc: 'Sign up, invite your team, and set your travel policy in under 10 minutes. Define spend limits, preferred suppliers, approval tiers, and booking windows — once, and they apply everywhere.',
    ava: null,
  },
  {
    num: '02',
    title: 'Travellers request or book',
    desc: 'Team members search for rail, flights, or accommodation directly inside VST. They see only options that meet your policy — no need to check manually or chase approvals for standard trips.',
    ava: 'Ava surfaces best-fit options in real time',
  },
  {
    num: '03',
    title: 'Approvals happen automatically',
    desc: 'Within-policy bookings are auto-approved. Out-of-policy requests route to the right manager immediately. No email threads, no manual chasing.',
    ava: 'Ava flags policy exceptions before they\'re submitted',
  },
  {
    num: '04',
    title: 'Travel gets managed in flight',
    desc: 'Managers see live trip status. Ava monitors for disruptions, delays, and safety alerts — and notifies the right people automatically. Duty of care is covered without manual tracking.',
    ava: 'Ava sends duty-of-care alerts to managers',
  },
  {
    num: '05',
    title: 'Spend is reconciled automatically',
    desc: 'Every trip generates a clean expense record. Reports are available by trip, traveller, department, or date range. No spreadsheets, no manual reconciliation before month-end.',
    ava: 'Ava highlights anomalies and budget overruns',
  },
];

export default function HowItWorks() {
  return (
    <Layout
      title="How It Works"
      description="See how Voyage Smart Travels simplifies business travel management from booking to reconciliation."
    >
      <section className="vst-page-hero">
        <div className="vst-container">
          <span className="vst-label vst-page-hero__label">How It Works</span>
          <h1 className="vst-h1 vst-page-hero__title" style={{ marginTop: 8, marginBottom: 16 }}>
            From policy to reconciled — without the admin
          </h1>
          <p className="vst-lead vst-page-hero__sub">
            VST handles the full travel lifecycle. Here's what that looks like in practice.
          </p>
        </div>
      </section>

      <section className="vst-section">
        <div className="vst-container">
          <div style={{ maxWidth: 720 }}>
            <div className="vst-steps">
              {STEPS.map(s => (
                <div key={s.num} className="vst-step">
                  <div className="vst-step__num">{s.num}</div>
                  <div className="vst-step__body">
                    <div className="vst-step__title">{s.title}</div>
                    <div className="vst-step__desc">{s.desc}</div>
                    {s.ava && (
                      <div className="vst-step__ava">✦ Ava — {s.ava}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ava detail */}
      <section className="vst-section vst-section--alt">
        <div className="vst-container">
          <div className="vst-section-head">
            <span className="vst-label">Ava — AI Layer</span>
            <h2 className="vst-h2">Intelligence built into every step</h2>
          </div>
          <div className="vst-grid-3">
            {[
              { title: 'Policy-aware recommendations', body: 'Ava filters search results against your live travel policy so non-compliant options are never surfaced in the first place.' },
              { title: 'Spend monitoring', body: 'Ongoing analysis of travel spend against budget. Ava flags when a department is trending over — before month-end.' },
              { title: 'Disruption response', body: 'Ava monitors active trips against live transport data and notifies managers when travellers are affected by delays or cancellations.' },
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
          <h2 className="vst-cta-banner__title">See it in action</h2>
          <p className="vst-cta-banner__sub">Walk through a live demo with our team in under 30 minutes.</p>
          <div className="vst-cta-banner__btns">
            <Link href="/demo" className="vst-btn vst-btn--primary vst-btn--lg">Book a Demo</Link>
            <Link href="/signup" className="vst-btn vst-btn--ghost-light vst-btn--lg">Start Free</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
