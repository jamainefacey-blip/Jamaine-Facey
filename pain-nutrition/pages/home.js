/* Pain Nutrition — Home */
window.renderHome = function () {
  const C = window.PNComponents;
  return `
    ${C.renderHero({
      eyebrow: 'Nutrition Guidance — Without the Noise',
      title:   'Real food. Real routines.<br><span>Real results.</span>',
      sub:     'Pain Nutrition delivers practical, accessible nutrition guidance built for everyday people — not elite athletes, not crash dieters. Clear, usable, and grounded in what actually works long-term.',
      primaryCTA:   { label: 'Get Started',       href: '#contact',  route: 'contact' },
      secondaryCTA: { label: 'What We Offer',      href: '#features', route: 'features' },
    })}
    ${C.renderTrustStrip([
      { icon: 'heart',    value: 'Practical', label: 'guidance built for real life' },
      { icon: 'users',    value: 'Family',    label: 'friendly — works for households, not just individuals' },
      { icon: 'book',     value: 'Clear',     label: 'plain English — no jargon, no guilt' },
      { icon: 'shield',   value: 'Safe',      label: 'non-medical — knows its boundaries' },
    ])}
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'What We Do', title: 'Nutrition support that fits<br><span>your actual life</span>', sub: 'Not a diet plan. Not a calorie counter. A practical education and support platform that makes good nutrition genuinely achievable — regardless of how busy, constrained, or overwhelmed your routine feels.', centered: true })}
        <div class="card-grid">
          ${C.renderCard({ iconName: 'calendar', title: 'Meal Planning Guidance',     body: 'Practical weekly meal planning frameworks — not rigid meal plans you abandon after three days. Structured to adapt to what is in your fridge, your budget, and your schedule.' })}
          ${C.renderCard({ iconName: 'book',     title: 'Nutrition Education',        body: 'Understand what you are eating and why it matters — without a nutrition degree. We explain macros, micros, hydration, and timing in language that makes sense.' })}
          ${C.renderCard({ iconName: 'heart',    title: 'Progress Support',           body: 'Nutrition is not a sprint. Our progress support framework helps you build habits that last — celebrating what works and adjusting what does not, without shame or pressure.' })}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({ eyebrow: 'Who This Is For', title: 'Nutrition for<br><span>real people</span>' })}
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">Most nutrition resources are written for motivated, time-rich people without dietary constraints, tight budgets, or family obligations. That is not most people.</p>
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:24px;">Pain Nutrition is designed for people managing real routines — families, shift workers, fitness clients looking for practical structure, and anyone who has tried a "nutrition plan" and found it impossible to maintain.</p>
            ${C.renderCallout('<strong>Not medical advice.</strong> Pain Nutrition is educational content and practical guidance — not clinical nutrition or dietitian services. We are clear about where our scope ends and where a registered professional should take over.', 'gold', 'shield')}
          </div>
          <div class="two-col-visual">
            ${C.renderStatBlock([
              { value: 'Clear',   label: 'Plain English throughout' },
              { value: 'Family',  label: 'Guidance that works for households' },
              { value: 'Flexible', label: 'No rigid meal plans to abandon' },
              { value: 'Free',    label: 'Core resources available to all' },
            ])}
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Family-First', title: 'Practical tips for<br>households, not just individuals', centered: true })}
        <div class="card-grid">
          ${C.renderCard({ iconName: 'users',    title: 'Cook once, eat well twice',    body: 'Batch cooking guidance built around real kitchens, real budgets, and real time constraints. Simple frameworks that reduce decision fatigue without requiring a weekly meal prep marathon.' })}
          ${C.renderCard({ iconName: 'calendar', title: 'Adaptable weekly structures',  body: 'Nutrition frameworks that flex around your week — not rigid plans that fall apart the moment you have a late night, a work trip, or an unplanned takeaway.' })}
          ${C.renderCard({ iconName: 'heart',    title: 'Children and mixed households', body: 'Guidance for households with mixed needs, fussy eaters, or family members with different goals. Practical, not preachy.' })}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Start where you are',
          sub:   'No expensive supplements. No elimination diets. No unsustainable commitments. Just practical guidance that works with your life.',
          primaryCTA:   { label: 'Get Started',   href: '#contact',  route: 'contact' },
          secondaryCTA: { label: 'Our Approach',  href: '#safety',   route: 'safety' },
        })}
      </div>
    </section>`;
};
