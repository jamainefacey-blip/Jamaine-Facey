/* Pain PT — About */
window.renderAbout = function () {
  const C = window.PPTComponents;
  return `
    ${C.renderPageHero({ eyebrow: 'About Pain PT', title: 'Built on<br><span>discipline, not hype</span>', sub: 'No transformation promises. No quick-fix programmes. A structured coaching platform for people who want to train properly and improve consistently.' })}
    <section class="section">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({ eyebrow: 'Our Mission', title: 'Structure and accountability for every client' })}
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">The fitness industry sells motivation. Pain PT sells structure. Motivation gets you started — structure keeps you going when motivation disappears, which it always does.</p>
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:24px;">Pain PT exists to give clients a coaching framework and training system that produces real, measurable improvement — without the noise, the supplements, the before-and-after marketing, or the unrealistic timelines that define most fitness platforms.</p>
            ${C.renderCallout('Consistent, correct effort over time. That is the entire system. Everything we build — the coaching framework, the training plans, the accountability check-ins — serves that principle.', 'gold', 'target')}
          </div>
          <div class="two-col-visual">
            ${C.renderStatBlock([
              { value: 'Structured', label: 'Coaching with clear phases and progression' },
              { value: 'Honest',     label: 'About timelines, effort, and what works' },
              { value: 'Safe',       label: 'Progressive overload, not premature intensity' },
              { value: 'Long-term',  label: 'Built for years of training, not weeks' },
            ])}
          </div>
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Our Values', title: 'What we build on', centered: true })}
        <div class="card-grid">
          ${C.renderCard({ iconName: 'zap',      title: 'Discipline over motivation', body: 'We do not rely on your motivation staying high. The system is designed to be followed consistently — especially when you do not feel like it.' })}
          ${C.renderCard({ iconName: 'activity', title: 'Progressive overload',       body: 'Training plans built on progressive overload principles. Intensity, volume, and complexity increase as your capacity does — not before.' })}
          ${C.renderCard({ iconName: 'shield',   title: 'Safety and longevity',       body: 'We train for years, not weeks. Every decision in programme design is made with injury prevention and long-term training health as the first consideration.' })}
          ${C.renderCard({ iconName: 'eye',      title: 'Honest coaching',            body: 'We tell clients the truth — about their progress, their limitations, and what needs to change. Honest feedback is the only kind that produces improvement.' })}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Ready to train properly?',
          sub:   'Coaching enquiries welcome. We will be honest about whether we are the right fit for where you are and where you want to go.',
          primaryCTA:   { label: 'Start Coaching', href: '#contact',  route: 'contact' },
          secondaryCTA: { label: 'The System',     href: '#features', route: 'features' },
        })}
      </div>
    </section>`;
};
