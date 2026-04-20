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
    'pain-control':  window.renderPainControl,
    'auth':          window.renderAuth,
    'profile':       window.renderProfile,
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

        /* ── Reset form to initial state ───────────────────────────────── */
        function resetForm() {
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
          var rOpt = tripForm.querySelector('.trip-type-opt:first-child');
          if (rOpt) rOpt.classList.add('trip-type-opt--active');
          if (returnGroup) { returnGroup.style.opacity = ''; returnGroup.style.pointerEvents = ''; }
          if (returnReq) returnReq.style.display = '';
        }

        /* ── Wire result-panel action buttons ───────────────────────────── */
        function wireResultButtons(result) {
          var saveBtn = document.getElementById('trip-save-btn');
          if (saveBtn) {
            saveBtn.addEventListener('click', function () {
              var savedTrip = window.VSTTrips.create(result);
              if (window.VSTNotifications) {
                window.VSTNotifications.bookingConfirmed({
                  destination: result.destination,
                  ref: savedTrip && savedTrip.id,
                });
              }

              if (stepEval)    stepEval.classList.remove('trip-step--active');
              if (stepConfirm) stepConfirm.classList.add('trip-step--active', 'trip-step--done');

              resultPanel.innerHTML = window.renderTripSuccess(savedTrip || result);

              var goDash = document.getElementById('trip-goto-dashboard');
              if (goDash) {
                goDash.addEventListener('click', function () { navigate('dashboard'); });
              }
              var reqAnother = document.getElementById('trip-request-another');
              if (reqAnother) {
                reqAnother.addEventListener('click', function () { resetForm(); });
              }
              setTimeout(function () {
                if (document.getElementById('trip-goto-dashboard')) navigate('dashboard');
              }, 8000);
            });
          }

          var newBtn = document.getElementById('trip-new-btn');
          if (newBtn) {
            newBtn.addEventListener('click', function () { resetForm(); });
          }
        }

        /* ── Evaluation processing (700 ms delay for realistic feel) ────── */
        setTimeout(function () {

          /* Phase 5 sync evaluation — builds baseline result object */
          var result = window.VSTAvaEngine.evaluate({
            destination:        destination,
            origin:             origin,
            departureDate:      departureDate,
            returnDate:         returnDate,
            tripType:           tripType,
            travellerCount:     travellerCount,
            travellerType:      travellerType,
            budgetBand:         budgetBand,
            accessibilityNeeds: accessibilityNeeds,
            purpose:            purpose,
            notes:              notes,
          });

          /* Phase 6 intelligence — async; resolves instantly in fallback mode */
          var p6Input = {
            destination:        result.destination,
            origin:             result.origin,
            departureDate:      result.departureDate,
            returnDate:         result.returnDate,
            tripType:           result.tripType,
            nights:             result.nights,
            travellerCount:     result.travellerCount,
            travellerType:      result.travellerType,
            budgetBand:         result.budgetBand,
            accessibilityNeeds: result.accessibilityNeeds,
            purpose:            result.purpose,
            estimatedCostUSD:   result.evaluation.estimatedCost,
            notes:              result.notes,
          };

          var p6Promise = window.VSTAvaPhase6
            ? window.VSTAvaPhase6.evaluate(p6Input)
            : Promise.resolve(null);

          p6Promise
            .then(function (p6)  { result.phase6 = p6; })
            .catch(function ()   { result.phase6 = null; })
            .then(function () {
              var ava = window.VSTAvaEngine.avaExplain(result.evaluation);

              resultPanel.innerHTML     = window.renderEvalResult(result, ava);
              formPanel.style.display   = 'none';
              resultPanel.style.display = 'block';

              if (stepForm) stepForm.classList.remove('trip-step--active');
              if (stepEval) stepEval.classList.add('trip-step--active', 'trip-step--done');

              wireResultButtons(result);

              /* ── Live fare search — async, non-blocking ─────────────────── */
              if (window.VSTFareSearch) {
                var farePanel = document.getElementById('trip-fare-panel');
                window.VSTFareSearch.search({
                  origin:         origin,
                  destination:    destination,
                  departureDate:  departureDate,
                  returnDate:     returnDate || null,
                  tripType:       tripType,
                  travellerCount: travellerCount,
                  currency:       'GBP',
                }).then(function (fareResult) {
                  farePanel = document.getElementById('trip-fare-panel');
                  if (farePanel) farePanel.outerHTML = window.renderFareResults(fareResult);
                }).catch(function () {
                  farePanel = document.getElementById('trip-fare-panel');
                  if (farePanel) farePanel.outerHTML = window.renderFareResults(null);
                });
              }
            });

        }, 700);
      });
    }

    /* ── Dashboard interactions ─────────────────────────────────────────────── */
    if (route === 'dashboard') {
      /* Nothing additional required — data is rendered server-side on load.
         Click delegation in handleMainClick covers all data-route links. */
    }

    /* ── Pain Control interactions ──────────────────────────────────────────── */
    if (route === 'pain-control') {
      var PE          = window.VSTPainEngine;
      var detailSheet = document.getElementById('pc-detail-sheet');
      var detailOverlay = document.getElementById('pc-detail-overlay');
      var detailBody  = document.getElementById('pc-detail-body');
      var detailTitle = document.getElementById('pc-detail-title');
      var detailClose = document.getElementById('pc-detail-close');
      var logPanel    = document.getElementById('pc-log-panel');
      var logClose    = document.getElementById('pc-log-close');
      var toast       = document.getElementById('pc-toast');
      var runBtn      = document.getElementById('pc-run-once');
      var refreshBtn  = document.getElementById('pc-refresh');
      var queueBtn    = document.getElementById('pc-view-queue');
      var logsBtn     = document.getElementById('pc-view-logs');
      var taskList    = document.getElementById('pc-task-list');

      var toastTimer = null;

      function showToast(msg, type) {
        if (!toast) return;
        toast.textContent = msg;
        toast.className = 'pc-toast pc-toast--visible' + (type ? ' pc-toast--' + type : '');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
          toast.className = 'pc-toast';
        }, 3000);
      }

      function openDetail(taskId) {
        if (!detailSheet || !detailBody) return;
        var html = window.buildPainTaskDetail(taskId);
        detailBody.innerHTML = html;
        var tasks = PE.getTasks();
        for (var i = 0; i < tasks.length; i++) {
          if (tasks[i].id === taskId && detailTitle) {
            detailTitle.textContent = tasks[i].title;
            break;
          }
        }
        detailSheet.setAttribute('aria-hidden', 'false');
        detailSheet.classList.add('pc-detail-sheet--open');
        if (detailOverlay) { detailOverlay.setAttribute('aria-hidden', 'false'); detailOverlay.classList.add('pc-detail-overlay--visible'); }
        document.body.classList.add('pc-noscroll');
      }

      function closeDetail() {
        if (!detailSheet) return;
        detailSheet.classList.remove('pc-detail-sheet--open');
        detailSheet.setAttribute('aria-hidden', 'true');
        if (detailOverlay) { detailOverlay.classList.remove('pc-detail-overlay--visible'); detailOverlay.setAttribute('aria-hidden', 'true'); }
        document.body.classList.remove('pc-noscroll');
      }

      function openLogs() {
        if (!logPanel) return;
        logPanel.setAttribute('aria-hidden', 'false');
        logPanel.classList.add('pc-log-panel--open');
      }

      function closeLogs() {
        if (!logPanel) return;
        logPanel.classList.remove('pc-log-panel--open');
        logPanel.setAttribute('aria-hidden', 'true');
      }

      /* Task row taps */
      if (taskList) {
        taskList.addEventListener('click', function (e) {
          var btn = e.target.closest('.pc-task-item');
          if (!btn) return;
          openDetail(btn.dataset.taskId);
        });
      }

      /* Detail close */
      if (detailClose) detailClose.addEventListener('click', closeDetail);
      if (detailOverlay) detailOverlay.addEventListener('click', closeDetail);

      /* Log close */
      if (logClose) logClose.addEventListener('click', closeLogs);

      /* Run once */
      if (runBtn) {
        runBtn.addEventListener('click', function () {
          runBtn.disabled = true;
          runBtn.textContent = '⏳ Running…';
          PE.runOnce().then(function (newStatus) {
            render('pain-control'); /* re-render page with updated state */
            showToast('Engine run complete — status: ' + newStatus.lastRunStatus, 'success');
            if (newStatus.handoff_required && window.VSTNotifications) {
              window.VSTNotifications.painGuardHandoff({
                task_id:       newStatus.currentTaskId || 'unknown',
                task_type:     'pain_guard',
                urgency_score: newStatus.urgency_score || 0,
              });
            }
          }).catch(function () {
            runBtn.disabled = false;
            runBtn.innerHTML = '<span class="pc-action-icon">&#9654;</span> Run Engine Once';
            showToast('Engine run failed', 'error');
          });
        });
      }

      /* Refresh */
      if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
          render('pain-control');
          showToast('Status refreshed', 'info');
        });
      }

      /* View queue */
      if (queueBtn) {
        queueBtn.addEventListener('click', function () {
          var queue = PE.getQueue();
          showToast(queue.length + ' task' + (queue.length !== 1 ? 's' : '') + ' in queue', 'info');
          if (taskList) {
            taskList.querySelectorAll('.pc-task-item').forEach(function (item) {
              var tasks = PE.getTasks();
              for (var i = 0; i < tasks.length; i++) {
                if (tasks[i].id === item.dataset.taskId && tasks[i].status === 'queued') {
                  item.classList.add('pc-task-item--highlight');
                  setTimeout(function (el) { el.classList.remove('pc-task-item--highlight'); }, 1800, item);
                }
              }
            });
          }
        });
      }

      /* View logs */
      if (logsBtn) {
        logsBtn.addEventListener('click', openLogs);
      }
    }

    /* ── Safety page — SOS demo trigger ────────────────────────────────────── */
    if (route === 'safety') {
      var sosDemoBtn    = document.getElementById('sos-demo-trigger');
      var sosDemoResult = document.getElementById('sos-demo-result');
      if (sosDemoBtn) {
        sosDemoBtn.addEventListener('click', function () {
          sosDemoBtn.disabled   = true;
          sosDemoBtn.textContent = 'Sending SOS…';
          if (sosDemoResult) { sosDemoResult.style.display = 'none'; sosDemoResult.className = 'sos-demo-result'; }
          var user         = window.VSTAuth && window.VSTAuth.getCachedUser();
          var sosContacts  = (user && user.sos_contacts) || [];
          var location     = 'Demo Location — not a real emergency';
          var notifPromise = window.VSTNotifications
            ? window.VSTNotifications.sosTriggered(location, sosContacts)
            : Promise.resolve({ accepted: true });
          notifPromise.then(function (res) {
            sosDemoBtn.disabled   = false;
            sosDemoBtn.textContent = 'Trigger SOS Demo';
            if (sosDemoResult) {
              sosDemoResult.className   = 'sos-demo-result sos-demo-result--sent';
              sosDemoResult.innerHTML   = '<strong>SOS alert dispatched.</strong> Push, SMS, and voice escalation queued for all SOS contacts. Event ID: <code>' + (res.event_id || 'demo') + '</code>';
              sosDemoResult.style.display = 'block';
            }
          }).catch(function () {
            sosDemoBtn.disabled   = false;
            sosDemoBtn.textContent = 'Trigger SOS Demo';
            if (sosDemoResult) {
              sosDemoResult.className   = 'sos-demo-result sos-demo-result--error';
              sosDemoResult.innerHTML   = 'SOS dispatch failed — check console or provider credentials.';
              sosDemoResult.style.display = 'block';
            }
          });
        });
      }
    }

    /* ── Auth page interactions ─────────────────────────────────────────────── */
    if (route === 'auth') {
      var A = window.VSTAuth;

      /* Tab switching */
      var authTabs = document.getElementById('auth-tabs');
      var loginPanel    = document.getElementById('auth-login-panel');
      var registerPanel = document.getElementById('auth-register-panel');
      if (authTabs) {
        authTabs.addEventListener('click', function (e) {
          var btn = e.target.closest('.auth-tab');
          if (!btn) return;
          authTabs.querySelectorAll('.auth-tab').forEach(function (t) { t.classList.remove('auth-tab--active'); });
          btn.classList.add('auth-tab--active');
          var tab = btn.dataset.tab;
          if (loginPanel)    loginPanel.style.display    = tab === 'login'    ? '' : 'none';
          if (registerPanel) registerPanel.style.display = tab === 'register' ? '' : 'none';
        });
      }

      /* Login form */
      var loginForm = document.getElementById('login-form');
      if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
          e.preventDefault();
          var email    = (document.getElementById('login-email')    || {}).value || '';
          var password = (document.getElementById('login-password') || {}).value || '';
          var btn      = document.getElementById('login-submit');
          var errEl    = document.getElementById('login-error');
          if (btn) { btn.textContent = 'Signing in…'; btn.disabled = true; }
          if (errEl) errEl.style.display = 'none';
          A.login(email.trim(), password)
            .then(function () { navigate('profile'); })
            .catch(function (err) {
              if (btn) { btn.textContent = 'Sign In'; btn.disabled = false; }
              if (errEl) { errEl.textContent = err.message || 'Sign in failed.'; errEl.style.display = 'block'; }
            });
        });
      }

      /* Register form */
      var regForm = document.getElementById('register-form');
      if (regForm) {
        regForm.addEventListener('submit', function (e) {
          e.preventDefault();
          var name     = (document.getElementById('reg-name')     || {}).value || '';
          var email    = (document.getElementById('reg-email')    || {}).value || '';
          var password = (document.getElementById('reg-password') || {}).value || '';
          var terms    = (document.getElementById('reg-terms')    || {}).checked;
          var btn      = document.getElementById('register-submit');
          var errEl    = document.getElementById('register-error');
          if (btn) { btn.textContent = 'Creating account…'; btn.disabled = true; }
          if (errEl) errEl.style.display = 'none';
          A.register(email.trim(), password, name.trim(), terms)
            .then(function () { navigate('profile'); })
            .catch(function (err) {
              if (btn) { btn.textContent = 'Create Account'; btn.disabled = false; }
              if (errEl) { errEl.textContent = err.message || 'Registration failed.'; errEl.style.display = 'block'; }
            });
        });
      }
    }

    /* ── Profile page interactions ──────────────────────────────────────────── */
    if (route === 'profile') {
      /* If user just arrived and has a token, refresh profile from server */
      if (window.VSTAuth && window.VSTAuth.isLoggedIn()) {
        window.VSTAuth.getMe().then(function () {
          var page = document.getElementById('profile-page');
          if (page) page.innerHTML = window.renderProfile().replace(/^[\s\S]*?<div class="profile-page" id="profile-page">/, '').replace(/<\/div>\s*<\/div>\s*<\/section>\s*$/, '');
        }).catch(function () { /* silently keep cached */ });
      }

      var logoutBtn = document.getElementById('profile-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
          window.VSTAuth.logout();
          navigate('home');
        });
      }
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
