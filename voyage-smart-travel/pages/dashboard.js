/* ─────────────────────────────────────────────────────────────────────────────
   VST — Dashboard Page
   Live trip overview: status summary, alerts, trip list, Ava status.
   ───────────────────────────────────────────────────────────────────────────── */

window.renderDashboard = function () {
  var C    = window.VSTComponents;
  var E    = window.VSTAvaEngine;
  var T    = window.VSTTrips;

  var trips   = T.getAll();
  var summary = T.getSummary();

  /* ── Status badge helper ──────────────────────────────────────────────── */
  function statusBadge(status) {
    var cls = {
      requested:    'status-requested',
      under_review: 'status-review',
      approved:     'status-approved',
      escalated:    'status-escalated',
      in_journey:   'status-journey',
      completed:    'status-completed',
    }[status] || 'status-requested';
    return '<span class="status-badge ' + cls + '">' + E.statusLabel(status) + '</span>';
  }

  function riskBadge(risk) {
    var cls = { low: 'risk-low', medium: 'risk-medium', high: 'risk-high' }[risk] || 'risk-low';
    return '<span class="status-badge ' + cls + '">' + E.riskLabel(risk) + '</span>';
  }

  /* ── Format date ──────────────────────────────────────────────────────── */
  function fmtDate(d) {
    if (!d) return '—';
    var parts = d.split('-');
    if (parts.length !== 3) return d;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return parseInt(parts[2], 10) + ' ' + months[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
  }

  /* ── Stat cards ──────────────────────────────────────────────────────── */
  var statsHtml = `
    <div class="dash-stats">
      <div class="dash-stat">
        <div class="dash-stat-value">${summary.total}</div>
        <div class="dash-stat-label">Total trips</div>
      </div>
      <div class="dash-stat dash-stat--approved">
        <div class="dash-stat-value">${summary.approved}</div>
        <div class="dash-stat-label">Approved</div>
      </div>
      <div class="dash-stat dash-stat--review">
        <div class="dash-stat-value">${summary.under_review}</div>
        <div class="dash-stat-label">Under review</div>
      </div>
      <div class="dash-stat dash-stat--escalated">
        <div class="dash-stat-value">${summary.escalated}</div>
        <div class="dash-stat-label">Escalated</div>
      </div>
      <div class="dash-stat">
        <div class="dash-stat-value">${summary.in_journey}</div>
        <div class="dash-stat-label">In journey</div>
      </div>
      <div class="dash-stat">
        <div class="dash-stat-value">${summary.completed}</div>
        <div class="dash-stat-label">Completed</div>
      </div>
    </div>`;

  /* ── Escalation alerts ───────────────────────────────────────────────── */
  var escalatedTrips = trips.filter(function (t) { return t.status === 'escalated'; });
  var alertsHtml = '';
  if (escalatedTrips.length > 0) {
    var alertItems = escalatedTrips.map(function (t) {
      var ev = t.evaluation || {};
      return `
        <div class="dash-alert">
          <div class="dash-alert-icon">${C.icon('alert')}</div>
          <div class="dash-alert-body">
            <strong>${t.destination}</strong>
            <span class="dash-alert-meta">
              ${fmtDate(t.departureDate)} &mdash; ${fmtDate(t.returnDate)}
              &nbsp;&middot;&nbsp; $${(ev.estimatedCost || 0).toLocaleString()} USD
            </span>
            ${ev.escalationReason
              ? '<p class="dash-alert-reason">' + ev.escalationReason + '</p>'
              : ''}
            ${ev.recommendedNextStep
              ? '<p class="dash-alert-action">' + C.icon('arrow') + ev.recommendedNextStep + '</p>'
              : ''}
          </div>
        </div>`;
    }).join('');

    alertsHtml = `
      <div class="dash-alerts-section">
        <div class="dash-section-head">
          <span class="dash-section-eyebrow">Requires action</span>
          <h3 class="dash-section-title">Escalated trips</h3>
        </div>
        <div class="dash-alerts">
          ${alertItems}
        </div>
      </div>`;
  }

  /* ── Trip list ────────────────────────────────────────────────────────── */
  var tripListHtml;
  if (trips.length === 0) {
    tripListHtml = `
      <div class="empty-state">
        <div class="empty-state-icon">${C.icon('compass')}</div>
        <h3 class="empty-state-title">No trips recorded yet</h3>
        <p class="empty-state-body">Submit a trip request to begin. All submitted and evaluated trips will appear here.</p>
        <a href="#trip-request" data-route="trip-request" class="btn btn-primary">Request a trip</a>
      </div>`;
  } else {
    var rows = trips.map(function (t) {
      var ev   = t.evaluation || {};
      var cost = ev.estimatedCost ? '$' + ev.estimatedCost.toLocaleString() : '—';
      var risk = ev.riskLevel ? riskBadge(ev.riskLevel) : '—';
      return `
        <div class="trip-row">
          <div class="trip-row-main">
            <div class="trip-row-dest">
              <span class="trip-row-name">${t.destination}</span>
              <span class="trip-row-purpose">${E.purposeLabel(t.purpose)}</span>
            </div>
            <div class="trip-row-dates">
              ${fmtDate(t.departureDate)} &mdash; ${fmtDate(t.returnDate)}
              <span class="trip-row-nights">${t.nights || '?'} night${(t.nights || 0) !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div class="trip-row-meta">
            <span class="trip-row-cost">${cost}</span>
            ${risk}
            ${statusBadge(t.status)}
          </div>
        </div>`;
    }).join('');

    tripListHtml = `<div class="trip-list">${rows}</div>`;
  }

  /* ── Ava summary panel ────────────────────────────────────────────────── */
  var avaHtml;
  if (trips.length === 0) {
    avaHtml = `
      <div class="ava-panel ava-positive">
        <div class="ava-panel-header">
          <div class="ava-avatar">Ava</div>
          <div class="ava-panel-title">
            <span class="ava-label">Travel Intelligence</span>
            <strong class="ava-headline">No active trips to monitor.</strong>
          </div>
        </div>
        <p class="ava-body">There are currently no trips in the system. When a trip is submitted and evaluated, I will provide a risk and compliance summary here.</p>
      </div>`;
  } else {
    var openCount  = (summary.under_review || 0) + (summary.escalated || 0);
    var avaTone    = summary.escalated > 0 ? 'ava-alert' : openCount > 0 ? 'ava-caution' : 'ava-positive';
    var avaHeadline, avaBody;

    if (summary.escalated > 0) {
      avaHeadline = summary.escalated + ' trip' + (summary.escalated > 1 ? 's require' : ' requires') + ' immediate attention.';
      avaBody     = 'I am monitoring ' + summary.escalated + ' escalated trip' + (summary.escalated > 1 ? 's' : '') + ' that require written authorisation before travel can proceed. Review the escalated items above and ensure the relevant approvers are notified.';
    } else if (summary.under_review > 0) {
      avaHeadline = summary.under_review + ' trip' + (summary.under_review > 1 ? 's are' : ' is') + ' awaiting approval.';
      avaBody     = 'I am tracking ' + summary.under_review + ' pending trip' + (summary.under_review > 1 ? 's' : '') + ' that require manager or finance sign-off. No security concerns are currently flagged across the active portfolio.';
    } else {
      avaHeadline = 'All active trips are within policy.';
      avaBody     = 'I have reviewed all ' + summary.total + ' trip' + (summary.total > 1 ? 's' : '') + ' in the system. ' + summary.approved + ' ' + (summary.approved === 1 ? 'is' : 'are') + ' approved and cleared, and ' + (summary.in_journey || 0) + ' ' + ((summary.in_journey || 0) === 1 ? 'is' : 'are') + ' currently in progress. No policy violations or security flags are active.';
    }

    avaHtml = `
      <div class="ava-panel ${avaTone}">
        <div class="ava-panel-header">
          <div class="ava-avatar">Ava</div>
          <div class="ava-panel-title">
            <span class="ava-label">Travel Intelligence — Portfolio Summary</span>
            <strong class="ava-headline">${avaHeadline}</strong>
          </div>
        </div>
        <p class="ava-body">${avaBody}</p>
      </div>`;
  }

  /* ── Assemble page ────────────────────────────────────────────────────── */
  return `
    <div class="dash-header-bar">
      <div class="section-inner">
        <div class="dash-header-inner">
          <div>
            <p class="section-eyebrow">Operations</p>
            <h1 class="dash-title">Travel Dashboard</h1>
            <p class="dash-subtitle">Live view of all trip requests, evaluations, and status updates.</p>
          </div>
          <a href="#trip-request" data-route="trip-request" class="btn btn-primary">
            ${C.icon('arrow')} Request a trip
          </a>
        </div>
      </div>
    </div>

    <section class="section section--dash">
      <div class="section-inner">

        <!-- Summary stats -->
        ${statsHtml}

        <!-- Ava summary -->
        <div class="dash-block">
          ${avaHtml}
        </div>

        <!-- Escalation alerts (if any) -->
        ${alertsHtml}

        <!-- Trip list -->
        <div class="dash-block">
          <div class="dash-section-head">
            <span class="dash-section-eyebrow">All requests</span>
            <h3 class="dash-section-title">Trip register</h3>
          </div>
          ${tripListHtml}
        </div>

      </div>
    </section>`;
};
