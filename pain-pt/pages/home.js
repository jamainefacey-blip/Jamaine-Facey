/* Pain PT — Home */
window.renderHome = function () {
  const C = window.PPTComponents;
  return `
    ${C.renderHero({
      eyebrow: 'Coaching, Structure & Accountability',
      title:   'Structure. Discipline.<br><span>Progress.</span>',
      sub:     'Pain PT is a training and progress platform for clients who want to improve — with a coaching framework, a disciplined system, and the accountability that actually makes change happen.',
      primaryCTA:   { label: 'Start Coaching',  href: '#contact',  route: 'contact' },
      secondaryCTA: { label: 'The System',       href: '#features', route: 'features' },
    })}
    ${C.renderTrustStrip([
      { icon: 'target',   value: 'Structured', label: 'coaching framework with clear progression' },
      { icon: 'zap',      value: 'Discipline', label: 'led — not motivation-dependent' },
      { icon: 'activity', value: 'Progress',   label: 'tracked, reviewed, and built upon' },
      { icon: 'users',    value: 'Real',       label: 'coaching relationships — not automated programs' },
    ])}
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'The Platform', title: 'What Pain PT<br><span>gives you</span>', sub: 'A coaching framework, a training structure, and an accountability system. Not a generic app. Not a one-size-fits-all programme. A disciplined system built around your goals and your starting point.', centered: true })}
        <div class="card-grid">
          ${C.renderCard({ iconName: 'target',   title: 'Coaching Framework',     body: 'A structured approach to coaching that maps your starting point, your goal, and the progression path between them. Clear phases. Clear milestones. Clear expectations on both sides.' })}
          ${C.renderCard({ iconName: 'calendar', title: 'Training Plan Structure', body: 'Training plans built with progressive overload, appropriate recovery, and real-world constraints in mind. For beginners building habits and experienced clients pushing past plateaus.' })}
          ${C.renderCard({ iconName: 'activity', title: 'Progress & Accountability', body: 'Regular check-ins, tracked progress, and an honest review process. Discipline-led — which means we hold you to the system when motivation dips, as it always does.' })}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({ eyebrow: 'Who This Is For', title: 'Clients who are ready<br><span>to actually change</span>' })}
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">Pain PT is not for everyone. It is for clients who understand that progress requires consistency, that motivation is unreliable, and that a structured system is the only thing that produces lasting improvement.</p>
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:24px;">We work with fitness beginners building their first sustainable habits, returning trainees who need structure after a break, and intermediate clients who have hit a plateau and need a disciplined system to move through it.</p>
            ${C.renderCallout('<strong>Not a quick fix.</strong> Pain PT is built on the principle that consistent, structured effort — applied correctly over time — produces results that short-term programmes cannot. If you want fast results with minimal effort, this is not the right platform.', 'gold', 'zap')}
          </div>
          <div class="two-col-visual">
            ${C.renderStatBlock([
              { value: 'Beginners',     label: 'Building first sustainable habits' },
              { value: 'Returning',     label: 'Trainees needing structure after a break' },
              { value: 'Intermediate', label: 'Clients breaking through a plateau' },
              { value: 'AI-Guided',    label: 'Future pathway — in development' },
            ])}
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'The Difference', title: 'Discipline over motivation', centered: true })}
        <div class="card-grid">
          ${C.renderCard({ iconName: 'zap',      title: 'Motivation is not a plan', body: 'Motivation fluctuates. A discipline-led system does not. Pain PT is built around consistent action — not waiting to feel ready. The system works when the motivation does not show up.' })}
          ${C.renderCard({ iconName: 'activity', title: 'Progress, not perfection',  body: 'We track the trend, not the individual session. A missed session does not break the system — it is accounted for. Progress is measured in weeks and months, not days.' })}
          ${C.renderCard({ iconName: 'shield',   title: 'Safe and sustainable',      body: 'Every training plan is built with injury prevention, appropriate progression, and long-term training health in mind. Intensity is earned through consistency, not demanded from day one.' })}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Ready to build something that lasts?',
          sub:   'Start with a coaching enquiry. Tell us where you are and where you want to get to. We will be honest about whether we are the right fit.',
          primaryCTA:   { label: 'Start Coaching',  href: '#contact',  route: 'contact' },
          secondaryCTA: { label: 'The System',      href: '#features', route: 'features' },
        })}
      </div>
    </section>`;
};
