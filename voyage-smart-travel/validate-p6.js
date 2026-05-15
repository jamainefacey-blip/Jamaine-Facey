/* ─────────────────────────────────────────────────────────────────────────────
   VST — Phase 6 Validation Suite
   Run: node validate-p6.js  (from voyage-smart-travel directory)
   ───────────────────────────────────────────────────────────────────────────── */
'use strict';

/* ── Shim browser globals ────────────────────────────────────────────────── */
global.window   = global;
global.document = { getElementById: function () { return null; } };

var passed = 0;
var failed = 0;

function ok(condition, label) {
  if (condition) {
    console.log('  PASS  ' + label);
    passed++;
  } else {
    console.error('  FAIL  ' + label);
    failed++;
  }
}

function section(name) {
  console.log('\n── ' + name + ' ──────────────────────────────────────────');
}

/* ── Load modules ───────────────────────────────────────────────────────── */
require('./js/ava-engine.js');
require('./js/ava-phase6.js');

var Engine = window.VSTAvaEngine;
var P6     = window.VSTAvaPhase6;

/* ── A. Module existence ──────────────────────────────────────────────────── */
section('A. Module existence');
ok(typeof Engine === 'object' && Engine !== null,          'VSTAvaEngine loaded');
ok(typeof P6     === 'object' && P6     !== null,          'VSTAvaPhase6 loaded');
ok(typeof P6.evaluate        === 'function',               'P6.evaluate is a function');
ok(typeof P6.fallbackEvaluate === 'function',              'P6.fallbackEvaluate is a function');
ok(typeof P6.validate        === 'function',               'P6.validate is a function');
ok(typeof P6.normalise       === 'function',               'P6.normalise is a function');
ok(typeof P6.isLiveMode      === 'function',               'P6.isLiveMode is a function');

/* ── B. validate() function ───────────────────────────────────────────────── */
section('B. validate()');
var validObj = {
  overallRiskLevel:    'LOW',
  complianceStatus:    'COMPLIANT',
  approvalStatus:      'APPROVED',
  costBand:            '$500–$1,000',
  tripSummary:         'Test trip',
  travellerProfile:    'Business traveller',
  avaBrief:            'All clear.',
  escalationRequired:  false,
  safetyFlags:         [],
  accessibilityFlags:  [],
  documentationFlags:  [],
  recommendedActions:  ['Proceed to booking'],
  confidenceScore:     0.9,
  source:              'fallback',
};

ok(P6.validate(validObj),                                  'valid object with all required fields passes');  // Fixed: was ok(!P6.validate(...))
ok(!P6.validate(null),                                     'null fails validation');
ok(!P6.validate({}),                                       'empty object fails validation');
ok(!P6.validate({ overallRiskLevel: 'LOW' }),              'partial object fails validation');
ok(!P6.validate({ ...validObj, overallRiskLevel: 'BAD' }), 'invalid riskLevel fails');
ok(!P6.validate({ ...validObj, complianceStatus: 'X' }),   'invalid complianceStatus fails');
ok(!P6.validate({ ...validObj, approvalStatus: 'MAYBE' }), 'invalid approvalStatus fails');

/* ── C. normalise() function ─────────────────────────────────────────────── */
section('C. normalise()');
var norm = P6.normalise({ overallRiskLevel: 'HIGH', complianceStatus: 'NON_COMPLIANT', approvalStatus: 'ESCALATED' });
ok(typeof norm === 'object',                               'normalise returns object');
ok(Array.isArray(norm.safetyFlags),                        'safetyFlags is array after normalise');
ok(Array.isArray(norm.accessibilityFlags),                 'accessibilityFlags is array after normalise');
ok(Array.isArray(norm.documentationFlags),                 'documentationFlags is array after normalise');
ok(Array.isArray(norm.recommendedActions),                 'recommendedActions is array after normalise');
ok(typeof norm.estimatedCostBand === 'string',             'estimatedCostBand is string after normalise');
ok(typeof norm.avaBrief === 'string',                      'avaBrief is string after normalise');
ok(typeof norm.confidence === 'number',                    'confidence is number after normalise');
ok(typeof norm.sourceMode === 'string',                    'sourceMode is string after normalise');
ok(typeof norm.tripSummary === 'string',                   'tripSummary is string after normalise');
ok(typeof norm.travellerProfile === 'string',              'travellerProfile is string after normalise');

/* ── D. fallbackEvaluate() — low-risk trip ───────────────────────────────── */
section('D. fallbackEvaluate() — low-risk');
var fd1 = {
  destination:        'London',
  origin:             'New York',
  departureDate:      '2026-04-01',
  returnDate:         '2026-04-07',
  tripType:           'return',
  nights:             6,
  travellerCount:     1,
  travellerType:      'business',
  budgetBand:         'standard',
  accessibilityNeeds: [],
  purpose:            'business_meeting',
  estimatedCostUSD:   2330,
  notes:              '',
};
var r1 = P6.fallbackEvaluate(fd1);
ok(P6.validate(r1),                                        'fallbackEvaluate output passes validate()');
ok(r1.overallRiskLevel === 'LOW',                          'London correctly rated LOW risk');
ok(r1.approvalStatus === 'APPROVED',                       'London auto-approved');
ok(r1.complianceStatus === 'COMPLIANT',                    'London compliant');
ok(r1.escalationRequired === false,                        'London no escalation');
ok(typeof r1.estimatedCostBand === 'string' && r1.estimatedCostBand.length > 0, 'estimatedCostBand populated');
ok(typeof r1.avaBrief === 'string' && r1.avaBrief.length > 10, 'avaBrief populated');
ok(r1.sourceMode === 'fallback_rules',                     'sourceMode is fallback_rules');
ok(typeof r1.confidence === 'number',                      'confidence is number');
ok(Array.isArray(r1.recommendedActions) && r1.recommendedActions.length > 0, 'recommendedActions populated');

/* ── E. fallbackEvaluate() — high-risk trip ──────────────────────────────── */
section('E. fallbackEvaluate() — high-risk');
var fd2 = {
  destination:        'Kabul',
  origin:             'London',
  departureDate:      '2026-05-01',
  returnDate:         '2026-05-10',
  tripType:           'return',
  nights:             9,
  travellerCount:     2,
  travellerType:      'solo',
  budgetBand:         'budget',
  accessibilityNeeds: [],
  purpose:            'site_inspection',
  estimatedCostUSD:   5200,
  notes:              '',
};
var r2 = P6.fallbackEvaluate(fd2);
ok(P6.validate(r2),                                        'high-risk output passes validate()');
ok(r2.overallRiskLevel === 'HIGH',                         'Kabul rated HIGH risk');
ok(r2.approvalStatus === 'ESCALATED',                      'Kabul escalated');
ok(r2.complianceStatus === 'NON_COMPLIANT',                'Kabul non-compliant');
ok(r2.escalationRequired === true,                         'Kabul escalation required');
ok(r2.safetyFlags.length > 0,                              'safety flags populated for high-risk');

/* ── F. fallbackEvaluate() — accessibility needs ─────────────────────────── */
section('F. fallbackEvaluate() — accessibility needs');
var fd3 = {
  destination:        'Paris',
  origin:             'Toronto',
  departureDate:      '2026-06-01',
  returnDate:         '2026-06-05',
  tripType:           'return',
  nights:             4,
  travellerCount:     1,
  travellerType:      'business',
  budgetBand:         'standard',
  accessibilityNeeds: ['wheelchair', 'visual'],
  purpose:            'conference',
  estimatedCostUSD:   1710,
  notes:              '',
};
var r3 = P6.fallbackEvaluate(fd3);
ok(r3.accessibilityFlags.length > 0,                       'accessibility flags populated when needs specified');

/* one-way trip with no origin — origin flag should fire (intentional behavior) */
var fd4 = {
  destination:        'Tokyo',
  origin:             '',
  departureDate:      '2026-07-01',
  returnDate:         null,
  tripType:           'one_way',
  nights:             1,
  travellerCount:     1,
  travellerType:      'business',
  budgetBand:         '',
  accessibilityNeeds: [],
  purpose:            'business_meeting',
  estimatedCostUSD:   850,
  notes:              '',
};
var r4 = P6.fallbackEvaluate(fd4);
ok(P6.validate(r4),                                        'one-way trip output passes validate()');
ok(r4.documentationFlags.some(function (f) { return f.indexOf('Origin') !== -1 || f.indexOf('origin') !== -1; }),
                                                           'origin flagged when empty (all trip types)'); // Fixed: was asserting NO origin flag

/* ── G. fallbackEvaluate() — medium-risk ────────────────────────────────── */
section('G. fallbackEvaluate() — medium-risk');
var fd5 = {
  destination:        'Nairobi',
  origin:             'London',
  departureDate:      '2026-08-01',
  returnDate:         '2026-08-08',
  tripType:           'return',
  nights:             7,
  travellerCount:     1,
  travellerType:      'business',
  budgetBand:         'standard',
  accessibilityNeeds: [],
  purpose:            'client_visit',
  estimatedCostUSD:   1490,
  notes:              '',
};
var r5 = P6.fallbackEvaluate(fd5);
ok(P6.validate(r5),                                        'medium-risk output passes validate()');
ok(r5.overallRiskLevel === 'MEDIUM',                       'Nairobi rated MEDIUM risk');
ok(r5.approvalStatus === 'REVIEW',                         'Nairobi requires review');
ok(r5.complianceStatus === 'CHECK_REQUIRED',               'Nairobi check_required compliance');

/* ── H. evaluate() returns a Promise ────────────────────────────────────── */
section('H. evaluate() returns a Promise');
var evalPromise = P6.evaluate(fd1);
ok(evalPromise && typeof evalPromise.then === 'function',   'evaluate() returns thenable');

evalPromise.then(function (result) {
  section('H (async). Promise resolution');
  ok(result !== null && typeof result === 'object',          'Promise resolves to an object');
  ok(P6.validate(result),                                    'resolved result passes validate()');
  ok(result.sourceMode === 'fallback_rules',                 'no API key → sourceMode is fallback_rules');
  finalize();
}).catch(function (err) {
  section('H (async). Promise rejection — UNEXPECTED');
  console.error('  FAIL  evaluate() rejected unexpectedly:', err.message);
  failed++;
  finalize();
});

/* ── I. isLiveMode() ─────────────────────────────────────────────────────── */
section('I. isLiveMode()');
ok(P6.isLiveMode() === false,                              'isLiveMode returns false when no API key set');

/* ── J. Engine labels ─────────────────────────────────────────────────────── */
section('J. VSTAvaEngine labels');
ok(Engine.riskLabel('low')     === 'Low risk',             'riskLabel low');
ok(Engine.riskLabel('medium')  === 'Medium risk',          'riskLabel medium');
ok(Engine.riskLabel('high')    === 'High risk',            'riskLabel high');
ok(Engine.approvalLabel('auto_approved')       === 'Auto-approved',   'approvalLabel auto_approved');
ok(Engine.approvalLabel('pending_approval')    === 'Pending approval', 'approvalLabel pending_approval');
ok(Engine.approvalLabel('requires_escalation') === 'Escalated',       'approvalLabel requires_escalation');
ok(Engine.complianceLabel('compliant')         === 'Compliant',        'complianceLabel compliant');
ok(Engine.complianceLabel('conditional')       === 'Conditional',      'complianceLabel conditional');
ok(Engine.complianceLabel('non_compliant')     === 'Non-compliant',    'complianceLabel non_compliant');
ok(Engine.purposeLabel('leisure')              === 'Leisure / personal', 'purposeLabel leisure');

/* ── K. Engine evaluate() ────────────────────────────────────────────────── */
section('K. VSTAvaEngine evaluate()');
var ev = Engine.evaluate({
  destination:        'Berlin',
  origin:             'London',
  departureDate:      '2026-04-01',
  returnDate:         '2026-04-05',
  tripType:           'return',
  travellerCount:     1,
  travellerType:      'business',
  budgetBand:         'standard',
  accessibilityNeeds: [],
  purpose:            'conference',
  notes:              '',
});
ok(ev.destination === 'Berlin',                            'evaluate preserves destination');
ok(ev.evaluation && typeof ev.evaluation === 'object',     'evaluate returns evaluation object');
ok(ev.evaluation.riskLevel === 'low',                      'Berlin is low risk');
ok(ev.evaluation.approvalStatus === 'auto_approved',       'Berlin auto-approved');
ok(typeof ev.evaluation.estimatedCost === 'number',        'estimatedCost is number');

/* ── L. Engine avaExplain() ──────────────────────────────────────────────── */
section('L. VSTAvaEngine avaExplain()');
var ava = Engine.avaExplain(ev.evaluation);
ok(typeof ava === 'object',                                'avaExplain returns object');
ok(ava.tone     === 'positive',                            'positive tone for auto_approved');
ok(typeof ava.headline === 'string',                       'headline is string');
ok(typeof ava.body     === 'string',                       'body is string');
ok(typeof ava.action   === 'string',                       'action is string');

/* ── M. All JS files parse cleanly ───────────────────────────────────────── */
section('M. All JS files parse cleanly');
var cp   = require('child_process');
var files = [
  'js/ava-phase6.js',
  'js/ava-engine.js',
  'js/router.js',
  'js/trips.js',
  'pages/trip-request.js',
  'pages/home.js',
];
files.forEach(function (f) {
  try {
    var result = cp.execSync('node --check ' + f, { stdio: 'pipe' });
    ok(true, f + ' — syntax OK');
  } catch (err) {
    ok(false, f + ' — SYNTAX ERROR: ' + err.stderr.toString().split('\n')[0]);
  }
});

/* ── finalize ─────────────────────────────────────────────────────────────── */
function finalize() {
  console.log('\n═══════════════════════════════════════════════════════');
  if (failed === 0) {
    console.log('  RESULT  ' + passed + ' passed  |  0 failed  ✓');
  } else {
    console.log('  RESULT  ' + passed + ' passed  |  ' + failed + ' failed');
  }
  console.log('═══════════════════════════════════════════════════════');
  if (failed > 0) {
    console.error('\nTEST FAILURE — aborting');
    process.exit(1);
  }
}
