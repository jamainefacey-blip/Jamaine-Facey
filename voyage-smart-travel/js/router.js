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

      /* "Plan my trip" button → trip request page */
      var plannerSubmit = document.getElementById('hp-planner-submit');
      if (plannerSubmit) {
        plannerSubmit.addEventListener('click', function () {
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

      if (!tripForm) return;

      tripForm.addEventListener('submit', function (e) {
        e.preventDefault();

        /* Collect values */
        var destination    = document.getElementById('tr-destination').value.trim();
        var departureDate  = document.getElementById('tr-departure').value;
        var returnDate     = document.getElementById('tr-return').value;
        var travellerCount = parseInt(document.getElementById('tr-travellers').value, 10);
        var purpose        = document.getElementById('tr-purpose').value;
        var notes          = document.getElementById('tr-notes').value.trim();

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

        setErr('err-destination', destination.length < 2 ? 'Enter a valid destination.' : '');
        setErr('err-departure',   !departureDate ? 'Select a departure date.' : '');

        if (!returnDate) {
          setErr('err-return', 'Select a return date.');
        } else if (departureDate && new Date(returnDate) <= new Date(departureDate)) {
          setErr('err-return', 'Return date must be after departure date.');
        } else {
          setErr('err-return', '');
        }

        setErr('err-travellers', (!travellerCount || travellerCount < 1) ? 'Enter at least 1 traveller.' : '');
        setErr('err-purpose',    !purpose ? 'Select a purpose.' : '');

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
            destination:    destination,
            departureDate:  departureDate,
            returnDate:     returnDate,
            travellerCount: travellerCount,
            purpose:        purpose,
            notes:          notes,
          });

          /* Get Ava explanation */
          var ava = window.VSTAvaEngine.avaExplain(result.evaluation);

          /* Render result panel */
          resultPanel.innerHTML = window.renderEvalResult(result, ava);
          formPanel.style.display   = 'none';
          resultPanel.style.display = 'block';

          /* Advance step indicator */
          if (stepForm) stepForm.classList.remove('trip-step--active');
          if (stepEval) stepEval.classList.add('trip-step--active', 'trip-step--done');

          /* Wire save button */
          var saveBtn = document.getElementById('trip-save-btn');
          if (saveBtn) {
            saveBtn.addEventListener('click', function () {
              window.VSTTrips.create(result);
              /* Advance to saved step */
              var stepConfirm = document.getElementById('step-confirm');
              if (stepEval)    stepEval.classList.remove('trip-step--active');
              if (stepConfirm) stepConfirm.classList.add('trip-step--active', 'trip-step--done');
              navigate('dashboard');
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
              if (stepEval) {
                stepEval.classList.remove('trip-step--active', 'trip-step--done');
              }
              if (stepForm) stepForm.classList.add('trip-step--active');
              tripForm.reset();
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
