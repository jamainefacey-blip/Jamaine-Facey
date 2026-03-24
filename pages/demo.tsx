import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Layout from '../components/vst/Layout';

const TEAM_SIZES = [
  '1–10 employees',
  '11–50 employees',
  '51–200 employees',
  '201–500 employees',
  '500+ employees',
];

export default function Demo() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Simulate submission — replace with real endpoint when backend is ready
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  }

  return (
    <Layout
      title="Book a Demo"
      description="Book a demo of Voyage Smart Travels. See how VST handles business travel management for your organisation."
    >
      <section className="vst-page-hero">
        <div className="vst-container">
          <span className="vst-label vst-page-hero__label">Book a Demo</span>
          <h1 className="vst-h1 vst-page-hero__title" style={{ marginTop: 8, marginBottom: 16 }}>
            See VST in under 30 minutes
          </h1>
          <p className="vst-lead vst-page-hero__sub">
            We'll walk through how VST fits your organisation's travel setup — no sales pressure, no lengthy discovery call.
          </p>
        </div>
      </section>

      <section className="vst-section">
        <div className="vst-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48 }}>
            <div style={{ maxWidth: 520 }}>

              {submitted ? (
                <div className="vst-success">
                  <div className="vst-success__icon">✓</div>
                  <div className="vst-success__title">Request received</div>
                  <p className="vst-success__body">
                    Thanks for getting in touch. A member of our team will be in touch within one business day to arrange your demo.
                  </p>
                  <div style={{ marginTop: 24 }}>
                    <Link href="/" className="vst-btn vst-btn--secondary">Back to home</Link>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="vst-h3" style={{ marginBottom: 24 }}>Request your demo</h2>
                  <form className="vst-form" onSubmit={handleSubmit}>
                    <div className="vst-form-row">
                      <div className="vst-field">
                        <label className="vst-label-text" htmlFor="demo-fname">First name</label>
                        <input id="demo-fname" className="vst-input" type="text" placeholder="Jane" required autoComplete="given-name" />
                      </div>
                      <div className="vst-field">
                        <label className="vst-label-text" htmlFor="demo-lname">Last name</label>
                        <input id="demo-lname" className="vst-input" type="text" placeholder="Smith" required autoComplete="family-name" />
                      </div>
                    </div>
                    <div className="vst-field">
                      <label className="vst-label-text" htmlFor="demo-company">Company / Organisation</label>
                      <input id="demo-company" className="vst-input" type="text" placeholder="Acme Ltd" required autoComplete="organization" />
                    </div>
                    <div className="vst-field">
                      <label className="vst-label-text" htmlFor="demo-email">Work email</label>
                      <input id="demo-email" className="vst-input" type="email" placeholder="jane@company.co.uk" required autoComplete="work email" />
                    </div>
                    <div className="vst-field">
                      <label className="vst-label-text" htmlFor="demo-size">Team size</label>
                      <select id="demo-size" className="vst-select" required>
                        <option value="">Select team size</option>
                        {TEAM_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="vst-field">
                      <label className="vst-label-text" htmlFor="demo-message">
                        Anything you'd like us to focus on? <span style={{ color: 'var(--vst-muted)', fontWeight: 400 }}>(optional)</span>
                      </label>
                      <textarea
                        id="demo-message"
                        className="vst-textarea"
                        placeholder="e.g. We need better expense visibility and approval controls for a 60-person team..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="vst-btn vst-btn--primary vst-btn--full"
                      disabled={loading}
                      style={{ marginTop: 8 }}
                    >
                      {loading ? 'Sending…' : 'Request Demo'}
                    </button>
                    <p style={{ fontSize: 13, color: 'var(--vst-muted)', textAlign: 'center' }}>
                      We'll respond within one business day. No spam.
                    </p>
                  </form>
                </>
              )}
            </div>

            {/* What to expect */}
            <div>
              <h2 className="vst-h3" style={{ marginBottom: 20 }}>What to expect</h2>
              <div className="vst-steps">
                {[
                  { num: '1', title: 'We confirm your slot', desc: 'A team member will reach out within one business day to arrange a 30-minute session.' },
                  { num: '2', title: 'Tailored walkthrough', desc: 'We focus on the parts of VST most relevant to your team — policy setup, approvals, reporting, or whatever matters most.' },
                  { num: '3', title: 'Your questions answered', desc: 'No slides, no scripted pitch. Bring your specific requirements and we\'ll show you exactly how VST handles them.' },
                  { num: '4', title: 'Easy next steps', desc: 'If VST is a fit, we\'ll get you set up on a free trial or the right plan. No pressure to decide on the call.' },
                ].map(s => (
                  <div key={s.num} className="vst-step">
                    <div className="vst-step__num">{s.num}</div>
                    <div className="vst-step__body">
                      <div className="vst-step__title">{s.title}</div>
                      <div className="vst-step__desc">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
