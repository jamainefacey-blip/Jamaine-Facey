/**
 * P6-LIVE-01 — Mock Anthropic API server
 * Returns valid Phase 6 JSON responses for London and Kabul test cases.
 * Listens on port 7700. Set window.VST_CONFIG.avaEndpoint to point here.
 */
'use strict';
const http = require('http');

const LONDON_RESPONSE = {
  tripSummary:        'New York → London · 7 nights · 1 traveller · Return',
  travellerProfile:   'Business traveller · conference',
  overallRiskLevel:   'LOW',
  complianceStatus:   'COMPLIANT',
  approvalStatus:     'APPROVED',
  estimatedCostBand:  '$1,800 – $2,400 USD',
  safetyFlags:        [],
  accessibilityFlags: [],
  documentationFlags: [],
  recommendedActions: [
    'Proceed to booking confirmation',
    'Ensure travel insurance covers the full trip duration',
    'Register trip with corporate travel security system',
  ],
  escalationRequired: false,
  avaBrief: 'I have reviewed this London conference trip and it is fully within policy. The destination carries low risk and the estimated cost is within the approved spend limit. This trip is cleared to proceed immediately to booking.',
  confidence: 0.97,
  sourceMode: 'live_claude',
};

const KABUL_RESPONSE = {
  tripSummary:        'London → Kabul · 9 nights · 1 traveller · Return',
  travellerProfile:   'Business traveller · site_inspection',
  overallRiskLevel:   'HIGH',
  complianceStatus:   'NON_COMPLIANT',
  approvalStatus:     'ESCALATED',
  estimatedCostBand:  '$5,400 – $7,200 USD',
  safetyFlags: [
    'Destination under active UK FCDO security advisory — Level 4 (Do not travel)',
    'Conflict zone — insurgent activity and civil unrest reported across all provinces',
    'Medical infrastructure severely limited — evacuation plan required',
  ],
  accessibilityFlags: [],
  documentationFlags: [
    'Written senior authorisation required before any travel commitment',
    'Full risk mitigation plan required — including security brief and evac route',
    'Security Officer sign-off mandatory — initiate briefing at least 14 days prior',
    'Cost justification required — estimated spend exceeds standard policy limit',
  ],
  recommendedActions: [
    'Do not book any travel until written authorisation is received and logged',
    'Submit escalation request to Senior Management and the Security Officer immediately',
    'Prepare a comprehensive risk mitigation and evacuation plan',
    'Contact the corporate security team for a destination threat briefing',
    'Identify in-country emergency contacts and secure communications channel',
  ],
  escalationRequired: true,
  avaBrief: 'I have escalated this Kabul trip request. The destination is classified as Do Not Travel under current FCDO and State Department advisories due to active conflict and extreme security risk. Travel cannot be booked under any circumstances until written authorisation is received from Senior Management, the Security Officer, and the Board Safety Committee. A full risk mitigation and evacuation plan must accompany the escalation.',
  confidence: 0.94,
  sourceMode: 'live_claude',
};

const server = http.createServer((req, res) => {
  // Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-api-access');

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405); res.end(); return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let dest = 'london';
    try {
      const parsed = JSON.parse(body);
      const content = parsed.messages && parsed.messages[0] && parsed.messages[0].content || '';
      if (content.toLowerCase().includes('kabul')) dest = 'kabul';
    } catch (e) {}

    const payload = dest === 'kabul' ? KABUL_RESPONSE : LONDON_RESPONSE;

    const anthropicResponse = {
      id: 'msg_mock_' + Date.now(),
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: JSON.stringify(payload) }],
      model: 'claude-haiku-4-5-20251001',
      stop_reason: 'end_turn',
      usage: { input_tokens: 512, output_tokens: 256 },
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(anthropicResponse));
  });
});

server.listen(7700, '127.0.0.1', () => {
  console.log('Mock Anthropic API listening on http://127.0.0.1:7700');
});
