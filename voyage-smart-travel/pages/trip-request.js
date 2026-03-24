/* ─────────────────────────────────────────────────────────────────────────────
   VST — Trip Request Page
   Full form + evaluation result panel + Ava explanation.
   ───────────────────────────────────────────────────────────────────────────── */

/* ── Evaluation result renderer (called from router after evaluation) ─────── */
window.renderEvalResult = function (result, ava) {
  var E  = window.VSTAvaEngine;
  var ev = result.evaluation;

  /* Risk badge */
  var riskClass = { low: 'risk-low', medium: 'risk-medium', high: 'risk-high' }[ev.riskLevel] || 'risk-low';
  var riskBadge = '<span class="status-badge ' + riskClass + '">' + E.riskLabel(ev.riskLevel) + '</span>';

  /* Compliance badge */
  var compClass = { compliant: 'comp-compliant', conditional: 'comp-conditional', non_compliant: 'comp-non-compliant' }[ev.complianceStatus] || 'comp-conditional';
  var compBadge = '<span class="status-badge ' + compClass + '">' + E.complianceLabel(ev.complianceStatus) + '</span>';

  /* Approval badge */
  var apprClass = { auto_approved: 'appr-approved', pending_approval: 'appr-pending', requires_escalation: 'appr-escalated' }[ev.approvalStatus] || 'appr-pending';
  var apprBadge = '<span class="status-badge ' + apprClass + '">' + E.approvalLabel(ev.approvalStatus) + '</span>';

  /* Ava tone class */
  var avaClass = { positive: 'ava-positive', caution: 'ava-caution', alert: 'ava-alert' }[ava.tone] || 'ava-caution';

  /* Format dates */
  function fmtDate(d) {
    if (!d) return '—';
    var parts = d.split('-');
    if (parts.length !== 3) return d;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return parseInt(parts[2], 10) + ' ' + months[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
  }

  var escalationBlock = ev.escalationReason
    ? '<div class="eval-escalation">' +
        '<div class="eval-escalation-icon">' + window.VSTComponents.icon('alert') + '</div>' +
        '<div><strong>Escalation trigger:</strong> ' + ev.escalationReason + '</div>' +
      '</div>'
    : '';

  return `
    <div class="eval-panel">

      <!-- Trip summary header -->
      <div class="eval-header">
        <div class="eval-header-left">
          <h2 class="eval-destination">${result.destination}</h2>
          <p class="eval-meta">
            ${fmtDate(result.departureDate)} &mdash; ${fmtDate(result.returnDate)}
            &nbsp;&middot;&nbsp; ${result.nights} night${result.nights !== 1 ? 's' : ''}
            &nbsp;&middot;&nbsp; ${result.travellerCount} traveller${result.travellerCount !== 1 ? 's' : ''}
            &nbsp;&middot;&nbsp; ${window.VSTAvaEngine.purposeLabel(result.purpose)}
          </p>
        </div>
        <div class="eval-header-badges">
          ${riskBadge}
          ${compBadge}
          ${apprBadge}
        </div>
      </div>

      <!-- Metrics grid -->
      <div class="eval-metrics">
        <div class="eval-metric">
          <div class="eval-metric-label">Estimated cost</div>
          <div class="eval-metric-value eval-metric-cost">$${ev.estimatedCost.toLocaleString()} <span>${ev.currency}</span></div>
        </div>
        <div class="eval-metric">
          <div class="eval-metric-label">Policy limit</div>
          <div class="eval-metric-value">$${window.VSTAvaEngine.POLICY_LIMIT.toLocaleString()}</div>
        </div>
        <div class="eval-metric">
          <div class="eval-metric-label">Duration</div>
          <div class="eval-metric-value">${result.nights} nights</div>
        </div>
        <div class="eval-metric">
          <div class="eval-metric-label">Evaluated</div>
          <div class="eval-metric-value eval-metric-small">${new Date(ev.evaluatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      ${escalationBlock}

      <!-- Ava explanation -->
      <div class="ava-panel ${avaClass}">
        <div class="ava-panel-header">
          <div class="ava-avatar">Ava</div>
          <div class="ava-panel-title">
            <span class="ava-label">Travel Intelligence</span>
            <strong class="ava-headline">${ava.headline}</strong>
          </div>
        </div>
        <p class="ava-body">${ava.body}</p>
        <div class="ava-action">
          <div class="ava-action-icon">${window.VSTComponents.icon('arrow')}</div>
          <p class="ava-action-text">${ava.action}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="eval-actions">
        <button class="btn btn-primary" id="trip-save-btn">
          Save Trip &amp; Go to Dashboard
        </button>
        <button class="btn btn-outline" id="trip-new-btn">
          New Request
        </button>
      </div>

    </div>`;
};

/* ── Page renderer ───────────────────────────────────────────────────────── */
window.renderTripRequest = function () {
  var C   = window.VSTComponents;
  var today = new Date().toISOString().split('T')[0];

  var purposeOpts = [
    ['business_meeting',  'Business meeting'],
    ['client_visit',      'Client visit'],
    ['conference',        'Conference / summit'],
    ['site_inspection',   'Site inspection'],
    ['training',          'Training / workshop'],
    ['internal_project',  'Internal project'],
    ['other',             'Other (specify in notes)'],
  ].map(function (o) {
    return '<option value="' + o[0] + '">' + o[1] + '</option>';
  }).join('');

  return `
    ${C.renderPageHero({
      eyebrow: 'Travel Control',
      title:   'Request a Trip',
      sub:     'Submit your travel details. All requests are evaluated automatically against spend limits, destination risk, and organisational policy before approval is considered.',
    })}

    <section class="section">
      <div class="section-inner section-inner--narrow">

        <!-- Step indicator -->
        <div class="trip-steps" id="trip-steps">
          <div class="trip-step trip-step--active" id="step-form">
            <div class="trip-step-num">1</div>
            <div class="trip-step-label">Trip details</div>
          </div>
          <div class="trip-step-divider"></div>
          <div class="trip-step" id="step-eval">
            <div class="trip-step-num">2</div>
            <div class="trip-step-label">Evaluation</div>
          </div>
          <div class="trip-step-divider"></div>
          <div class="trip-step" id="step-confirm">
            <div class="trip-step-num">3</div>
            <div class="trip-step-label">Saved</div>
          </div>
        </div>

        <!-- Request form -->
        <div id="trip-form-panel" class="card card-dark">

          <div class="card-section-head">
            <h3 class="card-section-title">Trip details</h3>
            <p class="card-section-sub">All fields marked <span class="form-required">*</span> are required.</p>
          </div>

          <form id="trip-request-form" novalidate>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label" for="tr-destination">
                  Destination <span class="form-required">*</span>
                </label>
                <input
                  class="form-input"
                  type="text"
                  id="tr-destination"
                  name="destination"
                  placeholder="e.g. London, UK"
                  required
                  autocomplete="off"
                  spellcheck="false"
                />
                <div class="form-error" id="err-destination"></div>
              </div>

              <div class="form-group">
                <label class="form-label" for="tr-purpose">
                  Purpose of travel <span class="form-required">*</span>
                </label>
                <select class="form-select" id="tr-purpose" name="purpose" required>
                  <option value="" disabled selected>Select purpose</option>
                  ${purposeOpts}
                </select>
                <div class="form-error" id="err-purpose"></div>
              </div>
            </div>

            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label" for="tr-departure">
                  Departure date <span class="form-required">*</span>
                </label>
                <input
                  class="form-input"
                  type="date"
                  id="tr-departure"
                  name="departureDate"
                  min="${today}"
                  required
                />
                <div class="form-error" id="err-departure"></div>
              </div>

              <div class="form-group">
                <label class="form-label" for="tr-return">
                  Return date <span class="form-required">*</span>
                </label>
                <input
                  class="form-input"
                  type="date"
                  id="tr-return"
                  name="returnDate"
                  min="${today}"
                  required
                />
                <div class="form-error" id="err-return"></div>
              </div>

              <div class="form-group">
                <label class="form-label" for="tr-travellers">
                  Travellers <span class="form-required">*</span>
                </label>
                <input
                  class="form-input"
                  type="number"
                  id="tr-travellers"
                  name="travellerCount"
                  min="1"
                  max="50"
                  value="1"
                  required
                />
                <div class="form-error" id="err-travellers"></div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="tr-notes">
                Additional notes <span class="form-optional">(optional)</span>
              </label>
              <textarea
                class="form-textarea"
                id="tr-notes"
                name="notes"
                rows="3"
                placeholder="Provide relevant context — key meetings, specific requirements, or risk considerations."
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="form-submit" id="trip-submit-btn">
                Evaluate Trip Request
              </button>
              <a href="#dashboard" data-route="dashboard" class="btn btn-ghost">
                View Dashboard
              </a>
            </div>

          </form>
        </div>

        <!-- Result panel — rendered after evaluation -->
        <div id="trip-result-panel" style="display:none;"></div>

      </div>
    </section>`;
};
