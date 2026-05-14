/* ─────────────────────────────────────────────────────────────────────────────
   VST — Bookings Module (window.VSTBookings)
   Handles flight / hotel / experience search UI, API calls, and result rendering.
   ───────────────────────────────────────────────────────────────────────────── */

window.VSTBookings = (function () {
  'use strict';

  /* ── State ────────────────────────────────────────────────────────────────── */
  var activeTab   = 'flights';
  var isLoading   = false;
  var lastResults = { flights: null, hotels: null };

  /* ── DOM refs (populated on init) ─────────────────────────────────────────── */
  var els = {};

  /* ── Helpers ──────────────────────────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return (root || document).querySelectorAll(sel); }

  function formatDate(d) {
    if (!d) return '';
    var dt = new Date(d);
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function ecoGradeClass(grade) {
    if (!grade) return '';
    var g = grade.toUpperCase();
    if (g === 'A') return 'eco-a';
    if (g === 'B') return 'eco-b';
    if (g === 'C') return 'eco-c';
    return 'eco-d';
  }

  function starsHTML(count) {
    var out = '';
    for (var i = 0; i < 5; i++) {
      out += i < count
        ? '<svg class="star-icon filled" viewBox="0 0 20 20"><path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.33L10 13.27l-4.77 2.51.91-5.33L2.27 6.68l5.34-.78z"/></svg>'
        : '<svg class="star-icon" viewBox="0 0 20 20"><path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.33L10 13.27l-4.77 2.51.91-5.33L2.27 6.68l5.34-.78z"/></svg>';
    }
    return out;
  }

  /* ── Auth guard ───────────────────────────────────────────────────────────── */
  function checkAuth() {
    if (typeof VSTAuth !== 'undefined' && VSTAuth.isLoggedIn && VSTAuth.isLoggedIn()) {
      return true;
    }
    /* Also check sessionStorage directly as fallback */
    try {
      if (sessionStorage.getItem('vst_auth_token')) return true;
    } catch (e) {}
    return false;
  }

  /* ── Tab switching ────────────────────────────────────────────────────────── */
  function switchTab(tab) {
    activeTab = tab;
    qsa('.booking-tab').forEach(function (el) {
      el.classList.toggle('active', el.dataset.tab === tab);
    });
    qsa('.booking-panel').forEach(function (el) {
      el.classList.toggle('active', el.dataset.panel === tab);
    });
    /* Clear results when switching */
    var rc = $('booking-results');
    if (rc) rc.innerHTML = '';
  }

  /* ── Skeleton loading ─────────────────────────────────────────────────────── */
  function showSkeletons(count) {
    var rc = $('booking-results');
    if (!rc) return;
    var html = '';
    for (var i = 0; i < (count || 5); i++) {
      html += '<div class="result-card skeleton"><div class="skel-line skel-title"></div><div class="skel-line skel-sub"></div><div class="skel-line skel-price"></div></div>';
    }
    rc.innerHTML = html;
  }

  function clearResults() {
    var rc = $('booking-results');
    if (rc) rc.innerHTML = '';
  }

  /* ── Form validation ──────────────────────────────────────────────────────── */
  function validateFlightForm() {
    var origin = $('fl-origin');
    var dest   = $('fl-destination');
    var depart = $('fl-depart');
    var errors = [];

    if (!origin || !origin.value.trim()) errors.push('Origin is required');
    if (!dest || !dest.value.trim()) errors.push('Destination is required');
    if (!depart || !depart.value) errors.push('Departure date is required');
    if (origin && dest && origin.value.trim().toUpperCase() === dest.value.trim().toUpperCase()) {
      errors.push('Origin and destination must be different');
    }
    if (depart && depart.value && new Date(depart.value) < new Date(new Date().toDateString())) {
      errors.push('Departure date cannot be in the past');
    }

    return errors;
  }

  function validateHotelForm() {
    var dest    = $('ht-destination');
    var checkIn = $('ht-checkin');
    var errors  = [];

    if (!dest || !dest.value.trim()) errors.push('Destination is required');
    if (!checkIn || !checkIn.value) errors.push('Check-in date is required');
    if (checkIn && checkIn.value && new Date(checkIn.value) < new Date(new Date().toDateString())) {
      errors.push('Check-in date cannot be in the past');
    }

    return errors;
  }

  function showErrors(errors) {
    var rc = $('booking-results');
    if (!rc) return;
    rc.innerHTML = '<div class="booking-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><div>' + errors.map(function(e) { return '<p>' + e + '</p>'; }).join('') + '</div></div>';
  }

  /* ── API calls ────────────────────────────────────────────────────────────── */
  function searchFlights() {
    var errors = validateFlightForm();
    if (errors.length) { showErrors(errors); return; }

    var body = {
      origin:      $('fl-origin').value.trim().toUpperCase(),
      destination: $('fl-destination').value.trim().toUpperCase(),
      departDate:  $('fl-depart').value,
      returnDate:  $('fl-return') ? $('fl-return').value : null,
      passengers:  parseInt($('fl-passengers') ? $('fl-passengers').value : '1', 10),
      cabinClass:  $('fl-cabin') ? $('fl-cabin').value : 'economy'
    };

    isLoading = true;
    showSkeletons(6);

    fetch('/api/flights-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      isLoading = false;
      lastResults.flights = data;
      renderFlightResults(data, body);
    })
    .catch(function (err) {
      isLoading = false;
      showErrors(['Search failed — please try again. ' + (err.message || '')]);
    });
  }

  function searchHotels() {
    var errors = validateHotelForm();
    if (errors.length) { showErrors(errors); return; }

    var body = {
      destination: $('ht-destination').value.trim(),
      checkIn:     $('ht-checkin').value,
      checkOut:    $('ht-checkout') ? $('ht-checkout').value : null,
      guests:      parseInt($('ht-guests') ? $('ht-guests').value : '2', 10),
      rooms:       parseInt($('ht-rooms') ? $('ht-rooms').value : '1', 10)
    };

    isLoading = true;
    showSkeletons(6);

    fetch('/api/hotels-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      isLoading = false;
      lastResults.hotels = data;
      renderHotelResults(data, body);
    })
    .catch(function (err) {
      isLoading = false;
      showErrors(['Search failed — please try again. ' + (err.message || '')]);
    });
  }

  /* ── Render: Flights ──────────────────────────────────────────────────────── */
  function renderFlightResults(data, params) {
    var rc = $('booking-results');
    if (!rc) return;

    if (!data.flights || !data.flights.length) {
      rc.innerHTML = '<div class="no-results"><p>No flights found for this route. Try different dates or airports.</p></div>';
      return;
    }

    var header = '<div class="results-header"><h3 class="results-title">' + data.total + ' flights found</h3><p class="results-sub">' + params.origin + ' → ' + params.destination + ' · ' + formatDate(params.departDate) + '</p></div>';

    var cards = data.flights.map(function (fl) {
      var stopsLabel = fl.stops === 0 ? 'Direct' : fl.stops + ' stop' + (fl.stops > 1 ? 's' : '');
      var seatsClass = fl.seatsLeft <= 3 ? 'seats-low' : '';

      return '<article class="result-card flight-card">' +
        '<div class="rc-top">' +
          '<div class="rc-airline">' +
            '<span class="rc-airline-code">' + fl.airlineCode + '</span>' +
            '<span class="rc-airline-name">' + fl.airline + '</span>' +
          '</div>' +
          '<div class="rc-eco-badge ' + ecoGradeClass(fl.ecoRating) + '">' +
            '<svg viewBox="0 0 20 20" class="eco-leaf"><path d="M17 3c-3 0-6 1-8 4-1.5 2.2-2 5-2 8 0 0 3-1 5-3s3-5 3-5c1-2 2-4 2-4z" fill="currentColor"/></svg>' +
            '<span>' + fl.ecoRating + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="rc-route">' +
          '<div class="rc-time-block">' +
            '<span class="rc-time">' + fl.departTime + '</span>' +
            '<span class="rc-code">' + fl.origin + '</span>' +
          '</div>' +
          '<div class="rc-duration">' +
            '<span class="rc-dur-label">' + fl.duration + '</span>' +
            '<div class="rc-dur-line"><div class="rc-dur-dot"></div>' + (fl.stops > 0 ? '<div class="rc-dur-stop"></div>' : '') + '<div class="rc-dur-dot"></div></div>' +
            '<span class="rc-stops-label">' + stopsLabel + '</span>' +
          '</div>' +
          '<div class="rc-time-block">' +
            '<span class="rc-time">' + fl.arriveTime + '</span>' +
            '<span class="rc-code">' + fl.destination + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="rc-bottom">' +
          '<div class="rc-meta">' +
            '<span class="rc-co2">' + fl.co2Kg + ' kg CO₂</span>' +
            '<span class="rc-seats ' + seatsClass + '">' + fl.seatsLeft + ' seat' + (fl.seatsLeft > 1 ? 's' : '') + ' left</span>' +
          '</div>' +
          '<div class="rc-price-block">' +
            '<span class="rc-price">£' + fl.price.toLocaleString() + '</span>' +
            '<span class="rc-cabin">' + (fl.cabinClass || 'economy').replace('_', ' ') + '</span>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');

    rc.innerHTML = header + '<div class="results-grid">' + cards + '</div>';
  }

  /* ── Render: Hotels ───────────────────────────────────────────────────────── */
  function renderHotelResults(data, params) {
    var rc = $('booking-results');
    if (!rc) return;

    if (!data.hotels || !data.hotels.length) {
      rc.innerHTML = '<div class="no-results"><p>No hotels found in ' + params.destination + '. Try a different destination.</p></div>';
      return;
    }

    var header = '<div class="results-header"><h3 class="results-title">' + data.total + ' hotels in ' + params.destination + '</h3><p class="results-sub">' + formatDate(params.checkIn) + (params.checkOut ? ' — ' + formatDate(params.checkOut) : '') + ' · ' + params.guests + ' guest' + (params.guests > 1 ? 's' : '') + '</p></div>';

    var cards = data.hotels.map(function (ht) {
      var amenList = (ht.amenities || []).slice(0, 5).map(function (a) { return '<span class="ht-amen">' + a + '</span>'; }).join('');
      var ecoLabel = ht.ecoCertification ? '<span class="ht-eco-cert">' + ht.ecoCertification + '</span>' : '';

      return '<article class="result-card hotel-card">' +
        '<div class="rc-top">' +
          '<div class="rc-hotel-info">' +
            '<h4 class="rc-hotel-name">' + ht.name + '</h4>' +
            '<div class="rc-stars">' + starsHTML(ht.stars) + '</div>' +
          '</div>' +
          '<div class="rc-eco-badge ' + ecoGradeClass(ht.ecoRating) + '">' +
            '<svg viewBox="0 0 20 20" class="eco-leaf"><path d="M17 3c-3 0-6 1-8 4-1.5 2.2-2 5-2 8 0 0 3-1 5-3s3-5 3-5c1-2 2-4 2-4z" fill="currentColor"/></svg>' +
            '<span>' + ht.ecoRating + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="rc-hotel-details">' +
          '<div class="rc-rating">' +
            '<span class="rc-rating-score">' + ht.rating + '</span>' +
            '<span class="rc-rating-count">' + ht.reviewCount.toLocaleString() + ' reviews</span>' +
          '</div>' +
          '<span class="rc-distance">' + ht.distanceToCentre + ' from centre</span>' +
        '</div>' +
        '<div class="rc-amenities">' + amenList + ecoLabel + '</div>' +
        (ht.accessibilityFeatures && ht.accessibilityFeatures.length
          ? '<div class="rc-access"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="4" r="2"/><path d="M12 6v6m-4 2l4-2 4 2m-4 0v4"/></svg><span>' + ht.accessibilityFeatures.join(', ') + '</span></div>'
          : '') +
        '<div class="rc-bottom">' +
          '<div class="rc-meta"></div>' +
          '<div class="rc-price-block">' +
            '<span class="rc-price">£' + ht.pricePerNight + '</span>' +
            '<span class="rc-cabin">per night</span>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');

    rc.innerHTML = header + '<div class="results-grid">' + cards + '</div>';
  }

  /* ── Event binding ────────────────────────────────────────────────────────── */
  function bindEvents() {
    /* Tab clicks */
    qsa('.booking-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(this.dataset.tab);
      });
    });

    /* Flight search */
    var flForm = $('flight-search-form');
    if (flForm) {
      flForm.addEventListener('submit', function (e) {
        e.preventDefault();
        searchFlights();
      });
    }

    /* Hotel search */
    var htForm = $('hotel-search-form');
    if (htForm) {
      htForm.addEventListener('submit', function (e) {
        e.preventDefault();
        searchHotels();
      });
    }

    /* Set min date on date inputs */
    var today = new Date().toISOString().split('T')[0];
    qsa('input[type="date"]').forEach(function (inp) {
      inp.setAttribute('min', today);
    });
  }

  /* ── Init ──────────────────────────────────────────────────────────────────── */
  function init() {
    /* Auth guard — redirect if not logged in */
    if (!checkAuth()) {
      var loginUrl = '/planner'; /* planner has auth flow */
      window.location.href = loginUrl;
      return;
    }
    bindEvents();
    switchTab('flights');
  }

  /* Run on DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Public API ───────────────────────────────────────────────────────────── */
  return {
    init: init,
    switchTab: switchTab,
    searchFlights: searchFlights,
    searchHotels: searchHotels,
    getLastResults: function () { return lastResults; }
  };
})();
