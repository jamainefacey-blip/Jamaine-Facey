/* Pain Nutrition — About */
window.renderAbout = function () {
  const C = window.PNComponents;
  return `
    ${C.renderPageHero({ eyebrow: 'About Pain Nutrition', title: 'Nutrition guidance that<br><span>respects your life</span>', sub: 'Not a diet brand. Not a supplement company. An educational platform that teaches you how to eat well — in the life you actually have.' })}
    <section class="section">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({ eyebrow: 'Our Mission', title: 'Accessible nutrition for everyone' })}
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">The nutrition industry is saturated with plans that work for people who already eat well, have flexible schedules, live alone, and have a healthy relationship with food. That describes a minority of the people who need nutritional support.</p>
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:24px;">Pain Nutrition was created to deliver practical, non-prescriptive nutrition guidance to the people most nutrition platforms ignore — families on budgets, people with unpredictable schedules, fitness clients who want structure without obsession, and anyone who has failed at a "diet" and blamed themselves for it.</p>
            ${C.renderCallout('The goal is not perfection. It is progress — consistent, sustainable, and built around your actual routine.', 'gold', 'heart')}
          </div>
          <div class="two-col-visual">
            ${C.renderStatBlock([
              { value: 'Real',     label: 'Practical guidance built for real routines' },
              { value: 'Clear',    label: 'No jargon, no guilt, no unnecessary complexity' },
              { value: 'Honest',   label: 'Clear about scope — we know when to refer' },
              { value: 'Flexible', label: 'Built to adapt to your life, not replace it' },
            ])}
          </div>
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Our Values', title: 'What we believe', centered: true })}
        <div class="card-grid">
          ${C.renderCard({ iconName: 'heart',  title: 'No guilt, no shame',  body: 'Nutrition guidance that does not use shame, fear, or restriction as tools. Behaviour change driven by understanding and habit-building — not deprivation.' })}
          ${C.renderCard({ iconName: 'eye',    title: 'Scope clarity',       body: 'We are clear about what we are and what we are not. Pain Nutrition is educational guidance. We refer to registered dietitians and clinical professionals when a situation exceeds our scope.' })}
          ${C.renderCard({ iconName: 'users',  title: 'Inclusive by design', body: 'Guidance designed for diverse households, dietary requirements, cultural food traditions, and budget realities. Nutrition advice that ignores context is not useful advice.' })}
          ${C.renderCard({ iconName: 'book',   title: 'Education, not prescription', body: 'We teach you to understand your nutrition — not to follow a plan until willpower runs out. Understanding is the only thing that sustains long-term change.' })}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Ready to start?',
          sub:   'Whether you are a fitness client looking for structure or a family looking for practical guidance — start here.',
          primaryCTA:   { label: 'Get Started',  href: '#contact',  route: 'contact' },
          secondaryCTA: { label: 'What We Offer', href: '#features', route: 'features' },
        })}
      </div>
    </section>`;
};
