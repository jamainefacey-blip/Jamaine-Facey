/* Pain PT — Safe Training */
window.renderSafety = function () {
  const C = window.PPTComponents;
  return `
    ${C.renderPageHero({ eyebrow: 'Safe Training', title: 'Train hard.<br><span>Train smart. Train long.</span>', sub: 'Safety is not the opposite of intensity. It is the foundation that makes sustained intensity possible. Every Pain PT programme is built on this principle.' })}
    <section class="section">
      <div class="section-inner">
        <div class="two-col">
          <div class="two-col-text">
            ${C.renderSectionHeader({ eyebrow: 'Our Approach to Safety', title: 'Intensity is earned, not assumed' })}
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">Every Pain PT training plan starts from your current capacity — not your target capacity. Load, volume, and intensity increase in line with your actual performance, not a predetermined schedule that assumes linear progress.</p>
            <p style="font-size:16px;color:var(--text-muted);line-height:1.75;margin-bottom:24px;">The most common cause of training failure is not insufficient effort — it is insufficient recovery, premature load increases, and programme design that does not account for real-world inconsistency.</p>
            ${C.renderCallout('<strong>If something hurts — stop.</strong> Pain PT coaching operates a zero-push-through-sharp-pain policy. Discomfort and effort are expected. Pain is a signal that requires assessment, not override.', 'gold', 'shield')}
          </div>
          <div class="two-col-visual">
            ${C.renderStatBlock([
              { value: 'Progressive', label: 'Overload — load increases with capacity' },
              { value: 'Mandatory',   label: 'Recovery built into every training plan' },
              { value: 'Assessed',    label: 'Starting point, not assumed' },
              { value: 'Injury',      label: 'Prevention is the first design consideration' },
            ])}
          </div>
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Safe Training Principles', title: 'What we build every programme around', centered: true })}
        <div class="card-grid">
          ${C.renderCard({ iconName: 'activity', title: 'Progressive overload', body: 'Load, volume, and complexity increase systematically — not arbitrarily. Progress is driven by performance data, not calendar dates.' })}
          ${C.renderCard({ iconName: 'calendar', title: 'Built-in recovery',    body: 'Recovery is not optional. Deload weeks, rest days, and reduced-volume phases are programmed — not left to the client to manage on willpower.' })}
          ${C.renderCard({ iconName: 'eye',      title: 'Movement quality first', body: 'Load is only increased when movement quality is established. Compensated movement patterns under load produce injury, not progress.' })}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${C.renderSectionHeader({ eyebrow: 'Medical Considerations', title: 'When to consult a professional first' })}
        ${C.renderCheckList([
          'You have a current or recent musculoskeletal injury — see a physiotherapist before starting a new programme',
          'You have been sedentary for more than 12 months — your GP can advise on appropriate starting intensity',
          'You have a cardiovascular condition, respiratory condition, or metabolic disease',
          'You are pregnant or postpartum — specialised fitness guidance applies',
          'You experience pain (not discomfort) during or after exercise — have it assessed before continuing',
          'You are on medication that affects heart rate, blood pressure, or energy metabolism',
        ])}
        <div class="mt-24">
          ${C.renderCallout('Pain PT coaching is exercise programming — not medical rehabilitation. If you are returning from injury or managing a health condition, please ensure you have medical clearance and, where appropriate, physiotherapy support running alongside your training.', 'blue', 'shield')}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderCTABanner({
          title: 'Train safely. Train consistently. Progress.',
          sub:   'A coaching enquiry is the first step. We assess your starting point before we design anything.',
          primaryCTA: { label: 'Start Coaching', href: '#contact', route: 'contact' },
        })}
      </div>
    </section>`;
};
