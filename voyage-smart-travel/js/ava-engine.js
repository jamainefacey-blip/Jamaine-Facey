/* ─────────────────────────────────────────────────────────────────────────────
   VST — Ava Evaluation Engine
   Structured mock evaluation logic. No external calls.
   Returns: estimated cost · risk level · compliance status · approval status
            escalation reason · recommended next step · Ava plain-language brief
   ───────────────────────────────────────────────────────────────────────────── */

window.VSTAvaEngine = (function () {
  'use strict';

  /* ── Risk catalogue ────────────────────────────────────────────────────── */
  var HIGH_RISK = [
    'kabul', 'mogadishu', 'tripoli', 'khartoum', 'damascus',
    'kyiv', 'kharkiv', 'juba', 'sanaa', 'bamako', 'aden',
    'aleppo', 'mosul', 'kandahar', 'bangui', 'maiduguri',
    'raqqa', 'lashkar', 'kunduz',
  ];

  var MEDIUM_RISK = [
    'nairobi', 'lagos', 'karachi', 'dhaka', 'cairo', 'beirut',
    'islamabad', 'jakarta', 'bogota', 'lima', 'mexico city',
    'casablanca', 'tunis', 'abuja', 'accra', 'dakar',
    'addis ababa', 'kinshasa', 'kampala', 'harare', 'lusaka',
    'islamabad', 'kabul', 'peshawar',
  ];

  /* ── Cost catalogue (USD per night approx.) ────────────────────────────── */
  var COST_MAP = {
    'london':      280, 'paris':       260, 'new york':    320,
    'dubai':       240, 'singapore':   220, 'tokyo':       200,
    'sydney':      230, 'toronto':     210, 'berlin':      180,
    'amsterdam':   230, 'hong kong':   250, 'zurich':      350,
    'geneva':      370, 'stockholm':   200, 'oslo':        240,
    'madrid':      160, 'rome':        190, 'barcelona':   175,
    'vienna':      190, 'prague':      130, 'lisbon':      150,
    'athens':      140, 'istanbul':    120, 'bangkok':     90,
    'kuala lumpur':110, 'delhi':       100, 'mumbai':      115,
    'beijing':     160, 'shanghai':    180, 'seoul':       170,
    'johannesburg':130, 'nairobi':     120, 'lagos':       105,
    'chicago':     290, 'los angeles': 310, 'san francisco':330,
    'miami':       260, 'seattle':     270, 'boston':      280,
  };

  var DEFAULT_NIGHTLY = 180;
  var FLIGHT_BASE     = 650;    // flat per-traveller
  var POLICY_LIMIT    = 3500;   // standard approval threshold (USD total)
  var ESCALATION_LIMIT = 7000;  // senior sign-off required above this

  /* ── Internal helpers ──────────────────────────────────────────────────── */
  function slug(s) {
    return String(s || '').toLowerCase().trim();
  }

  function calcNights(dep, ret) {
    var d = new Date(dep);
    var r = new Date(ret);
    var ms = r.getTime() - d.getTime();
    return Math.max(1, Math.round(ms / 86400000));
  }

  function resolveRisk(destination) {
    var d = slug(destination);
    for (var i = 0; i < HIGH_RISK.length; i++) {
      if (d.indexOf(HIGH_RISK[i]) !== -1) return 'high';
    }
    for (var j = 0; j < MEDIUM_RISK.length; j++) {
      if (d.indexOf(MEDIUM_RISK[j]) !== -1) return 'medium';
    }
    return 'low';
  }

  function estimateCost(destination, nights, travellerCount) {
    var d = slug(destination);
    var nightly = DEFAULT_NIGHTLY;
    var keys = Object.keys(COST_MAP);
    for (var i = 0; i < keys.length; i++) {
      if (d.indexOf(keys[i]) !== -1) {
        nightly = COST_MAP[keys[i]];
        break;
      }
    }
    return Math.round((nightly * nights + FLIGHT_BASE) * travellerCount);
  }

  /* ── Compliance + approval logic ────────────────────────────────────────── */
  function resolveCompliance(risk, cost) {
    if (risk === 'high' || cost > ESCALATION_LIMIT)  return 'non_compliant';
    if (risk === 'medium' || cost > POLICY_LIMIT)    return 'conditional';
    return 'compliant';
  }

  function resolveApproval(risk, cost) {
    if (risk === 'high' || cost > ESCALATION_LIMIT)  return 'requires_escalation';
    if (risk === 'medium' || cost > POLICY_LIMIT)    return 'pending_approval';
    return 'auto_approved';
  }

  function resolveEscalationReason(risk, cost) {
    var reasons = [];
    if (risk === 'high') {
      reasons.push('Destination is classified as high-risk under the current security advisory');
    }
    if (cost > ESCALATION_LIMIT) {
      reasons.push(
        'Total estimated cost ($' + cost.toLocaleString() + ') exceeds the senior approval threshold ($' +
        ESCALATION_LIMIT.toLocaleString() + ')'
      );
    } else if (cost > POLICY_LIMIT) {
      reasons.push(
        'Total estimated cost ($' + cost.toLocaleString() + ') exceeds the standard policy limit ($' +
        POLICY_LIMIT.toLocaleString() + ')'
      );
    }
    if (risk === 'medium') {
      reasons.push('Destination carries a medium-risk rating requiring manager sign-off');
    }
    return reasons.length > 0 ? reasons.join('. ') + '.' : null;
  }

  function resolveNextStep(approval, risk) {
    if (approval === 'auto_approved') {
      return 'Trip is within policy. You may proceed to booking confirmation.';
    }
    if (approval === 'pending_approval') {
      return risk === 'medium'
        ? 'Submit to your line manager for approval. Include a risk mitigation plan covering emergency contacts, medical cover, and local security contacts.'
        : 'Submit to Finance for approval. Attach a business justification and full cost breakdown.';
    }
    return 'This trip requires written authorisation from Senior Management and the Security Officer. Do not book any travel until written approval is received and logged.';
  }

  function resolveTripStatus(approval) {
    if (approval === 'auto_approved')       return 'approved';
    if (approval === 'pending_approval')    return 'under_review';
    return 'escalated';
  }

  /* ── Main evaluate function ─────────────────────────────────────────────── */
  function evaluate(formData) {
    var destination    = String(formData.destination || '').trim();
    var departureDate  = formData.departureDate;
    var returnDate     = formData.returnDate;
    var travellerCount = Math.max(1, parseInt(formData.travellerCount, 10) || 1);
    var purpose        = formData.purpose || '';
    var notes          = String(formData.notes || '').trim() || null;

    var nights     = calcNights(departureDate, returnDate);
    var risk       = resolveRisk(destination);
    var cost       = estimateCost(destination, nights, travellerCount);
    var compliance = resolveCompliance(risk, cost);
    var approval   = resolveApproval(risk, cost);
    var escalation = resolveEscalationReason(risk, cost);
    var nextStep   = resolveNextStep(approval, risk);
    var status     = resolveTripStatus(approval);

    return {
      destination:    destination,
      departureDate:  departureDate,
      returnDate:     returnDate,
      nights:         nights,
      travellerCount: travellerCount,
      purpose:        purpose,
      notes:          notes,
      status:         status,
      evaluation: {
        estimatedCost:       cost,
        currency:            'USD',
        riskLevel:           risk,
        complianceStatus:    compliance,
        approvalStatus:      approval,
        escalationReason:    escalation,
        recommendedNextStep: nextStep,
        evaluatedAt:         new Date().toISOString(),
      },
    };
  }

  /* ── Ava plain-language explanation ────────────────────────────────────── */
  function avaExplain(ev) {
    var approval   = ev.approvalStatus;
    var risk       = ev.riskLevel;
    var cost       = ev.estimatedCost;
    var currency   = ev.currency;
    var escalation = ev.escalationReason;
    var nextStep   = ev.recommendedNextStep;

    var tone, headline, body, action;

    if (approval === 'auto_approved') {
      tone     = 'positive';
      headline = 'This trip is cleared to proceed.';
      body     = 'I reviewed this request against current travel policy. The estimated cost of '
        + currency + '\u00a0' + cost.toLocaleString()
        + ' is within the approved spend limit'
        + (risk === 'low' ? ', and the destination carries no elevated risk flags' : '')
        + '. No escalation is required — this trip can be booked.';
      action = nextStep;

    } else if (approval === 'pending_approval') {
      tone     = 'caution';
      headline = 'This trip needs approval before it can proceed.';
      body     = 'I flagged this request because '
        + (escalation || 'the trip falls outside standard policy parameters')
        + ' The estimated total spend is '
        + currency + '\u00a0' + cost.toLocaleString()
        + '. This does not prevent the trip — it means the correct authorisation must be in place first.';
      action = nextStep;

    } else {
      tone     = 'alert';
      headline = 'This trip requires senior-level authorisation.';
      body     = 'I have escalated this request because '
        + (escalation || 'it falls outside the scope of standard approval authority')
        + ' Estimated total cost: '
        + currency + '\u00a0' + cost.toLocaleString()
        + '. Travel cannot be booked until written approval is confirmed from the required approvers.';
      action = nextStep;
    }

    return {
      tone:     tone,
      headline: headline,
      body:     body,
      action:   action,
    };
  }

  /* ── Formatting helpers ─────────────────────────────────────────────────── */
  function riskLabel(risk) {
    return { low: 'Low risk', medium: 'Medium risk', high: 'High risk' }[risk] || risk;
  }

  function approvalLabel(approval) {
    return {
      auto_approved:        'Auto-approved',
      pending_approval:     'Pending approval',
      requires_escalation:  'Escalated',
    }[approval] || approval;
  }

  function complianceLabel(compliance) {
    return {
      compliant:     'Compliant',
      conditional:   'Conditional',
      non_compliant: 'Non-compliant',
    }[compliance] || compliance;
  }

  function statusLabel(status) {
    return {
      requested:    'Requested',
      under_review: 'Under review',
      approved:     'Approved',
      escalated:    'Escalated',
      in_journey:   'In journey',
      completed:    'Completed',
    }[status] || status;
  }

  function purposeLabel(purpose) {
    return {
      business_meeting: 'Business meeting',
      client_visit:     'Client visit',
      conference:       'Conference / summit',
      site_inspection:  'Site inspection',
      training:         'Training / workshop',
      internal_project: 'Internal project',
      other:            'Other',
    }[purpose] || purpose;
  }

  /* ── Public API ─────────────────────────────────────────────────────────── */
  return {
    evaluate:         evaluate,
    avaExplain:       avaExplain,
    riskLabel:        riskLabel,
    approvalLabel:    approvalLabel,
    complianceLabel:  complianceLabel,
    statusLabel:      statusLabel,
    purposeLabel:     purposeLabel,
    POLICY_LIMIT:     POLICY_LIMIT,
    ESCALATION_LIMIT: ESCALATION_LIMIT,
  };

})();
