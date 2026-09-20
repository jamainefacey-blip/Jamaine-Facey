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
      origin:          $('fl-origin').value.trim().toUpperCase(),
      destination:     $('fl-destination').value.trim().toUpperCase(),
      departureDate:   $('fl-depart').value,
      returnDate:      $('fl-return') ? $('fl-return').value : null,
      tripType:        $('fl-return') && $('fl-return').value ? 'return' : 'one_way',
      travellerCount:  parseInt($('fl-passengers') ? $('fl-passengers').value : '1', 10),
      currency:        'GBP'
    };

    isLoading = true;
    showSkeletons(6);

    // Use the existing real Amadeus-backed FareRouter. The legacy
    // /api/flights-search endpoint produces random mock inventory and must not
    // be presented to customers as live availability.
    fetch('/api/fares/search', {
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
      showErrors(['Live fare search is temporarily unavailable. ' + (err.message || '')]);
    });
  }

  function searchHotels() {
    // The existing /api/hotels-search endpoint is mock-generated inventory.
    // Never present synthetic hotel names, ratings or prices as live stock.
    lastResults.hotels = null;
    var rc = $('booking-results');
    if (!rc) return;
    rc.innerHTML =
      '<div class="no-results">' +
        '<h3>Live hotel comparison is being connected.</h3>' +
        '<p>We are not showing invented hotel prices or availability. Use AVA Planner to shape the trip while the verified supplier feed is completed.</p>' +
        '<p><a class="trip-book" href="/planner">Continue in AVA Planner →</a></p>' +
      '</div>';
  }

  /* ── Render: Flights ──────────────────────────────────────────────────────── */
  function renderFlightResults(data, params) {
    var rc = $('booking-results');
    if (!rc) return;

    var offers = Array.isArray(data.offers) ? data.offers : [];
    if (data.error) {
      rc.innerHTML = '<div class="no-results"><p>' + data.error + '</p></div>';
      return;
    }
    if (!offers.length) {
      rc.innerHTML = '<div class="no-results"><p>No live fares were returned for this route. Try different dates or airports.</p></div>';
      return;
    }

    var providerLabel = data.provider === 'amadeus' ? 'Live fare data via Amadeus' : 'Fare results';
    var header =
      '<div class="results-header">' +
        '<h3 class="results-title">' + offers.length + ' live fare option' + (offers.length === 1 ? '' : 's') + '</h3>' +
        '<p class="results-sub">' + params.origin + ' → ' + params.destination + ' · ' +
          formatDate(params.departureDate) + ' · ' + providerLabel +
          ' · prices can change until supplier checkout</p>' +
      '</div>';

    function timeFromIso(value) {
      if (!value) return '—';
      var d = new Date(value);
      return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    function durationLabel(minutes) {
      minutes = Number(minutes || 0);
      if (!minutes) return '—';
      return Math.floor(minutes / 60) + 'h ' + (minutes % 60) + 'm';
    }

    var cards = offers.map(function (offer) {
      var itinerary = offer.itineraries && offer.itineraries[0] ? offer.itineraries[0] : {};
      var segments = itinerary.segments || [];
      var first = segments[0] || {};
      var last = segments[segments.length - 1] || first;
      var stops = typeof itinerary.stops === 'number' ? itinerary.stops : Math.max(0, segments.length - 1);
      var stopsLabel = stops === 0 ? 'Direct' : stops + ' stop' + (stops > 1 ? 's' : '');
      var carrier = first.carrier || 'Airline';
      var price = offer.price && Number(offer.price.total);
      var currency = offer.price && offer.price.currency ? offer.price.currency : 'GBP';
      var priceText = Number.isFinite(price)
        ? (currency === 'GBP' ? '£' : currency + ' ') + price.toLocaleString('en-GB', { maximumFractionDigits: 2 })
        : 'Price unavailable';
      var planQuery = encodeURIComponent(
        'Help me assess this live fare: ' + params.origin + ' to ' + params.destination +
        ' on ' + params.departureDate + ', ' + carrier + ', ' + priceText +
        ', ' + stopsLabel + '. Compare suitability, accessibility and total trip impact before I book.'
      );

      return '<article class="result-card flight-card">' +
        '<div class="rc-top">' +
          '<div class="rc-airline">' +
            '<span class="rc-airline-code">' + carrier + '</span>' +
            '<span class="rc-airline-name">Live supplier fare</span>' +
          '</div>' +
          '<div class="rc-eco-badge">' +
            '<span>' + (offer.carbon_estimate_kg == null ? 'CO₂ pending' : offer.carbon_estimate_kg + ' kg CO₂') + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="rc-route">' +
          '<div class="rc-time-block">' +
            '<span class="rc-time">' + timeFromIso(first.departure_at) + '</span>' +
            '<span class="rc-code">' + (first.origin || params.origin) + '</span>' +
          '</div>' +
          '<div class="rc-duration">' +
            '<span class="rc-dur-label">' + durationLabel(itinerary.duration_minutes) + '</span>' +
            '<div class="rc-dur-line"><div class="rc-dur-dot"></div>' +
              (stops > 0 ? '<div class="rc-dur-stop"></div>' : '') +
              '<div class="rc-dur-dot"></div></div>' +
            '<span class="rc-stops-label">' + stopsLabel + '</span>' +
          '</div>' +
          '<div class="rc-time-block">' +
            '<span class="rc-time">' + timeFromIso(last.arrival_at) + '</span>' +
            '<span class="rc-code">' + (last.destination || params.destination) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="rc-bottom">' +
          '<div class="rc-meta">' +
            '<span class="rc-co2">Offer ID ' + String(offer.offer_id || '').replace(/^amadeus_/, '') + '</span>' +
          '</div>' +
          '<div class="rc-price-block">' +
            '<span class="rc-price">' + priceText + '</span>' +
            '<span class="rc-cabin">live search result</span>' +
          '</div>' +
        '</div>' +
        '<div class="rc-bottom">' +
          '<div class="rc-meta"><span>Supplier checkout is not yet activated in VST.</span></div>' +
          '<a class="trip-book" href="/planner?q=' + planQuery + '">Plan this fare →</a>' +
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
    // Fare discovery is public. Authentication is required only when a
    // future customer action genuinely needs an account; do not block the
    // acquisition funnel before a traveller can see verified fare data.
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
