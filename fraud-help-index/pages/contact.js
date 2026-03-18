/* Fraud Help Index — Contact / Report Page */
window.renderContact = function () {
  const C = window.FHIComponents;
  return `
    ${C.renderPageHero({
      eyebrow: 'Report & Contact',
      title:   'Find your<br><span>reporting route</span>',
      sub:     'Use this form to describe your situation. We will respond with the specific reporting authority and steps you should take — usually within one business day.',
    })}
    <section class="section">
      <div class="section-inner">
        <div class="two-col">
          <div>
            ${C.renderSectionHeader({ eyebrow: 'Describe Your Situation', title: 'What happened?' })}
            ${C.renderCallout('If fraud is in progress right now or you are in immediate danger — call <strong>999</strong> (UK) or your national emergency number. Do not use this form for emergencies.', 'red', 'warning')}
            <div class="mt-24">
              <form id="contact-form" novalidate>
                <div class="form-group">
                  <label class="form-label" for="cf-name">Your name (optional)</label>
                  <input class="form-input" type="text" id="cf-name" name="name" placeholder="You can remain anonymous" autocomplete="name" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="cf-email">Email address (for our response)</label>
                  <input class="form-input" type="email" id="cf-email" name="email" placeholder="your@email.com" required autocomplete="email" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="cf-type">Enquiry type</label>
                  <select class="form-select" id="cf-type" name="type" required>
                    <option value="" disabled selected>Select the nature of your enquiry</option>
                    <option value="report">I have been a victim of fraud and need to report it</option>
                    <option value="identify">I am not sure if I have been defrauded</option>
                    <option value="prevention">I want to check if something is a scam before acting</option>
                    <option value="third-party">I am reporting on behalf of someone else</option>
                    <option value="agency">I want to list an agency or organisation</option>
                    <option value="press">Press or media enquiry</option>
                    <option value="partnership">Partnership or data request</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="cf-country">Country where the fraud occurred</label>
                  <input class="form-input" type="text" id="cf-country" name="country" placeholder="e.g. United Kingdom" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="cf-message">Describe what happened</label>
                  <textarea class="form-textarea" id="cf-message" name="message" placeholder="Include: how contact was made, what you were asked to do, whether money or information was shared, and when it happened. The more detail, the more precise our guidance." required></textarea>
                </div>
                <button type="submit" class="form-submit">Send — Get Reporting Guidance</button>
              </form>
              <div id="form-success" class="form-success">
                <p><strong>Received. We will respond within one business day.</strong></p>
                <p style="margin-top:8px;font-weight:400;font-size:14px;color:var(--text-muted);">While you wait — if money was transferred in the last 72 hours, contact your bank now on the number on the back of your card and ask them to initiate a recall.</p>
              </div>
            </div>
          </div>
          <div>
            ${C.renderSectionHeader({ eyebrow: 'Immediate Actions', title: 'Do this now' })}
            <div class="card mb-24">
              ${[
                { iconName: 'phone',    label: 'Action Fraud (UK)',           value: '0300 123 2040 · Mon–Fri 8am–8pm · actionfraud.police.uk' },
                { iconName: 'building', label: 'FCA Consumer Helpline',       value: '0800 111 6768 · For investment and financial fraud' },
                { iconName: 'users',    label: 'Citizens Advice',             value: '0808 223 1133 · Free advice on recovery steps' },
                { iconName: 'shield',   label: 'Victim Support',              value: '0808 168 9111 · Emotional support and practical guidance' },
                { iconName: 'phone',    label: 'Relay UK (deaf/hard of hearing)', value: '18001 0300 123 2040 · Action Fraud via relay' },
              ].map(r => C.renderInfoRow(r)).join('')}
            </div>
            ${C.renderCallout('<strong>Contact your bank first.</strong> Before anything else — if money was sent in the last 72 hours, call your bank now. Ask them to initiate a payment recall. This is the single most time-critical action.', 'gold', 'clock')}
            <div class="mt-24">
              ${C.renderSectionHeader({ eyebrow: 'Response Times', title: 'What to expect' })}
              <div class="card">
                ${[
                  { iconName: 'clock', label: 'Directory guidance', value: 'Within 1 business day — we will identify the correct reporting authority for your specific situation.' },
                  { iconName: 'mail',  label: 'Agency listing requests', value: 'Within 3 business days — include full organisation details and evidence of public interest status.' },
                  { iconName: 'globe', label: 'Press enquiries', value: 'Within 2 business days — include your publication, deadline, and the nature of your enquiry.' },
                ].map(r => C.renderInfoRow(r)).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>`;
};
