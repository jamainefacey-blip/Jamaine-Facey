/* Pain Nutrition — Features / What We Offer */
window.renderFeatures = function () {
  const C = window.PNComponents;
  return `
    ${C.renderPageHero({ eyebrow: 'What We Offer', title: 'Practical tools for<br><span>real nutrition change</span>', sub: 'Guidance, education, and structure — without rigid plans, unrealistic commitments, or expensive products.' })}
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Core Offerings', title: 'What is available', centered: true })}
        <div class="card-grid">
          ${C.renderCard({ iconName: 'calendar', title: 'Meal Planning Guidance',      body: 'Weekly meal planning frameworks that adapt to your household, budget, and schedule. Templates, shopping list structures, and batch cooking guides — built to save time, not add to it.' })}
          ${C.renderCard({ iconName: 'book',     title: 'Nutrition Education Library', body: 'Clearly written guides on macronutrients, micronutrients, hydration, meal timing, and label reading. Designed for someone with no prior nutrition knowledge.' })}
          ${C.renderCard({ iconName: 'zap',      title: 'Progress Frameworks',         body: 'Not a tracking app. A structured approach to monitoring what is working, adjusting what is not, and building sustainable habits over weeks — not days.' })}
          ${C.renderCard({ iconName: 'users',    title: 'Family Nutrition Guides',     body: 'Practical guidance for mixed households, children, and families with different nutritional goals. Includes budget cooking, fussy eater strategies, and quick weeknight approaches.' })}
          ${C.renderCard({ iconName: 'heart',    title: 'Coaching Support',            body: 'One-to-one nutrition coaching sessions for clients who want personalised guidance. Available to fitness clients and general public. Not clinical — educational and behaviour-focused.' })}
          ${C.renderCard({ iconName: 'eye',      title: 'Clear Scope Referrals',       body: 'When your situation requires clinical dietitian or medical nutrition input, we say so — and we point you to the right type of professional rather than overstretching our scope.' })}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'How It Works', title: 'From guidance to habit', sub: 'A three-stage framework for sustainable nutrition change.' })}
        ${C.renderStepList([
          { title: 'Understand your baseline', body: 'Start by understanding what you currently eat and why — not to judge it, but to identify where practical changes are most achievable. No calorie counting required.' },
          { title: 'Apply practical changes', body: 'Use our meal planning guides, education library, and cooking frameworks to make incremental, sustainable changes. Small wins build the habit base.' },
          { title: 'Build habits that stick', body: 'The progress framework helps you review, adjust, and embed changes over time. The goal is not a perfect week — it is a better year.' },
        ])}
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Start with the guidance that fits your life',
          sub:   'No one-size-fits-all plan. Tell us about your situation and we will point you to the most useful place to start.',
          primaryCTA:   { label: 'Get Started',   href: '#contact', route: 'contact' },
          secondaryCTA: { label: 'Our Approach',  href: '#safety',  route: 'safety' },
        })}
      </div>
    </section>`;
};
