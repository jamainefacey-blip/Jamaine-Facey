export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0B1120] text-slate-200">
      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav className="border-b border-[#1E2D4A] bg-[#0B1120]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#1D6FF2] font-bold text-xl tracking-tight">VST</span>
            <span className="text-slate-400 text-sm font-light hidden sm:inline">
              Voyage Smart Travels
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="#control" className="hover:text-white transition-colors">Platform</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a
              href="/sign-in"
              className="bg-[#1D6FF2] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#1558c4] transition-colors"
            >
              Sign in
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-[#1A2540] border border-[#1E2D4A] rounded-full px-4 py-1.5 text-xs text-[#8A99B8] mb-8 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D6FF2] inline-block"></span>
            Corporate travel management
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight text-white mb-6">
            Business travel.{' '}
            <span className="text-[#1D6FF2]">Controlled,</span>{' '}
            compliant, and continuously monitored.
          </h1>

          <p className="text-lg text-[#8A99B8] leading-relaxed max-w-2xl mb-10">
            Voyage Smart Travels enforces policy, reduces risk, and keeps your organisation
            in control — before, during, and after every journey.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/sign-up"
              className="bg-[#1D6FF2] text-white px-6 py-3 rounded font-medium text-sm hover:bg-[#1558c4] transition-colors inline-flex items-center justify-center"
            >
              Request access
            </a>
            <a
              href="#how-it-works"
              className="border border-[#1E2D4A] text-slate-300 px-6 py-3 rounded font-medium text-sm hover:border-[#2C3E60] hover:text-white transition-colors inline-flex items-center justify-center"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Stat strip */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 pt-12 border-t border-[#1E2D4A]">
          {[
            { value: '100%', label: 'Policy enforcement' },
            { value: 'Real-time', label: 'Journey monitoring' },
            { value: 'Instant', label: 'Exception flagging' },
            { value: 'Full', label: 'Audit trail' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-semibold text-white">{s.value}</p>
              <p className="text-sm text-[#8A99B8] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTROL SECTION ─────────────────────────────────────── */}
      <section id="control" className="bg-[#111827] border-y border-[#1E2D4A] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-4">
              Built for control.{' '}
              <span className="text-[#1D6FF2]">Powered by intelligence.</span>
            </h2>
            <p className="text-[#8A99B8] text-base leading-relaxed">
              Every journey passes through a structured evaluation layer before it moves
              forward. Nothing slips through.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Pre-trip evaluation',
                body: 'Every trip request is assessed against spend limits, destination risk, and organisational policy before approval is considered.',
              },
              {
                step: '02',
                title: 'Automatic policy application',
                body: 'Policies are applied at the point of booking — not after. Compliant options are surfaced; non-compliant options are restricted.',
              },
              {
                step: '03',
                title: 'Exception flagging',
                body: 'Any deviation from policy triggers an immediate flag, escalated to the appropriate approver without manual intervention.',
              },
              {
                step: '04',
                title: 'Live journey monitoring',
                body: 'Once a trip is approved, it is monitored in real time — delays, safety alerts, and itinerary changes are tracked and logged.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-[#1A2540] border border-[#1E2D4A] rounded-lg p-6"
              >
                <span className="text-[#1D6FF2] text-xs font-mono font-semibold tracking-widest">
                  {item.step}
                </span>
                <h3 className="text-white font-medium mt-3 mb-2">{item.title}</h3>
                <p className="text-[#8A99B8] text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVA ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-[#1A2540] border border-[#1E2D4A] rounded-xl p-10 flex flex-col sm:flex-row items-start sm:items-center gap-8">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#1D6FF2]/10 border border-[#1D6FF2]/20 flex items-center justify-center">
            <span className="text-[#1D6FF2] font-semibold text-sm">Ava</span>
          </div>
          <div>
            <h3 className="text-white font-medium text-lg mb-2">
              Always on. Always monitoring.
            </h3>
            <p className="text-[#8A99B8] text-base leading-relaxed max-w-2xl">
              Ava works in the background to evaluate, monitor, and guide every journey —
              ensuring nothing is missed.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-[#111827] border-y border-[#1E2D4A] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-xl mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-4">
              How it works
            </h2>
            <p className="text-[#8A99B8] text-base">
              A structured system flow — from request to completion.
            </p>
          </div>

          <ol className="relative border-l border-[#1E2D4A] ml-4 space-y-10">
            {[
              {
                n: 1,
                title: 'Request travel',
                body: 'The traveller or travel manager submits a trip request. Destination, dates, and purpose are captured at the point of entry.',
              },
              {
                n: 2,
                title: 'System evaluates cost, policy, and risk',
                body: 'The platform assesses the request against live spend data, corporate policy, and destination risk scoring. No manual review required at this stage.',
              },
              {
                n: 3,
                title: 'Approval or escalation triggered',
                body: 'Compliant requests proceed automatically. Exceptions are escalated to the designated approver with full context attached.',
              },
              {
                n: 4,
                title: 'Journey monitored through completion',
                body: 'From departure to return, the itinerary is tracked in real time. Any change, delay, or alert is logged and surfaced to the relevant stakeholder.',
              },
            ].map((step) => (
              <li key={step.n} className="ml-8">
                <span className="absolute -left-4 flex items-center justify-center w-8 h-8 rounded-full bg-[#1D6FF2]/10 border border-[#1D6FF2]/30 text-[#1D6FF2] text-xs font-semibold">
                  {step.n}
                </span>
                <h3 className="text-white font-medium mb-1">{step.title}</h3>
                <p className="text-[#8A99B8] text-sm leading-relaxed max-w-xl">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────── */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20">
        <div className="max-w-xl mb-14">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-4">
            Choose your level of control
          </h2>
          <p className="text-[#8A99B8] text-base">
            Each tier is designed around operational responsibility — from single travellers
            to enterprise-wide oversight.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              name: 'Starter',
              tagline: 'Basic control',
              price: 'Free',
              period: 'per user / month',
              description:
                'Foundation-level policy enforcement and pre-trip evaluation for small teams or individual business travellers.',
              features: [
                'Pre-trip policy checks',
                'Basic spend tracking',
                'Email alerts on exceptions',
                'Up to 5 travellers',
              ],
              cta: 'Get started',
              highlight: false,
            },
            {
              name: 'Business',
              tagline: 'Full operational control',
              price: '$19',
              period: 'per user / month',
              description:
                'Complete booking management, live journey monitoring, and automated approval workflows for growing organisations.',
              features: [
                'Everything in Starter',
                'Automated approval routing',
                'Live journey monitoring',
                'Duty of care alerts',
                'Full audit trail',
                'Up to 100 travellers',
              ],
              cta: 'Start free trial',
              highlight: true,
            },
            {
              name: 'Enterprise',
              tagline: 'Complete organisational oversight',
              price: 'Custom',
              period: 'contact for pricing',
              description:
                'Enterprise-grade controls, dedicated account management, custom policy engine, and multi-entity support.',
              features: [
                'Everything in Business',
                'Custom policy engine',
                'Multi-entity management',
                'SSO / SAML integration',
                'Dedicated account manager',
                'SLA-backed support',
                'Unlimited travellers',
              ],
              cta: 'Contact us',
              highlight: false,
            },
          ].map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl border p-8 flex flex-col ${
                tier.highlight
                  ? 'border-[#1D6FF2] bg-[#1A2540]'
                  : 'border-[#1E2D4A] bg-[#111827]'
              }`}
            >
              {tier.highlight && (
                <span className="text-xs font-semibold text-[#1D6FF2] tracking-widest uppercase mb-4">
                  Most popular
                </span>
              )}
              <div className="mb-1">
                <span className="text-white font-semibold text-lg">{tier.name}</span>
              </div>
              <div className="text-[#8A99B8] text-xs uppercase tracking-widest mb-4">
                {tier.tagline}
              </div>
              <div className="mb-2">
                <span className="text-white text-3xl font-bold">{tier.price}</span>
              </div>
              <p className="text-[#8A99B8] text-xs mb-4">{tier.period}</p>
              <p className="text-[#8A99B8] text-sm leading-relaxed mb-6 border-t border-[#1E2D4A] pt-6">
                {tier.description}
              </p>
              <ul className="space-y-2 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-[#1D6FF2] mt-0.5 flex-shrink-0">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/sign-up"
                className={`w-full text-center py-2.5 rounded text-sm font-medium transition-colors ${
                  tier.highlight
                    ? 'bg-[#1D6FF2] text-white hover:bg-[#1558c4]'
                    : 'border border-[#2C3E60] text-slate-300 hover:border-[#1D6FF2] hover:text-white'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-[#1E2D4A] bg-[#0B1120] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#1D6FF2] font-bold text-lg">VST</span>
            <span className="text-[#8A99B8] text-sm">Voyage Smart Travels</span>
          </div>
          <p className="text-[#8A99B8] text-xs">
            &copy; {new Date().getFullYear()} Voyage Smart Travels. All rights reserved.
          </p>
          <div className="flex gap-5 text-xs text-[#8A99B8]">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
