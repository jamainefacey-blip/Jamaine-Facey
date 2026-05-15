/**
 * VST Booking Handlers — Phase 3.4
 *
 * POST   /v1/bookings               — create booking
 * GET    /v1/bookings               — list user bookings
 * GET    /v1/bookings/:booking_id   — single booking
 * PATCH  /v1/bookings/:booking_id/cancel — cancel booking
 *
 * All routes require Bearer JWT. Booking ownership enforced on single/cancel.
 * BOOKING_CONFIRMED notification is dispatched non-blocking on create.
 */
'use strict';

const { BookingStore } = require('./booking-store');
const { jwt, UserStore } = require('./user-store');
const { dispatch }    = require('./notification-service');
const eco             = require('./eco-engine');

/* ── Tiny helpers ────────────────────────────────────────────────────────── */
function readBody(req) {
  return new Promise(function (resolve, reject) {
    var chunks = [];
    req.on('data', function (c) { chunks.push(c); });
    req.on('end',  function ()  { resolve(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', reject);
  });
}

function json(res, status, body) {
  var payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(payload);
}

function authUser(req) {
  /* Returns JWT claims or throws */
  return jwt.fromHeader(req.headers['authorization'] || '');
}

/* ── POST /v1/bookings ───────────────────────────────────────────────────── */
async function handleCreateBooking(req, res) {
  var claims;
  try { claims = authUser(req); }
  catch (e) { return json(res, 401, { error: 'UNAUTHORISED' }); }

  var body;
  try { body = JSON.parse(await readBody(req)); }
  catch (e) { return json(res, 400, { error: 'INVALID_BODY' }); }

  /* Required fields */
  if (!body.destination)    return json(res, 400, { error: 'MISSING_FIELD', field: 'destination' });
  if (!body.departure_date) return json(res, 400, { error: 'MISSING_FIELD', field: 'departure_date' });
  if (body.price === undefined || body.price === null) return json(res, 400, { error: 'MISSING_FIELD', field: 'price' });

  /* Resolve tier from user profile */
  var user = UserStore.findById(claims.sub);
  var tier = (user && user.tier) || claims.tier || 'GUEST';

  /* Compute eco metrics from origin/destination IATA codes */
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
    price:             body.price,
    currency:          body.currency          || 'GBP',
    co2_kg:            ecoResult && !ecoResult.error ? ecoResult.co2_kg            : null,
    co2_per_person_kg: ecoResult && !ecoResult.error ? ecoResult.co2_per_person_kg : null,
    eco_grade:         ecoResult && !ecoResult.error ? ecoResult.eco_grade         : null,
    distance_km:       ecoResult && !ecoResult.error ? ecoResult.distance_km       : null,
  });

  /* Fire BOOKING_CONFIRMED notification — non-blocking */
  var phone  = user && user.identity && user.identity.phone;
  var playerId = user && user.onesignal_player_id;
  dispatch({
    event_id:    booking.booking_id,
    event_type:  'BOOKING_CONFIRMED',
    priority:    'P2_NORMAL',
    recipient:   { user_id: claims.sub, tier, phone: phone || undefined, onesignal_player_id: playerId || undefined },
    payload: {
      title:    'Booking Confirmed — ' + booking.destination,
      body:     'Your trip to ' + booking.destination + ' on ' + booking.departure_date + ' is confirmed. Ref: ' + booking.confirmation_ref,
      sms_body: 'VST: Trip to ' + booking.destination + ' confirmed. Ref ' + booking.confirmation_ref,
      deep_link: '#dashboard',
      data: { booking_id: booking.booking_id, confirmation_ref: booking.confirmation_ref },
    },
    created_at: booking.created_at,
    source_service: 'booking',
  }).catch(function () { /* notification failure must not affect booking response */ });

  return json(res, 201, { booking });
}

/* ── GET /v1/bookings ────────────────────────────────────────────────────── */
async function handleGetBookings(req, res) {
  var claims;
  try { claims = authUser(req); }
  catch (e) { return json(res, 401, { error: 'UNAUTHORISED' }); }

  var bookings = BookingStore.findByUserId(claims.sub);
  return json(res, 200, { bookings, count: bookings.length });
}

/* ── GET /v1/bookings/:booking_id ────────────────────────────────────────── */
async function handleGetBooking(req, res, bookingId) {
  var claims;
  try { claims = authUser(req); }
  catch (e) { return json(res, 401, { error: 'UNAUTHORISED' }); }

  var booking = BookingStore.findById(bookingId);
  if (!booking)                   return json(res, 404, { error: 'NOT_FOUND' });
  if (booking.user_id !== claims.sub) return json(res, 403, { error: 'FORBIDDEN' });

  return json(res, 200, { booking });
}

/* ── PATCH /v1/bookings/:booking_id/cancel ───────────────────────────────── */
async function handleCancelBooking(req, res, bookingId) {
  var claims;
  try { claims = authUser(req); }
  catch (e) { return json(res, 401, { error: 'UNAUTHORISED' }); }

  var booking = BookingStore.findById(bookingId);
  if (!booking)                       return json(res, 404, { error: 'NOT_FOUND' });
  if (booking.user_id !== claims.sub) return json(res, 403, { error: 'FORBIDDEN' });

  var cancelled;
  try { cancelled = BookingStore.cancel(bookingId); }
  catch (e) {
    if (e.message === 'ALREADY_CANCELLED') return json(res, 409, { error: 'ALREADY_CANCELLED' });
    throw e;
  }

  return json(res, 200, { booking: cancelled });
}

module.exports = { handleCreateBooking, handleGetBookings, handleGetBooking, handleCancelBooking };
