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
               carrier?, flight_number?, price, currency */
    var now = new Date().toISOString();
    var booking = {
      booking_id:       uuid(),
      user_id:          fields.user_id,
      tier:             fields.tier             || 'GUEST',
      origin:           fields.origin           || null,
      destination:      fields.destination,
      departure_date:   fields.departure_date,
      return_date:      fields.return_date      || null,
      carrier:          fields.carrier          || null,
      flight_number:    fields.flight_number    || null,
      price:            typeof fields.price === 'number' ? fields.price : parseFloat(fields.price) || 0,
      currency:         fields.currency         || 'GBP',
      status:           'CONFIRMED',
      confirmation_ref: confirmationRef(),
      created_at:       now,
      updated_at:       now,
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
      [
        { origin: 'LHR', destination: 'Tokyo (NRT)', departure_date: '2025-12-10', return_date: '2025-12-22', carrier: 'British Airways', flight_number: 'BA006', price: 1240, currency: 'GBP', status_override: 'CONFIRMED' },
        { origin: 'LHR', destination: 'Dubai (DXB)',  departure_date: '2026-02-14', return_date: '2026-02-21', carrier: 'Emirates',        flight_number: 'EK004', price: 680,  currency: 'GBP', status_override: 'CONFIRMED' },
        { origin: 'LHR', destination: 'Paris (CDG)',  departure_date: '2026-03-22', return_date: '2026-03-24', carrier: 'British Airways', flight_number: 'BA304', price: 195,  currency: 'GBP', status_override: 'CANCELLED' },
      ].forEach(function (b) {
        var bk = BookingStore.create(Object.assign({ user_id: demo.id, tier: demo.tier }, b));
        if (b.status_override) { bk.status = b.status_override; bk.updated_at = bk.created_at; }
      });
    }

    if (elite) {
      [
        { origin: 'JFK', destination: 'London (LHR)',    departure_date: '2026-01-08', return_date: '2026-01-15', carrier: 'British Airways', flight_number: 'BA112', price: 3200,  currency: 'GBP', status_override: 'CONFIRMED' },
        { origin: 'LHR', destination: 'Singapore (SIN)', departure_date: '2026-02-20', return_date: '2026-03-06', carrier: 'Singapore Air',   flight_number: 'SQ322', price: 2850,  currency: 'GBP', status_override: 'CONFIRMED' },
        { origin: 'SIN', destination: 'Sydney (SYD)',    departure_date: '2026-03-06', return_date: '2026-03-20', carrier: 'Singapore Air',   flight_number: 'SQ221', price: 1900,  currency: 'GBP', status_override: 'CONFIRMED' },
        { origin: 'JFK', destination: 'Tokyo (NRT)',     departure_date: '2026-04-10', return_date: '2026-04-24', carrier: 'Japan Airlines',  flight_number: 'JL005', price: 4100,  currency: 'GBP', status_override: 'CONFIRMED' },
        { origin: 'LHR', destination: 'Cape Town (CPT)', departure_date: '2026-05-18', return_date: '2026-06-02', carrier: 'British Airways', flight_number: 'BA057', price: 1750,  currency: 'GBP', status_override: 'PENDING'   },
      ].forEach(function (b) {
        var bk = BookingStore.create(Object.assign({ user_id: elite.id, tier: elite.tier }, b));
        if (b.status_override) { bk.status = b.status_override; bk.updated_at = bk.created_at; }
      });
    }
  } catch (e) { /* silently skip — user-store may not be loaded in Vercel context */ }
});

module.exports = { BookingStore };
