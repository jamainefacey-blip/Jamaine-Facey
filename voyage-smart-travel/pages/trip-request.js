/* ─────────────────────────────────────────────────────────────────────────────
   VST — Trip Request Page
   Full form + evaluation result panel + Ava explanation + success state.
   ───────────────────────────────────────────────────────────────────────────── */

/* ── Evaluation result renderer (called from router after evaluation) ─────── */
window.renderEvalResult = function (result, ava) {
  var E  = window.VSTAvaEngine;
  var ev = result.evaluation;
  var p6 = result.phase6 || null; /* Phase 6 intelligence block — may be null */

  /* ── Badges: prefer Phase 6 values when available ─── */
  var riskKey, compKey, apprKey;
  if (p6) {
    riskKey = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high' }[p6.overallRiskLevel]                     || ev.riskLevel;
    compKey = { COMPLIANT: 'compliant', CHECK_REQUIRED: 'conditional', NON_COMPLIANT: 'non_compliant' }[p6.complianceStatus] || ev.complianceStatus;
    apprKey = { APPROVED: 'auto_approved', REVIEW: 'pending_approval', ESCALATED: 'requires_escalation' }[p6.approvalStatus] || ev.approvalStatus;
  } else {
    riskKey = ev.riskLevel;
    compKey = ev.complianceStatus;
    apprKey = ev.approvalStatus;
  }

  var riskClass = { low: 'risk-low', medium: 'risk-medium', high: 'risk-high' }[riskKey] || 'risk-low';
  var riskBadge = '<span class="status-badge ' + riskClass + '">' + E.riskLabel(riskKey) + '</span>';

  var compClass = { compliant: 'comp-compliant', conditional: 'comp-conditional', non_compliant: 'comp-non-compliant' }[compKey] || 'comp-conditional';
  var compLabel = p6
    ? ({ COMPLIANT: 'Compliant', CHECK_REQUIRED: 'Check required', NON_COMPLIANT: 'Non-compliant' }[p6.complianceStatus] || E.complianceLabel(compKey))
    : E.complianceLabel(compKey);
  var compBadge = '<span class="status-badge ' + compClass + '">' + compLabel + '</span>';

  var apprClass = { auto_approved: 'appr-approved', pending_approval: 'appr-pending', requires_escalation: 'appr-escalated' }[apprKey] || 'appr-pending';
  var apprLabel = p6
    ? ({ APPROVED: 'Approved', REVIEW: 'Review required', ESCALATED: 'Escalated' }[p6.approvalStatus] || E.approvalLabel(apprKey))
    : E.approvalLabel(apprKey);
  var apprBadge = '<span class="status-badge ' + apprClass + '">' + apprLabel + '</span>';

  /* ── Ava panel tone: Phase 6 approval drives colour when available ─── */
  var avaTone = p6
    ? ({ APPROVED: 'positive', REVIEW: 'caution', ESCALATED: 'alert' }[p6.approvalStatus] || ava.tone)
    : ava.tone;
  var avaClass = { positive: 'ava-positive', caution: 'ava-caution', alert: 'ava-alert' }[avaTone] || 'ava-caution';

  /* ── Body copy: Phase 6 brief replaces Phase 5 body when available ── */
  var avaBody = (p6 && p6.avaBrief) ? p6.avaBrief : ava.body;

  /* ── Date helpers ─── */
  function fmtDate(d) {
    if (!d) return '\u2014';
    var parts = d.split('-');
    if (parts.length !== 3) return d;
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return parseInt(parts[2], 10) + ' ' + months[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
  }

  var dateRange    = result.tripType === 'one_way'
    ? fmtDate(result.departureDate) + ' &mdash; One-way'
    : fmtDate(result.departureDate) + ' &mdash; ' + fmtDate(result.returnDate);
  var durationText = result.tripType === 'one_way'
    ? '1 night (est.)'
    : result.nights + ' night' + (result.nights !== 1 ? 's' : '');
  var originMeta = result.origin ? result.origin + ' &rarr; ' : '';

  /* ── Escalation block ─── */
  var escalationBlock = (p6 && p6.escalationRequired) || ev.escalationReason
    ? '<div class="eval-escalation">'
        + '<div class="eval-escalation-icon">' + window.VSTComponents.icon('alert') + '</div>'
        + '<div><strong>Escalation required.</strong> '
        + (ev.escalationReason || 'This trip requires senior-level authorisation before any travel can be booked.')
        + '</div>'
        + '</div>'
    : '';

  /* ── Accessibility note ─── */
  var accessBlock = result.accessibilityNeeds && result.accessibilityNeeds.length > 0
    ? '<div class="eval-access-note">'
        + '<span class="eval-access-label">Accessibility needs noted:</span> '
        + result.accessibilityNeeds.join(', ')
        + '</div>'
    : '';

  /* ── Phase 6 intelligence panel ─── */
  function p6Panel(p6data) {
    if (!p6data) return '';

    function flagGroup(title, flags, mod) {
      if (!flags || !flags.length) return '';
      return '<div class="p6-flags-group p6-flags-group--' + mod + '">'
        + '<h4 class="p6-flags-title">' + title + '</h4>'
        + '<ul class="p6-flags-list">'
        + flags.map(function (f) { return '<li>' + f + '</li>'; }).join('')
        + '</ul></div>';
    }

    var flags = flagGroup('Safety', p6data.safetyFlags, 'safety')
      + flagGroup('Accessibility', p6data.accessibilityFlags, 'access')
      + flagGroup('Documentation', p6data.documentationFlags, 'docs');

    var actions = p6data.recommendedActions && p6data.recommendedActions.length
      ? '<div class="p6-actions">'
          + '<h4 class="p6-actions-title">Recommended actions</h4>'
          + '<ol class="p6-actions-list">'
          + p6data.recommendedActions.map(function (a) { return '<li>' + a + '</li>'; }).join('')
          + '</ol></div>'
      : '';

    var hasCostBand = p6data.estimatedCostBand && p6data.estimatedCostBand.indexOf('unavailable') === -1;

    var isLive = p6data.sourceMode === 'live_claude';
    var sourceDot = '<span class="p6-source-dot' + (isLive ? ' p6-source-dot--live' : '') + '" aria-hidden="true"></span>';
    var sourceName = isLive ? 'Ava Phase 6 \u00b7 live intelligence' : 'Ava Phase 6 \u00b7 deterministic analysis';

    return '<div class="p6-panel">'
      + (hasCostBand
          ? '<div class="p6-cost-band">'
              + '<span class="p6-cost-label">Estimated cost range</span>'
              + '<span class="p6-cost-value">' + p6data.estimatedCostBand + '</span>'
              + '</div>'
          : '')
      + (flags ? '<div class="p6-flags">' + flags + '</div>' : '')
      + actions
      + '<div class="p6-source">' + sourceDot + sourceName + '</div>'
      + '</div>';
  }

  return `
    <div class="eval-panel">

      <!-- Trip summary header -->
      <div class="eval-header">
        <div class="eval-header-left">
          <p class="eval-origin">${originMeta}${result.destination}</p>
          <h2 class="eval-destination">${result.destination}</h2>
          <p class="eval-meta">
            ${dateRange}
            &nbsp;&middot;&nbsp; ${durationText}
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
          <div class="eval-metric-value">${durationText}</div>
        </div>
        <div class="eval-metric">
          <div class="eval-metric-label">Evaluated</div>
          <div class="eval-metric-value eval-metric-small">${new Date(ev.evaluatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      ${escalationBlock}
      ${accessBlock}

      <!-- Ava intelligence panel -->
      <div class="ava-panel ${avaClass}">
        <div class="ava-panel-header">
          <div class="ava-avatar">Ava</div>
          <div class="ava-panel-title">
            <span class="ava-label">Travel Intelligence</span>
            <strong class="ava-headline">${ava.headline}</strong>
          </div>
        </div>
        <p class="ava-body">${avaBody}</p>
        <div class="ava-action">
          <div class="ava-action-icon">${window.VSTComponents.icon('arrow')}</div>
          <p class="ava-action-text">${ava.action}</p>
        </div>
      </div>

      <!-- Phase 6 structured intelligence -->
      ${p6Panel(p6)}

      <!-- Actions -->
      <div class="eval-actions">
        <button class="btn btn-primary" id="trip-save-btn">
          Save Trip &amp; Confirm
        </button>
        <button class="btn btn-outline" id="trip-new-btn">
          New Request
        </button>
      </div>

    </div>`;
};

/* ── Success confirmation panel ───────────────────────────────────────────── */
window.renderTripSuccess = function (result) {
  function fmtDate(d) {
    if (!d) return '—';
    var parts = d.split('-');
    if (parts.length !== 3) return d;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return parseInt(parts[2], 10) + ' ' + months[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
  }

  var statusLabels = {
    approved:     'Auto-approved',
    under_review: 'Under review',
    escalated:    'Escalated',
  };
  var statusClasses = {
    approved:     'appr-approved',
    under_review: 'appr-pending',
    escalated:    'appr-escalated',
  };

  var statusLabel = statusLabels[result.status] || result.status;
  var statusClass = statusClasses[result.status] || 'appr-pending';

  return `
    <div class="trip-success-panel">
      <div class="trip-success-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h2 class="trip-success-title">Trip request saved.</h2>
      <p class="trip-success-sub">Your request is logged and queued for review.</p>

      <div class="trip-success-summary">
        <div class="trip-success-row">
          <span class="trip-success-label">Destination</span>
          <span class="trip-success-value">${result.destination}</span>
        </div>
        ${result.origin ? '<div class="trip-success-row"><span class="trip-success-label">Origin</span><span class="trip-success-value">' + result.origin + '</span></div>' : ''}
        <div class="trip-success-row">
          <span class="trip-success-label">Dates</span>
          <span class="trip-success-value">${
            result.tripType === 'one_way'
              ? fmtDate(result.departureDate) + ' · One-way'
              : fmtDate(result.departureDate) + ' – ' + fmtDate(result.returnDate)
          }</span>
        </div>
        <div class="trip-success-row">
          <span class="trip-success-label">Travellers</span>
          <span class="trip-success-value">${result.travellerCount}</span>
        </div>
        <div class="trip-success-row">
          <span class="trip-success-label">Status</span>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
        </div>
        <div class="trip-success-row">
          <span class="trip-success-label">Trip ID</span>
          <span class="trip-success-id">${result.id}</span>
        </div>
      </div>

      <div class="trip-success-actions">
        <button class="btn btn-primary" id="trip-goto-dashboard">
          Go to Dashboard
        </button>
        <button class="btn btn-ghost" id="trip-request-another">
          Request another trip
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
    ['leisure',           'Leisure / personal'],
    ['other',             'Other (specify in notes)'],
  ].map(function (o) {
    return '<option value="' + o[0] + '">' + o[1] + '</option>';
  }).join('');

  var budgetOpts = [
    ['', 'Select budget band'],
    ['economy', 'Economy'],
    ['mid', 'Mid-range'],
    ['premium', 'Premium'],
    ['luxury', 'Luxury'],
  ].map(function (o, i) {
    return '<option value="' + o[0] + '"' + (i === 0 ? ' disabled selected' : '') + '>' + o[1] + '</option>';
  }).join('');

  var travellerTypeOpts = [
    ['',            'Select traveller type'],
    ['solo',        'Solo traveller'],
    ['family',      'Family'],
    ['business',    'Business'],
    ['disabled',    'Accessibility needs'],
    ['luxury',      'Luxury / VIP'],
    ['backpacker',  'Backpacker'],
  ].map(function (o, i) {
    return '<option value="' + o[0] + '"' + (i === 0 ? ' disabled selected' : '') + '>' + o[1] + '</option>';
  }).join('');

  var accessOpts = [
    ['wheelchair', 'Wheelchair access'],
    ['hearing',    'Hearing assistance'],
    ['visual',     'Visual assistance'],
    ['dietary',    'Dietary requirements'],
    ['cognitive',  'Cognitive support'],
  ];

  var accessChecks = accessOpts.map(function (a) {
    return `
      <label class="access-check">
        <input type="checkbox" name="accessibility" value="${a[0]}" class="access-check-input" />
        <span class="access-check-box" aria-hidden="true"></span>
        ${a[1]}
      </label>`;
  }).join('');

  return `
    ${C.renderPageHero({
      eyebrow: 'Travel Control',
      title:   'Request a Trip',
      sub:     'Submit your travel details. All requests are evaluated automatically against spend limits, destination risk, and policy before approval is considered.',
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
            <p class="card-section-sub">Fields marked <span class="form-required">*</span> are required.</p>
          </div>

          <form id="trip-request-form" novalidate>

            <!-- Row 1: Origin + Destination -->
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label" for="tr-origin">
                  Travelling from
                </label>
                <input
                  class="form-input"
                  type="text"
                  id="tr-origin"
                  name="origin"
                  placeholder="e.g. New York, USA"
                  autocomplete="off"
                  spellcheck="false"
                />
              </div>

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
            </div>

            <!-- Row 2: Trip type + Traveller type -->
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Trip type</label>
                <div class="trip-type-toggle" role="group" aria-label="Trip type">
                  <label class="trip-type-opt trip-type-opt--active">
                    <input type="radio" name="tripType" id="tr-triptype-return" value="return" checked />
                    Return
                  </label>
                  <label class="trip-type-opt">
                    <input type="radio" name="tripType" id="tr-triptype-oneway" value="one_way" />
                    One-way
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="tr-traveller-type">
                  Traveller type <span class="form-required">*</span>
                </label>
                <select class="form-select" id="tr-traveller-type" name="travellerType" required>
                  ${travellerTypeOpts}
                </select>
                <div class="form-error" id="err-traveller-type"></div>
              </div>
            </div>

            <!-- Row 3: Departure + Return + Travellers -->
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

              <div class="form-group" id="tr-return-group">
                <label class="form-label" for="tr-return">
                  Return date <span class="form-required" id="tr-return-required">*</span>
                </label>
                <input
                  class="form-input"
                  type="date"
                  id="tr-return"
                  name="returnDate"
                  min="${today}"
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

            <!-- Row 4: Purpose + Budget -->
            <div class="form-row-2">
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

              <div class="form-group">
                <label class="form-label" for="tr-budget">
                  Budget band <span class="form-optional">(optional)</span>
                </label>
                <select class="form-select" id="tr-budget" name="budgetBand">
                  ${budgetOpts}
                </select>
              </div>
            </div>

            <!-- Accessibility needs -->
            <div class="form-group" id="tr-access-group">
              <label class="form-label">
                Accessibility needs <span class="form-optional">(select all that apply)</span>
              </label>
              <div class="access-checks">
                ${accessChecks}
              </div>
            </div>

            <!-- Notes -->
            <div class="form-group">
              <label class="form-label" for="tr-notes">
                Additional notes <span class="form-optional">(optional)</span>
              </label>
              <textarea
                class="form-textarea"
                id="tr-notes"
                name="notes"
                rows="3"
                placeholder="Key meetings, specific requirements, or risk considerations."
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
