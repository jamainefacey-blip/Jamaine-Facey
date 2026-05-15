/* ─────────────────────────────────────────────────────────────────────────────
   VST — Trip Store
   localStorage-backed trip persistence. No server required.
   ───────────────────────────────────────────────────────────────────────────── */

window.VSTTrips = (function () {
  'use strict';

  var STORAGE_KEY = 'vst_trips_v1';

  var STATUSES = ['requested', 'under_review', 'approved', 'escalated', 'in_journey', 'completed'];

  /* ── Read ──────────────────────────────────────────────────────────────── */
  function getAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function getById(id) {
    var trips = getAll();
    for (var i = 0; i < trips.length; i++) {
      if (trips[i].id === id) return trips[i];
    }
    return null;
  }

  /* ── Write ─────────────────────────────────────────────────────────────── */
  function saveAll(trips) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
    } catch (_) {
      console.warn('[VSTTrips] localStorage write failed.');
    }
  }

  function create(tripData) {
    var trips = getAll();
    var now   = new Date().toISOString();
    var trip  = Object.assign({}, tripData, {
      id:        'trip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      createdAt: now,
      updatedAt: now,
    });
    trips.unshift(trip);
    saveAll(trips);
    return trip;
  }

  function updateStatus(id, status) {
    if (STATUSES.indexOf(status) === -1) return null;
    var trips = getAll();
    for (var i = 0; i < trips.length; i++) {
      if (trips[i].id === id) {
        trips[i].status    = status;
        trips[i].updatedAt = new Date().toISOString();
        saveAll(trips);
        return trips[i];
      }
    }
    return null;
  }

  function remove(id) {
    var trips   = getAll();
    var updated = trips.filter(function (t) { return t.id !== id; });
    saveAll(updated);
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /* ── Summaries ─────────────────────────────────────────────────────────── */
  function getSummary() {
    var trips = getAll();
    var out   = { total: trips.length, approved: 0, under_review: 0, escalated: 0, in_journey: 0, completed: 0, requested: 0 };
    for (var i = 0; i < trips.length; i++) {
      var s = trips[i].status;
      if (out.hasOwnProperty(s)) out[s]++;
    }
    return out;
  }

  /* ── Public ────────────────────────────────────────────────────────────── */
  return {
    getAll:       getAll,
    getById:      getById,
    create:       create,
    updateStatus: updateStatus,
    remove:       remove,
    clear:        clear,
    getSummary:   getSummary,
    STATUSES:     STATUSES,
  };

})();
