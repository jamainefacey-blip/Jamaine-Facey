/* ═══════════════════════════════════════════════════════════════════
   VST Accessibility Intelligence — Core Module v1
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const DATA = window.VST_A11Y_DATA;
  const PREF_KEY = 'vst_a11y_prefs';

  /* ── Default preferences ──────────────────────────────────────── */
  const DEFAULT_PREFS = {
    profile: null,          // sensory profile id
    mobilityFilters: [],    // array of tag ids
    visionSupport: false,
    hearingSupport: false,
    medicalNeeds: [],       // array of need ids
    destination: '',
    sensoryMode: false,
    neurodivergentMode: false,
  };

  /* ── State ────────────────────────────────────────────────────── */
  let prefs = loadPrefs();
  let activeTab = 'hotels';

  /* ── Persistence ─────────────────────────────────────────────── */
  function loadPrefs() {
    try {
      const stored = localStorage.getItem(PREF_KEY);
      return stored ? Object.assign({}, DEFAULT_PREFS, JSON.parse(stored)) : Object.assign({}, DEFAULT_PREFS);
    } catch (_) { return Object.assign({}, DEFAULT_PREFS); }
  }

  function savePrefs() {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (_) {}
  }

  /* ── Bootstrap ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initProfileSelector();
    initTabs();
    initMobilityFilters();
    initSupportToggles();
    initMedicalSearch();
    initHotelSearch();
    initTransportList();
    applyProfileUI();
    renderHotels(DATA.hotels);
    renderTransport(DATA.transport);
    renderMedicalNeeds();

    // Restore saved destination search
    const destInput = document.getElementById('a11y-destination');
    if (destInput && prefs.destination) {
      destInput.value = prefs.destination;
      renderVenues(prefs.destination);
    }
  });

  /* ── Nav burger ──────────────────────────────────────────────── */
  function initNav() {
    const burger = document.getElementById('nav-burger');
    const mobile = document.getElementById('nav-mobile');
    const overlay = document.getElementById('sidebar-overlay');
    if (!burger) return;

    function openMenu() {
      mobile.classList.add('open');
      overlay.classList.add('active');
      burger.setAttribute('aria-expanded', 'true');
      mobile.setAttribute('aria-hidden', 'false');
    }
    function closeMenu() {
      mobile.classList.remove('open');
      overlay.classList.remove('active');
      burger.setAttribute('aria-expanded', 'false');
      mobile.setAttribute('aria-hidden', 'true');
    }
    burger.addEventListener('click', function () {
      mobile.classList.contains('open') ? closeMenu() : openMenu();
    });
    overlay.addEventListener('click', closeMenu);
  }

  /* ── Sensory profile selector ────────────────────────────────── */
  function initProfileSelector() {
    const cards = document.querySelectorAll('.a11y-profile-card');
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        const id = card.dataset.profile;
        if (prefs.profile === id) {
          prefs.profile = null;
          card.classList.remove('selected');
          prefs.sensoryMode = false;
          prefs.neurodivergentMode = false;
        } else {
          cards.forEach(function (c) { c.classList.remove('selected'); });
          card.classList.add('selected');
          prefs.profile = id;
          const profileData = DATA.sensoryProfiles.find(function (p) { return p.id === id; });
          if (profileData) {
            prefs.sensoryMode = profileData.uiChanges.reduceMotion;
            prefs.neurodivergentMode = profileData.uiChanges.simplifiedNav;
          }
        }
        savePrefs();
        applyProfileUI();
        renderHotels(filterHotels());
        showToast('Profile updated');
      });

      // Restore selection
      if (prefs.profile === card.dataset.profile) {
        card.classList.add('selected');
      }
    });
  }

  /* ── Tab navigation ──────────────────────────────────────────── */
  function initTabs() {
    const tabs = document.querySelectorAll('.a11y-tab');
    const panels = document.querySelectorAll('.a11y-panel');

    function switchTab(id) {
      activeTab = id;
      tabs.forEach(function (t) {
        t.classList.toggle('active', t.dataset.tab === id);
        t.setAttribute('aria-selected', t.dataset.tab === id ? 'true' : 'false');
      });
      panels.forEach(function (p) {
        p.classList.toggle('active', p.dataset.panel === id);
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { switchTab(tab.dataset.tab); });
      tab.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); switchTab(tab.dataset.tab); }
      });
    });
  }

  /* ── Mobility filter chips ───────────────────────────────────── */
  function initMobilityFilters() {
    const chips = document.querySelectorAll('.mobility-chip');
    chips.forEach(function (chip) {
      const tag = chip.dataset.tag;
      if (prefs.mobilityFilters.includes(tag)) chip.classList.add('active');

      chip.addEventListener('click', function () {
        chip.classList.toggle('active');
        if (chip.classList.contains('active')) {
          if (!prefs.mobilityFilters.includes(tag)) prefs.mobilityFilters.push(tag);
        } else {
          prefs.mobilityFilters = prefs.mobilityFilters.filter(function (t) { return t !== tag; });
        }
        savePrefs();
        renderHotels(filterHotels());
        renderTransport(filterTransport());
      });
    });
  }

  /* ── Vision / hearing support toggles ───────────────────────── */
  function initSupportToggles() {
    const visionToggle = document.getElementById('vision-toggle');
    const hearingToggle = document.getElementById('hearing-toggle');

    if (visionToggle) {
      visionToggle.checked = prefs.visionSupport;
      visionToggle.addEventListener('change', function () {
        prefs.visionSupport = visionToggle.checked;
        savePrefs();
        renderHotels(filterHotels());
      });
    }
    if (hearingToggle) {
      hearingToggle.checked = prefs.hearingSupport;
      hearingToggle.addEventListener('change', function () {
        prefs.hearingSupport = hearingToggle.checked;
        savePrefs();
        renderHotels(filterHotels());
      });
    }
  }

  /* ── Medical needs chips ─────────────────────────────────────── */
  function initMedicalSearch() {
    const container = document.getElementById('medical-needs-container');
    if (!container) return;

    DATA.medicalNeeds.forEach(function (need) {
      const chip = document.createElement('button');
      chip.className = 'medical-chip' + (prefs.medicalNeeds.includes(need.id) ? ' active' : '');
      chip.dataset.need = need.id;
      chip.setAttribute('aria-pressed', prefs.medicalNeeds.includes(need.id) ? 'true' : 'false');
      chip.innerHTML = '<span class="chip-icon">' + need.icon + '</span><span>' + need.label + '</span>';
      chip.title = need.description;

      chip.addEventListener('click', function () {
        chip.classList.toggle('active');
        const isActive = chip.classList.contains('active');
        chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        if (isActive) {
          if (!prefs.medicalNeeds.includes(need.id)) prefs.medicalNeeds.push(need.id);
        } else {
          prefs.medicalNeeds = prefs.medicalNeeds.filter(function (n) { return n !== need.id; });
        }
        savePrefs();
        renderMedicalResults();
      });

      container.appendChild(chip);
    });
  }

  function renderMedicalNeeds() {
    renderMedicalResults();
  }

  function renderMedicalResults() {
    const panel = document.getElementById('medical-results');
    if (!panel) return;

    if (prefs.medicalNeeds.length === 0) {
      panel.innerHTML = '<p class="a11y-empty">Select your medical needs above to see accommodation recommendations.</p>';
      return;
    }

    const matchedNeeds = DATA.medicalNeeds.filter(function (n) { return prefs.medicalNeeds.includes(n.id); });
    const matchedHotels = DATA.hotels.filter(function (h) {
      return prefs.medicalNeeds.some(function (needId) {
        if (needId === 'dialysis') return h.features.medical.includes('dialysis-nearby');
        if (needId === 'oxygen') return h.features.medical.includes('oxygen-rental');
        if (needId === 'insulin') return h.features.medical.includes('refrigerator-medication');
        if (needId === 'allergy-severe') return h.features.dietary.includes('allergen-menus');
        return h.features.medical.includes(needId) || h.features.medical.includes('on-site-nurse');
      });
    });

    let html = '<div class="medical-needs-summary">';
    matchedNeeds.forEach(function (need) {
      html += '<div class="medical-need-item"><span class="need-icon">' + need.icon + '</span><div><strong>' + need.label + '</strong><p>' + need.description + '</p></div></div>';
    });
    html += '</div>';

    if (matchedHotels.length > 0) {
      html += '<h3 class="a11y-section-sub">Matching hotels (' + matchedHotels.length + ')</h3>';
      html += '<div class="hotel-grid">' + matchedHotels.map(renderHotelCard).join('') + '</div>';
    } else {
      html += '<p class="a11y-empty">No hotels in our current dataset match all selected needs. Contact our accessibility team for bespoke recommendations.</p>';
    }

    panel.innerHTML = html;
  }

  /* ── Hotel search input ──────────────────────────────────────── */
  function initHotelSearch() {
    const form = document.getElementById('hotel-a11y-form');
    const scoreFilter = document.getElementById('hotel-score-filter');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        renderHotels(filterHotels());
      });
    }
    if (scoreFilter) {
      scoreFilter.addEventListener('input', function () {
        document.getElementById('score-display').textContent = scoreFilter.value + '+';
        renderHotels(filterHotels());
      });
    }
  }

  /* ── Transport list init ─────────────────────────────────────── */
  function initTransportList() {
    const destInput = document.getElementById('a11y-destination');
    if (!destInput) return;
    destInput.addEventListener('input', function () {
      prefs.destination = destInput.value.trim();
      savePrefs();
      if (prefs.destination.length >= 2) renderVenues(prefs.destination);
      else document.getElementById('venue-results').innerHTML = '<p class="a11y-empty">Enter a destination to see accessible venues.</p>';
    });
  }

  /* ── Filter engines ──────────────────────────────────────────── */
  function filterHotels() {
    const scoreInput = document.getElementById('hotel-score-filter');
    const minScore = scoreInput ? parseInt(scoreInput.value, 10) : 0;

    return DATA.hotels.filter(function (hotel) {
      if (hotel.accessScore < minScore) return false;

      if (prefs.mobilityFilters.length > 0) {
        const allFeatures = Object.values(hotel.features).flat();
        if (!prefs.mobilityFilters.every(function (f) { return allFeatures.includes(f); })) return false;
      }

      if (prefs.visionSupport) {
        if (!hotel.features.vision || hotel.features.vision.length === 0) return false;
      }

      if (prefs.hearingSupport) {
        if (!hotel.features.hearing || hotel.features.hearing.length === 0) return false;
      }

      if (prefs.profile) {
        const profileData = DATA.sensoryProfiles.find(function (p) { return p.id === prefs.profile; });
        if (profileData && profileData.venueFilter.length > 0) {
          const allFeatures = Object.values(hotel.features).flat();
          const sensoryMatch = profileData.venueFilter.some(function (f) { return allFeatures.includes(f); });
          if (!sensoryMatch && profileData.venueFilter.length > 0) return false;
        }
      }

      return true;
    });
  }

  function filterTransport() {
    return DATA.transport.filter(function (route) {
      if (prefs.mobilityFilters.length > 0) {
        if (!prefs.mobilityFilters.every(function (f) { return route.features.includes(f); })) return false;
      }
      if (prefs.visionSupport && !route.tags.includes('vision')) return false;
      if (prefs.hearingSupport && !route.tags.includes('hearing')) return false;
      return true;
    });
  }

  /* ── Renderers ───────────────────────────────────────────────── */
  function renderHotels(hotels) {
    const container = document.getElementById('hotel-results');
    if (!container) return;

    if (hotels.length === 0) {
      container.innerHTML = '<p class="a11y-empty">No hotels match your current filters. Try adjusting your preferences.</p>';
      return;
    }

    container.innerHTML = '<div class="hotel-grid">' + hotels.map(renderHotelCard).join('') + '</div>';
  }

  function renderHotelCard(hotel) {
    const scoreColour = hotel.accessScore >= 90 ? 'var(--teal)' : hotel.accessScore >= 75 ? 'var(--gold)' : 'var(--eco-amber)';
    const allTags = [
      ...hotel.features.mobility.slice(0, 3),
      ...(hotel.features.sensory || []).slice(0, 2),
    ];

    const tagHTML = allTags.map(function (tag) {
      const t = DATA.mobilityTags[tag] || DATA.sensoryTags[tag];
      return t ? '<span class="feat-tag">' + t.icon + ' ' + t.label + '</span>' : '';
    }).join('');

    const certs = hotel.certifications.map(function (c) {
      return '<span class="cert-badge">' + c + '</span>';
    }).join('');

    return '<div class="hotel-card" tabindex="0" aria-label="' + hotel.name + ', access score ' + hotel.accessScore + '">' +
      '<div class="hotel-img-wrap"><img src="' + hotel.image + '" alt="' + hotel.name + '" loading="lazy" /></div>' +
      '<div class="hotel-card-body">' +
        '<div class="hotel-card-top">' +
          '<div>' +
            '<h3 class="hotel-name">' + hotel.name + '</h3>' +
            '<p class="hotel-loc">' + hotel.city + ', ' + hotel.country + ' · ' + '★'.repeat(hotel.stars) + '</p>' +
          '</div>' +
          '<div class="access-score" style="background:' + scoreColour + '22; border-color:' + scoreColour + '44; color:' + scoreColour + '">' +
            '<span class="score-num">' + hotel.accessScore + '</span>' +
            '<span class="score-label">A11Y</span>' +
          '</div>' +
        '</div>' +
        '<div class="feat-tags">' + tagHTML + '</div>' +
        '<div class="cert-badges">' + certs + '</div>' +
        '<div class="hotel-footer">' +
          '<span class="hotel-price">from <strong>£' + hotel.pricePerNight + '</strong>/night</span>' +
          '<span class="hotel-rooms">' + hotel.accessibleRooms + ' accessible rooms</span>' +
          '<a class="hotel-cta" href="/bookings" aria-label="Book ' + hotel.name + '">Book</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderTransport(routes) {
    const container = document.getElementById('transport-results');
    if (!container) return;

    if (routes.length === 0) {
      container.innerHTML = '<p class="a11y-empty">No routes match your current filters.</p>';
      return;
    }

    container.innerHTML = routes.map(function (route) {
      const scoreColour = route.accessScore >= 90 ? 'var(--teal)' : 'var(--gold)';
      const tagHTML = route.features.slice(0, 5).map(function (f) {
        const t = DATA.mobilityTags[f] || DATA.sensoryTags[f];
        return t ? '<span class="feat-tag">' + t.icon + ' ' + t.label + '</span>' : '';
      }).join('');
      const modeIcons = { eurostar: '🚄', thalys: '🚄', intercity: '🚆', amtrak: '🚃', shinkansen: '🚄', 'ave-high-speed': '🚄', 'xpt-train': '🚆', coach: '🚌' };
      const modeHTML = route.modes.map(function (m) { return modeIcons[m] || '🚆'; }).join(' ');

      return '<div class="transport-card" tabindex="0">' +
        '<div class="transport-top">' +
          '<div>' +
            '<p class="transport-mode">' + modeHTML + ' ' + route.modes.map(function (m) { return m.replace(/-/g,' '); }).join(' / ') + '</p>' +
            '<h3 class="transport-route">' + route.route + '</h3>' +
          '</div>' +
          '<div class="access-score" style="background:' + scoreColour + '22; border-color:' + scoreColour + '44; color:' + scoreColour + '">' +
            '<span class="score-num">' + route.accessScore + '</span>' +
            '<span class="score-label">A11Y</span>' +
          '</div>' +
        '</div>' +
        '<div class="feat-tags">' + tagHTML + '</div>' +
        '<p class="transport-note">' + route.bookingNotes + '</p>' +
      '</div>';
    }).join('');
  }

  function renderVenues(destination) {
    const container = document.getElementById('venue-results');
    if (!container) return;

    const normalised = Object.keys(DATA.venues).find(function (k) {
      return k.toLowerCase() === destination.toLowerCase();
    });

    if (!normalised) {
      container.innerHTML = '<p class="a11y-empty">No venue data for "' + escHtml(destination) + '". Try: Paris, London, Barcelona, Tokyo, Amsterdam.</p>';
      return;
    }

    const venues = DATA.venues[normalised];
    const activeProfile = prefs.profile ? DATA.sensoryProfiles.find(function (p) { return p.id === prefs.profile; }) : null;

    const filtered = venues.filter(function (v) {
      if (activeProfile && activeProfile.venueFilter.length > 0) {
        return activeProfile.venueFilter.some(function (f) { return v.features.includes(f); });
      }
      if (prefs.visionSupport) {
        const visionTags = ['audio-guide','audio-descriptions','large-print','large-print-menus','tactile-gallery','tactile-models','tactile-exhibits','tactile-replicas','screen-reader-kiosk'];
        return visionTags.some(function (t) { return v.features.includes(t); });
      }
      if (prefs.hearingSupport) {
        return v.features.includes('induction-loop') || v.features.includes('hearing-loop') || v.features.includes('captioned-performances') || v.features.includes('bsl-tours') || v.features.includes('bsl-performances');
      }
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = '<p class="a11y-empty">No venues match your profile in ' + escHtml(normalised) + '. Try adjusting your filters.</p>';
      return;
    }

    container.innerHTML = '<div class="venue-grid">' + filtered.map(function (venue) {
      const mobilityStars = '●'.repeat(venue.mobilityRating) + '○'.repeat(5 - venue.mobilityRating);
      const sensoryStars = '●'.repeat(venue.sensoryRating) + '○'.repeat(5 - venue.sensoryRating);
      const featHTML = venue.features.slice(0, 5).map(function (f) {
        const t = DATA.sensoryTags[f] || DATA.mobilityTags[f];
        return t ? '<span class="feat-tag">' + t.icon + ' ' + t.label + '</span>' : '';
      }).join('');
      const typeIcon = { museum: '🏛️', landmark: '🗺️', outdoor: '🌿', theatre: '🎭' };

      return '<div class="venue-card" tabindex="0">' +
        '<div class="venue-type">' + (typeIcon[venue.type] || '📍') + ' ' + venue.type + '</div>' +
        '<h3 class="venue-name">' + escHtml(venue.name) + '</h3>' +
        '<div class="venue-ratings">' +
          '<div class="venue-rating"><span class="rating-label">Mobility</span><span class="rating-stars" aria-label="' + venue.mobilityRating + ' out of 5">' + mobilityStars + '</span></div>' +
          '<div class="venue-rating"><span class="rating-label">Sensory</span><span class="rating-stars" aria-label="' + venue.sensoryRating + ' out of 5">' + sensoryStars + '</span></div>' +
        '</div>' +
        '<div class="feat-tags">' + featHTML + '</div>' +
        '<div class="access-score-sm" style="color:var(--teal)">' + venue.accessScore + ' / 100</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  /* ── Apply profile UI changes ────────────────────────────────── */
  function applyProfileUI() {
    const body = document.body;
    const activeProfile = prefs.profile ? DATA.sensoryProfiles.find(function (p) { return p.id === prefs.profile; }) : null;

    body.classList.remove('sensory-mode', 'neurodivergent-mode', 'reduce-motion', 'dyslexia-font', 'large-text');

    if (activeProfile) {
      if (activeProfile.uiChanges.reduceMotion) body.classList.add('reduce-motion', 'sensory-mode');
      if (activeProfile.uiChanges.simplifiedNav) body.classList.add('neurodivergent-mode');
      if (activeProfile.uiChanges.largeText) body.classList.add('large-text');
      if (activeProfile.uiChanges.dyslexiaFont) body.classList.add('dyslexia-font');
    }

    const indicator = document.getElementById('active-profile-indicator');
    if (indicator) {
      if (activeProfile) {
        indicator.textContent = activeProfile.label;
        indicator.style.display = 'inline-flex';
      } else {
        indicator.style.display = 'none';
      }
    }
  }

  /* ── Toast notification ──────────────────────────────────────── */
  function showToast(message) {
    let toast = document.getElementById('a11y-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'a11y-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { toast.classList.remove('visible'); }, 2500);
  }

  /* ── Utility ─────────────────────────────────────────────────── */
  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();
