/* ─────────────────────────────────────────────────────────────────────────────
   VST — Ava Phase 6 Intelligence Layer
   Dual-mode: live Claude API (if configured) or deterministic fallback.

   Configuration via window.VST_CONFIG (set before this script loads):
     avaApiKey   — Anthropic API key  → enables live mode
     avaEndpoint — proxy endpoint override  (default: Anthropic API directly)
     avaModel    — model override  (default: claude-haiku-4-5-20251001)
     avaTimeout  — request timeout ms  (default: 12000)

   Output shape (always normalised to same structure regardless of mode):
     tripSummary · travellerProfile · overallRiskLevel · complianceStatus
     approvalStatus · estimatedCostBand · safetyFlags · accessibilityFlags
     documentationFlags · recommendedActions · escalationRequired
     avaBrief · confidence · sourceMode
   ───────────────────────────────────────────────────────────────────────────── */

window.VSTAvaPhase6 = (function () {
  'use strict';

  /* ── Config ──────────────────────────────────────────────────────────────── */
  var CFG      = window.VST_CONFIG || {};
  var API_KEY  = CFG.avaApiKey   || null;
  var ENDPOINT = CFG.avaEndpoint || 'https://api.anthropic.com/v1/messages';
  var MODEL    = CFG.avaModel    || 'claude-haiku-4-5-20251001';
  var TIMEOUT  = CFG.avaTimeout  || 12000;

  /* ── Valid enum values ───────────────────────────────────────────────────── */
  var VALID_RISK       = ['LOW', 'MEDIUM', 'HIGH'];
  var VALID_COMPLIANCE = ['COMPLIANT', 'CHECK_REQUIRED', 'NON_COMPLIANT'];
  var VALID_APPROVAL   = ['APPROVED', 'REVIEW', 'ESCALATED'];

  /* ── Schema validator ────────────────────────────────────────────────────── */
  function validate(obj) {
    if (!obj || typeof obj !== 'object')                        return false;
    if (VALID_RISK.indexOf(obj.overallRiskLevel)    === -1)     return false;
    if (VALID_COMPLIANCE.indexOf(obj.complianceStatus) === -1)  return false;
    if (VALID_APPROVAL.indexOf(obj.approvalStatus)   === -1)    return false;
    if (typeof obj.avaBrief !== 'string' || !obj.avaBrief)      return false;
    if (!Array.isArray(obj.recommendedActions))                 return false;
    return true;
  }

  /* ── Normalise — fill missing optional fields ────────────────────────────── */
  function normalise(raw) {
    return {
      tripSummary:        String(raw.tripSummary        || ''),
      travellerProfile:   String(raw.travellerProfile   || ''),
      overallRiskLevel:   raw.overallRiskLevel,
      complianceStatus:   raw.complianceStatus,
      approvalStatus:     raw.approvalStatus,
      estimatedCostBand:  String(raw.estimatedCostBand  || ''),
      safetyFlags:        Array.isArray(raw.safetyFlags)        ? raw.safetyFlags        : [],
      accessibilityFlags: Array.isArray(raw.accessibilityFlags) ? raw.accessibilityFlags : [],
      documentationFlags: Array.isArray(raw.documentationFlags) ? raw.documentationFlags : [],
      recommendedActions: Array.isArray(raw.recommendedActions) ? raw.recommendedActions : [],
      escalationRequired: !!raw.escalationRequired,
      avaBrief:           String(raw.avaBrief),
      confidence:         typeof raw.confidence === 'number'
                            ? Math.min(1, Math.max(0, raw.confidence))
                            : 0.75,
      sourceMode:         raw.sourceMode === 'live_claude' ? 'live_claude' : 'fallback_rules',
    };
  }

  /* ── Risk catalogue ──────────────────────────────────────────────────────── */
  var HIGH_RISK = [
    'kabul', 'mogadishu', 'tripoli', 'khartoum', 'damascus', 'kyiv', 'kharkiv',
    'juba', 'sanaa', 'bamako', 'aden', 'aleppo', 'mosul', 'kandahar', 'bangui',
    'maiduguri', 'raqqa', 'lashkar', 'kunduz',
  ];
  var MEDIUM_RISK = [
    'nairobi', 'lagos', 'karachi', 'dhaka', 'cairo', 'beirut', 'islamabad',
    'jakarta', 'bogota', 'lima', 'mexico city', 'casablanca', 'tunis', 'abuja',
    'accra', 'dakar', 'addis ababa', 'kinshasa', 'kampala', 'harare', 'lusaka', 'peshawar',
  ];

  function destRisk(dest) {
    var d = String(dest || '').toLowerCase();
    for (var i = 0; i < HIGH_RISK.length;   i++) { if (d.indexOf(HIGH_RISK[i])   !== -1) return 'HIGH'; }
    for (var j = 0; j < MEDIUM_RISK.length; j++) { if (d.indexOf(MEDIUM_RISK[j]) !== -1) return 'MEDIUM'; }
    return 'LOW';
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     DETERMINISTIC FALLBACK EVALUATION
     Produces the full Phase 6 structured output without any API call.
     ═══════════════════════════════════════════════════════════════════════════ */
  function fallbackEvaluate(fd) {
    var dest          = String(fd.destination || '');
    var origin        = String(fd.origin || '');
    var nights        = Math.max(1, fd.nights || 1);
    var pax           = Math.max(1, fd.travellerCount || 1);
    var tripType      = fd.tripType || 'return';
    var travellerType = fd.travellerType || '';
    var budget        = fd.budgetBand || '';
    var access        = Array.isArray(fd.accessibilityNeeds) ? fd.accessibilityNeeds : [];
    var purpose       = fd.purpose || '';
    var cost          = fd.estimatedCostUSD || 0;
    var notes         = String(fd.notes || '');

    /* ── Risk ────────────────────────────────────────────────────────── */
    var riskLevel = destRisk(dest);

    /* ── Compliance ──────────────────────────────────────────────────── */
    var compliance;
    if (riskLevel === 'HIGH' || cost > 7000)        compliance = 'NON_COMPLIANT';
    else if (riskLevel === 'MEDIUM' || cost > 3500) compliance = 'CHECK_REQUIRED';
    else                                             compliance = 'COMPLIANT';

    /* ── Approval ────────────────────────────────────────────────────── */
    var approval;
    if (compliance === 'NON_COMPLIANT')   approval = 'ESCALATED';
    else if (compliance === 'CHECK_REQUIRED') approval = 'REVIEW';
    else                                  approval = 'APPROVED';

    /* ── Budget realism check ────────────────────────────────────────── */
    var budgetMismatch = (budget === 'economy' && cost > 4000) ||
                         (budget === 'luxury'  && cost < 1500);

    /* ── Safety flags ────────────────────────────────────────────────── */
    var safetyFlags = [];
    if (riskLevel === 'HIGH')
      safetyFlags.push('Destination under active security advisory — high-risk classification');
    if (riskLevel === 'MEDIUM')
      safetyFlags.push('Elevated destination risk — travel advisory currently in effect');
    if (travellerType === 'solo')
      safetyFlags.push('Solo traveller — enhanced check-in protocol recommended');
    if (tripType === 'one_way')
      safetyFlags.push('One-way trip — confirm onward or return arrangements are documented');
    if (!fd.returnDate && tripType !== 'one_way')
      safetyFlags.push('Return date not specified — trip duration is unconfirmed');

    /* ── Accessibility flags ─────────────────────────────────────────── */
    var accessMap = {
      wheelchair: 'Wheelchair access — verify transport and venue accessibility at all stops',
      hearing:    'Hearing assistance — confirm airline and hotel communication support',
      visual:     'Visual assistance — request specialist escort or support documentation',
      dietary:    'Dietary requirements — pre-notify accommodation and airline at booking',
      cognitive:  'Cognitive support needs — ensure a dedicated support contact is identified',
    };
    var accessibilityFlags = [];
    access.forEach(function (a) {
      if (accessMap[a]) accessibilityFlags.push(accessMap[a]);
    });
    if (travellerType === 'disabled' && access.length === 0)
      accessibilityFlags.push('Accessibility traveller type noted — no specific needs recorded yet');

    /* ── Documentation flags ─────────────────────────────────────────── */
    var documentationFlags = [];
    if (riskLevel !== 'LOW')
      documentationFlags.push('Risk mitigation plan required before departure');
    if (approval === 'ESCALATED')
      documentationFlags.push('Written senior authorisation required — do not book without confirmation');
    if (approval === 'REVIEW')
      documentationFlags.push('Manager sign-off required — submit request with full justification');
    if (cost > 3500)
      documentationFlags.push('Cost justification required — attach business case to approval request');
    if (budgetMismatch)
      documentationFlags.push('Budget band and estimated cost are misaligned — review before submitting');
    if (!origin || origin.length < 2)
      documentationFlags.push('Origin city not specified — confirm all departure details');
    if (notes.length < 10 && riskLevel !== 'LOW')
      documentationFlags.push('Notes field is sparse — add risk context before submitting');

    /* ── Recommended actions ─────────────────────────────────────────── */
    var actions = [];
    if (approval === 'APPROVED') {
      actions.push('Proceed to booking confirmation');
      actions.push('Save and review the final itinerary before departure');
    } else if (approval === 'REVIEW') {
      actions.push('Submit trip for manager approval');
      actions.push('Attach business justification and full estimated cost breakdown');
      if (riskLevel === 'MEDIUM')
        actions.push('Include emergency contacts and local security references in the submission');
    } else {
      actions.push('Do not book until written authorisation has been received and logged');
      actions.push('Submit escalation request to Senior Management and the Security Officer');
      actions.push('Prepare a comprehensive risk mitigation plan for the submission');
      if (riskLevel === 'HIGH')
        actions.push('Contact the Security team before any bookings or commitments are made');
    }
    if (accessibilityFlags.length > 0)
      actions.push('Review all accessibility requirements with accommodation and airline');
    if (documentationFlags.length > 0 && approval !== 'APPROVED')
      actions.push('Complete all outstanding documentation flags before progressing');

    /* ── Cost band ───────────────────────────────────────────────────── */
    var costBand = cost > 0
      ? '$' + Math.round(cost * 0.9).toLocaleString()
        + ' \u2013 $' + Math.round(cost * 1.15).toLocaleString() + ' USD'
      : 'Cost estimate unavailable';

    /* ── Trip summary ────────────────────────────────────────────────── */
    var tripSummary = (origin ? origin + ' \u2192 ' : '') + dest
      + ' \u00b7 ' + nights + ' night' + (nights !== 1 ? 's' : '')
      + ' \u00b7 ' + pax + ' traveller' + (pax !== 1 ? 's' : '')
      + (tripType === 'one_way' ? ' \u00b7 One-way' : ' \u00b7 Return');

    /* ── Traveller profile ───────────────────────────────────────────── */
    var profileMap = {
      solo:     'Solo traveller',  family:     'Family group',
      business: 'Business traveller', disabled: 'Traveller with accessibility needs',
      luxury:   'Luxury / VIP',   backpacker: 'Backpacker',
    };
    var travellerProfile = (profileMap[travellerType] || 'Traveller')
      + ' \u00b7 ' + (purpose.replace(/_/g, ' ') || 'unspecified purpose');

    /* ── Ava brief ───────────────────────────────────────────────────── */
    var avaBrief;
    if (approval === 'APPROVED') {
      avaBrief = 'I reviewed this trip request and it is within policy. The destination carries '
        + riskLevel.toLowerCase() + ' risk and the estimated cost is within the approved spend limit.'
        + (travellerType === 'solo'
          ? ' As a solo traveller, I recommend activating trip check-in alerts before departure.'
          : '')
        + ' This trip is cleared to proceed to booking.';
    } else if (approval === 'REVIEW') {
      avaBrief = 'This trip requires manager review before it can proceed.'
        + (riskLevel === 'MEDIUM'
          ? ' The destination carries elevated risk, requiring a signed risk mitigation plan.'
          : '')
        + (cost > 3500
          ? ' The estimated spend of $' + cost.toLocaleString() + ' exceeds the standard policy limit.'
          : '')
        + ' Once approval is confirmed, booking can continue without delay.';
    } else {
      avaBrief = 'I have escalated this trip request.'
        + (riskLevel === 'HIGH'
          ? ' The destination is classified high-risk under the current security advisory.'
          : '')
        + ' Travel cannot be booked until written authorisation is received from Senior Management'
        + ' and the Security Officer. Prepare a full risk mitigation plan and cost justification'
        + ' to accompany the escalation.';
    }

    /* ── Confidence ──────────────────────────────────────────────────── */
    var confidence = 0.88;
    if (riskLevel === 'HIGH') confidence -= 0.08;
    if (!origin)              confidence -= 0.04;
    if (notes.length < 5)    confidence -= 0.04;
    if (budgetMismatch)      confidence -= 0.04;
    confidence = Math.round(Math.max(0.60, Math.min(1, confidence)) * 100) / 100;

    return normalise({
      tripSummary:        tripSummary,
      travellerProfile:   travellerProfile,
      overallRiskLevel:   riskLevel,
      complianceStatus:   compliance,
      approvalStatus:     approval,
      estimatedCostBand:  costBand,
      safetyFlags:        safetyFlags,
      accessibilityFlags: accessibilityFlags,
      documentationFlags: documentationFlags,
      recommendedActions: actions,
      escalationRequired: approval === 'ESCALATED',
      avaBrief:           avaBrief,
      confidence:         confidence,
      sourceMode:         'fallback_rules',
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     LIVE API MODE
     ═══════════════════════════════════════════════════════════════════════════ */

  /* ── Build structured prompt ─────────────────────────────────────────────── */
  function buildPrompt(fd) {
    var tripData = {
      destination:        fd.destination,
      origin:             fd.origin         || null,
      departureDate:      fd.departureDate,
      returnDate:         fd.returnDate      || null,
      tripType:           fd.tripType,
      nights:             fd.nights,
      travellerCount:     fd.travellerCount,
      travellerType:      fd.travellerType   || null,
      budgetBand:         fd.budgetBand      || null,
      accessibilityNeeds: fd.accessibilityNeeds || [],
      purpose:            fd.purpose         || null,
      estimatedCostUSD:   fd.estimatedCostUSD || 0,
      notes:              fd.notes           || null,
    };
    var schema = {
      tripSummary:        'string — one-line trip summary',
      travellerProfile:   'string — one-line traveller profile description',
      overallRiskLevel:   'LOW | MEDIUM | HIGH',
      complianceStatus:   'COMPLIANT | CHECK_REQUIRED | NON_COMPLIANT',
      approvalStatus:     'APPROVED | REVIEW | ESCALATED',
      estimatedCostBand:  'string — e.g. "$1,200 \u2013 $1,800 USD"',
      safetyFlags:        ['string — specific safety concern'],
      accessibilityFlags: ['string — specific accessibility concern'],
      documentationFlags: ['string — specific documentation requirement'],
      recommendedActions: ['string — specific action the traveller must take'],
      escalationRequired: 'boolean',
      avaBrief:           'string — 2-3 sentences of plain-language evaluation summary',
      confidence:         'number between 0 and 1',
      sourceMode:         'live_claude',
    };
    return 'You are Ava, the travel intelligence system for Voyage Smart Travel.'
      + ' Evaluate the following trip request and return ONLY a valid JSON object.'
      + ' No markdown, no code fences, no explanation — JSON only.\n\n'
      + 'TRIP DATA:\n' + JSON.stringify(tripData, null, 2)
      + '\n\nRETURN ONLY this exact JSON shape:\n' + JSON.stringify(schema, null, 2);
  }

  /* ── Fetch with timeout ──────────────────────────────────────────────────── */
  function fetchWithTimeout(url, opts, ms) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error('ava:timeout')); }, ms);
      fetch(url, opts)
        .then(function (r) { clearTimeout(timer); resolve(r); })
        .catch(function (e) { clearTimeout(timer); reject(e); });
    });
  }

  /* ── Live API call ───────────────────────────────────────────────────────── */
  function liveEvaluate(fd) {
    return fetchWithTimeout(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type':      'application/json',
        'x-api-key':         API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-api-access': 'true',
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 1024,
        messages:   [{ role: 'user', content: buildPrompt(fd) }],
      }),
    }, TIMEOUT)
    .then(function (res) {
      if (!res.ok) throw new Error('ava:http:' + res.status);
      return res.json();
    })
    .then(function (data) {
      var text = (data.content && data.content[0] && data.content[0].text) || '';
      /* Strip markdown code fences if model adds them */
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      var parsed = JSON.parse(text);
      if (!validate(parsed)) throw new Error('ava:schema');
      parsed.sourceMode = 'live_claude';
      return normalise(parsed);
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════════════════════════════════ */

  function evaluate(formData) {
    if (API_KEY) {
      /* Live mode — fail-safe fallback if API fails or returns invalid data */
      return liveEvaluate(formData).catch(function () {
        return fallbackEvaluate(formData);
      });
    }
    /* No API key — deterministic fallback, resolves synchronously via Promise */
    return Promise.resolve(fallbackEvaluate(formData));
  }

  return {
    evaluate:         evaluate,
    fallbackEvaluate: fallbackEvaluate, /* exposed for testing */
    validate:         validate,
    normalise:        normalise,
    isLiveMode:       function () { return !!API_KEY; },
  };

})();
