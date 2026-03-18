/* {{VENTURE_NAME}} — Contact */
window.renderContact = function () {
  const C = window.VentureComponents; /* REPLACE: window.{{VENTURE_SLUG}}Components */
  return `
    ${C.renderPageHero({
      eyebrow: '{{CTA_LABEL}}',
      /* REPLACE: Update page hero title and sub. */
      title: '{{CONTACT_HERO_TITLE}}<br><span>{{CONTACT_HERO_TITLE_2}}</span>',
      sub: '{{CONTACT_HERO_SUB}}',
    })}
    <section class="section">
      <div class="section-inner">
        <div class="two-col">
          <div>
            ${C.renderSectionHeader({ eyebrow: '{{CONTACT_FORM_EYEBROW}}', title: '{{CONTACT_FORM_TITLE}}' })}
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
                  /* REPLACE: Replace options with enquiry types relevant to this venture. */
                  <option value="general">{{ENQUIRY_TYPE_1}}</option>
                  <option value="partnership">{{ENQUIRY_TYPE_2}}</option>
                  <option value="beta">{{ENQUIRY_TYPE_3}}</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="cf-message">{{CONTACT_MESSAGE_LABEL}}</label>
                <textarea class="form-textarea" id="cf-message" name="message" placeholder="{{CONTACT_MESSAGE_PLACEHOLDER}}" required></textarea>
              </div>
              <button type="submit" class="form-submit">{{CONTACT_SUBMIT_LABEL}}</button>
            </form>
            <div id="form-success" class="form-success">
              <p><strong>Enquiry received.</strong></p>
              <p style="margin-top:8px;font-weight:400;font-size:14px;color:var(--text-muted);">{{CONTACT_SUCCESS_MSG}}</p>
            </div>
          </div>
          <div>
            ${C.renderSectionHeader({ eyebrow: 'Direct Contact', title: 'Channels' })}
            <div class="card mb-24">
              ${[
                /* REPLACE: Replace with real contact channels — email addresses per purpose. */
                { iconName: 'mail',      label: '{{CONTACT_CHANNEL_1_LABEL}}', value: '{{CONTACT_CHANNEL_1_EMAIL}}' },
                { iconName: 'handshake', label: '{{CONTACT_CHANNEL_2_LABEL}}', value: '{{CONTACT_CHANNEL_2_EMAIL}}' },
                { iconName: 'zap',       label: '{{CONTACT_CHANNEL_3_LABEL}}', value: '{{CONTACT_CHANNEL_3_EMAIL}}' },
              ].map(r => C.renderInfoRow(r)).join('')}
            </div>
            ${C.renderSectionHeader({ eyebrow: 'Response Times', title: 'What to expect' })}
            <div class="card">
              ${[
                /* REPLACE: Replace with real response time commitments. */
                { iconName: 'clock', label: '{{RESPONSE_TYPE_1}}', value: '{{RESPONSE_TIME_1}}' },
                { iconName: 'clock', label: '{{RESPONSE_TYPE_2}}', value: '{{RESPONSE_TIME_2}}' },
                { iconName: 'clock', label: '{{RESPONSE_TYPE_3}}', value: '{{RESPONSE_TIME_3}}' },
              ].map(r => C.renderInfoRow(r)).join('')}
            </div>
            <div class="mt-24">
              ${C.renderCallout(
                /* REPLACE: Update callout — honesty note, scope boundary, or key commitment. */
                '<strong>{{CONTACT_CALLOUT_BOLD}}.</strong> {{CONTACT_CALLOUT_BODY}}',
                'gold',
                'eye'
              )}
            </div>
          </div>
        </div>
      </div>
    </section>`;
};
