/* ─────────────────────────────────────────────────────────────────────────────
   Voyage Smart Travel — Contact Page
   ───────────────────────────────────────────────────────────────────────────── */

window.renderContact = function () {
  const C = window.VSTComponents;

  const contactChannels = [
    { iconName: 'mail',  label: 'General Enquiries',     value: 'hello@voyagesmarttravel.com' },
    { iconName: 'shield', label: 'Safety Support',        value: 'safety@voyagesmarttravel.com' },
    { iconName: 'handshake', label: 'Partnership Enquiries', value: 'partners@voyagesmarttravel.com' },
    { iconName: 'accessibility', label: 'Accessibility Support', value: 'access@voyagesmarttravel.com' },
  ];

  const responseTimes = [
    { iconName: 'phone', label: '24/7 Emergency Line',   value: 'Immediate — for active travel emergencies. Available to registered travellers.' },
    { iconName: 'clock', label: 'General Enquiries',     value: 'Within 1 business day. Monday to Friday, 09:00–18:00 GMT.' },
    { iconName: 'users', label: 'Partnership Enquiries', value: 'Within 3 business days. Include your organisation name and type of partnership.' },
    { iconName: 'chat',  label: 'Accessibility Support', value: 'Within 1 business day. Available via voice, text, and BSL/ASL video relay.' },
  ];

  return `
    ${C.renderPageHero({
      eyebrow: 'Contact',
      title:   'Get in touch',
      sub:     'Whether you are a traveller, a potential partner, or have a question about our platform — we respond to every message.',
    })}

    <section class="section">
      <div class="section-inner">
        <div class="two-col">

          <!-- Contact form -->
          <div>
            ${C.renderSectionHeader({
              eyebrow: 'Send a Message',
              title:   'What can we help with?',
            })}

            <form id="contact-form" novalidate>

              <div class="form-group">
                <label class="form-label" for="cf-name">Your name</label>
                <input
                  class="form-input"
                  type="text"
                  id="cf-name"
                  name="name"
                  placeholder="How should we address you?"
                  required
                  autocomplete="name"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="cf-email">Email address</label>
                <input
                  class="form-input"
                  type="email"
                  id="cf-email"
                  name="email"
                  placeholder="your@email.com"
                  required
                  autocomplete="email"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="cf-type">Enquiry type</label>
                <select class="form-select" id="cf-type" name="type" required>
                  <option value="" disabled selected>Select the nature of your enquiry</option>
                  <option value="traveller">Traveller — using the platform</option>
                  <option value="safety">Safety — incident, concern or alert</option>
                  <option value="accessibility">Accessibility — platform or travel support</option>
                  <option value="accommodation">Partner — accommodation provider</option>
                  <option value="tourism">Partner — tourism board or destination organisation</option>
                  <option value="operator">Partner — tour operator or experience provider</option>
                  <option value="press">Press or media</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="cf-message">Your message</label>
                <textarea
                  class="form-textarea"
                  id="cf-message"
                  name="message"
                  placeholder="Tell us what you need. The more detail you can share, the better we can help."
                  required
                ></textarea>
              </div>

              <button type="submit" class="form-submit">Send Message</button>

            </form>

            <div id="form-success" class="form-success">
              <p><strong>Message received.</strong></p>
              <p style="margin-top:8px;font-weight:400;font-size:14px;color:var(--text-muted);">
                We will respond within 1 business day for general enquiries, or 3 business days for partnership requests. If this is a safety emergency, please call our 24/7 emergency line.
              </p>
            </div>
          </div>

          <!-- Contact channels & response times -->
          <div>
            ${C.renderSectionHeader({
              eyebrow: 'Direct Channels',
              title:   'Other ways to reach us',
            })}

            <div class="card mb-32">
              ${contactChannels.map(ch => C.renderInfoRow(ch)).join('')}
            </div>

            ${C.renderSectionHeader({
              eyebrow: 'Response Times',
              title:   'When to expect a reply',
            })}

            <div class="card">
              ${responseTimes.map(rt => C.renderInfoRow(rt)).join('')}
            </div>

            <div class="mt-24">
              ${C.renderCallout(
                '<strong>Emergency?</strong> Do not use this form. Use the in-app SOS button or call our 24/7 emergency line. The emergency line is available to registered travellers with an active trip.',
                'gold',
                'phone'
              )}
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Accessibility for this contact page -->
    <section class="section section-alt">
      <div class="section-inner">
        ${C.renderSectionHeader({
          eyebrow:  'Contact Accessibility',
          title:    'We can communicate<br>in the way that works for you',
          centered: true,
        })}
        <div class="card-grid">
          ${C.renderCard({ iconName: 'chat',         title: 'Text-based support',     body:  'All support enquiries can be handled entirely by text — email or in-app messaging. No requirement to call.' })}
          ${C.renderCard({ iconName: 'accessibility', title: 'BSL / ASL video relay',  body:  'Accessibility and general support available via British Sign Language and American Sign Language video relay on request.' })}
          ${C.renderCard({ iconName: 'globe',         title: 'Multilingual support',   body:  'Support available in 14 languages for our network destinations. Specify your preferred language in your enquiry.' })}
        </div>
      </div>
    </section>`;
};
