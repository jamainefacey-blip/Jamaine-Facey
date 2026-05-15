/**
 * VST Vercel Serverless — /v1/bookings
 *
 * POST /v1/bookings  — create booking (JWT required)
 * GET  /v1/bookings  — list user bookings (JWT required)
 */
'use strict';

const { BookingStore } = require('../server/booking-store');
const { jwt, UserStore } = require('../server/user-store');
const { dispatch }    = require('../server/notification-service');
const eco             = require('../server/eco-engine');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  /* ── GET: list bookings ───────────────────────────────────────────────── */
  if (req.method === 'GET') {
    var bookings = BookingStore.findByUserId(claims.sub);
    return res.status(200).json({ bookings, count: bookings.length });
  }

  /* ── POST: create booking ─────────────────────────────────────────────── */
  if (req.method === 'POST') {
    var body = req.body;
    if (!body || typeof body !== 'object') return res.status(400).json({ error: 'INVALID_BODY' });
    if (!body.destination)    return res.status(400).json({ error: 'MISSING_FIELD', field: 'destination' });
    if (!body.departure_date) return res.status(400).json({ error: 'MISSING_FIELD', field: 'departure_date' });
    if (body.price === undefined || body.price === null) return res.status(400).json({ error: 'MISSING_FIELD', field: 'price' });

    var user = UserStore.findById(claims.sub);
    var tier = (user && user.tier) || claims.tier || 'GUEST';

    var ecoResult = (body.origin && body.destination)
      ? eco.calculate(body.origin, body.destination, body.cabin_class || 'ECONOMY', body.passengers || 1)
      : null;

    var booking = BookingStore.create({
      user_id:           claims.sub,
      tier,
      origin:            body.origin            || null,
      destination:       body.destination,
      departure_date:    body.departure_date,
      return_date:       body.return_date       || null,
      carrier:           body.carrier           || null,
      flight_number:     body.flight_number     || null,
      co2_kg:            ecoResult && !ecoResult.error ? ecoResult.co2_kg            : null,
      co2_per_person_kg: ecoResult && !ecoResult.error ? ecoResult.co2_per_person_kg : null,
      eco_grade:         ecoResult && !ecoResult.error ? ecoResult.eco_grade         : null,
      distance_km:       ecoResult && !ecoResult.error ? ecoResult.distance_km       : null,
      price:          body.price,
      currency:       body.currency      || 'GBP',
    });

    /* BOOKING_CONFIRMED notification — non-blocking */
    var phone    = user && user.identity && user.identity.phone;
    var playerId = user && user.onesignal_player_id;
    dispatch({
      event_id:   booking.booking_id,
      event_type: 'BOOKING_CONFIRMED',
      priority:   'P2_NORMAL',
      recipient:  { user_id: claims.sub, tier, phone: phone || undefined, onesignal_player_id: playerId || undefined },
      payload: {
        title:    'Booking Confirmed — ' + booking.destination,
        body:     'Your trip to ' + booking.destination + ' on ' + booking.departure_date + ' is confirmed. Ref: ' + booking.confirmation_ref,
        sms_body: 'VST: Trip to ' + booking.destination + ' confirmed. Ref ' + booking.confirmation_ref,
        deep_link: '#dashboard',
        data: { booking_id: booking.booking_id, confirmation_ref: booking.confirmation_ref },
      },
      created_at:     booking.created_at,
      source_service: 'booking',
    }).catch(function () {});

    return res.status(201).json({ booking });
  }

  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
};
