/* Pain Nutrition — Contact */
window.renderContact = function () {
  const C = window.PNComponents;
  return `
    ${C.renderPageHero({ eyebrow: 'Get Started', title: 'Tell us what<br><span>you need</span>', sub: 'Coaching enquiry, content partnership, early access, or a general question — we respond to every message.' })}
    <section class="section">
      <div class="section-inner">
        <div class="two-col">
          <div>
            ${C.renderSectionHeader({ eyebrow: 'Send a Message', title: 'How can we help?' })}
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
                  <option value="coaching">Coaching enquiry — one-to-one nutrition support</option>
                  <option value="general">General question about guidance or content</option>
                  <option value="family">Family nutrition guidance</option>
                  <option value="early-access">Early access to new content or features</option>
                  <option value="partner-coach">Partnership — I am a coach or trainer</option>
                  <option value="partner-wellness">Partnership — wellness or healthcare professional</option>
                  <option value="partner-content">Content collaboration or contribution</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="cf-message">Tell us more</label>
                <textarea class="form-textarea" id="cf-message" name="message" placeholder="Describe your situation, what you are looking for, or what question you have. The more context you give us, the more useful our response will be." required></textarea>
              </div>
              <button type="submit" class="form-submit">Send Message</button>
            </form>
            <div id="form-success" class="form-success">
              <p><strong>Message received.</strong></p>
              <p style="margin-top:8px;font-weight:400;font-size:14px;color:var(--text-muted);">We respond within 1 business day for coaching and general enquiries, and within 3 business days for partnership requests.</p>
            </div>
          </div>
          <div>
            ${C.renderSectionHeader({ eyebrow: 'Channels', title: 'Other ways to reach us' })}
            <div class="card mb-24">
              ${[
                { iconName: 'mail',  label: 'General Enquiries',     value: 'hello@painnutrition.com' },
                { iconName: 'users', label: 'Coaching',              value: 'coaching@painnutrition.com' },
                { iconName: 'handshake', label: 'Partnerships',      value: 'partners@painnutrition.com' },
              ].map(r => C.renderInfoRow(r)).join('')}
            </div>
            ${C.renderSectionHeader({ eyebrow: 'Response Times', title: 'What to expect' })}
            <div class="card">
              ${[
                { iconName: 'clock', label: 'Coaching & general enquiries', value: 'Within 1 business day.' },
                { iconName: 'clock', label: 'Partnership enquiries',         value: 'Within 3 business days. Include your organisation name and what you are looking to achieve.' },
              ].map(r => C.renderInfoRow(r)).join('')}
            </div>
            <div class="mt-24">
              ${C.renderCallout('<strong>Not medical advice.</strong> Pain Nutrition cannot advise on clinical conditions, medication interactions, or medical nutrition therapy. If your question is clinical in nature, please contact your GP or a registered dietitian.', 'gold', 'shield')}
            </div>
          </div>
        </div>
      </div>
    </section>`;
};
