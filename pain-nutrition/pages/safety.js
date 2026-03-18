/* Pain Nutrition — Our Approach (Safety) */
window.renderSafety = function () {
  const C = window.PNComponents;
  return `
    ${C.renderPageHero({ eyebrow: 'Our Approach', title: 'Honest about<br><span>what we are</span>', sub: 'Pain Nutrition is educational content and practical guidance. We are clear about where our scope ends — and where registered clinical professionals should take over.' })}
    <section class="section">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({ eyebrow: 'What We Are', title: 'Educational guidance — not clinical nutrition' })}
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">Pain Nutrition provides educational nutrition content, practical meal planning frameworks, and behaviour-change support. This is not clinical dietitian input, medical nutrition therapy, or NHS-regulated services.</p>
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:24px;">We do not diagnose, treat, or provide medical advice. We do not support extreme calorie restriction, elimination diets, or any approach that a registered dietitian would flag as a clinical concern.</p>
            ${C.renderCallout('<strong>If you have a medical condition, eating disorder history, or are under clinical care for a nutritional condition — please work with a registered dietitian or your GP before making dietary changes.</strong>', 'gold', 'shield')}
          </div>
          <div class="two-col-visual">
            ${C.renderStatBlock([
              { value: 'In scope',     label: 'Practical meal planning and nutrition education' },
              { value: 'In scope',     label: 'Behaviour-change support and habit frameworks' },
              { value: 'Out of scope', label: 'Clinical diagnosis and medical nutrition therapy' },
              { value: 'Out of scope', label: 'Treatment of eating disorders or clinical conditions' },
            ])}
          </div>
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Our Principles', title: 'How we approach guidance', centered: true })}
        <div class="card-grid">
          ${C.renderCard({ iconName: 'heart', title: 'No restriction-based advice',  body: 'We do not recommend severe calorie restriction, food elimination without clinical reason, or any approach that prioritises rapid weight loss over sustainable health.' })}
          ${C.renderCard({ iconName: 'eye',   title: 'Transparent scope limits',    body: 'Every content piece is clear about when a situation requires clinical input. We would rather refer appropriately than overreach our expertise.' })}
          ${C.renderCard({ iconName: 'users', title: 'Non-judgemental framing',     body: 'No food is "bad". No eating pattern is "failed". Our guidance is built around understanding, habit-building, and practical progress — without shame or moral framing around food choices.' })}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'When to Seek Clinical Support', title: 'Refer to a professional if…' })}
        ${C.renderCheckList([
          'You have a diagnosed medical condition where diet is part of clinical management (diabetes, IBD, kidney disease, etc.)',
          'You have a history of disordered eating or are currently experiencing disordered eating patterns',
          'You are pregnant or breastfeeding and require clinical nutritional support',
          'You are managing significant unintentional weight loss or gain without a clear cause',
          'A previous healthcare professional has recommended you see a registered dietitian',
          'You are a child or supporting a child with clinical nutritional concerns',
        ])}
        <div class="mt-24">
          ${C.renderCallout('<strong>Find a registered dietitian:</strong> BDA (British Dietetic Association) at bda.uk.com/find-a-dietitian. Or speak to your GP who can refer you via the NHS.', 'blue', 'globe')}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Practical guidance, honestly delivered',
          sub:   'If Pain Nutrition is right for your situation, we are here. If you need clinical support, we will tell you — and point you in the right direction.',
          primaryCTA: { label: 'Get Started', href: '#contact', route: 'contact' },
        })}
      </div>
    </section>`;
};
