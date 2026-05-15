/**
 * VST Vercel Serverless — /v1/bookings/:booking_id
 *
 * GET   /v1/bookings/:booking_id        — single booking
 * PATCH /v1/bookings/:booking_id/cancel — cancel booking
 *
 * booking_id injected via rewrite query param: ?booking_id=:id
 * cancel action injected via: ?action=cancel
 */
'use strict';

const { BookingStore } = require('../server/booking-store');
const { jwt }          = require('../server/user-store');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function authUser(req) {
  var header = (req.headers && req.headers['authorization']) || '';
  if (!header.startsWith('Bearer ')) throw new Error('missing token');
  return jwt.verify(header.slice(7));
}

module.exports = async function handler(req, res) {
  Object.keys(CORS).forEach(function (k) { res.setHeader(k, CORS[k]); });
  if (req.method === 'OPTIONS') return res.status(204).end();

  var claims;
  try { claims = authUser(req); }
  catch (e) { return res.status(401).json({ error: 'UNAUTHORISED' }); }

  var bookingId = req.query && req.query.booking_id;
  var action    = req.query && req.query.action;

  if (!bookingId) return res.status(400).json({ error: 'MISSING_BOOKING_ID' });

  var booking = BookingStore.findById(bookingId);
  if (!booking)                       return res.status(404).json({ error: 'NOT_FOUND' });
  if (booking.user_id !== claims.sub) return res.status(403).json({ error: 'FORBIDDEN' });

  /* ── GET: single booking ──────────────────────────────────────────────── */
  if (req.method === 'GET' && !action) {
    return res.status(200).json({ booking });
  }

  /* ── PATCH /cancel ────────────────────────────────────────────────────── */
  if (req.method === 'PATCH' && action === 'cancel') {
    var cancelled;
    try { cancelled = BookingStore.cancel(bookingId); }
    catch (e) {
      if (e.message === 'ALREADY_CANCELLED') return res.status(409).json({ error: 'ALREADY_CANCELLED' });
      return res.status(500).json({ error: 'CANCEL_FAILED' });
    }
    return res.status(200).json({ booking: cancelled });
  }

  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
};
