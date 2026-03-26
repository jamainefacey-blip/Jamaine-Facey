/* ─────────────────────────────────────────────────────────────────────────────
   Voyage Smart Travel — Hash Router
   Hash-based SPA routing. Maps #routes to page render functions.
   ───────────────────────────────────────────────────────────────────────────── */

window.VSTRouter = (function () {

  /* ── Route map ────────────────────────────────────────────────────────────── */
  var ROUTES = {
    'home':          window.renderHome,
    'about':         window.renderAbout,
    'safety':        window.renderSafety,
    'features':      window.renderFeatures,
    'accessibility': window.renderAccessibility,
    'partners':      window.renderPartners,
    'contact':       window.renderContact,
    'trip-request':  window.renderTripRequest,
    'dashboard':     window.renderDashboard,
  };

  var DEFAULT_ROUTE = 'home';

  /* ── State ────────────────────────────────────────────────────────────────── */
  var currentRoute = null;

  /* ── navigate ─────────────────────────────────────────────────────────────── */
  function navigate(route) {
    if (!ROUTES[route]) route = DEFAULT_ROUTE;

    if (window.location.hash !== '#' + route) {
      window.location.hash = route;
      return; // hashchange event will re-trigger navigate
    }

    render(route);
  }

  /* ── render ───────────────────────────────────────────────────────────────── */
  function render(route) {
    currentRoute = route;
    var renderFn = ROUTES[route] || ROUTES[DEFAULT_ROUTE];

    var main = document.getElementById('site-main');
    if (!main) return;

    main.innerHTML = '<div class="page">' + renderFn() + '</div>';

    window.scrollTo({ top: 0, behavior: 'instant' });
    updateNavState(route);
    initPageInteractions(route);
  }

  /* ── updateNavState ───────────────────────────────────────────────────────── */
  function updateNavState(route) {
    document.querySelectorAll('[data-route]').forEach(function (el) {
      el.classList.toggle('active', el.dataset.route === route);
    });
  }

  /* ── initPageInteractions ─────────────────────────────────────────────────── */
  function initPageInteractions(route) {

    /* ── Contact form ──────────────────────────────────────────────────────── */
    if (route === 'contact') {
      var contactForm = document.getElementById('contact-form');
      var contactSuccess = document.getElementById('form-success');
      if (contactForm && contactSuccess) {
        contactForm.addEventListener('submit', function (e) {
          e.preventDefault();
          contactForm.style.display = 'none';
          contactSuccess.classList.add('visible');
          setTimeout(function () {
            contactForm.reset();
            contactForm.style.display = '';
            contactSuccess.classList.remove('visible');
          }, 6000);
        });
      }
    }

    /* ── Home page interactions ─────────────────────────────────────────────── */
    if (route === 'home') {
      /* Planner tab switching */
      var plannerTabs = document.getElementById('hp-planner-tabs');
      if (plannerTabs) {
        plannerTabs.addEventListener('click', function (e) {
          var btn = e.target.closest('.hp-planner-tab');
          if (!btn) return;
          plannerTabs.querySelectorAll('.hp-planner-tab').forEach(function (t) {
            t.classList.remove('active');
          });
          btn.classList.add('active');
        });
      }

      /* One-way toggle — hide/show return date field */
      var oneWayCheck   = document.getElementById('hp-plan-oneway');
      var returnField   = document.getElementById('hp-plan-return-field');
      if (oneWayCheck && returnField) {
        oneWayCheck.addEventListener('change', function () {
          returnField.style.display = oneWayCheck.checked ? 'none' : '';
        });
      }

      /* "Plan my trip" → collect values, store prefill, navigate */
      var plannerSubmit = document.getElementById('hp-planner-submit');
      if (plannerSubmit) {
        plannerSubmit.addEventListener('click', function () {
          var fromEl         = document.getElementById('hp-plan-from');
          var toEl           = document.getElementById('hp-plan-to');
          var departEl       = document.getElementById('hp-plan-depart');
          var returnEl       = document.getElementById('hp-plan-return');
          var paxEl          = document.getElementById('hp-plan-pax');
          var typeEl         = document.getElementById('hp-plan-traveller-type');
          var isOneWay       = oneWayCheck && oneWayCheck.checked;

          var prefill = {
            origin:        fromEl   ? fromEl.value.trim()   : '',
            destination:   toEl     ? toEl.value.trim()     : '',
            departureDate: departEl ? departEl.value        : '',
            returnDate:    (!isOneWay && returnEl) ? returnEl.value : '',
            travellerCount: paxEl   ? paxEl.value           : '1',
            travellerType: typeEl   ? typeEl.value          : '',
            tripType:      isOneWay ? 'one_way'             : 'return',
          };

          try {
            sessionStorage.setItem('vst_planner_prefill', JSON.stringify(prefill));
          } catch (e) { /* storage unavailable */ }

          navigate('trip-request');
        });
      }
    }

    /* ── Trip Request form ─────────────────────────────────────────────────── */
    if (route === 'trip-request') {
      var tripForm    = document.getElementById('trip-request-form');
      var formPanel   = document.getElementById('trip-form-panel');
      var resultPanel = document.getElementById('trip-result-panel');
      var stepForm    = document.getElementById('step-form');
      var stepEval    = document.getElementById('step-eval');
      var stepConfirm = document.getElementById('step-confirm');

      if (!tripForm) return;

      /* ── Pre-fill from planner sessionStorage ──────────────────────────── */
      try {
        var raw = sessionStorage.getItem('vst_planner_prefill');
        if (raw) {
          var prefill = JSON.parse(raw);
          sessionStorage.removeItem('vst_planner_prefill');

          function pf(id, val) {
            var el = document.getElementById(id);
            if (el && val) el.value = val;
          }

          pf('tr-origin',        prefill.origin);
          pf('tr-destination',   prefill.destination);
          pf('tr-departure',     prefill.departureDate);
          pf('tr-return',        prefill.returnDate);
          pf('tr-travellers',    prefill.travellerCount);
          pf('tr-traveller-type', prefill.travellerType);

          /* Apply trip type radio */
          if (prefill.tripType === 'one_way') {
            var oneWayRadio = document.getElementById('tr-triptype-oneway');
            if (oneWayRadio) {
              oneWayRadio.checked = true;
              oneWayRadio.closest('.trip-type-opt').classList.add('trip-type-opt--active');
              var returnRadio = document.getElementById('tr-triptype-return');
              if (returnRadio) returnRadio.closest('.trip-type-opt').classList.remove('trip-type-opt--active');
              /* Hide return date group */
              var rg = document.getElementById('tr-return-group');
              if (rg) { rg.style.opacity = '0.4'; rg.style.pointerEvents = 'none'; }
              var req = document.getElementById('tr-return-required');
              if (req) req.style.display = 'none';
            }
          }
        }
      } catch (e) { /* ignore prefill errors */ }

      /* ── Trip type toggle — return / one-way ───────────────────────────── */
      var tripTypeOpts = tripForm.querySelectorAll('.trip-type-opt');
      var returnGroup  = document.getElementById('tr-return-group');
      var returnReq    = document.getElementById('tr-return-required');

      tripTypeOpts.forEach(function (opt) {
        var radio = opt.querySelector('input[type="radio"]');
        if (!radio) return;
        radio.addEventListener('change', function () {
          tripTypeOpts.forEach(function (o) { o.classList.remove('trip-type-opt--active'); });
          opt.classList.add('trip-type-opt--active');
          var isOneWay = radio.value === 'one_way';
          if (returnGroup) {
            returnGroup.style.opacity       = isOneWay ? '0.4' : '';
            returnGroup.style.pointerEvents = isOneWay ? 'none' : '';
          }
          if (returnReq) returnReq.style.display = isOneWay ? 'none' : '';
          /* Clear return error when switching to one-way */
          if (isOneWay) {
            var errReturn = document.getElementById('err-return');
            if (errReturn) { errReturn.textContent = ''; errReturn.style.display = 'none'; }
          }
        });
      });

      /* ── Form submit ───────────────────────────────────────────────────── */
      tripForm.addEventListener('submit', function (e) {
        e.preventDefault();

        /* Collect values */
        var destination    = document.getElementById('tr-destination').value.trim();
        var origin         = (document.getElementById('tr-origin') || {}).value;
        origin = origin ? origin.trim() : '';
        var departureDate  = document.getElementById('tr-departure').value;
        var travellerCount = parseInt(document.getElementById('tr-travellers').value, 10);
        var purpose        = document.getElementById('tr-purpose').value;
        var travellerType  = document.getElementById('tr-traveller-type').value;
        var budgetBand     = (document.getElementById('tr-budget') || {}).value || '';
        var notes          = document.getElementById('tr-notes').value.trim();

        /* Trip type */
        var tripTypeRadio = tripForm.querySelector('input[name="tripType"]:checked');
        var tripType      = tripTypeRadio ? tripTypeRadio.value : 'return';
        var isOneWay      = tripType === 'one_way';

        var returnDate = '';
        if (!isOneWay) {
          returnDate = document.getElementById('tr-return').value;
        }

        /* Accessibility needs */
        var accessChecks = tripForm.querySelectorAll('input[name="accessibility"]:checked');
        var accessibilityNeeds = [];
        accessChecks.forEach(function (cb) { accessibilityNeeds.push(cb.value); });

        /* Validate */
        var valid = true;

        function setErr(id, msg) {
          var el = document.getElementById(id);
          if (el) {
            el.textContent = msg;
            el.style.display = msg ? 'block' : 'none';
          }
          if (msg) valid = false;
        }

        setErr('err-destination',   destination.length < 2 ? 'Enter a valid destination.' : '');
        setErr('err-departure',     !departureDate ? 'Select a departure date.' : '');
        setErr('err-travellers',    (!travellerCount || travellerCount < 1) ? 'Enter at least 1 traveller.' : '');
        setErr('err-purpose',       !purpose ? 'Select a purpose.' : '');
        setErr('err-traveller-type', !travellerType ? 'Select a traveller type.' : '');

        if (!isOneWay) {
          if (!returnDate) {
            setErr('err-return', 'Select a return date.');
          } else if (departureDate && new Date(returnDate) <= new Date(departureDate)) {
            setErr('err-return', 'Return date must be after departure date.');
          } else {
            setErr('err-return', '');
          }
        } else {
          setErr('err-return', '');
        }

        if (!valid) return;

        /* Show loading state */
        var submitBtn = document.getElementById('trip-submit-btn');
        if (submitBtn) {
          submitBtn.textContent = 'Evaluating…';
          submitBtn.disabled    = true;
        }

        /* Simulate brief evaluation processing */
        setTimeout(function () {

          /* Run evaluation */
          var result = window.VSTAvaEngine.evaluate({
            destination:       destination,
            origin:            origin,
            departureDate:     departureDate,
            returnDate:        returnDate,
            tripType:          tripType,
            travellerCount:    travellerCount,
            travellerType:     travellerType,
            budgetBand:        budgetBand,
            accessibilityNeeds: accessibilityNeeds,
            purpose:           purpose,
            notes:             notes,
          });

          /* Get Ava explanation */
          var ava = window.VSTAvaEngine.avaExplain(result.evaluation);

          /* Render result panel */
          resultPanel.innerHTML     = window.renderEvalResult(result, ava);
          formPanel.style.display   = 'none';
          resultPanel.style.display = 'block';

          /* Advance step indicator */
          if (stepForm) stepForm.classList.remove('trip-step--active');
          if (stepEval) stepEval.classList.add('trip-step--active', 'trip-step--done');

          /* Wire save button */
          var saveBtn = document.getElementById('trip-save-btn');
          if (saveBtn) {
            saveBtn.addEventListener('click', function () {
              var savedTrip = window.VSTTrips.create(result);

              /* Advance to saved step */
              if (stepEval)    stepEval.classList.remove('trip-step--active');
              if (stepConfirm) stepConfirm.classList.add('trip-step--active', 'trip-step--done');

              /* Show success confirmation panel */
              resultPanel.innerHTML = window.renderTripSuccess(savedTrip || result);

              /* Wire success panel buttons */
              var goDash = document.getElementById('trip-goto-dashboard');
              if (goDash) {
                goDash.addEventListener('click', function () { navigate('dashboard'); });
              }

              var reqAnother = document.getElementById('trip-request-another');
              if (reqAnother) {
                reqAnother.addEventListener('click', function () {
                  resultPanel.innerHTML     = '';
                  resultPanel.style.display = 'none';
                  formPanel.style.display   = 'block';
                  if (submitBtn) {
                    submitBtn.textContent = 'Evaluate Trip Request';
                    submitBtn.disabled    = false;
                  }
                  if (stepEval)    stepEval.classList.remove('trip-step--active', 'trip-step--done');
                  if (stepConfirm) stepConfirm.classList.remove('trip-step--active', 'trip-step--done');
                  if (stepForm)    stepForm.classList.add('trip-step--active');
                  tripForm.reset();
                  tripTypeOpts.forEach(function (o) { o.classList.remove('trip-type-opt--active'); });
                  var returnOpt = tripForm.querySelector('.trip-type-opt:first-child');
                  if (returnOpt) returnOpt.classList.add('trip-type-opt--active');
                  if (returnGroup) { returnGroup.style.opacity = ''; returnGroup.style.pointerEvents = ''; }
                  if (returnReq) returnReq.style.display = '';
                });
              }

              /* Auto-navigate to dashboard after 8 s if user doesn't click */
              setTimeout(function () {
                if (document.getElementById('trip-goto-dashboard')) {
                  navigate('dashboard');
                }
              }, 8000);
            });
          }

          /* Wire new request button */
          var newBtn = document.getElementById('trip-new-btn');
          if (newBtn) {
            newBtn.addEventListener('click', function () {
              resultPanel.innerHTML     = '';
              resultPanel.style.display = 'none';
              formPanel.style.display   = 'block';
              if (submitBtn) {
                submitBtn.textContent = 'Evaluate Trip Request';
                submitBtn.disabled    = false;
              }
              if (stepEval) stepEval.classList.remove('trip-step--active', 'trip-step--done');
              if (stepForm) stepForm.classList.add('trip-step--active');
              tripForm.reset();
              tripTypeOpts.forEach(function (o) { o.classList.remove('trip-type-opt--active'); });
              var returnOpt = tripForm.querySelector('.trip-type-opt:first-child');
              if (returnOpt) returnOpt.classList.add('trip-type-opt--active');
              if (returnGroup) { returnGroup.style.opacity = ''; returnGroup.style.pointerEvents = ''; }
              if (returnReq) returnReq.style.display = '';
            });
          }

        }, 700); /* evaluation delay — gives a realistic feel */
      });
    }

    /* ── Dashboard interactions ─────────────────────────────────────────────── */
    if (route === 'dashboard') {
      /* Nothing additional required — data is rendered server-side on load.
         Click delegation in handleMainClick covers all data-route links. */
    }

    /* ── In-page data-route links ────────────────────────────────────────────── */
    var siteMain = document.getElementById('site-main');
    if (siteMain) {
      siteMain.addEventListener('click', handleMainClick);
    }
  }

  /* ── handleMainClick ──────────────────────────────────────────────────────── */
  function handleMainClick(e) {
    var link = e.target.closest('[data-route]');
    if (!link) return;
    var route = link.dataset.route;
    if (route && ROUTES[route]) {
      e.preventDefault();
      navigate(route);
    }
  }

  /* ── parseHash ────────────────────────────────────────────────────────────── */
  function parseHash() {
    var hash = window.location.hash.replace('#', '').trim();
    return hash || DEFAULT_ROUTE;
  }

  /* ── init ─────────────────────────────────────────────────────────────────── */
  function init() {
    VSTComponents.initComponents();

    window.addEventListener('hashchange', function () {
      render(parseHash());
    });

    document.addEventListener('click', function (e) {
      var link = e.target.closest('[data-route]');
      if (!link) return;
      var route = link.dataset.route;
      if (route && ROUTES[route]) {
        if (window.location.hash === '#' + route) {
          e.preventDefault();
          render(route);
        }
      }
    });

    render(parseHash());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { navigate: navigate, render: render };

})();
