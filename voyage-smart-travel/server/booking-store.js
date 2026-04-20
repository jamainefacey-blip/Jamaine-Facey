/**
 * VST Booking Store — in-memory (Phase 3.4)
 *
 * NOT a production database. Resets on server restart.
 * Replace with Supabase adapter before any live deployment.
 *
 * Status lifecycle: PENDING → CONFIRMED → CANCELLED
 */
'use strict';

const crypto = require('crypto');

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function confirmationRef() {
  return 'VST-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

/* ── In-memory indices ───────────────────────────────────────────────────── */
const _byId     = new Map(); /* booking_id → booking */
const _byUserId = new Map(); /* user_id    → Set<booking_id> */

/* ── Public API ─────────────────────────────────────────────────────────── */
const BookingStore = {

  create(fields) {
    /* fields: user_id, tier, origin, destination, departure_date, return_date?,
               carrier?, flight_number?, price, currency,
               co2_kg?, co2_per_person_kg?, eco_grade?, distance_km? */
    var now = new Date().toISOString();
    var booking = {
      booking_id:         uuid(),
      user_id:            fields.user_id,
      tier:               fields.tier               || 'GUEST',
      origin:             fields.origin             || null,
      destination:        fields.destination,
      departure_date:     fields.departure_date,
      return_date:        fields.return_date        || null,
      carrier:            fields.carrier            || null,
      flight_number:      fields.flight_number      || null,
      price:              typeof fields.price === 'number' ? fields.price : parseFloat(fields.price) || 0,
      currency:           fields.currency           || 'GBP',
      status:             'CONFIRMED',
      confirmation_ref:   confirmationRef(),
      co2_kg:             fields.co2_kg             || null,
      co2_per_person_kg:  fields.co2_per_person_kg  || null,
      eco_grade:          fields.eco_grade          || null,
      distance_km:        fields.distance_km        || null,
      created_at:         now,
      updated_at:         now,
    };
    _byId.set(booking.booking_id, booking);
    if (!_byUserId.has(fields.user_id)) _byUserId.set(fields.user_id, new Set());
    _byUserId.get(fields.user_id).add(booking.booking_id);
    return booking;
  },

  findById(booking_id) {
    return _byId.get(booking_id) || null;
  },

  findByUserId(user_id) {
    var ids = _byUserId.get(user_id);
    if (!ids) return [];
    return Array.from(ids)
      .map(function (id) { return _byId.get(id); })
      .filter(Boolean)
      .sort(function (a, b) { return b.created_at.localeCompare(a.created_at); });
  },

  cancel(booking_id) {
    var booking = _byId.get(booking_id);
    if (!booking) throw new Error('NOT_FOUND');
    if (booking.status === 'CANCELLED') throw new Error('ALREADY_CANCELLED');
    booking.status     = 'CANCELLED';
    booking.updated_at = new Date().toISOString();
    return booking;
  },
};

/* ── Seed demo bookings ─────────────────────────────────────────────────── */
/* Deferred until next tick so user-store seeding completes first */
setImmediate(function _seedDemoBookings() {
  try {
    var UserStore = require('./user-store').UserStore;
    var demo      = UserStore.findByEmail('demo@voyage.test');
    var elite     = UserStore.findByEmail('elite@voyage.test');

    if (demo) {
      /* eco values precomputed: LHR→NRT 9497km×0.133=1263kg E, LHR→DXB 5492km×0.133=730kg E, LHR→CDG 340km×0.133=45kg A */
      [
        { origin:'LHR', destination:'Tokyo (NRT)',  departure_date:'2025-12-10', return_date:'2025-12-22', carrier:'British Airways', flight_number:'BA006', price:1240, currency:'GBP', status_override:'CONFIRMED', co2_kg:1263, co2_per_person_kg:1263, eco_grade:'E', distance_km:9497 },
        { origin:'LHR', destination:'Dubai (DXB)',  departure_date:'2026-02-14', return_date:'2026-02-21', carrier:'Emirates',        flight_number:'EK004', price:680,  currency:'GBP', status_override:'CONFIRMED', co2_kg:730,  co2_per_person_kg:730,  eco_grade:'E', distance_km:5492 },
        { origin:'LHR', destination:'Paris (CDG)',  departure_date:'2026-03-22', return_date:'2026-03-24', carrier:'British Airways', flight_number:'BA304', price:195,  currency:'GBP', status_override:'CANCELLED', co2_kg:45,   co2_per_person_kg:45,   eco_grade:'A', distance_km:340  },
      ].forEach(function (b) {
        var bk = BookingStore.create(Object.assign({ user_id: demo.id, tier: demo.tier }, b));
        if (b.status_override) { bk.status = b.status_override; bk.updated_at = bk.created_at; }
      });
    }

    if (elite) {
      /* eco values precomputed — business class (×0.320):
         JFK→LHR 5555km×0.320=1778kg E, LHR→SIN 10838km×0.320=3468kg E,
         SIN→SYD 6308km×0.320=2019kg E, JFK→NRT 10833km×0.532=5763kg E (first),
         LHR→CPT 9676km×0.320=3096kg E */
      [
        { origin:'JFK', destination:'London (LHR)',    departure_date:'2026-01-08', return_date:'2026-01-15', carrier:'British Airways', flight_number:'BA112', price:3200, currency:'GBP', status_override:'CONFIRMED', co2_kg:1778, co2_per_person_kg:1778, eco_grade:'E', distance_km:5555 },
        { origin:'LHR', destination:'Singapore (SIN)', departure_date:'2026-02-20', return_date:'2026-03-06', carrier:'Singapore Air',   flight_number:'SQ322', price:2850, currency:'GBP', status_override:'CONFIRMED', co2_kg:3468, co2_per_person_kg:3468, eco_grade:'E', distance_km:10838 },
        { origin:'SIN', destination:'Sydney (SYD)',    departure_date:'2026-03-06', return_date:'2026-03-20', carrier:'Singapore Air',   flight_number:'SQ221', price:1900, currency:'GBP', status_override:'CONFIRMED', co2_kg:2019, co2_per_person_kg:2019, eco_grade:'E', distance_km:6308 },
        { origin:'JFK', destination:'Tokyo (NRT)',     departure_date:'2026-04-10', return_date:'2026-04-24', carrier:'Japan Airlines',  flight_number:'JL005', price:4100, currency:'GBP', status_override:'CONFIRMED', co2_kg:5763, co2_per_person_kg:5763, eco_grade:'E', distance_km:10833 },
        { origin:'LHR', destination:'Cape Town (CPT)', departure_date:'2026-05-18', return_date:'2026-06-02', carrier:'British Airways', flight_number:'BA057', price:1750, currency:'GBP', status_override:'PENDING',   co2_kg:3096, co2_per_person_kg:3096, eco_grade:'E', distance_km:9676 },
      ].forEach(function (b) {
        var bk = BookingStore.create(Object.assign({ user_id: elite.id, tier: elite.tier }, b));
        if (b.status_override) { bk.status = b.status_override; bk.updated_at = bk.created_at; }
      });
    }
  } catch (e) { /* silently skip — user-store may not be loaded in Vercel context */ }
});

module.exports = { BookingStore };
