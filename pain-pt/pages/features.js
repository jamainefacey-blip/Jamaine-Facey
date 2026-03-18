/* Pain PT — Features / The System */
window.renderFeatures = function () {
  const C = window.PPTComponents;
  return `
    ${C.renderPageHero({ eyebrow: 'The System', title: 'A coaching framework<br><span>built for progress</span>', sub: 'Five components. One disciplined system. No guesswork about what to do next.' })}
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'System Components', title: 'What makes up Pain PT', centered: true })}
        <div class="card-grid">
          ${C.renderCard({ iconName: 'target',   title: 'Coaching Framework',      body: 'A structured coaching relationship with defined phases, clear goals, regular check-ins, and honest review. Not just a programme — a disciplined system with a coach behind it.' })}
          ${C.renderCard({ iconName: 'calendar', title: 'Training Plan Structure', body: 'Periodised training plans with progressive overload built in. Beginners get foundational structure. Intermediate clients get targeted programming for specific goals.' })}
          ${C.renderCard({ iconName: 'activity', title: 'Progress Tracking',       body: 'Structured progress review — not obsessive daily tracking, but meaningful weekly and monthly check-ins that show the trend over time.' })}
          ${C.renderCard({ iconName: 'zap',      title: 'Discipline System',       body: 'Accountability that works when motivation does not. A system for maintaining consistency — built on habits and structure, not willpower.' })}
          ${C.renderCard({ iconName: 'eye',      title: 'AI-Guided Pathway',       body: 'In development. Future functionality will use AI-guided programme adaptation based on progress data — maintaining the coaching relationship while scaling personalisation.' })}
          ${C.renderCard({ iconName: 'shield',   title: 'Safe Training Protocol',  body: 'Every plan is built with injury prevention and appropriate progression at its core. Intensity is earned. Recovery is non-negotiable.' })}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'How It Works', title: 'The coaching journey', sub: 'Four stages. Clear progression. No guesswork.' })}
        ${C.renderStepList([
          { title: 'Intake and goal-setting', body: 'We start with an honest assessment of where you are — training history, current capacity, injury history, time available, and what you actually want to achieve. Not what you think you should want. What you actually want.' },
          { title: 'Plan design and baseline phase', body: 'Your first training phase is built around your current capacity — not where you want to be. Foundations are established. Movement patterns are reinforced. Consistency is built before intensity increases.' },
          { title: 'Progressive phases with regular review', body: 'Each phase progresses in line with your actual performance — not a predetermined schedule. Check-ins identify what is working, what needs adjustment, and what the next phase should prioritise.' },
          { title: 'Long-term structure and independence', body: 'The goal of coaching is not dependency. Over time, you develop the understanding and discipline to maintain and progress your own training — with coaching support stepping back as your capacity grows.' },
        ])}
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Who It Is For', title: 'Three client types we work best with' })}
        <div class="card-grid">
          ${C.renderCard({ iconName: 'users',    title: 'Fitness beginners',    body: 'Building the first sustainable training habit. Establishing movement quality before intensity. Learning to train consistently before training hard.' })}
          ${C.renderCard({ iconName: 'activity', title: 'Returning trainees',   body: 'Back from injury, illness, a long break, or life getting in the way. A structured return-to-training programme that rebuilds foundation without ego driving the load too fast.' })}
          ${C.renderCard({ iconName: 'target',   title: 'Intermediate clients', body: 'Training consistently but not progressing. Need more structure, more intelligent programming, and more honest feedback about what is actually limiting them.' })}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Ready to start the system?',
          sub:   'Coaching enquiry takes five minutes. We respond within one business day and we are honest about whether we are the right fit.',
          primaryCTA:   { label: 'Start Coaching', href: '#contact', route: 'contact' },
          secondaryCTA: { label: 'Safe Training',  href: '#safety',  route: 'safety' },
        })}
      </div>
    </section>`;
};
