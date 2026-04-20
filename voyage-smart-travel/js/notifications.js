/* ─────────────────────────────────────────────────────────────────────────────
   VST — Notifications Frontend Module
   window.VSTNotifications — trigger notification events from the browser.
   All calls go to POST /v1/notifications/send (Vercel serverless).
   ───────────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* Generate a UUID v4 (browser-safe) */
  function _uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  /* Build base recipient from cached auth user */
  function _recipient(overrides) {
    var user = window.VSTAuth && window.VSTAuth.getCachedUser();
    var base = user ? {
      user_id:  user.user_id || user.id || 'anonymous',
      phone:    user.identity && user.identity.phone,
      locale:   (user.preferences && user.preferences.locale) || 'en-GB',
      tier:     user.tier || 'GUEST',
      onesignal_player_id: user.onesignal_player_id || null,
    } : { user_id: 'anonymous', tier: 'GUEST' };
    return Object.assign(base, overrides || {});
  }

  /* POST the event envelope to the notification API */
  function trigger(eventType, opts) {
    /* opts: { priority, payload, recipient_overrides, sos_contacts } */
    opts = opts || {};
    var envelope = {
      event_id:      _uuid(),
      event_type:    eventType,
      priority:      opts.priority   || 'P2_NORMAL',
      recipient:     _recipient(opts.recipient_overrides),
      payload:       opts.payload    || { title: eventType, body: '' },
      sos_contacts:  opts.sos_contacts || [],
      created_at:    new Date().toISOString(),
      source_service: 'vst-frontend',
    };

    return fetch('/v1/notifications/send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(envelope),
    })
      .then(function (res) { return res.json(); })
      .catch(function (err) {
        console.warn('[VSTNotifications] delivery failed:', err.message);
        return { accepted: false, error: err.message };
      });
  }

  /* ── Convenience helpers for wired events ─────────────────────────────────── */

  function bookingConfirmed(booking) {
    return trigger('BOOKING_CONFIRMED', {
      priority: 'P2_NORMAL',
      payload: {
        title:   'Booking Confirmed',
        body:    'Your trip to ' + (booking.destination || 'your destination') + ' is confirmed.',
        sms_body: 'VST: Trip to ' + (booking.destination || 'destination') + ' confirmed. Have a great journey!',
        deep_link: '#dashboard',
        data:    { booking_ref: booking.ref || booking.id },
      },
    });
  }

  function sosTriggered(location, sosContacts) {
    var user = window.VSTAuth && window.VSTAuth.getCachedUser();
    var name = (user && user.identity && (user.identity.preferred_name || user.identity.full_name)) || 'A VST traveller';
    return trigger('SOS_TRIGGERED', {
      priority: 'P0_CRITICAL',
      payload: {
        title:    'SOS Alert — Help Needed',
        body:     name + ' has triggered an SOS alert via Voyage Smart Travel.',
        sms_body: 'VST SOS: ' + name + ' needs help. Location: ' + (location || 'unknown') + '. Open VST app immediately.',
        voice_twiml: '<Response><Say voice="alice">Emergency SOS alert from Voyage Smart Travel. ' + name + ' needs immediate assistance. Please check your messages and contact them now.</Say></Response>',
        deep_link: '#safety',
        data:    { location: location || null, triggered_at: new Date().toISOString() },
      },
      sos_contacts: sosContacts || [],
    });
  }

  function painGuardHandoff(task) {
    return trigger('PAIN_GUARD_HANDOFF_REQUIRED', {
      priority: 'P1_HIGH',
      payload: {
        title:    'Pain Guard: Operator Handoff',
        body:     'A traveller pain management task requires human review.',
        deep_link: '#pain-control',
        data: {
          task_id:       task.task_id || task.id,
          task_type:     task.task_type || task.type,
          urgency_score: task.urgency_score || 0,
          deep_link_to_pain_control: '#pain-control',
        },
      },
    });
  }

  window.VSTNotifications = { trigger, bookingConfirmed, sosTriggered, painGuardHandoff };
})();
