/* ─────────────────────────────────────────────────────────────────────────────
   VST — Vercel Serverless: POST /v1/notifications/send
   Validates the NotificationEvent envelope and dispatches via NotificationService.
   Also handles GET /v1/notifications/delivery-records.
   ───────────────────────────────────────────────────────────────────────────── */

'use strict';

const { dispatch, getDeliveryLog } = require('../server/notification-service');

const VALID_PRIORITIES = ['P0_CRITICAL', 'P1_HIGH', 'P2_NORMAL', 'P3_LOW'];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  /* GET — delivery log (internal/dev use) */
  if (req.method === 'GET') {
    return res.status(200).json({ records: getDeliveryLog() });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  var event = req.body;

  /* Basic envelope validation */
  if (!event || typeof event !== 'object') {
    return res.status(400).json({ error: 'INVALID_ENVELOPE' });
  }
  if (!event.event_type) {
    return res.status(400).json({ error: 'MISSING_EVENT_TYPE' });
  }
  if (!event.recipient || !event.recipient.user_id) {
    return res.status(400).json({ error: 'MISSING_RECIPIENT' });
  }
  if (!event.payload || !event.payload.title || !event.payload.body) {
    return res.status(400).json({ error: 'MISSING_PAYLOAD' });
  }
  if (!VALID_PRIORITIES.includes(event.priority)) {
    return res.status(400).json({ error: 'INVALID_PRIORITY', valid: VALID_PRIORITIES });
  }

  if (!event.created_at) event.created_at = new Date().toISOString();

  try {
    var result = await dispatch(event);
    return res.status(202).json({ accepted: true, event_id: event.event_id, result });
  } catch (err) {
    console.error('[notifications] dispatch error:', err.message);
    return res.status(500).json({ error: 'DISPATCH_FAILED', detail: err.message });
  }
};
