/* Pain PT — Contact */
window.renderContact = function () {
  const C = window.PPTComponents;
  return `
    ${C.renderPageHero({ eyebrow: 'Start Coaching', title: 'Tell us about<br><span>where you are</span>', sub: 'Coaching interest, partnership enquiry, or beta access request — we respond to every message and we are honest about fit.' })}
    <section class="section">
      <div class="section-inner">
        <div class="two-col">
          <div>
            ${C.renderSectionHeader({ eyebrow: 'Coaching Enquiry', title: 'Tell us your situation' })}
            <form id="contact-form" novalidate>
              <div class="form-group">
                <label class="form-label" for="cf-name">Your name</label>
                <input class="form-input" type="text" id="cf-name" name="name" placeholder="How should we address you?" required autocomplete="name" />
              </div>
              <div class="form-group">
                <label class="form-label" for="cf-email">Email address</label>
                <input class="form-input" type="email" id="cf-email" name="email" placeholder="your@email.com" required autocomplete="email" />
              </div>
              <div class="form-group">
                <label class="form-label" for="cf-type">Enquiry type</label>
                <select class="form-select" id="cf-type" name="type" required>
                  <option value="" disabled selected>Select enquiry type</option>
                  <option value="coaching-beginner">Coaching — fitness beginner</option>
                  <option value="coaching-returning">Coaching — returning to training</option>
                  <option value="coaching-intermediate">Coaching — intermediate client / plateau</option>
                  <option value="coaching-rehab">Coaching — returning from injury / illness</option>
                  <option value="beta">Beta access — early platform access</option>
                  <option value="partner-gym">Partnership — gym or training facility</option>
                  <option value="partner-physio">Partnership — physiotherapist / sports therapist</option>
                  <option value="partner-coach">Partnership — PT or coach referral</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="cf-history">Training background (brief)</label>
                <input class="form-input" type="text" id="cf-history" name="history" placeholder="e.g. 2 years gym, 6 month break, currently doing nothing" />
              </div>
              <div class="form-group">
                <label class="form-label" for="cf-message">What do you want to achieve?</label>
                <textarea class="form-textarea" id="cf-message" name="message" placeholder="Be specific. Not 'get fit' — what does improvement look like for you in 6 months? Any injuries, time constraints, or equipment limitations we should know about?" required></textarea>
              </div>
              <button type="submit" class="form-submit">Send Coaching Enquiry</button>
            </form>
            <div id="form-success" class="form-success">
              <p><strong>Enquiry received.</strong></p>
              <p style="margin-top:8px;font-weight:400;font-size:14px;color:var(--text-muted);">We respond within 1 business day. We will give you an honest assessment of whether Pain PT is the right fit — and if not, we will point you in the right direction.</p>
            </div>
          </div>
          <div>
            ${C.renderSectionHeader({ eyebrow: 'Direct Contact', title: 'Channels' })}
            <div class="card mb-24">
              ${[
                { iconName: 'mail',      label: 'Coaching Enquiries',   value: 'coaching@painpt.com' },
                { iconName: 'handshake', label: 'Partnerships',         value: 'partners@painpt.com' },
                { iconName: 'zap',       label: 'Beta Access',          value: 'beta@painpt.com' },
              ].map(r => C.renderInfoRow(r)).join('')}
            </div>
            ${C.renderSectionHeader({ eyebrow: 'Response Times', title: 'What to expect' })}
            <div class="card">
              ${[
                { iconName: 'clock', label: 'Coaching enquiries',    value: 'Within 1 business day. We will be honest about fit.' },
                { iconName: 'clock', label: 'Partnership enquiries',  value: 'Within 3 business days.' },
                { iconName: 'clock', label: 'Beta access requests',   value: 'Within 5 business days — we will add you to the beta list and notify you when access opens.' },
              ].map(r => C.renderInfoRow(r)).join('')}
            </div>
            <div class="mt-24">
              ${C.renderCallout('<strong>Fit matters.</strong> Pain PT is not right for everyone. If we are not the right coaching environment for your goals or situation, we will tell you — and we will try to point you somewhere that is.', 'gold', 'eye')}
            </div>
          </div>
        </div>
      </div>
    </section>`;
};
