/**
 * pages/fhi/index.tsx
 * FHI — Fraud Help Index — Homepage
 * Hero + trust positioning + "I've been scammed" entry surface
 * Lane: FHI | Scope: public-facing MVP
 */

import Head from 'next/head';
import Link from 'next/link';

const TRUST_SIGNALS = [
  { icon: '🛡️', label: 'Action Fraud aligned', detail: 'Reporting flows follow Action Fraud guidance' },
  { icon: '🔒', label: 'ICO registered', detail: 'Your data is never sold or shared' },
  { icon: '📋', label: 'Free to use', detail: 'No sign-up required to get help' },
  { icon: '⚡', label: 'Instant guidance', detail: 'Know your next step in under 2 minutes' },
];

const FRAUD_TYPES = [
  { label: 'Online purchase scam', icon: '🛒' },
  { label: 'Investment fraud', icon: '📈' },
  { label: 'Romance scam', icon: '💔' },
  { label: 'Impersonation fraud', icon: '🎭' },
  { label: 'Phishing / smishing', icon: '📱' },
  { label: 'Authorised push payment', icon: '🏦' },
];

export default function FHIHome() {
  return (
    <>
      <Head>
        <title>Fraud Help Index — Get help with fraud and scams</title>
        <meta name="description" content="Been scammed or targeted by fraud? Fraud Help Index gives you instant, clear guidance on what to do next — from reporting to recovery." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Fraud Help Index — Get help with fraud and scams" />
        <meta property="og:description" content="Instant guidance for fraud victims. Know what to do next in under 2 minutes." />
        <meta property="og:type" content="website" />
      </Head>

      <div className="fhi-root">

        {/* ── Nav ─────────────────────────────────────────────────── */}
        <nav className="fhi-nav">
          <div className="fhi-nav__inner">
            <span className="fhi-logo">
              <span className="fhi-logo__mark">FHI</span>
              <span className="fhi-logo__name">Fraud Help Index</span>
            </span>
            <div className="fhi-nav__links">
              <a href="#what-to-do">What to do</a>
              <a href="#fraud-types">Fraud types</a>
              <a href="#report">Report</a>
            </div>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="fhi-hero">
          <div className="fhi-hero__inner">
            <div className="fhi-hero__badge">Free · Confidential · Instant</div>
            <h1 className="fhi-hero__headline">
              Been scammed?<br />
              <span className="fhi-hero__accent">We'll help you fight back.</span>
            </h1>
            <p className="fhi-hero__sub">
              Fraud Help Index gives you clear, step-by-step guidance — from what to do right now,
              to who to report it to, to how to start recovering.
            </p>
            <div className="fhi-hero__cta-row">
              <a href="#what-to-do" className="fhi-cta fhi-cta--primary">
                I've been scammed — what now?
              </a>
              <a href="#fraud-types" className="fhi-cta fhi-cta--secondary">
                Identify your fraud type
              </a>
            </div>
            <p className="fhi-hero__note">No sign-up required. Guidance is instant and free.</p>
          </div>
        </section>

        {/* ── Trust bar ───────────────────────────────────────────── */}
        <section className="fhi-trust">
          <div className="fhi-trust__inner">
            {TRUST_SIGNALS.map(t => (
              <div key={t.label} className="fhi-trust__item">
                <span className="fhi-trust__icon">{t.icon}</span>
                <div>
                  <div className="fhi-trust__label">{t.label}</div>
                  <div className="fhi-trust__detail">{t.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Entry surface: I've been scammed ────────────────────── */}
        <section className="fhi-entry" id="what-to-do">
          <div className="fhi-section__inner">
            <h2 className="fhi-section__title">What to do right now</h2>
            <p className="fhi-section__sub">Follow these steps immediately. Time matters.</p>
            <ol className="fhi-steps">
              <li className="fhi-step">
                <span className="fhi-step__num">1</span>
                <div>
                  <strong>Stop all contact</strong>
                  <p>Do not send any more money. Block the scammer on all platforms.</p>
                </div>
              </li>
              <li className="fhi-step">
                <span className="fhi-step__num">2</span>
                <div>
                  <strong>Contact your bank immediately</strong>
                  <p>Call the number on the back of your card. Ask for the fraud team. Request a chargeback or recall if money was sent.</p>
                </div>
              </li>
              <li className="fhi-step">
                <span className="fhi-step__num">3</span>
                <div>
                  <strong>Report to Action Fraud</strong>
                  <p>Report online at actionfraud.police.uk or call 0300 123 2040. Keep your reference number.</p>
                </div>
              </li>
              <li className="fhi-step">
                <span className="fhi-step__num">4</span>
                <div>
                  <strong>Secure your accounts</strong>
                  <p>Change passwords on any accounts that may be compromised. Enable two-factor authentication.</p>
                </div>
              </li>
              <li className="fhi-step">
                <span className="fhi-step__num">5</span>
                <div>
                  <strong>Get a full fraud assessment</strong>
                  <p>Use Fraud Help Index to identify your fraud type and get tailored guidance.</p>
                </div>
              </li>
            </ol>
            <div className="fhi-entry__cta">
              <a href="#fraud-types" className="fhi-cta fhi-cta--primary">
                Identify my fraud type →
              </a>
            </div>
          </div>
        </section>

        {/* ── Fraud type cards ─────────────────────────────────────── */}
        <section className="fhi-types" id="fraud-types">
          <div className="fhi-section__inner">
            <h2 className="fhi-section__title">What type of fraud?</h2>
            <p className="fhi-section__sub">Select your fraud type to get tailored guidance and reporting steps.</p>
            <div className="fhi-types__grid">
              {FRAUD_TYPES.map(f => (
                <button key={f.label} className="fhi-type-card">
                  <span className="fhi-type-card__icon">{f.icon}</span>
                  <span className="fhi-type-card__label">{f.label}</span>
                  <span className="fhi-type-card__arrow">→</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Report CTA ──────────────────────────────────────────── */}
        <section className="fhi-report" id="report">
          <div className="fhi-section__inner fhi-report__inner">
            <h2 className="fhi-report__title">Ready to report?</h2>
            <p className="fhi-report__sub">Reporting protects you and stops others from being targeted.</p>
            <div className="fhi-report__cta-row">
              <a href="https://www.actionfraud.police.uk/reporting-fraud-and-cyber-crime" target="_blank" rel="noopener noreferrer" className="fhi-cta fhi-cta--primary">
                Report to Action Fraud
              </a>
              <a href="https://www.financial-ombudsman.org.uk/" target="_blank" rel="noopener noreferrer" className="fhi-cta fhi-cta--secondary">
                Financial Ombudsman
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer className="fhi-footer">
          <div className="fhi-footer__inner">
            <span className="fhi-logo__mark" style={{ fontSize: '14px' }}>FHI</span>
            <span className="fhi-footer__text">Fraud Help Index — free guidance for fraud victims.</span>
            <span className="fhi-footer__legal">Not legal advice. Always report to Action Fraud.</span>
          </div>
        </footer>

      </div>

      <style jsx>{`
        /* ── Reset / base ────────────────────────────────────────── */
        .fhi-root { font-family: -apple-system, 'Inter', system-ui, sans-serif; background: #0A0E1A; color: #F0F2F7; min-height: 100vh; }

        /* ── Nav ─────────────────────────────────────────────────── */
        .fhi-nav { background: rgba(10,14,26,.95); border-bottom: 1px solid #1C2540; position: sticky; top: 0; z-index: 10; }
        .fhi-nav__inner { max-width: 1080px; margin: 0 auto; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .fhi-logo { display: flex; align-items: center; gap: 8px; }
        .fhi-logo__mark { background: #E85D3A; color: #fff; font-size: 12px; font-weight: 800; padding: 3px 7px; border-radius: 5px; letter-spacing: .04em; }
        .fhi-logo__name { font-weight: 600; font-size: 14px; color: #F0F2F7; }
        .fhi-nav__links { display: flex; gap: 20px; }
        .fhi-nav__links a { color: #8A9AC0; font-size: 13px; text-decoration: none; font-weight: 500; }
        .fhi-nav__links a:hover { color: #F0F2F7; }
        @media(max-width:480px){ .fhi-nav__links { display: none; } }

        /* ── Hero ────────────────────────────────────────────────── */
        .fhi-hero { padding: 72px 24px 64px; text-align: center; background: linear-gradient(180deg, #0D1120 0%, #0A0E1A 100%); }
        .fhi-hero__inner { max-width: 720px; margin: 0 auto; }
        .fhi-hero__badge { display: inline-block; background: rgba(232,93,58,.12); color: #E85D3A; border: 1px solid rgba(232,93,58,.3); border-radius: 100px; font-size: 12px; font-weight: 700; padding: 4px 14px; margin-bottom: 20px; letter-spacing: .05em; text-transform: uppercase; }
        .fhi-hero__headline { font-size: clamp(32px, 6vw, 52px); font-weight: 800; line-height: 1.15; margin-bottom: 18px; color: #F0F2F7; }
        .fhi-hero__accent { color: #E85D3A; }
        .fhi-hero__sub { font-size: 17px; color: #8A9AC0; line-height: 1.65; margin-bottom: 32px; max-width: 560px; margin-left: auto; margin-right: auto; }
        .fhi-hero__cta-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 16px; }
        .fhi-hero__note { font-size: 12px; color: #5A6A8A; }

        /* ── CTAs ─────────────────────────────────────────────────── */
        .fhi-cta { display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 15px; font-weight: 700; padding: 14px 24px; text-decoration: none; transition: opacity .15s, transform .1s; cursor: pointer; border: none; }
        .fhi-cta:active { transform: scale(.97); }
        .fhi-cta--primary { background: #E85D3A; color: #fff; }
        .fhi-cta--primary:hover { opacity: .9; }
        .fhi-cta--secondary { background: rgba(232,93,58,.1); color: #E85D3A; border: 1px solid rgba(232,93,58,.35); }
        .fhi-cta--secondary:hover { background: rgba(232,93,58,.15); }
        @media(max-width:480px){ .fhi-cta { width: 100%; font-size: 16px; padding: 16px; } }

        /* ── Trust bar ───────────────────────────────────────────── */
        .fhi-trust { background: #0D1120; border-top: 1px solid #1C2540; border-bottom: 1px solid #1C2540; padding: 24px 24px; }
        .fhi-trust__inner { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .fhi-trust__item { display: flex; align-items: flex-start; gap: 12px; }
        .fhi-trust__icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
        .fhi-trust__label { font-size: 13px; font-weight: 700; color: #C8D0E8; margin-bottom: 3px; }
        .fhi-trust__detail { font-size: 11px; color: #5A6A8A; line-height: 1.4; }
        @media(max-width:700px){ .fhi-trust__inner { grid-template-columns: 1fr 1fr; } }
        @media(max-width:420px){ .fhi-trust__inner { grid-template-columns: 1fr; } }

        /* ── Sections ─────────────────────────────────────────────── */
        .fhi-section__inner { max-width: 760px; margin: 0 auto; padding: 64px 24px; }
        .fhi-section__title { font-size: clamp(22px, 4vw, 32px); font-weight: 800; margin-bottom: 10px; }
        .fhi-section__sub { color: #8A9AC0; font-size: 15px; margin-bottom: 32px; }

        /* ── Steps ───────────────────────────────────────────────── */
        .fhi-entry { background: #0D1120; }
        .fhi-steps { list-style: none; padding: 0; margin: 0 0 32px; display: flex; flex-direction: column; gap: 16px; }
        .fhi-step { display: flex; align-items: flex-start; gap: 16px; background: #111827; border: 1px solid #1C2540; border-radius: 10px; padding: 18px 20px; }
        .fhi-step__num { background: #E85D3A; color: #fff; font-size: 13px; font-weight: 800; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
        .fhi-step strong { display: block; font-size: 15px; font-weight: 700; margin-bottom: 5px; color: #F0F2F7; }
        .fhi-step p { font-size: 13px; color: #8A9AC0; line-height: 1.55; margin: 0; }
        .fhi-entry__cta { text-align: center; }

        /* ── Fraud types ─────────────────────────────────────────── */
        .fhi-types { background: #0A0E1A; }
        .fhi-types__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .fhi-type-card { background: #111827; border: 1px solid #1C2540; border-radius: 10px; padding: 18px 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; text-align: left; transition: border-color .15s, background .15s; }
        .fhi-type-card:hover { border-color: rgba(232,93,58,.4); background: rgba(232,93,58,.04); }
        .fhi-type-card__icon { font-size: 20px; flex-shrink: 0; }
        .fhi-type-card__label { font-size: 13px; font-weight: 600; color: #C8D0E8; flex: 1; }
        .fhi-type-card__arrow { color: #E85D3A; font-size: 14px; font-weight: 700; flex-shrink: 0; }
        @media(max-width:600px){ .fhi-types__grid { grid-template-columns: 1fr 1fr; } }
        @media(max-width:380px){ .fhi-types__grid { grid-template-columns: 1fr; } }

        /* ── Report ──────────────────────────────────────────────── */
        .fhi-report { background: #0D1120; border-top: 1px solid #1C2540; }
        .fhi-report__inner { text-align: center; }
        .fhi-report__title { font-size: clamp(22px, 4vw, 32px); font-weight: 800; margin-bottom: 10px; }
        .fhi-report__sub { color: #8A9AC0; font-size: 15px; margin-bottom: 28px; }
        .fhi-report__cta-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

        /* ── Footer ──────────────────────────────────────────────── */
        .fhi-footer { background: #060810; border-top: 1px solid #1C2540; padding: 20px 24px; }
        .fhi-footer__inner { max-width: 1080px; margin: 0 auto; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .fhi-footer__text { font-size: 12px; color: #5A6A8A; flex: 1; }
        .fhi-footer__legal { font-size: 11px; color: #3A4A6A; }
      `}</style>
    </>
  );
}
