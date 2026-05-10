/* ─────────────────────────────────────────────────────────────────────────────
   VST — AVA Itinerary Planner Page
   Conversational trip planning: natural language → structured itinerary + eco.
   ───────────────────────────────────────────────────────────────────────────── */

/* ── Example prompts ─────────────────────────────────────────────────────── */
var PLANNER_EXAMPLES = [
  'Fly to Tokyo in July for 10 days, business class, eco-conscious',
  'Weekend in Barcelona from London, economy, 3 nights',
  'Dubai for 7 days in December, premium economy, 2 passengers',
  'New York from Manchester, 5 days, first class, solo adventure',
  'Bali for 2 weeks from London, budget, backpacker style',
];

/* ── Main page renderer ─────────────────────────────────────────────────── */
window.renderPlanner = function () {
  return `
    <section class="planner-page">

      <div class="planner-hero">
        <div class="planner-hero-inner">
          <div class="planner-ava-badge">
            <span class="planner-ava-dot"></span>
            AVA Itinerary Builder
          </div>
          <h1 class="planner-h1">Tell AVA where you want to go</h1>
          <p class="planner-sub">
            Describe your trip in plain English. AVA will build a day-by-day itinerary,
            calculate your carbon footprint, and find eco offsets — all in one place.
          </p>
        </div>
      </div>

      <div class="planner-body">

        <div class="planner-input-card">

          <div class="planner-chips" id="planner-chips">
            ${PLANNER_EXAMPLES.map(function (ex) {
              return '<button class="planner-chip" data-example="' + ex.replace(/"/g, '&quot;') + '">' + ex + '</button>';
            }).join('')}
          </div>

          <div class="planner-field">
            <textarea
              id="planner-transcript"
              class="planner-textarea"
              placeholder="e.g. I want to fly to Tokyo in July for 10 days, business class, eco-conscious…"
              rows="3"
              maxlength="500"
            ></textarea>
          </div>

          <div class="planner-field-actions">
            <span class="planner-char-count" id="planner-char-count">0 / 500</span>
            <button class="planner-submit-btn" id="planner-submit">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 10l16-8-8 16-2-6-6-2z"/>
              </svg>
              Ask AVA
            </button>
          </div>

        </div>

        <div id="planner-result" class="planner-result" style="display:none;"></div>

      </div>

    </section>
  `;
};

/* ── Eco grade colour helper ─────────────────────────────────────────────── */
window.ecoGradeClass = function (grade) {
  var map = { A: 'eco-grade--a', B: 'eco-grade--b', C: 'eco-grade--c', D: 'eco-grade--d', E: 'eco-grade--e' };
  return map[grade] || 'eco-grade--c';
};

/* ── Activity type icon ──────────────────────────────────────────────────── */
window.activityIcon = function (type) {
  var icons = {
    transport:     '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 10h14M10 3l7 7-7 7"/></svg>',
    sightseeing:   '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 3"/></svg>',
    dining:        '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3v14M13 3c0 0 2 2 2 5s-2 5-2 5v4"/></svg>',
    accommodation: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="14" height="10" rx="1"/><path d="M1 17h18M7 7V5a3 3 0 016 0v2"/></svg>',
    culture:       '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 17V9l6-6 6 6v8M8 17v-5h4v5"/></svg>',
    nature:        '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 17V9M5 12c0-4 5-9 5-9s5 5 5 9a5 5 0 01-10 0z"/></svg>',
    leisure:       '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10" cy="10" r="7"/><path d="M10 7v3l2 2"/></svg>',
    shopping:      '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2l-2 6h12L14 2M4 8v9a1 1 0 001 1h10a1 1 0 001-1V8"/></svg>',
  };
  return icons[type] || icons.sightseeing;
};

/* ── Itinerary result renderer ───────────────────────────────────────────── */
window.renderItineraryCard = function (data) {
  var p      = data.parsed    || {};
  var itin   = data.itinerary || {};
  var eco    = data.eco       || {};
  var days   = itin.days      || [];
  var isLoggedIn = window.VSTAuth && window.VSTAuth.isLoggedIn();

  /* Flight route label */
  var routeLabel = '';
  if (p.origin_iata && p.destination_iata) {
    routeLabel = p.origin_iata + ' &rarr; ' + p.destination_iata;
    if (p.trip_type !== 'one_way') routeLabel += ' &rarr; ' + p.origin_iata;
  } else if (p.destination_city) {
    routeLabel = 'Destination: ' + p.destination_city;
  }

  /* Cabin class label */
  var cabinMap = { ECONOMY: 'Economy', PREMIUM_ECONOMY: 'Premium Economy', BUSINESS: 'Business', FIRST: 'First Class' };
  var cabinLabel = cabinMap[p.cabin_class] || 'Economy';

  /* Eco summary block */
  var ecoHtml = '';
  if (eco.overall_grade) {
    var outGrade = eco.outbound && !eco.outbound.error ? eco.outbound.eco_grade : null;
    var retGrade = eco.return_leg && !eco.return_leg.error ? eco.return_leg.eco_grade : null;
    ecoHtml = `
      <div class="itin-eco-summary">
        <div class="itin-eco-header">
          <span class="itin-eco-label">Carbon Impact</span>
          <span class="eco-grade-badge eco-grade-badge--lg ${window.ecoGradeClass(eco.overall_grade)}">${eco.overall_grade}</span>
        </div>
        <div class="itin-eco-stats">
          ${outGrade ? `
            <div class="itin-eco-stat">
              <span class="itin-eco-stat-value">
                <span class="eco-grade-badge ${window.ecoGradeClass(outGrade)}">${outGrade}</span>
                ${eco.outbound.co2_per_person_kg ? eco.outbound.co2_per_person_kg + ' kg' : ''}
              </span>
              <span class="itin-eco-stat-label">Outbound per person</span>
            </div>
          ` : ''}
          ${retGrade ? `
            <div class="itin-eco-stat">
              <span class="itin-eco-stat-value">
                <span class="eco-grade-badge ${window.ecoGradeClass(retGrade)}">${retGrade}</span>
                ${eco.return_leg.co2_per_person_kg ? eco.return_leg.co2_per_person_kg + ' kg' : ''}
              </span>
              <span class="itin-eco-stat-label">Return per person</span>
            </div>
          ` : ''}
          <div class="itin-eco-stat">
            <span class="itin-eco-stat-value itin-eco-total">${eco.total_co2_kg} kg</span>
            <span class="itin-eco-stat-label">Total CO₂ (${p.passengers || 1} pax)</span>
          </div>
          <div class="itin-eco-stat itin-eco-stat--offset">
            <span class="itin-eco-stat-value">£${eco.total_offset_gbp}</span>
            <span class="itin-eco-stat-label">Offset cost</span>
          </div>
        </div>
        <p class="itin-eco-note">
          Calculated using ICAO methodology &bull; ${cabinLabel} cabin &bull; Offset at £0.015/kg CO₂
        </p>
      </div>
    `;
  }

  /* Day cards */
  var daysHtml = days.map(function (day) {
    var activitiesHtml = (day.activities || []).map(function (act) {
      return `
        <div class="itin-activity">
          <div class="itin-activity-icon itin-type-${act.type || 'sightseeing'}">
            ${window.activityIcon(act.type)}
          </div>
          <div class="itin-activity-body">
            <span class="itin-activity-time">${act.time || ''}</span>
            <span class="itin-activity-text">${act.activity || ''}</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="itin-day">
        <div class="itin-day-header">
          <span class="itin-day-num">Day ${day.day}</span>
          <span class="itin-day-title">${day.title || ''}</span>
        </div>
        <div class="itin-activities">
          ${activitiesHtml}
        </div>
      </div>
    `;
  }).join('');

  /* Highlights */
  var highlightsHtml = '';
  if (itin.highlights && itin.highlights.length) {
    highlightsHtml = `
      <div class="itin-section">
        <h4 class="itin-section-title">Must-Do Highlights</h4>
        <ul class="itin-highlight-list">
          ${itin.highlights.map(function (h) {
            return '<li class="itin-highlight-item"><span class="itin-highlight-dot"></span>' + h + '</li>';
          }).join('')}
        </ul>
      </div>
    `;
  }

  /* Eco tips */
  var ecoTipsHtml = '';
  if (itin.eco_tips && itin.eco_tips.length) {
    ecoTipsHtml = `
      <div class="itin-section itin-section--eco">
        <h4 class="itin-section-title">AVA Eco Tips</h4>
        <ul class="itin-eco-tip-list">
          ${itin.eco_tips.map(function (t) {
            return '<li class="itin-eco-tip"><span class="itin-eco-tip-dot"></span>' + t + '</li>';
          }).join('')}
        </ul>
      </div>
    `;
  }

  /* Save button */
  var saveHtml = isLoggedIn
    ? '<button class="btn-primary itin-save-btn" id="itin-save-btn">Save Itinerary</button>'
    : '<a href="#auth" data-route="auth" class="btn-outline itin-save-btn">Sign in to save</a>';

  return `
    <div class="itin-card" id="itin-card">

      <div class="itin-header">
        <div class="itin-header-left">
          <div class="itin-ava-pill">AVA</div>
          <div>
            <h2 class="itin-title">${itin.title || 'Your Itinerary'}</h2>
            <p class="itin-route">${routeLabel}</p>
          </div>
        </div>
        <div class="itin-meta-pills">
          ${p.departure_date ? '<span class="itin-pill">' + p.departure_date + '</span>' : ''}
          ${p.duration_days  ? '<span class="itin-pill">' + p.duration_days + ' days</span>' : ''}
          <span class="itin-pill">${cabinLabel}</span>
          ${p.passengers > 1 ? '<span class="itin-pill">' + p.passengers + ' passengers</span>' : ''}
        </div>
      </div>

      ${itin.summary ? '<p class="itin-summary">' + itin.summary + '</p>' : ''}

      ${ecoHtml}

      <div class="itin-days-wrap">
        <h3 class="itin-days-heading">Day-by-Day Itinerary</h3>
        <div class="itin-days">
          ${daysHtml}
        </div>
      </div>

      ${highlightsHtml}
      ${ecoTipsHtml}

      <div class="itin-actions">
        ${saveHtml}
        <button class="btn-outline itin-new-btn" id="itin-new-btn">Plan Another Trip</button>
      </div>

    </div>
  `;
};
