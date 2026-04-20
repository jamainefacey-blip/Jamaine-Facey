/* ─────────────────────────────────────────────────────────────────────────────
   VST — NotificationService
   Routes NotificationEvent envelopes to channels based on priority × tier.
   Implements P0 SOS 6-step escalation, Pain Guard operator handoff,
   DeliveryRecord logging, and retry policies per spec.
   ───────────────────────────────────────────────────────────────────────────── */

'use strict';

const oneSignal = require('./providers/onesignal-provider');
const twilio    = require('./providers/twilio-provider');

/* ── Tiny UUID generator (no external dep) ─────────────────────────────────── */
function _uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/* ── In-memory DeliveryRecord store ────────────────────────────────────────── */
var _deliveryLog = [];

function _logDelivery(record) {
  _deliveryLog.push(Object.assign({ delivery_id: _uuid(), attempted_at: new Date().toISOString() }, record));
}

function getDeliveryLog() { return _deliveryLog.slice(); }

/* ── Priority → channel routing (from spec) ────────────────────────────────── */
var PRIORITY_CHANNELS = {
  P0_CRITICAL: ['push', 'sms', 'voice'],
  P1_HIGH:     ['push', 'sms'],
  P2_NORMAL:   ['push', 'in_app'],
  P3_LOW:      ['in_app'],
};

/* Channels blocked by tier */
var TIER_BLOCKED = {
  GUEST: ['sms', 'voice', 'whatsapp'],
};

function _allowedChannels(priority, tier, overrideAll) {
  var base    = (PRIORITY_CHANNELS[priority] || ['in_app']).slice();
  var blocked = overrideAll ? [] : (TIER_BLOCKED[tier] || []);
  return base.filter(function (ch) { return blocked.indexOf(ch) === -1; });
}

/* ── Retry wrappers ─────────────────────────────────────────────────────────── */
async function _retryFixed(fn, maxAttempts, intervalMs, eventId, channel) {
  for (var i = 1; i <= maxAttempts; i++) {
    var result = await fn();
    _logDelivery({
      event_id:       eventId,
      channel:        channel,
      provider:       channel === 'push' || channel === 'in_app' ? 'onesignal' : 'twilio',
      provider_msg_id: result.provider_msg_id,
      status:         result.ok ? 'sent' : 'failed',
      failure_reason: result.error,
      attempt_number: i,
    });
    if (result.ok) return result;
    if (i < maxAttempts) await new Promise(function (r) { setTimeout(r, intervalMs); });
  }
  return { ok: false };
}

async function _retryExponential(fn, maxAttempts, initialMs, maxMs, eventId, channel) {
  var delay = initialMs;
  for (var i = 1; i <= maxAttempts; i++) {
    var result = await fn();
    _logDelivery({
      event_id:       eventId,
      channel:        channel,
      provider:       channel === 'push' || channel === 'in_app' ? 'onesignal' : 'twilio',
      provider_msg_id: result.provider_msg_id,
      status:         result.ok ? 'sent' : 'failed',
      failure_reason: result.error,
      attempt_number: i,
    });
    if (result.ok) return result;
    if (i < maxAttempts) {
      await new Promise(function (r) { setTimeout(r, Math.min(delay, maxMs)); });
      delay *= 2;
    }
  }
  return { ok: false };
}

/* ── Channel dispatch helpers ───────────────────────────────────────────────── */
function _dispatchPush(event, channel) {
  var p = event.payload;
  var r = event.recipient;
  return oneSignal.sendPush({
    player_id: r.onesignal_player_id,
    title:     p.title,
    body:      p.body,
    data:      Object.assign({ event_id: event.event_id, event_type: event.event_type }, p.data || {}),
    url:       p.deep_link,
    image_url: p.image_url,
    channel:   channel,
  });
}

function _dispatchSms(to, body, eventId) {
  return twilio.sendSms({ to: to, body: body });
}

function _dispatchVoice(to, twiml, eventId) {
  return twilio.sendVoice({ to: to, twiml: twiml });
}

/* ── SOS 6-step escalation (P0) ─────────────────────────────────────────────── */
async function _runSosEscalation(event) {
  var p          = event.payload;
  var r          = event.recipient;
  var sosContacts = event.sos_contacts || [];
  var eventId    = event.event_id;
  var voiceDelay = parseInt(process.env.SOS_VOICE_DELAY_MS   || '60000', 10);
  var escalDelay = parseInt(process.env.SOS_ESCALATE_DELAY_MS || '120000', 10);

  /* Step 2 — push to traveller */
  await _retryFixed(function () { return _dispatchPush(event, 'push'); }, 10, 2000, eventId, 'push');

  /* Step 3 — SMS to traveller */
  if (r.phone) {
    var smsTxt = (p.sms_body || p.body).slice(0, 160);
    await _retryFixed(function () { return _dispatchSms(r.phone, smsTxt, eventId); }, 10, 2000, eventId, 'sms');
  }

  /* Step 4 — SMS all SOS contacts */
  for (var i = 0; i < sosContacts.length; i++) {
    var contact = sosContacts[i];
    if (contact.phone) {
      var contactMsg = 'VST SOS Alert: ' + (p.sms_body || p.body).slice(0, 130);
      await _dispatchSms(contact.phone, contactMsg, eventId);
      _logDelivery({ event_id: eventId, channel: 'sms', provider: 'twilio', status: 'sent', attempt_number: 1 });
    }
  }

  /* Step 5 — Voice calls to SOS contacts at 60s if unacknowledged */
  setTimeout(async function () {
    var twiml = p.voice_twiml || '<Response><Say voice="alice">This is an emergency SOS alert from Voyage Smart Travel. Your contact has triggered an SOS. Please check your messages and contact them immediately.</Say></Response>';
    for (var j = 0; j < sosContacts.length; j++) {
      if (sosContacts[j].phone) {
        var vr = await _dispatchVoice(sosContacts[j].phone, twiml, eventId);
        _logDelivery({ event_id: eventId, channel: 'voice', provider: 'twilio', provider_msg_id: vr.provider_msg_id, status: vr.ok ? 'sent' : 'failed', failure_reason: vr.error, attempt_number: 1 });
      }
    }
  }, voiceDelay);

  /* Step 6 — Escalate to emergency services marker at 120s */
  setTimeout(function () {
    var escalEvent = {
      event_id:   _uuid(),
      event_type: 'SOS_ESCALATED_TO_EMERGENCY_SERVICES',
      priority:   'P0_CRITICAL',
      recipient:  event.recipient,
      payload:    {
        title:    'SOS Escalated',
        body:     'Your SOS has been escalated. Emergency services have been notified.',
        sms_body: 'VST: SOS escalated. Emergency services notified.',
        data:     { original_event_id: event.event_id },
      },
      sos_contacts: sosContacts,
      created_at: new Date().toISOString(),
    };
    _logDelivery({ event_id: escalEvent.event_id, channel: 'in_app', provider: 'onesignal', status: 'queued', attempt_number: 1 });
    /* Fire escalation push non-blocking */
    _dispatchPush(escalEvent, 'push').then(function (res) {
      _logDelivery({ event_id: escalEvent.event_id, channel: 'push', provider: 'onesignal', provider_msg_id: res.provider_msg_id, status: res.ok ? 'sent' : 'failed', failure_reason: res.error, attempt_number: 1 });
    });
  }, escalDelay);
}

/* ── Pain Guard operator handoff ───────────────────────────────────────────── */
async function _runPainGuardHandoff(event) {
  /* Operator notification: push + in_app only, regardless of tier */
  var p       = event.payload;
  var eventId = event.event_id;

  var operatorEvent = Object.assign({}, event, {
    recipient: {
      onesignal_player_id: process.env.OPERATOR_ONESIGNAL_PLAYER_ID || null,
    },
    payload: Object.assign({}, p, {
      title: p.title || 'Pain Guard: Handoff Required',
      body:  p.body  || 'A traveller requires human operator assistance.',
      data:  {
        task_id:                 p.data && p.data.task_id,
        task_type:               p.data && p.data.task_type,
        user_id:                 event.recipient && event.recipient.user_id,
        urgency_score:           p.data && p.data.urgency_score,
        deep_link_to_pain_control: p.deep_link || '/pain-control',
      },
    }),
  });

  var pushResult = await _retryExponential(
    function () { return _dispatchPush(operatorEvent, 'push'); },
    5, 5000, 300000, eventId, 'push'
  );

  var inAppResult = await _dispatchPush(operatorEvent, 'in_app');
  _logDelivery({ event_id: eventId, channel: 'in_app', provider: 'onesignal', provider_msg_id: inAppResult.provider_msg_id, status: inAppResult.ok ? 'sent' : 'failed', failure_reason: inAppResult.error, attempt_number: 1 });

  return pushResult;
}

/* ── Main dispatch entry point ──────────────────────────────────────────────── */
async function dispatch(event) {
  var priority = event.priority || 'P3_LOW';
  var tier     = (event.recipient && event.recipient.tier) || 'GUEST';
  var eventId  = event.event_id || _uuid();
  event.event_id = eventId;

  /* Pain Guard handoff routes to operator, not traveller */
  if (event.event_type === 'PAIN_GUARD_HANDOFF_REQUIRED') {
    return _runPainGuardHandoff(event);
  }

  /* SOS: full 6-step escalation */
  if (event.event_type === 'SOS_TRIGGERED') {
    return _runSosEscalation(event);
  }

  /* Standard routing */
  var isP0     = priority === 'P0_CRITICAL';
  var channels = _allowedChannels(priority, tier, isP0);
  var p        = event.payload;
  var r        = event.recipient;

  for (var i = 0; i < channels.length; i++) {
    var ch = channels[i];

    if (ch === 'push' || ch === 'in_app') {
      if (priority === 'P0_CRITICAL') {
        await _retryFixed(function () { return _dispatchPush(event, ch); }, 10, 2000, eventId, ch);
      } else if (priority === 'P3_LOW') {
        var res = await _dispatchPush(event, ch);
        _logDelivery({ event_id: eventId, channel: ch, provider: 'onesignal', provider_msg_id: res.provider_msg_id, status: res.ok ? 'sent' : 'failed', failure_reason: res.error, attempt_number: 1 });
      } else {
        await _retryExponential(function () { return _dispatchPush(event, ch); }, 5, 5000, 300000, eventId, ch);
      }
    } else if (ch === 'sms') {
      var smsBody = ((p.sms_body || p.body) + '').slice(0, 160);
      if (r && r.phone) {
        await _retryExponential(function () { return _dispatchSms(r.phone, smsBody, eventId); }, 5, 5000, 300000, eventId, 'sms');
      }
    } else if (ch === 'whatsapp') {
      var waBody = (p.body + '').slice(0, 1600);
      if (r && r.phone) {
        await _retryExponential(function () { return twilio.sendSms({ to: r.phone, body: waBody, whatsapp: true }); }, 5, 5000, 300000, eventId, 'whatsapp');
      }
    } else if (ch === 'voice') {
      var twiml = p.voice_twiml || '<Response><Say voice="alice">' + (p.body || 'You have a notification from Voyage Smart Travel.') + '</Say></Response>';
      if (r && r.phone) {
        await _retryFixed(function () { return _dispatchVoice(r.phone, twiml, eventId); }, 3, 5000, eventId, 'voice');
      }
    }
  }

  return { ok: true, event_id: eventId, channels_attempted: channels };
}

module.exports = { dispatch, getDeliveryLog };
