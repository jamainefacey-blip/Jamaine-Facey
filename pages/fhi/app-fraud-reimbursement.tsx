/**
 * pages/fhi/app-fraud-reimbursement.tsx
 * FHI — APP Fraud Reimbursement Guide
 * PSR Mandatory Reimbursement (October 2024)
 * Lane: FHI | Scope: public-facing guidance page
 */

import Head from 'next/head';
import Link from 'next/link';

const IMMEDIATE_STEPS = [
  {
    num: 1,
    title: 'Call your bank now',
    detail: 'Call the number on the back of your card. Tell them you\'ve been a victim of APP fraud. Ask for the Payment Services or Fraud team — do not hang up.',
  },
  {
    num: 2,
    title: 'Say "APP fraud" — it triggers a legal protocol',
    detail: 'Under PSR rules, the words "Authorised Push Payment fraud" activate a mandatory investigation process. Banks are legally required to reimburse most losses up to £85,000.',
  },
  {
    num: 3,
    title: 'Request the receiving bank is contacted',
    detail: 'Your bank can contact the receiving bank to freeze the funds. Time is critical — the sooner you call, the higher the chance of recovery.',
  },
  {
    num: 4,
    title: 'Report to Action Fraud',
    detail: 'Report online at actionfraud.police.uk or call 0300 123 2040. You\'ll get a crime reference number — keep it, you\'ll need it for your bank and any escalation.',
  },
  {
    num: 5,
    title: 'If refused, escalate to the Financial Ombudsman',
    detail: 'If your bank refuses to reimburse or delays unreasonably, you can escalate to the Financial Ombudsman Service (FOS) for free. FOS decisions are binding on your bank.',
  },
];

const ELIGIBILITY = [
  { eligible: true,  label: 'You authorised the payment yourself (you transferred the money)' },
  { eligible: true,  label: 'You were deceived into making the transfer — e.g. fake invoice, impersonation, romance scam' },
  { eligible: true,  label: 'Payment was made from a UK bank account to another UK account' },
  { eligible: true,  label: 'The fraud occurred on or after 7 October 2024' },
  { eligible: false, label: 'You made the payment knowingly to commit a fraud yourself' },
  { eligible: false, label: 'You were grossly negligent (ignored clear warnings from your bank)' },
  { eligible: false, label: 'International transfers — PSR rules apply to UK domestic payments only' },
];

const LIMITATIONS = [
  {
    title: '£85,000 reimbursement cap',
    detail: 'The maximum mandatory reimbursement is £85,000 per claim. Losses above this are not covered by the mandatory scheme, though banks may reimburse more voluntarily.',
  },
  {
    title: '13-month reporting window',
    detail: 'You must report the fraud to your bank within 13 months of the final payment. After this window, mandatory reimbursement does not apply.',
  },
  {
    title: 'Gross negligence exception',
    detail: 'If you ignored explicit, specific warnings from your bank about the payment, your bank may reduce or refuse reimbursement. Standard warnings do not count as "specific".',
  },
  {
    title: 'Voluntary payments for illegal goods',
    detail: 'Payments made knowingly to purchase illegal goods or services are excluded, even if you were subsequently defrauded.',
  },
];

export default function APPFraudReimbursement() {
  return (
    <>
      <Head>
        <title>APP Fraud Reimbursement — Can You Get Your Money Back? | Fraud Help Index</title>
        <meta
          name="description"
          content="Under UK PSR rules (October 2024), banks must reimburse most APP fraud victims up to £85,000. Find out if you qualify and what to do right now."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="APP Fraud Reimbursement — PSR Rules 2024 | Fraud Help Index" />
        <meta
          property="og:description"
          content="Your bank is legally required to reimburse most APP fraud up to £85,000. Here's how to claim."
        />
        <meta property="og:type" content="article" />
        {/* AEO — FAQ structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'Can I get my money back after APP fraud?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Under UK PSR mandatory reimbursement rules (effective October 2024), banks are required to reimburse most APP fraud victims up to £85,000. Call your bank immediately and reference APP fraud.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What is the time limit for APP fraud reimbursement?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'You must report the APP fraud to your bank within 13 months of the final payment to qualify for mandatory reimbursement under PSR rules.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What is the maximum APP fraud reimbursement?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'The mandatory maximum is £85,000 per claim under PSR rules. Some banks may offer higher amounts voluntarily.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What if my bank refuses to reimburse APP fraud?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Escalate to the Financial Ombudsman Service (FOS). The FOS can compel your bank to pay and the process is free to use.',
                  },
                },
              ],
            }),
          }}
        />
      </Head>

      <div className="fhi-root">

        {/* ── Nav ─────────────────────────────────────────────────── */}
        <nav className="fhi-nav">
          <div className="fhi-nav__inner">
            <Link href="/fhi" className="fhi-logo">
              <span className="fhi-logo__mark">FHI</span>
              <span className="fhi-logo__name">Fraud Help Index</span>
            </Link>
            <div className="fhi-nav__links">
              <Link href="/fhi#what-to-do">What to do</Link>
              <Link href="/fhi#fraud-types">Fraud types</Link>
              <Link href="/fhi#report">Report</Link>
            </div>
          </div>
        </nav>

        {/* ── Breadcrumb ───────────────────────────────────────────── */}
        <div className="fhi-breadcrumb">
          <Link href="/fhi">Fraud Help Index</Link>
          <span className="fhi-breadcrumb__sep">›</span>
          <span>APP Fraud Reimbursement</span>
        </div>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="fhi-hero fhi-hero--guide">
          <div className="fhi-hero__inner">
            <div className="fhi-hero__badge">PSR Rules — October 2024</div>
            <h1 className="fhi-hero__headline">
              APP Fraud —{' '}
              <span className="fhi-accent">Can You Get Your Money Back?</span>
            </h1>
            <p className="fhi-hero__sub">
              Yes. Under UK law, your bank is <strong>legally required</strong> to reimburse most APP
              fraud losses up to <strong>£85,000</strong>. Here's exactly what to do.
            </p>
            <div className="fhi-hero__cta-row">
              <a href="tel:999" className="fhi-cta-primary">Call your bank now</a>
              <a
                href="https://www.actionfraud.police.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="fhi-cta-secondary"
              >
                Report to Action Fraud
              </a>
            </div>
            <p className="fhi-hero__note">Free guidance. No sign-up required.</p>
          </div>
        </section>

        {/* ── Short answer block ───────────────────────────────────── */}
        <section className="fhi-answer-block">
          <div className="fhi-answer-block__inner">
            <div className="fhi-answer-card">
              <div className="fhi-answer-card__icon">⚖️</div>
              <div>
                <div className="fhi-answer-card__title">The short answer</div>
                <p className="fhi-answer-card__text">
                  Under the Payment Systems Regulator (PSR) mandatory reimbursement rules —
                  effective <strong>7 October 2024</strong> — UK banks must reimburse victims of
                  Authorised Push Payment (APP) fraud up to <strong>£85,000</strong> per claim.
                  The rules apply to domestic bank transfers made on or after that date.
                  Call your bank immediately and use the words <em>"APP fraud"</em>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Immediate steps ─────────────────────────────────────── */}
        <section className="fhi-steps-section" id="what-to-do">
          <div className="fhi-section-inner">
            <h2 className="fhi-section-title">What to do right now</h2>
            <p className="fhi-section-sub">
              Every minute counts. Act immediately to maximise your chance of recovery.
            </p>
            <ol className="fhi-steps">
              {IMMEDIATE_STEPS.map((step) => (
                <li key={step.num} className="fhi-step">
                  <div className="fhi-step__num">{step.num}</div>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Eligibility ─────────────────────────────────────────── */}
        <section className="fhi-eligibility-section">
          <div className="fhi-section-inner">
            <h2 className="fhi-section-title">Am I eligible for reimbursement?</h2>
            <p className="fhi-section-sub">
              PSR rules cover most APP fraud victims. Check the criteria below.
            </p>
            <ul className="fhi-eligibility-list">
              {ELIGIBILITY.map((item, i) => (
                <li
                  key={i}
                  className={`fhi-eligibility-item ${item.eligible ? 'fhi-eligibility-item--yes' : 'fhi-eligibility-item--no'}`}
                >
                  <span className="fhi-eligibility-item__icon">
                    {item.eligible ? '✓' : '✗'}
                  </span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
            <p className="fhi-eligibility-note">
              Not sure? Contact the <strong>Financial Ombudsman Service</strong> — their assessment
              is free and they can advise before you make a formal complaint.
            </p>
          </div>
        </section>

        {/* ── Timelines ───────────────────────────────────────────── */}
        <section className="fhi-timeline-section">
          <div className="fhi-section-inner">
            <h2 className="fhi-section-title">Key timelines</h2>
            <div className="fhi-timeline-grid">
              <div className="fhi-timeline-card">
                <div className="fhi-timeline-card__value">Same day</div>
                <div className="fhi-timeline-card__label">Call your bank</div>
                <div className="fhi-timeline-card__detail">
                  Reporting the same day dramatically increases the chance of funds being frozen
                  in the receiving account.
                </div>
              </div>
              <div className="fhi-timeline-card">
                <div className="fhi-timeline-card__value">13 months</div>
                <div className="fhi-timeline-card__label">Report to your bank</div>
                <div className="fhi-timeline-card__detail">
                  The PSR mandatory window. Report within 13 months of the final payment to
                  qualify for mandatory reimbursement.
                </div>
              </div>
              <div className="fhi-timeline-card">
                <div className="fhi-timeline-card__value">8 weeks</div>
                <div className="fhi-timeline-card__label">Bank response time</div>
                <div className="fhi-timeline-card__detail">
                  Your bank has up to 8 weeks to resolve your complaint. After this, you can
                  escalate to the Financial Ombudsman Service.
                </div>
              </div>
              <div className="fhi-timeline-card">
                <div className="fhi-timeline-card__value">Free</div>
                <div className="fhi-timeline-card__label">FOS escalation</div>
                <div className="fhi-timeline-card__detail">
                  The Financial Ombudsman Service is free to use and can compel your bank to
                  reimburse you. FOS decisions are legally binding on the bank.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Limitations ─────────────────────────────────────────── */}
        <section className="fhi-limits-section">
          <div className="fhi-section-inner">
            <h2 className="fhi-section-title">Limitations and exceptions</h2>
            <p className="fhi-section-sub">
              The PSR scheme covers most victims — but there are exceptions to be aware of.
            </p>
            <div className="fhi-limits-grid">
              {LIMITATIONS.map((item, i) => (
                <div key={i} className="fhi-limit-card">
                  <div className="fhi-limit-card__title">{item.title}</div>
                  <p className="fhi-limit-card__detail">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA / Report ────────────────────────────────────────── */}
        <section className="fhi-report" id="report">
          <div className="fhi-report__inner">
            <h2 className="fhi-report__title">Ready to act?</h2>
            <p className="fhi-report__sub">
              Don't wait. Every hour reduces the chance of fund recovery.
            </p>
            <div className="fhi-hero__cta-row">
              <a
                href="https://www.actionfraud.police.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="fhi-cta-primary"
              >
                Report to Action Fraud
              </a>
              <a
                href="https://www.financial-ombudsman.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="fhi-cta-secondary"
              >
                Financial Ombudsman
              </a>
            </div>
            <p className="fhi-report__note">
              Regulatory basis: PSR Mandatory Reimbursement Policy — effective 7 October 2024. FCA
              regulated. Not legal advice.
            </p>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer className="fhi-footer">
          <span className="fhi-logo__mark" style={{ fontSize: '12px' }}>FHI</span>
          <span className="fhi-footer__text">
            Fraud Help Index — free guidance for fraud victims.
          </span>
          <span className="fhi-footer__legal">
            Not legal advice. Always report to Action Fraud.
          </span>
        </footer>

      </div>

      <style jsx>{`
        /* ── FHI design tokens ─────────────────────────────── */
        .fhi-root {
          font-family: -apple-system, 'Inter', system-ui, sans-serif;
          background: #0A0E1A;
          color: #F0F2F7;
          min-height: 100vh;
        }
        /* Nav */
        .fhi-nav {
          background: rgba(10,14,26,.97);
          border-bottom: 1px solid #1C2540;
          padding: 14px 40px;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .fhi-nav__inner {
          max-width: 1080px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .fhi-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
        }
        .fhi-logo__mark {
          background: #E85D3A;
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          padding: 3px 7px;
          border-radius: 5px;
          letter-spacing: .04em;
        }
        .fhi-logo__name {
          font-weight: 600;
          font-size: 14px;
          color: #F0F2F7;
          margin-left: 8px;
        }
        .fhi-nav__links {
          display: flex;
          gap: 20px;
        }
        .fhi-nav__links a {
          color: #8A9AC0;
          font-size: 13px;
          text-decoration: none;
          font-weight: 500;
        }
        /* Breadcrumb */
        .fhi-breadcrumb {
          padding: 10px 40px;
          background: #0D1120;
          border-bottom: 1px solid #1C2540;
          font-size: 12px;
          color: #5A6A8A;
          max-width: 100%;
        }
        .fhi-breadcrumb a {
          color: #8A9AC0;
          text-decoration: none;
        }
        .fhi-breadcrumb__sep {
          margin: 0 6px;
        }
        /* Hero */
        .fhi-hero {
          padding: 64px 40px 56px;
          background: linear-gradient(180deg, #0D1120 0%, #0A0E1A 100%);
          text-align: center;
        }
        .fhi-hero--guide {
          padding: 48px 40px 44px;
        }
        .fhi-hero__inner {
          max-width: 720px;
          margin: 0 auto;
        }
        .fhi-hero__badge {
          display: inline-block;
          background: rgba(232,93,58,.12);
          color: #E85D3A;
          border: 1px solid rgba(232,93,58,.3);
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 14px;
          margin-bottom: 20px;
          letter-spacing: .05em;
          text-transform: uppercase;
        }
        .fhi-hero__headline {
          font-size: 44px;
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 18px;
        }
        .fhi-accent { color: #E85D3A; }
        .fhi-hero__sub {
          font-size: 17px;
          color: #8A9AC0;
          line-height: 1.65;
          margin-bottom: 28px;
        }
        .fhi-hero__sub strong { color: #F0F2F7; }
        .fhi-hero__cta-row {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .fhi-cta-primary {
          background: #E85D3A;
          color: #fff;
          padding: 15px 28px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
        }
        .fhi-cta-secondary {
          background: rgba(232,93,58,.1);
          color: #E85D3A;
          border: 1px solid rgba(232,93,58,.35);
          padding: 15px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
        }
        .fhi-hero__note {
          font-size: 12px;
          color: #5A6A8A;
        }
        /* Short answer block */
        .fhi-answer-block {
          background: #0D1120;
          border-top: 1px solid #1C2540;
          border-bottom: 1px solid #1C2540;
          padding: 32px 40px;
        }
        .fhi-answer-block__inner {
          max-width: 760px;
          margin: 0 auto;
        }
        .fhi-answer-card {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          background: #111827;
          border: 1px solid #2A3A5A;
          border-radius: 12px;
          padding: 20px 24px;
        }
        .fhi-answer-card__icon {
          font-size: 28px;
          flex-shrink: 0;
        }
        .fhi-answer-card__title {
          font-size: 13px;
          font-weight: 700;
          color: #E85D3A;
          text-transform: uppercase;
          letter-spacing: .06em;
          margin-bottom: 8px;
        }
        .fhi-answer-card__text {
          font-size: 15px;
          color: #C8D0E8;
          line-height: 1.65;
          margin: 0;
        }
        .fhi-answer-card__text strong { color: #F0F2F7; }
        .fhi-answer-card__text em { color: #E85D3A; font-style: normal; font-weight: 700; }
        /* Steps */
        .fhi-steps-section {
          background: #0D1120;
          padding: 56px 40px;
        }
        .fhi-section-inner {
          max-width: 760px;
          margin: 0 auto;
        }
        .fhi-section-title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .fhi-section-sub {
          color: #8A9AC0;
          font-size: 15px;
          margin-bottom: 28px;
        }
        .fhi-steps {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .fhi-step {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          background: #111827;
          border: 1px solid #1C2540;
          border-radius: 10px;
          padding: 18px 20px;
        }
        .fhi-step__num {
          background: #E85D3A;
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .fhi-step strong {
          display: block;
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 5px;
          color: #F0F2F7;
        }
        .fhi-step p {
          font-size: 13px;
          color: #8A9AC0;
          line-height: 1.55;
          margin: 0;
        }
        /* Eligibility */
        .fhi-eligibility-section {
          padding: 56px 40px;
        }
        .fhi-eligibility-list {
          list-style: none;
          padding: 0;
          margin: 0 0 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .fhi-eligibility-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #111827;
          border: 1px solid #1C2540;
          border-radius: 8px;
          padding: 14px 16px;
          font-size: 14px;
          color: #C8D0E8;
        }
        .fhi-eligibility-item--yes { border-left: 3px solid #3ECF8E; }
        .fhi-eligibility-item--no  { border-left: 3px solid #E85D3A; }
        .fhi-eligibility-item__icon {
          font-weight: 800;
          font-size: 15px;
          flex-shrink: 0;
          width: 20px;
        }
        .fhi-eligibility-item--yes .fhi-eligibility-item__icon { color: #3ECF8E; }
        .fhi-eligibility-item--no  .fhi-eligibility-item__icon { color: #E85D3A; }
        .fhi-eligibility-note {
          font-size: 13px;
          color: #8A9AC0;
          background: #0D1120;
          border: 1px solid #1C2540;
          border-radius: 8px;
          padding: 14px 16px;
          line-height: 1.6;
        }
        .fhi-eligibility-note strong { color: #F0F2F7; }
        /* Timeline */
        .fhi-timeline-section {
          background: #0D1120;
          border-top: 1px solid #1C2540;
          border-bottom: 1px solid #1C2540;
          padding: 56px 40px;
        }
        .fhi-timeline-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .fhi-timeline-card {
          background: #111827;
          border: 1px solid #1C2540;
          border-radius: 10px;
          padding: 20px;
        }
        .fhi-timeline-card__value {
          font-size: 28px;
          font-weight: 800;
          color: #E85D3A;
          margin-bottom: 4px;
        }
        .fhi-timeline-card__label {
          font-size: 13px;
          font-weight: 700;
          color: #C8D0E8;
          margin-bottom: 8px;
        }
        .fhi-timeline-card__detail {
          font-size: 12px;
          color: #5A6A8A;
          line-height: 1.55;
        }
        /* Limitations */
        .fhi-limits-section {
          padding: 56px 40px;
        }
        .fhi-limits-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        .fhi-limit-card {
          background: #111827;
          border: 1px solid #1C2540;
          border-top: 3px solid #E85D3A;
          border-radius: 10px;
          padding: 18px 16px;
        }
        .fhi-limit-card__title {
          font-size: 14px;
          font-weight: 700;
          color: #F0F2F7;
          margin-bottom: 8px;
        }
        .fhi-limit-card__detail {
          font-size: 13px;
          color: #8A9AC0;
          line-height: 1.55;
          margin: 0;
        }
        /* Report CTA */
        .fhi-report {
          background: #0D1120;
          border-top: 1px solid #1C2540;
          padding: 56px 40px;
          text-align: center;
        }
        .fhi-report__inner {
          max-width: 720px;
          margin: 0 auto;
        }
        .fhi-report__title {
          font-size: 30px;
          font-weight: 800;
          margin-bottom: 10px;
        }
        .fhi-report__sub {
          color: #8A9AC0;
          font-size: 15px;
          margin-bottom: 28px;
        }
        .fhi-report__note {
          font-size: 11px;
          color: #3A4A6A;
          margin-top: 16px;
          line-height: 1.6;
        }
        /* Footer */
        .fhi-footer {
          background: #060810;
          border-top: 1px solid #1C2540;
          padding: 20px 40px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .fhi-footer__text {
          font-size: 12px;
          color: #5A6A8A;
          flex: 1;
        }
        .fhi-footer__legal {
          font-size: 11px;
          color: #3A4A6A;
        }
        /* ── Mobile responsive ─────────────────────────────── */
        @media (max-width: 640px) {
          .fhi-nav { padding: 14px 16px; }
          .fhi-nav__links { display: none; }
          .fhi-breadcrumb { padding: 10px 16px; }
          .fhi-hero { padding: 40px 16px 36px; }
          .fhi-hero--guide { padding: 36px 16px 32px; }
          .fhi-hero__headline { font-size: 30px; }
          .fhi-hero__sub { font-size: 15px; }
          .fhi-hero__cta-row { flex-direction: column; }
          .fhi-cta-primary, .fhi-cta-secondary { text-align: center; padding: 16px; }
          .fhi-answer-block { padding: 24px 16px; }
          .fhi-answer-card { flex-direction: column; }
          .fhi-steps-section { padding: 40px 16px; }
          .fhi-eligibility-section { padding: 40px 16px; }
          .fhi-timeline-section { padding: 40px 16px; }
          .fhi-timeline-grid { grid-template-columns: 1fr; }
          .fhi-limits-section { padding: 40px 16px; }
          .fhi-limits-grid { grid-template-columns: 1fr; }
          .fhi-report { padding: 40px 16px; }
          .fhi-footer { padding: 16px; flex-direction: column; align-items: flex-start; gap: 6px; }
        }
      `}</style>
    </>
  );
}
