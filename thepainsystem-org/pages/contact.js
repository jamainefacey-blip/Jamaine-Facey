function ContactPage() {
  return `
  <div class="page-content">

    <section class="page-hero">
      <div class="container">
        <span class="label">Contact</span>
        <h1>Get in Touch</h1>
        <p>Partnership enquiries, venture proposals, general questions — we'd like to hear from you.</p>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
        <div class="grid grid--2">

          <!-- Form -->
          <div>
            <form class="contact-form" name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field">
              <input type="hidden" name="form-name" value="contact">
              <p style="display:none"><label>Don't fill this out: <input name="bot-field"></label></p>

              <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" name="name" required placeholder="Your name">
              </div>

              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required placeholder="you@example.com">
              </div>

              <div class="form-group">
                <label for="type">Enquiry Type</label>
                <select id="type" name="type" required>
                  <option value="" disabled selected>Select an option</option>
                  <option value="general">General Enquiry</option>
                  <option value="partnership">Partnership / Enterprise</option>
                  <option value="venture">Venture Proposal</option>
                  <option value="press">Press / Media</option>
                </select>
              </div>

              <div class="form-group">
                <label for="message">Message</label>
                <textarea id="message" name="message" required placeholder="Tell us what you're looking for..."></textarea>
              </div>

              <button type="submit" class="btn btn--primary" style="width: 100%;">Send Message</button>
            </form>
          </div>

          <!-- Info -->
          <div>
            <div class="gov-block" style="margin-bottom: var(--space-6);">
              <h3>Partnership Enquiries</h3>
              <p>Interested in integration, council membership, or strategic collaboration? Select "Partnership / Enterprise" in the form and describe your organisation and goals.</p>
            </div>

            <div class="gov-block" style="margin-bottom: var(--space-6);">
              <h3>Venture Proposals</h3>
              <p>Have a product idea that fits the Pain System architecture? Select "Venture Proposal" and include a brief description of the problem you're solving and the layers you'd use.</p>
            </div>

            <div class="gov-block">
              <h3>General</h3>
              <p>For all other enquiries — press, community questions, or feedback — use the general option. We aim to respond within 5 business days.</p>
            </div>
          </div>

        </div>
      </div>
    </section>

  </div>`;
}

Router.register('/contact', ContactPage);
