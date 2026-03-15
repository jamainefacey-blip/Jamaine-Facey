/* ─────────────────────────────────────────────────────────────────────────────
   Mr Pain PT — Rehab Engine  v2
   Mode-aware SPA. Hash-based routing. No framework. No build step.

   Program modes
   ─────────────
   one_off          Single prescribed session. No nav, no history.
   multi_week       Fixed-duration block (configurable, data-driven week count).
   ongoing_coaching Open-ended. Coach extends sessions over time.
                    Progress = streak + pain trend, not a completion %.

   Globals required (loaded before this script in index.html/loader.js order):
     CLIENT_CONFIG    — branding, client profile, coach, disclaimer
     PROGRAM          — mode, sessions/session, phases, weeks, goals, etc.
     EXERCISE_LIBRARY — enriched exercise definitions (exercises.js)
     ProgressStore    — localStorage isolation layer (engine/progress.js)
     Validator        — exercise reference validation (engine/validate.js)
     AccessGuard      — entitlement check (engine/access.js)

   Payment-ready architecture:
     PROGRAM.access.type   = "one_off_purchase" | "subscription" | "complimentary" | "trial"
     PROGRAM.access.status = "active" | "expired" | "suspended" | "pending"
     AccessGuard.check(PROGRAM) returns { allowed, reason, heading, body, cta }
     When allowed === false the engine renders renderAccessGuard() and stops.
   ───────────────────────────────────────────────────────────────────────────── */

(function () {
  "use strict";

  // ── Mode constants ─────────────────────────────────────────────────────────
  const ONE_OFF  = "one_off";
  const MULTI_WK = "multi_week";
  const COACHING = "ongoing_coaching";
  const MODE     = PROGRAM.mode;

  // ── allSessions — normalise one_off vs multi/coaching ─────────────────────
  // Sessions can exist with or without weekNumber.
  // one_off: single session at PROGRAM.session (no sessions array)
  // multi_week / ongoing_coaching: PROGRAM.sessions[]
  function allSessions() {
    if (MODE === ONE_OFF) return PROGRAM.session ? [PROGRAM.session] : [];
    return PROGRAM.sessions || [];
  }

  // ── Program duration — data-driven, never hard-coded ──────────────────────
  const PROGRAM_WEEKS = (function () {
    const ss = allSessions();
    if (!ss.length || MODE === ONE_OFF) return 1;
    const weeks = ss.map(s => s.weekNumber).filter(Boolean);
    return weeks.length ? Math.max(...weeks) : 1;
  })();

  // ── Boot ───────────────────────────────────────────────────────────────────
  ProgressStore.seedFromProgram(allSessions());

  const VALIDATION_ERRORS = Validator.validateProgram(PROGRAM, EXERCISE_LIBRARY);
  if (VALIDATION_ERRORS.length) {
    console.warn(`[Mr Pain PT] ${VALIDATION_ERRORS.length} program error(s):`);
    VALIDATION_ERRORS.forEach(e => console.warn(" →", e.message));
  }

  // ── Access guard ──────────────────────────────────────────────────────────
  // AccessGuard is optional — older program files without an access block are
  // treated as active. When access is denied the engine renders the guard view.
  const ACCESS = (typeof AccessGuard !== "undefined")
    ? AccessGuard.check(PROGRAM)
    : { allowed: true, reason: null, heading: null, body: null, cta: null };

  // ── Branding ───────────────────────────────────────────────────────────────
  function applyBranding() {
    const r = document.documentElement;
    r.style.setProperty("--accent",       CLIENT_CONFIG.accentColor);
    r.style.setProperty("--accent-dark",  shadeColor(CLIENT_CONFIG.accentColor, -20));
    r.style.setProperty("--accent-light", hexToRgba(CLIENT_CONFIG.accentColor, 0.13));
    document.title = CLIENT_CONFIG.appName;
    const logo  = document.getElementById("header-logo");
    const title = document.getElementById("header-title");
    if (logo)  logo.textContent  = CLIENT_CONFIG.logoText;
    if (title) title.textContent = CLIENT_CONFIG.appName;
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", CLIENT_CONFIG.accentColor);
  }

  function shadeColor(hex, pct) {
    const n = parseInt(hex.replace("#", ""), 16);
    const c = v => Math.min(255, Math.max(0, v));
    const r = c((n >> 16) + pct), g = c(((n >> 8) & 0xff) + pct), b = c((n & 0xff) + pct);
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  function hexToRgba(hex, a) {
    const n = parseInt(hex.replace("#", ""), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // ── Router ─────────────────────────────────────────────────────────────────
  const VIEWS = {
    welcome:   renderWelcome,
    dashboard: renderDashboard,
    overview:  renderOverview,
    plan:      renderPlan,
    session:   renderSessionView,
    exercises: renderExerciseLibrary,
    progress:  renderProgress,
    notes:     renderCoachNotes,
    access:    renderAccessGuard,   // entitlement guard — shown on denied access
  };

  function getRoute() {
    const hash = window.location.hash.replace(/^#/, "").split("/");
    return { view: hash[0] || "welcome", param: hash[1] || null };
  }

  function navigate(view, param) {
    const newHash = param ? `${view}/${param}` : view;
    if (window.location.hash === "#" + newHash) doRender();
    else window.location.hash = newHash;
  }

  function doRender() {
    const { view, param } = getRoute();
    const main = document.getElementById("app-main");
    const fn   = VIEWS[view] || VIEWS.dashboard;
    main.innerHTML = fn(param);
    main.scrollTop = 0;
    _updateNavActive(view === "session" ? "plan" : view === "welcome" ? "" : view);
    _updateNavVisibility(view);
    // Bind click events via delegation on each render
    main.addEventListener("click", handleMainClick);
    // Bind search input if present (uses input event, not click)
    const searchInput = main.querySelector(".ex-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", handleSearchInput);
      searchInput.focus();
    }
  }

  function _updateNavActive(view) {
    document.querySelectorAll(".nav-btn").forEach(b =>
      b.classList.toggle("active", b.dataset.view === view)
    );
  }

  function _updateNavVisibility(view) {
    const nav = document.getElementById("bottom-nav");
    if (!nav) return;
    // one_off: always hide — the session IS the whole app
    if (MODE === ONE_OFF) { nav.classList.add("hidden"); return; }
    // access guard and welcome: hide nav
    nav.classList.toggle("hidden", view === "welcome" || view === "access");
  }

  // ── Shared helpers ─────────────────────────────────────────────────────────
  function fmtDate(d) {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  function painClass(v) {
    if (v == null) return "";
    return v <= 2 ? "pain-low" : v <= 5 ? "pain-mid" : "pain-high";
  }

  function svgIcon(d, extra = "") {
    return `<svg ${extra} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  }

  const ICONS = {
    check:   svgIcon(`<polyline points="20 6 9 17 4 12"/>`),
    chevron: svgIcon(`<polyline points="9 18 15 12 9 6"/>`),
    back:    svgIcon(`<polyline points="15 18 9 12 15 6"/>`),
    image:   svgIcon(`<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>`),
    video:   svgIcon(`<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>`),
    play:    svgIcon(`<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>`),
    arrow:   svgIcon(`<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>`),
    warning: svgIcon(`<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`, 'width="16" height="16"'),
    alert:   svgIcon(`<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`),
    trendUp: svgIcon(`<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>`, 'width="20" height="20"'),
    trendDn: svgIcon(`<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>`, 'width="20" height="20"'),
    stable:  svgIcon(`<line x1="5" y1="12" x2="19" y2="12"/>`, 'width="20" height="20"'),
    fire:    svgIcon(`<path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z"/>`, 'width="18" height="18"'),
    lock:    svgIcon(`<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`, 'width="40" height="40"'),
    search:  svgIcon(`<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`, 'width="18" height="18"'),
  };

  function disclaimer() {
    return `
    <div class="disclaimer-footer">
      <div class="disclaimer-title">&#9888; Important Safety Notice</div>
      <p>${CLIENT_CONFIG.disclaimer}</p>
      <ul class="disclaimer-list">
        <li>This is <strong>not medical advice</strong> — always follow your licensed healthcare provider's guidance.</li>
        <li><strong>Stop immediately</strong> if you experience unusual pain, sharp discomfort, sudden swelling, or numbness.</li>
        <li>This tool supports <strong>coach-led rehabilitation guidance only</strong>.</li>
        <li>Individual results vary — <strong>no specific outcome is guaranteed</strong>.</li>
      </ul>
    </div>`;
  }

  // ── Stats helpers ──────────────────────────────────────────────────────────
  function getNextSession() {
    for (const s of allSessions()) {
      if (!ProgressStore.isSessionDone(s.id)) return s;
    }
    return null;
  }

  function getWeekMeta(weekNumber) {
    return (PROGRAM.weeks || []).find(w => w.weekNumber === weekNumber) || null;
  }

  function getPhase(phaseId) {
    if (!PROGRAM.phases) return null;
    return PROGRAM.phases.find(p => p.id === phaseId) || null;
  }

  function getExercise(id) {
    return EXERCISE_LIBRARY.find(e => e.id === id) || null;
  }

  function getStats() {
    const all    = allSessions();
    const curWk  = PROGRAM.currentWeek || 1;
    const isDone = s => ProgressStore.isSessionDone(s.id);

    const completedAll = all.filter(isDone);
    const ratings = completedAll
      .map(s => ProgressStore.getSession(s.id).painRating)
      .filter(v => v != null);
    const avgPain = ratings.length
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "—";

    if (MODE === COACHING) {
      const streak = ProgressStore.getWeekStreak(all);
      const trend  = ProgressStore.getPainTrend(all);
      return { completed: completedAll.length, total: all.length, avgPain, streak, trend, pct: null };
    }

    const toDate     = all.filter(s => (s.weekNumber || 1) <= curWk);
    const doneToDate = toDate.filter(isDone);
    const pct        = toDate.length ? Math.round(doneToDate.length / toDate.length * 100) : 0;
    return { completed: completedAll.length, total: all.length, doneToDate: doneToDate.length, toDate: toDate.length, pct, avgPain, streak: null, trend: null };
  }

  function trendLabel(trend) {
    if (trend === "improving") return { icon: ICONS.trendDn, label: "Improving", cls: "trend-improving" };
    if (trend === "worsening") return { icon: ICONS.trendUp, label: "Worsening", cls: "trend-worsening" };
    if (trend === "stable")    return { icon: ICONS.stable,  label: "Stable",    cls: "trend-stable"    };
    return { icon: "", label: "Not enough data", cls: "trend-insufficient" };
  }

  // ── Pain sparkline ─────────────────────────────────────────────────────────
  // Inline SVG plotted from pain history. Returns "" if < 2 sessions rated.
  function renderPainSparkline(sessions) {
    const hist = ProgressStore.getPainHistory(sessions);
    if (hist.length < 2) return "";
    const W = 220, H = 48, PAD = 10;
    const plotW = W - PAD * 2, plotH = H - PAD * 2;
    const xStep = hist.length > 1 ? plotW / (hist.length - 1) : plotW;
    const pts = hist.map((d, i) => ({
      x: PAD + i * xStep,
      y: PAD + (1 - d.pain / 10) * plotH,
      pain: d.pain,
    }));
    const polyline = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const trend    = ProgressStore.getPainTrend(sessions);
    const stroke   = trend === "improving" ? "var(--success)"
                   : trend === "worsening" ? "var(--danger)"
                   : "var(--accent)";
    const fillPath = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} `
      + pts.slice(1).map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
      + ` L${pts[pts.length - 1].x.toFixed(1)},${(PAD + plotH).toFixed(1)} L${pts[0].x.toFixed(1)},${(PAD + plotH).toFixed(1)} Z`;
    const dots = pts.map(p =>
      `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="${stroke}" stroke="var(--bg-card)" stroke-width="1.5"/>`
    ).join("");
    const first = hist[0].pain, last = hist[hist.length - 1].pain;
    const delta = last - first;
    const deltaLabel = delta === 0 ? "no change"
      : delta < 0 ? `${Math.abs(delta).toFixed(1)} pts lower`
      : `${delta.toFixed(1)} pts higher`;
    return `
    <div class="pain-sparkline-wrap">
      <div class="pain-sparkline-labels">
        <span>${first}/10</span>
        <span class="pain-sparkline-label-mid">Pain history &mdash; ${deltaLabel}</span>
        <span>${last}/10</span>
      </div>
      <svg class="pain-sparkline" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
        <path d="${fillPath}" fill="${stroke}" opacity=".08"/>
        <polyline points="${polyline}" fill="none" stroke="${stroke}" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}
      </svg>
      <div class="pain-sparkline-axis">
        <span>Session 1</span><span>Session ${hist.length}</span>
      </div>
    </div>`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: ACCESS GUARD
  // Rendered when AccessGuard.check() returns { allowed: false }.
  // Replaces the entire app UI — nav is hidden, no routing past this screen.
  // ─────────────────────────────────────────────────────────────────────────
  function renderAccessGuard() {
    const { heading, body, cta, reason } = ACCESS;
    const { coach } = CLIENT_CONFIG;
    return `
    <div class="access-guard-wrap">
      <div class="access-guard-icon">${ICONS.lock}</div>
      <h2 class="access-guard-heading">${heading || "Access Required"}</h2>
      <p class="access-guard-body">${body || "You do not have access to this program."}</p>
      <div class="access-guard-coach">
        <div class="access-guard-coach-name">${coach.name}</div>
        <div class="access-guard-coach-note">${coach.contactNote}</div>
      </div>
      <div class="access-guard-type">
        Access type: <strong>${(PROGRAM.access?.type || "unknown").replace(/_/g, " ")}</strong>
        &middot; Status: <strong class="access-status-${reason || "unknown"}">${PROGRAM.access?.status || "unknown"}</strong>
      </div>
    </div>`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: WELCOME
  // ─────────────────────────────────────────────────────────────────────────
  function renderWelcome() {
    const { client, coach, appName } = CLIENT_CONFIG;
    const next = getNextSession();

    const subLine = MODE === ONE_OFF
      ? client.conditionDetail
      : MODE === COACHING
      ? `Ongoing coaching — week ${PROGRAM.currentWeek}`
      : `Week ${PROGRAM.currentWeek || 1} of ${PROGRAM_WEEKS}`;

    const btnLabel = MODE === ONE_OFF ? "View My Exercises" : "Open Dashboard";

    const nextHint = MODE === ONE_OFF
      ? `<div class="welcome-next-hint"><strong>${PROGRAM.session?.label || "Your session"}</strong> &middot; ${PROGRAM.session?.exercises?.length || 0} exercises &middot; ${PROGRAM.session?.duration || ""}</div>`
      : next
      ? `<div class="welcome-next-hint"><span>Next up:</span> <strong>${next.weekNumber ? `Week ${next.weekNumber} &middot; ` : ""}${next.day || ""} &middot; ${next.exercises.length} exercises</strong></div>`
      : MODE === COACHING
      ? `<div class="welcome-next-hint"><strong>No upcoming sessions yet — your coach will add them soon.</strong></div>`
      : `<div class="welcome-next-hint"><strong>Program complete — speak with your coach about next steps.</strong></div>`;

    return `
    <div class="welcome-screen">
      <div class="welcome-logo">${CLIENT_CONFIG.logoText}</div>
      <h1 class="welcome-app-name">${appName}</h1>
      <p class="welcome-tagline">Coach-led rehabilitation &amp; recovery</p>

      <div class="welcome-hero-card">
        <div class="welcome-client-name">Welcome back, ${client.firstName}</div>
        <div class="welcome-condition">${client.condition}</div>
        <div class="welcome-detail">${client.conditionDetail}</div>
        <div class="welcome-meta-row">
          <div class="welcome-meta-item">
            <span class="welcome-meta-val">${subLine}</span>
            <span class="welcome-meta-label">${MODE === COACHING ? "Subscription active" : "Your program"}</span>
          </div>
          <div class="welcome-meta-divider"></div>
          <div class="welcome-meta-item">
            <span class="welcome-meta-val">${coach.name}</span>
            <span class="welcome-meta-label">${coach.credentials}</span>
          </div>
        </div>
      </div>

      ${nextHint}

      <button class="btn-welcome-enter" data-action="enter-program">
        ${btnLabel} ${ICONS.arrow}
      </button>

      <p class="welcome-disclaimer-mini">
        Not medical advice. Supports coach-led rehabilitation only.
        Stop exercising and contact your provider if symptoms worsen.
      </p>
    </div>`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: DASHBOARD
  // one_off        — not used (enters directly to session)
  // multi_week     — progress ring + week/pain stats + next session
  // ongoing_coaching — today's session + streak + pain trend
  // ─────────────────────────────────────────────────────────────────────────
  function renderDashboard() {
    const { client } = CLIENT_CONFIG;
    const stats  = getStats();
    const next   = getNextSession();
    const curWk  = PROGRAM.currentWeek || 1;
    const wkMeta = getWeekMeta(curWk);
    const phase  = wkMeta?.phaseId ? getPhase(wkMeta.phaseId) : null;

    let html = `
    <p class="greeting">Hi, ${client.firstName}</p>
    <p class="greeting-sub">${wkMeta ? `Week ${curWk} — ${wkMeta.focus}` : `Week ${curWk}`}</p>`;

    // ── Stats block — mode-specific ──────────────────────────────────────
    if (MODE === COACHING) {
      html += _renderCoachingStats(stats, phase);
    } else {
      html += _renderProgressRing(stats, phase);
    }

    // ── Next / Today session ─────────────────────────────────────────────
    if (next) {
      const wm = getWeekMeta(next.weekNumber);
      const sessionLabel = MODE === COACHING ? "Today's Session" : "Next Session";
      html += `
      <p class="section-label">${sessionLabel}</p>
      <div class="next-session-card">
        <div class="next-session-tag">${next.weekNumber ? `Week ${next.weekNumber}` : ""}${wm ? ` &middot; ${wm.focus}` : ""}</div>
        <div class="next-session-title">${next.day || ""} — ${next.label}</div>
        <div class="next-session-meta">${next.exercises.length} exercises &middot; ${next.duration}</div>
        <button class="btn-start" data-action="start-session" data-session="${next.id}">
          ${ICONS.play} Start Session
        </button>
      </div>`;
    } else if (MODE === COACHING) {
      html += `<p class="section-label">Program Status</p>
      <div class="card"><p style="font-size:15px;font-weight:700;color:var(--accent)">Awaiting next session from your coach.</p>
      <p class="text-muted" style="margin-top:6px;font-size:14px">Your coach will assign your next block soon.</p></div>`;
    } else {
      html += `<p class="section-label">Program Status</p>
      <div class="card"><p style="font-size:15px;font-weight:700;color:var(--success)">Program complete!</p>
      <p class="text-muted" style="margin-top:6px;font-size:14px">Speak with your coach about next steps and a maintenance plan.</p></div>`;
    }

    // ── Profile shortcut ─────────────────────────────────────────────────
    html += `
    <p class="section-label">My Profile</p>
    <div class="profile-shortcut-card" data-action="go-overview">
      <div class="profile-shortcut-left">
        <div class="profile-avatar">${client.firstName[0]}${client.lastName[0]}</div>
        <div>
          <div style="font-size:15px;font-weight:700">${client.firstName} ${client.lastName}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:2px">${client.condition}</div>
        </div>
      </div>
      <div class="profile-shortcut-right">${ICONS.chevron}</div>
    </div>`;

    // ── Milestones ───────────────────────────────────────────────────────
    if ((PROGRAM.milestones || []).length) {
      html += `<p class="section-label">Milestones</p><div class="card card-flush"><ul class="milestone-list" style="padding:0 18px">`;
      PROGRAM.milestones.forEach(m => {
        html += `<li class="milestone-item">
          <span class="milestone-check ${m.achieved ? "done" : "todo"}">${m.achieved ? ICONS.check : ""}</span>
          <span style="font-size:14px;line-height:1.4">${m.label}</span>
          ${m.week ? `<span class="milestone-week">Wk ${m.week}</span>` : ""}
        </li>`;
      });
      html += `</ul></div>`;
    }

    html += disclaimer();
    return html;
  }

  function _renderProgressRing(stats, phase) {
    const { pct, completed, avgPain } = stats;
    const curWk  = PROGRAM.currentWeek || 1;
    const radius = 40, circ = 2 * Math.PI * radius;
    const dash   = circ - (pct / 100) * circ;
    return `
    <div class="card" style="margin-bottom:14px">
      <div class="progress-summary">
        <div class="progress-ring-wrap">
          <svg width="100" height="100" style="transform:rotate(-90deg)">
            <circle cx="50" cy="50" r="${radius}" stroke="var(--border)" stroke-width="9" fill="none"/>
            <circle cx="50" cy="50" r="${radius}" stroke="var(--accent)" stroke-width="9" fill="none"
              stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${dash.toFixed(1)}"
              stroke-linecap="round" style="transition:stroke-dashoffset .6s ease"/>
          </svg>
          <div class="progress-ring-label">
            <span class="progress-ring-pct">${pct}%</span>
            <span class="progress-ring-sub">Done</span>
          </div>
        </div>
        <div class="progress-ring-info">
          <h3>${completed} sessions complete</h3>
          <p style="font-size:14px;color:var(--text-muted);line-height:1.5;margin-top:4px">
            Consistency is the key to recovery. Keep it up.
          </p>
          ${phase ? `<div class="phase-pill" style="margin-top:10px"><span class="phase-dot" style="background:${phase.color}"></span><span style="color:${phase.color};font-size:12px;font-weight:700">${phase.label}</span></div>` : ""}
        </div>
      </div>
    </div>
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-value">${curWk}/${PROGRAM_WEEKS}</div>
        <div class="stat-label">Weeks</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:${avgPain === "—" ? "var(--text)" : +avgPain <= 2 ? "var(--success)" : +avgPain <= 5 ? "var(--warning)" : "var(--danger)"}">${avgPain}</div>
        <div class="stat-label">Avg Pain</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${completed}</div>
        <div class="stat-label">Sessions</div>
      </div>
    </div>`;
  }

  function _renderCoachingStats(stats, phase) {
    const { completed, avgPain, streak, trend } = stats;
    const curWk = PROGRAM.currentWeek || 1;
    const td    = trendLabel(trend);
    return `
    <div class="coaching-stats-row">
      <div class="coaching-stat-card">
        <div class="coaching-stat-icon">${ICONS.fire}</div>
        <div class="coaching-stat-value">${streak}</div>
        <div class="coaching-stat-label">Week streak</div>
      </div>
      <div class="coaching-stat-card">
        <div class="coaching-stat-value" style="color:${avgPain === "—" ? "var(--text)" : +avgPain <= 2 ? "var(--success)" : +avgPain <= 5 ? "var(--warning)" : "var(--danger)"}">${avgPain}</div>
        <div class="coaching-stat-label">Avg pain (0–10)</div>
      </div>
      <div class="coaching-stat-card">
        <div class="coaching-stat-value">${completed}</div>
        <div class="coaching-stat-label">Total sessions</div>
      </div>
    </div>
    <div class="trend-card ${td.cls}">
      <div class="trend-icon">${td.icon}</div>
      <div>
        <div class="trend-label">Pain trend</div>
        <div class="trend-value">${td.label}</div>
      </div>
      ${PROGRAM.currentWeek ? `<div class="trend-week" style="margin-left:auto;font-size:12px;opacity:.7">Week ${curWk}</div>` : ""}
    </div>`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: OVERVIEW  (client profile + outcomes + goals + phases)
  // ─────────────────────────────────────────────────────────────────────────
  function renderOverview() {
    const { client, coach } = CLIENT_CONFIG;
    const goals    = PROGRAM.goals    || [];
    const outcomes = PROGRAM.outcomes || null;

    let html = `
    <div class="overview-hero">
      <div class="overview-client-name">${client.firstName} ${client.lastName}</div>
      <div class="overview-condition">${client.condition}</div>
      <div class="overview-detail">${client.conditionDetail}</div>
    </div>

    <div class="card card-sm" style="margin-bottom:14px">
      ${[
        ["Age",           client.age],
        ["Program Start", fmtDate(client.startDate)],
        ["Mode",          `<span class="mode-badge mode-${MODE}">${MODE.replace(/_/g," ")}</span>`],
        ["Duration",      MODE === ONE_OFF ? "Single session" : MODE === COACHING ? "Ongoing" : `${PROGRAM_WEEKS} weeks`],
        ...(MODE !== ONE_OFF ? [["Current Week", `<span style="color:var(--accent);font-weight:700">Week ${PROGRAM.currentWeek || 1}</span>`]] : []),
        ...(PROGRAM.access ? [["Access",  `${(PROGRAM.access.type || "").replace(/_/g," ")} &middot; <span style="color:${PROGRAM.access.status === "active" ? "var(--success)" : "var(--danger)"}">${PROGRAM.access.status}</span>`]] : []),
      ].map(([label, val]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:13px;color:var(--text-muted)">${label}</span>
          <span style="font-size:14px;font-weight:600">${val}</span>
        </div>`).join("")}
    </div>

    <div class="coach-card">
      <div class="coach-name">${coach.name}, ${coach.credentials}</div>
      <div class="coach-creds">Your Rehab Coach</div>
      <div class="coach-note">${coach.contactNote}</div>
    </div>`;

    // Outcome targets
    if (outcomes && MODE !== ONE_OFF) {
      html += `<p class="section-label">Outcome Targets</p><div class="card card-flush">`;
      if (outcomes.pain) {
        html += `<div class="outcome-row"><div class="outcome-label">Pain (${outcomes.pain.unit})</div>
          <div class="outcome-values">
            <span class="outcome-chip baseline">Baseline: <strong>${outcomes.pain.baseline}</strong></span>
            <span class="outcome-chip target">Target: <strong>${outcomes.pain.target}</strong></span>
          </div></div>`;
      }
      if (outcomes.rom) {
        html += `<div class="outcome-row"><div class="outcome-label">ROM — ${outcomes.rom.unit}</div>
          <div class="outcome-values">
            <span class="outcome-chip baseline">Baseline: <strong>${outcomes.rom.baseline}</strong></span>
            <span class="outcome-chip target">Target: <strong>${outcomes.rom.target}</strong></span>
          </div></div>`;
      }
      if (outcomes.strength) {
        html += `<div class="outcome-row"><div class="outcome-label">Strength — ${outcomes.strength.unit}</div>
          <div class="outcome-values">
            <span class="outcome-chip baseline">Baseline: <strong>${outcomes.strength.baseline}</strong></span>
            <span class="outcome-chip target">Target: <strong>${outcomes.strength.target}</strong></span>
          </div></div>`;
      }
      if (outcomes.readiness) {
        const rd = outcomes.readiness;
        html += `<div class="outcome-row outcome-row-last">
          <div class="outcome-label">Return to activity</div>
          <div class="outcome-values">
            <span class="outcome-chip ${rd.cleared ? "cleared" : "pending"}">${rd.cleared ? "&#10003; Cleared" : "Pending"}</span>
            <span style="font-size:12px;color:var(--text-muted);margin-left:6px">${rd.label}</span>
          </div></div>`;
      }
      html += `</div>`;
    }

    // Program goals
    if (goals.length) {
      html += `<p class="section-label">Program Goals</p>
      <div class="card card-flush"><ul class="goals-list" style="padding:0 18px">`;
      goals.forEach((g, i) => {
        html += `<li class="goal-item"><span class="goal-bullet">${i + 1}</span><span>${g}</span></li>`;
      });
      html += `</ul></div>`;
    }

    // Phase overview — multi_week only
    if (MODE === MULTI_WK && PROGRAM.phases?.length) {
      html += `<p class="section-label">Program Phases</p>`;
      PROGRAM.phases.forEach(ph => {
        html += `<div class="card card-sm" style="border-left:4px solid ${ph.color};margin-bottom:10px">
          <div style="font-size:14px;font-weight:700;margin-bottom:4px">${ph.label}
            <span style="color:var(--text-muted);font-weight:400;font-size:12px"> (Weeks ${ph.weeks})</span></div>
          <div style="font-size:13px;color:var(--text-muted);line-height:1.5">${ph.focus}</div>
        </div>`;
      });
    }

    // Coach notes shortcut
    if ((PROGRAM.coachNotes || []).length) {
      html += `
      <p class="section-label">Coach Notes</p>
      <div class="profile-shortcut-card" data-action="go-notes">
        <div style="flex:1">
          <div style="font-size:15px;font-weight:700">${PROGRAM.coachNotes.length} notes from ${coach.name}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:2px">Tap to read latest updates</div>
        </div>
        <div class="profile-shortcut-right">${ICONS.chevron}</div>
      </div>`;
    }

    html += disclaimer();
    return html;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: PLAN
  // multi_week     — all weeks with phase dividers
  // ongoing_coaching — rolling window: curWk-2 through curWk+2
  // ─────────────────────────────────────────────────────────────────────────
  function renderPlan() {
    const sessions = allSessions();
    const curWk    = PROGRAM.currentWeek || 1;
    const nextSess = getNextSession();

    // Group by weekNumber — sessions without weekNumber go under week 1
    const byWeek = new Map();
    sessions.forEach(s => {
      const wk = s.weekNumber || 1;
      if (!byWeek.has(wk)) byWeek.set(wk, []);
      byWeek.get(wk).push(s);
    });
    const allWeeks    = Array.from(byWeek.keys()).sort((a, b) => a - b);
    const visibleWeeks = MODE === COACHING
      ? allWeeks.filter(w => w >= curWk - 2 && w <= curWk + 2)
      : allWeeks;

    const titleLine = MODE === COACHING
      ? `Ongoing Program — Week ${curWk}`
      : `Your ${PROGRAM_WEEKS}-Week Program`;

    let html = `<p class="section-label" style="margin-top:4px">${titleLine}</p>`;

    if (MODE === COACHING && curWk > 2) {
      html += `<div class="plan-history-note">Showing weeks ${Math.max(1, curWk - 2)}–${curWk + 2}. Earlier history is visible in Progress.</div>`;
    }

    let lastPhaseId = null;

    visibleWeeks.forEach(weekNum => {
      const weekSessions = byWeek.get(weekNum);
      const wkMeta       = getWeekMeta(weekNum);
      const phaseId      = wkMeta?.phaseId || weekSessions[0]?.phaseId;
      const phase        = getPhase(phaseId);

      // Phase dividers — multi_week with phases only
      if (MODE === MULTI_WK && phase && phaseId !== lastPhaseId) {
        html += `<div class="phase-divider">
          <div class="phase-divider-line"></div>
          <span class="phase-divider-label" style="color:${phase.color}">${phase.label}</span>
          <div class="phase-divider-line"></div>
        </div>`;
        lastPhaseId = phaseId;
      }

      const doneCount = weekSessions.filter(s => ProgressStore.isSessionDone(s.id)).length;
      const allDone   = doneCount === weekSessions.length;
      const isPast    = weekNum < curWk;
      const isCur     = weekNum === curWk;

      const badge = isCur
        ? `<span class="week-badge current">Current</span>`
        : (allDone || isPast)
        ? `<span class="week-badge complete">&#10003; Done</span>`
        : `<span class="week-badge upcoming">Upcoming</span>`;

      html += `<div class="week-card"><div class="week-header">
        <span class="week-num">Week ${weekNum}</span>
        <span class="week-focus">${wkMeta?.focus || ""}</span>
        ${badge}
      </div>`;

      weekSessions.forEach(session => {
        const isDone  = ProgressStore.isSessionDone(session.id);
        const isNext  = !isDone && nextSess?.id === session.id;
        const st      = ProgressStore.getSession(session.id);
        const painVal = st.painRating;
        const dotCls  = isDone ? "done" : isNext ? "next" : "upcoming";
        const dotIcon = isDone ? ICONS.check : isNext ? "&#8594;" : "&middot;";

        html += `<div class="session-row" data-action="open-session" data-session="${session.id}">
          <span class="session-dot ${dotCls}">${dotIcon}</span>
          <div class="session-info">
            <div class="session-day">${session.day || ""} — ${session.label}</div>
            <div class="session-dur">${session.exercises.length} exercises &middot; ${session.duration}</div>
          </div>
          ${painVal != null ? `<div class="session-pain">
            <span class="session-pain-dot" style="background:${painVal <= 2 ? "var(--success)" : painVal <= 5 ? "var(--warning)" : "var(--danger)"}"></span>
            <span>${painVal}/10</span>
          </div>` : ""}
          <svg class="session-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`;
      });

      html += `</div>`;
    });

    if (MODE === COACHING) {
      html += `<div class="coaching-extend-note">
        ${ICONS.arrow}
        <span>Your coach will add upcoming sessions as your program progresses.</span>
      </div>`;
    }

    html += disclaimer();
    return html;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: SESSION
  // one_off   — renders PROGRAM.session directly, no back button
  // multi/coaching — looks up session by id in PROGRAM.sessions[]
  // ─────────────────────────────────────────────────────────────────────────
  function renderSessionView(sessionId) {
    let session;
    if (MODE === ONE_OFF) {
      session = PROGRAM.session;
    } else {
      session = allSessions().find(s => s.id === sessionId);
    }

    if (!session) {
      return `<button class="back-btn" data-action="back">${ICONS.back} Back</button>
        <div class="card"><p class="text-muted">Session not found.</p></div>`;
    }

    const st           = ProgressStore.getSession(session.id);
    const sessionDone  = ProgressStore.isSessionDone(session.id);
    const checkedCount = session.exercises.filter(id => st.exercises[id]).length;
    const valErrors    = Validator.errorsForSession(session.id, PROGRAM, EXERCISE_LIBRARY);
    const wkMeta       = getWeekMeta(session.weekNumber);

    const headerTitle = session.weekNumber
      ? `Week ${session.weekNumber} — ${session.day || ""}`
      : session.day || session.label;

    let html = MODE !== ONE_OFF
      ? `<button class="back-btn" data-action="back">${ICONS.back} Back to Plan</button>` : "";

    html += `
    <div class="session-header-card">
      <div class="session-header-title">${headerTitle}</div>
      <div class="session-header-meta">${session.label} &middot; ${session.duration} &middot; ${session.exercises.length} exercises</div>
      ${!sessionDone && session.exercises.length > 0 ? `
      <div class="session-progress-row">
        <div class="session-progress-track">
          <div class="session-progress-fill" style="width:${Math.round(checkedCount / session.exercises.length * 100)}%"></div>
        </div>
        <span class="session-progress-label">${checkedCount}/${session.exercises.length}</span>
      </div>` : ""}
    </div>`;

    // Validation errors — visible, not silent
    if (valErrors.length) {
      html += `<div class="validation-error-card">
        <div class="validation-error-title">${ICONS.warning} Missing exercises detected</div>
        <ul class="validation-error-list">
          ${valErrors.map(e => `<li><code>${e.exerciseId}</code> — not in the exercise library. Ask your coach to update the program.</li>`).join("")}
        </ul>
      </div>`;
    }

    if (!sessionDone) {
      html += `<div class="session-instructions">
        Tap the circle next to each exercise when completed.
        All exercises must be marked done before you can log the session.
      </div>`;
    }

    // ── Exercise cards ───────────────────────────────────────────────────
    session.exercises.forEach(exId => {
      const ex = getExercise(exId);
      if (!ex) {
        html += `<div class="exercise-missing-card">
          ${ICONS.alert}
          <div>
            <div class="exercise-missing-id"><code>${exId}</code></div>
            <div class="exercise-missing-msg">This exercise was not found in the library. Contact your coach.</div>
          </div>
        </div>`;
        return;
      }

      const checked  = !!st.exercises[exId];
      const catClass = "cat-" + ex.category.replace(/[\s\/]+/g, "-");

      html += `
      <div class="exercise-session-card ${checked ? "done" : ""}" id="exc-${exId}">
        <div class="ex-top">
          <button class="ex-check ${checked ? "checked" : ""}" data-action="toggle-exercise"
            data-session="${session.id}" data-exercise="${exId}"
            aria-label="${checked ? "Mark incomplete" : "Mark complete"}" aria-pressed="${checked}">
            ${checked ? ICONS.check : ""}
          </button>
          <div class="ex-body">
            <div class="ex-name">${ex.name}</div>
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:4px">
              <span class="ex-category-badge ${catClass}">${ex.category}</span>
              ${ex.bodyRegion     ? `<span class="ex-meta-chip">${ex.bodyRegion}</span>`     : ""}
              ${ex.movementPattern ? `<span class="ex-meta-chip">${ex.movementPattern}</span>` : ""}
              ${ex.equipment      ? `<span class="ex-meta-chip equip">${ex.equipment}</span>` : ""}
            </div>
            <div class="ex-desc" style="margin-top:8px">${ex.description}</div>

            <div class="ex-specs">
              ${ex.sets  ? `<div class="spec-chip"><strong>${ex.sets}</strong> <span>sets</span></div>` : ""}
              ${ex.reps  ? `<div class="spec-chip"><strong>${ex.reps}</strong> <span>reps</span></div>` : ""}
              ${ex.hold  ? `<div class="spec-chip"><strong>${ex.hold}</strong> <span>hold</span></div>` : ""}
              ${ex.tempo ? `<div class="spec-chip spec-chip-wide"><span>Tempo </span><strong>${ex.tempo}</strong></div>` : ""}
              ${ex.rest  ? `<div class="spec-chip spec-chip-wide"><span>Rest </span><strong>${ex.rest}</strong></div>` : ""}
            </div>

            <div class="ex-cue"><span class="ex-cue-label">Coaching cue</span>${ex.cue}</div>
            ${ex.painNote ? `<div class="ex-pain-note"><span class="ex-pain-label">&#9888; Pain note</span>${ex.painNote}</div>` : ""}
            ${ex.contraindications?.length ? `
            <div class="ex-contraindications">
              <span class="ex-contra-label">Not suitable if:</span>
              ${ex.contraindications.join(" &middot; ")}
            </div>` : ""}

            ${ex.imageSrc
              ? `<img src="${ex.imageSrc}" alt="${ex.imageAlt}" class="ex-image" loading="lazy">`
              : `<div class="ex-image-placeholder">
                  <div class="ex-image-icon">${ex.videoSrc ? ICONS.video : ICONS.image}</div>
                  <div class="ex-image-text">
                    <span class="ex-image-name">${ex.name}</span>
                    <span class="ex-image-sub">${ex.imageAlt}</span>
                  </div>
                </div>`}

            ${ex.videoSrc
              ? `<a href="${ex.videoSrc}" target="_blank" rel="noopener noreferrer" class="ex-video-link">
                  ${ICONS.play} Watch exercise video
                </a>`
              : ""}
          </div>
        </div>
      </div>`;
    });

    // ── Session complete / log button ────────────────────────────────────
    if (sessionDone) {
      const note = st.note ? `<div class="session-note-display"><span class="session-note-label">Your note</span>${st.note}</div>` : "";
      html += `
      <div class="session-complete-card">
        <div style="font-size:40px;margin-bottom:10px">&#9989;</div>
        <div class="session-complete-title">Session Complete!</div>
        <div class="session-complete-meta">
          ${st.painRating != null
            ? `Pain: <span class="${painClass(st.painRating)} inline-pill">${st.painRating}/10</span>
               &nbsp;&middot;&nbsp; Effort: <strong>${st.effortRating}/5</strong>`
            : "Well done on completing this session."}
        </div>
        ${note}
        ${MODE !== ONE_OFF ? `<button class="btn-secondary" data-action="back" style="margin-top:16px">Back to Plan</button>` : ""}
      </div>`;

      // one_off: after completion show the coach notes prominently
      if (MODE === ONE_OFF && (PROGRAM.coachNotes || []).length) {
        html += `<p class="section-label">Instructions from your coach</p>`;
        PROGRAM.coachNotes.forEach(note => {
          html += `<div class="note-card">
            <div class="note-date">${fmtDate(note.date)}</div>
            <div class="note-title">${note.title}</div>
            <div class="note-body">${note.body}</div>
          </div>`;
        });
      }
    } else {
      const validExercises  = session.exercises.filter(id => getExercise(id) !== null);
      const allValidChecked = validExercises.length > 0 && validExercises.every(id => st.exercises[id]);
      html += `
      <div class="complete-btn-wrap">
        ${!allValidChecked ? `<p class="complete-hint">Complete all exercises above to unlock session log.</p>` : ""}
        <button class="btn-complete" data-action="open-checkin" data-session="${session.id}"
          ${allValidChecked ? "" : "disabled"}>
          ${allValidChecked ? "Log Session &amp; Check In" : `${checkedCount} / ${session.exercises.length} exercises done`}
        </button>
      </div>`;
    }

    html += disclaimer();
    return html;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: EXERCISE LIBRARY  (with live text search + category filter chips)
  // ─────────────────────────────────────────────────────────────────────────
  function renderExerciseLibrary(filter) {
    // filter format: "all" | "phase:N" | "region:X" | "search:query"
    const hasPhases = EXERCISE_LIBRARY.some(e => e.phase);
    const regions   = [...new Set(EXERCISE_LIBRARY.map(e => e.bodyRegion).filter(Boolean))];

    const filters = [{ key: "all", label: "All" }];
    if (hasPhases) [1, 2, 3].forEach(p => {
      if (EXERCISE_LIBRARY.some(e => e.phase === p)) filters.push({ key: `phase:${p}`, label: `Phase ${p}` });
    });
    regions.forEach(r => filters.push({ key: `region:${r}`, label: r.charAt(0).toUpperCase() + r.slice(1) }));

    // Separate search term from category filter
    let searchTerm = "";
    let activeFilter = filter || "all";
    if (activeFilter && activeFilter.startsWith("search:")) {
      searchTerm   = activeFilter.slice(7);
      activeFilter = "all";
    }

    // Apply category filter first
    let filtered = activeFilter === "all"
      ? EXERCISE_LIBRARY.slice()
      : activeFilter.startsWith("region:") ? EXERCISE_LIBRARY.filter(e => e.bodyRegion === activeFilter.slice(7))
      : activeFilter.startsWith("phase:")  ? EXERCISE_LIBRARY.filter(e => String(e.phase) === activeFilter.slice(6))
      : EXERCISE_LIBRARY.slice();

    // Apply text search (searches name, description, category, bodyRegion, movementPattern)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(q) ||
        (e.description || "").toLowerCase().includes(q) ||
        (e.category || "").toLowerCase().includes(q) ||
        (e.bodyRegion || "").toLowerCase().includes(q) ||
        (e.movementPattern || "").toLowerCase().includes(q)
      );
    }

    let html = `<p class="section-label" style="margin-top:4px">Exercise Library</p>

    <div class="ex-search-wrap">
      <span class="ex-search-icon">${ICONS.search}</span>
      <input class="ex-search-input" type="search" placeholder="Search exercises…"
        value="${searchTerm.replace(/"/g, "&quot;")}"
        autocomplete="off" autocorrect="off" spellcheck="false"
        data-current-filter="${activeFilter}" />
    </div>

    <div class="filter-row">`;
    filters.forEach(({ key, label }) => {
      html += `<button class="filter-chip ${activeFilter === key && !searchTerm ? "active" : ""}"
        data-action="filter-exercises" data-filter="${key}">${label}</button>`;
    });
    html += `</div>`;

    if (!filtered.length) {
      html += `<div class="empty-state">
        <p>${searchTerm ? `No exercises match "${searchTerm}".` : "No exercises in this category."}</p>
        ${searchTerm ? `<button class="btn-secondary" data-action="filter-exercises" data-filter="all" style="margin-top:12px">Clear search</button>` : ""}
      </div>`;
    }

    filtered.forEach(ex => {
      const catClass = "cat-" + ex.category.replace(/[\s\/]+/g, "-");
      html += `
      <div class="exercise-lib-card" data-action="open-exercise" data-exercise="${ex.id}">
        <div class="ex-lib-top">
          <span class="ex-category-badge ${catClass}">${ex.category}</span>
          ${ex.phase ? `<span class="ex-lib-phase-badge">Phase ${ex.phase}</span>` : ""}
          ${ex.bodyRegion ? `<span class="ex-meta-chip" style="margin-left:auto;margin-right:22px">${ex.bodyRegion}</span>` : ""}
          <span class="ex-lib-chevron">${ICONS.chevron}</span>
        </div>
        <div class="ex-lib-name">${ex.name}</div>
        <div class="ex-lib-desc">${ex.description}</div>
        <div class="ex-lib-specs">
          ${ex.sets  ? `<span>${ex.sets} sets</span>` : ""}
          ${ex.reps  ? `<span>${ex.reps} reps</span>` : ""}
          ${ex.hold  ? `<span>${ex.hold} hold</span>` : ""}
          ${ex.equipment      ? `<span>${ex.equipment}</span>`      : ""}
          ${ex.movementPattern ? `<span>${ex.movementPattern}</span>` : ""}
        </div>
      </div>`;
    });

    html += disclaimer();
    return html;
  }

  // Search input handler — live filter without full page navigation
  function handleSearchInput(e) {
    const input        = e.target;
    const q            = input.value;
    const filterBase   = input.dataset.currentFilter || "all";
    const main         = document.getElementById("app-main");
    const activeFilter = q.trim() ? `search:${q}` : filterBase;

    // Re-render only the card list, preserving the input focus + value
    const newHtml = renderExerciseLibrary(activeFilter);
    const tmp     = document.createElement("div");
    tmp.innerHTML = newHtml;

    // Replace the cards area (everything after filter-row)
    const existingCards   = main.querySelectorAll(".exercise-lib-card, .empty-state");
    const existingDisclaim = main.querySelector(".disclaimer-footer");
    existingCards.forEach(el => el.remove());
    if (existingDisclaim) existingDisclaim.remove();

    const newCards = tmp.querySelectorAll(".exercise-lib-card, .empty-state, .disclaimer-footer");
    newCards.forEach(el => main.appendChild(el));

    // Re-bind click on the main area (harmless — event delegation)
    main.addEventListener("click", handleMainClick);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: PROGRESS
  // multi_week     — % ring, phase bars, week completion grid, outcomes
  // ongoing_coaching — streak, trend, sparkline, history table
  // ─────────────────────────────────────────────────────────────────────────
  function renderProgress() {
    const stats    = getStats();
    const { completed, total, avgPain, trend } = stats;
    const curWk    = PROGRAM.currentWeek || 1;
    const sessions = allSessions();
    const outcomes = PROGRAM.outcomes || null;
    const assessments = PROGRAM.assessments || [];

    let html = `<p class="section-label" style="margin-top:4px">Overall Progress</p>
    <div class="card" style="margin-bottom:14px">`;

    if (MODE === COACHING) {
      const td = trendLabel(trend);
      html += `
      <div class="coaching-stats-row" style="margin-bottom:14px">
        <div class="coaching-stat-card">
          <div class="coaching-stat-icon">${ICONS.fire}</div>
          <div class="coaching-stat-value">${stats.streak}</div>
          <div class="coaching-stat-label">Week streak</div>
        </div>
        <div class="coaching-stat-card">
          <div class="coaching-stat-value" style="color:${avgPain === "—" ? "var(--text)" : +avgPain <= 2 ? "var(--success)" : +avgPain <= 5 ? "var(--warning)" : "var(--danger)"}">${avgPain}</div>
          <div class="coaching-stat-label">Avg pain</div>
        </div>
        <div class="coaching-stat-card">
          <div class="coaching-stat-value">${completed}</div>
          <div class="coaching-stat-label">Sessions done</div>
        </div>
      </div>
      <div class="trend-card ${td.cls}" style="margin-bottom:0">
        <div class="trend-icon">${td.icon}</div>
        <div><div class="trend-label">Pain trend</div><div class="trend-value">${td.label}</div></div>
      </div>
      ${renderPainSparkline(sessions)}`;
    } else {
      const pct = stats.pct;
      html += `
      <div style="font-size:36px;font-weight:800;color:var(--accent);margin-bottom:2px">${pct}%</div>
      <div style="font-size:14px;color:var(--text-muted);margin-bottom:18px">${completed} of ${total} sessions completed</div>
      <div class="progress-bar-wrap" style="margin-bottom:14px">
        <div class="progress-bar-label">
          <span style="font-weight:600">Overall</span>
          <span style="color:var(--accent);font-weight:700">${pct}%</span>
        </div>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      </div>`;

      if (MODE === MULTI_WK && PROGRAM.phases?.length) {
        PROGRAM.phases.forEach((ph, i) => {
          const ps = sessions.filter(s => s.phaseId === ph.id);
          const dn = ps.filter(s => ProgressStore.isSessionDone(s.id)).length;
          const pp = ps.length ? Math.round(dn / ps.length * 100) : 0;
          html += `
          <div class="progress-bar-wrap"${i < PROGRAM.phases.length - 1 ? ' style="margin-bottom:14px"' : ""}>
            <div class="progress-bar-label">
              <span style="font-weight:600;color:${ph.color}">${ph.label}</span>
              <span style="color:${ph.color};font-weight:700">${dn}/${ps.length}</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width:${pp}%;background:${ph.color}"></div>
            </div>
          </div>`;
        });
      }

      // Pain sparkline for multi_week
      html += renderPainSparkline(sessions);
    }

    html += `</div>`;

    // ── Summary stats row ───────────────────────────────────────────────
    html += `
    <div class="stat-row" style="margin-bottom:16px">
      <div class="stat-card">
        <div class="stat-value" style="color:${avgPain === "—" ? "var(--text)" : +avgPain <= 2 ? "var(--success)" : +avgPain <= 5 ? "var(--warning)" : "var(--danger)"}">${avgPain}</div>
        <div class="stat-label">Avg Pain</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${curWk}${MODE !== COACHING ? `/${PROGRAM_WEEKS}` : ""}</div>
        <div class="stat-label">Current Week</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${(PROGRAM.milestones || []).filter(m => m.achieved).length}/${(PROGRAM.milestones || []).length || "—"}</div>
        <div class="stat-label">Milestones</div>
      </div>
    </div>`;

    // ── Week completion grid — multi_week only ──────────────────────────
    if (MODE === MULTI_WK && sessions.length) {
      const byWeek = new Map();
      sessions.forEach(s => {
        const wk = s.weekNumber || 1;
        if (!byWeek.has(wk)) byWeek.set(wk, []);
        byWeek.get(wk).push(s);
      });
      const sortedWeeks = Array.from(byWeek.keys()).sort((a, b) => a - b);

      html += `<p class="section-label">Week-by-Week Completion</p>
      <div class="card card-flush week-grid-wrap">`;
      sortedWeeks.forEach(wk => {
        const wkSessions = byWeek.get(wk);
        const wkMeta     = getWeekMeta(wk);
        const phaseId    = wkMeta?.phaseId || wkSessions[0]?.phaseId;
        const phase      = getPhase(phaseId);
        const isCur      = wk === curWk;
        html += `
        <div class="week-grid-row ${isCur ? "current-week" : ""}">
          <div class="week-grid-label">Wk ${wk}</div>
          <div class="week-grid-cells">
            ${wkSessions.map(s => {
              const done = ProgressStore.isSessionDone(s.id);
              const st   = ProgressStore.getSession(s.id);
              const col  = phase ? phase.color : "var(--accent)";
              const painColor = st.painRating != null
                ? (st.painRating <= 2 ? "var(--success)" : st.painRating <= 5 ? "var(--warning)" : "var(--danger)")
                : col;
              return `<div class="week-grid-cell ${done ? "done" : "todo"}"
                style="${done ? `background:${painColor};border-color:${painColor}` : ""}"
                title="${done ? `Done — Pain: ${st.painRating != null ? st.painRating + "/10" : "—"} Effort: ${st.effortRating != null ? st.effortRating + "/5" : "—"}` : `${s.day || s.label} — not done`}">
              </div>`;
            }).join("")}
          </div>
          <div class="week-grid-focus">${wkMeta?.focus || ""}</div>
        </div>`;
      });
      html += `<div class="week-grid-legend">
        <span class="week-grid-legend-dot done" style="background:var(--success)"></span><span>Done — low pain</span>
        <span class="week-grid-legend-dot done" style="background:var(--warning);margin-left:10px"></span><span>Done — moderate</span>
        <span class="week-grid-legend-dot done" style="background:var(--danger);margin-left:10px"></span><span>Done — high</span>
        <span class="week-grid-legend-dot todo" style="margin-left:10px"></span><span>Not done</span>
      </div></div>`;
    }

    // ── Outcome targets ──────────────────────────────────────────────────
    if (outcomes && MODE !== ONE_OFF) {
      html += `<p class="section-label">Outcome Targets</p>
      <div class="card card-sm" style="margin-bottom:14px">`;
      const rows = [
        outcomes.pain     ? ["Pain",     outcomes.pain.baseline,     outcomes.pain.target,     outcomes.pain.unit]     : null,
        outcomes.rom      ? ["ROM",      outcomes.rom.baseline,      outcomes.rom.target,       outcomes.rom.unit]      : null,
        outcomes.strength ? ["Strength", outcomes.strength.baseline, outcomes.strength.target, outcomes.strength.unit] : null,
      ].filter(Boolean);
      rows.forEach(([lbl, base, tgt, unit]) => {
        html += `<div style="padding:8px 0;border-bottom:1px solid var(--border)">
          <div style="font-size:12px;color:var(--text-muted);font-weight:600;margin-bottom:4px">${lbl} — ${unit}</div>
          <div style="display:flex;gap:8px">
            <span class="outcome-chip baseline">Start: <strong>${base}</strong></span>
            <span class="outcome-chip target">Goal: <strong>${tgt}</strong></span>
          </div></div>`;
      });
      if (outcomes.readiness) {
        const rd = outcomes.readiness;
        html += `<div style="padding:8px 0">
          <span class="outcome-chip ${rd.cleared ? "cleared" : "pending"}">${rd.cleared ? "&#10003; Cleared" : "Pending clearance"}</span>
          <span style="font-size:12px;color:var(--text-muted);margin-left:8px">${rd.label}</span>
        </div>`;
      }
      html += `</div>`;
    }

    // ── Reassessments ────────────────────────────────────────────────────
    if (assessments.length) {
      html += `<p class="section-label">Reassessments</p>`;
      assessments.slice().reverse().forEach(a => {
        html += `<div class="assessment-card">
          <div class="assessment-header">
            <span class="assessment-week">Week ${a.weekNumber}</span>
            <span class="assessment-date">${fmtDate(a.date)}</span>
            ${a.cleared ? `<span class="week-badge complete" style="margin-left:auto">&#10003; Cleared</span>` : ""}
          </div>
          <div class="assessment-grid">
            ${a.painRating    != null ? `<div class="assessment-item"><span class="assessment-key">Pain</span><span class="pain-pill ${painClass(a.painRating)}">${a.painRating}/10</span></div>` : ""}
            ${a.romMeasurement        ? `<div class="assessment-item"><span class="assessment-key">ROM</span><strong>${a.romMeasurement}</strong></div>` : ""}
            ${a.strengthRating        ? `<div class="assessment-item"><span class="assessment-key">Strength</span><strong>${a.strengthRating}</strong></div>` : ""}
          </div>
          ${a.notes ? `<div class="assessment-notes">${a.notes}</div>` : ""}
        </div>`;
      });
    }

    // ── Session history table ─────────────────────────────────────────────
    html += `<p class="section-label">Session History</p>
    <div class="card card-flush">
      <table class="history-table">
        <thead><tr><th>Week</th><th>Day</th><th>Status</th><th>Pain</th><th>Effort</th></tr></thead>
        <tbody>`;

    sessions.forEach(s => {
      // multi_week / one_off: only show up to next week to avoid clutter
      // ongoing_coaching: show all (history can be long)
      if (MODE !== COACHING && s.weekNumber && s.weekNumber > (PROGRAM.currentWeek || 1) + 1) return;
      const st     = ProgressStore.getSession(s.id);
      const isDone = ProgressStore.isSessionDone(s.id);
      html += `<tr>
        <td style="font-weight:600;white-space:nowrap">${s.weekNumber ? `Wk${s.weekNumber}` : "—"}</td>
        <td>${(s.day || s.label || "").slice(0, 3)}</td>
        <td>${isDone
          ? `<span class="pain-pill pain-low">&#10003; Done</span>`
          : `<span class="pain-pill" style="background:var(--bg);color:var(--text-muted)">—</span>`}</td>
        <td>${st.painRating   != null ? `<span class="pain-pill ${painClass(st.painRating)}">${st.painRating}/10</span>` : "—"}</td>
        <td>${st.effortRating != null ? `<strong>${st.effortRating}/5</strong>` : "—"}</td>
      </tr>`;
      if (st.note) {
        html += `<tr><td colspan="5" class="history-note-row">${st.note}</td></tr>`;
      }
    });

    html += `</tbody></table></div>`;
    html += disclaimer();
    return html;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: COACH NOTES
  // ─────────────────────────────────────────────────────────────────────────
  function renderCoachNotes() {
    const { coach } = CLIENT_CONFIG;
    const notes     = PROGRAM.coachNotes || [];

    let html = `
    <div class="coach-card">
      <div class="coach-name">${coach.name}, ${coach.credentials}</div>
      <div class="coach-creds">Your Rehab Coach</div>
      <div class="coach-note">${coach.contactNote}</div>
    </div>
    <p class="section-label">Notes From Your Coach</p>`;

    if (!notes.length) {
      html += `<div class="empty-state"><p>No coach notes yet. Check back after your next session.</p></div>`;
    } else {
      notes.forEach(note => {
        html += `<div class="note-card">
          <div class="note-date">${fmtDate(note.date)}</div>
          <div class="note-title">${note.title}</div>
          <div class="note-body">${note.body}</div>
        </div>`;
      });
    }

    html += disclaimer();
    return html;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODAL: Check-in  (pain scale + effort scale + optional session note)
  // ─────────────────────────────────────────────────────────────────────────
  function openCheckIn(sessionId) {
    const session = MODE === ONE_OFF
      ? PROGRAM.session
      : allSessions().find(s => s.id === sessionId);
    if (!session) return;

    let painBtns = "";
    for (let i = 0; i <= 10; i++) {
      const col = i <= 2 ? "scale-low" : i <= 5 ? "scale-mid" : "scale-high";
      painBtns += `<button class="scale-btn ${col}" data-scale="pain" data-val="${i}">${i}</button>`;
    }

    const effortLabels = ["", "Very Easy", "Easy", "Moderate", "Hard", "Very Hard"];
    let effortBtns = "";
    for (let i = 1; i <= 5; i++) {
      effortBtns += `<button class="scale-btn" data-scale="effort" data-val="${i}" title="${effortLabels[i]}">${i}</button>`;
    }

    document.getElementById("modal-body").innerHTML = `
      <div class="modal-title">Session Log</div>
      <p style="font-size:14px;color:var(--text-muted);margin-bottom:20px">
        ${session.weekNumber ? `Week ${session.weekNumber} &middot; ` : ""}${session.day || ""} &middot; ${session.label}
      </p>

      <p class="scale-label">Pain level <em>during this session</em></p>
      <p class="scale-sublabel">0 = No pain &nbsp;&nbsp; 10 = Severe pain</p>
      <div class="scale-grid scale-grid-11" id="pain-scale">${painBtns}</div>

      <p class="scale-label" style="margin-top:20px">Effort / difficulty</p>
      <p class="scale-sublabel">1 = Very easy &nbsp;&nbsp; 5 = Very hard</p>
      <div class="scale-grid scale-grid-5" id="effort-scale">${effortBtns}</div>

      <div class="checkin-note-wrap">
        <label class="checkin-note-label" for="checkin-note">Session note <span style="font-weight:400;opacity:.7">(optional)</span></label>
        <textarea id="checkin-note" class="checkin-note-textarea"
          placeholder="How did it feel? Any tightness, stiffness, or issues to remember…"
          rows="3" maxlength="500"></textarea>
      </div>

      <div class="checkin-safety-note">
        If your pain was 7 or above, please contact your coach before your next session.
      </div>

      <button class="btn-complete" id="confirm-checkin" data-session="${sessionId}" disabled style="margin-top:16px">
        Save Session
      </button>
      <button class="btn-secondary" data-action="close-modal" style="margin-top:8px">Cancel</button>`;

    document.getElementById("modal-overlay").hidden = false;
    _bindModalScales(sessionId);
  }

  function _bindModalScales(sessionId) {
    let painVal = null, effortVal = null;
    const overlay = document.getElementById("modal-overlay");

    overlay.querySelectorAll(".scale-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const scale = btn.dataset.scale;
        const val   = parseInt(btn.dataset.val, 10);
        overlay.querySelectorAll(`.scale-btn[data-scale="${scale}"]`).forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        if (scale === "pain")   painVal   = val;
        if (scale === "effort") effortVal = val;
        const confirm = document.getElementById("confirm-checkin");
        if (confirm && painVal !== null && effortVal !== null) confirm.removeAttribute("disabled");
      });
    });

    document.getElementById("confirm-checkin")?.addEventListener("click", () => {
      const noteEl = document.getElementById("checkin-note");
      const note   = noteEl ? noteEl.value.trim() : "";
      ProgressStore.saveSession(sessionId, {
        completed:    true,
        painRating:   painVal,
        effortRating: effortVal,
        ...(note ? { note } : {}),
      });
      closeModal();
      const targetId = MODE === ONE_OFF ? PROGRAM.session?.id : sessionId;
      navigate("session", targetId);
    });
  }

  function closeModal() {
    document.getElementById("modal-overlay").hidden = true;
    document.getElementById("modal-body").innerHTML = "";
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT DELEGATION  — all data-action clicks in #app-main
  // ─────────────────────────────────────────────────────────────────────────
  function handleMainClick(e) {
    const target = e.target.closest("[data-action]");
    if (!target) return;

    switch (target.dataset.action) {

      case "enter-program":
        ProgressStore.markVisited();
        if (MODE === ONE_OFF) navigate("session", PROGRAM.session?.id);
        else navigate("dashboard");
        break;

      case "back":
        if (MODE === ONE_OFF) navigate("session", PROGRAM.session?.id);
        else navigate("plan");
        break;

      case "go-overview": navigate("overview"); break;
      case "go-notes":    navigate("notes");    break;

      case "start-session":
      case "open-session":
        navigate("session", target.dataset.session);
        break;

      case "open-exercise": {
        const ex = getExercise(target.dataset.exercise);
        if (!ex) break;
        const catClass = "cat-" + ex.category.replace(/[\s\/]+/g, "-");
        document.getElementById("modal-body").innerHTML = `
          <div class="modal-title">${ex.name}</div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
            <span class="ex-category-badge ${catClass}">${ex.category}</span>
            ${ex.phase ? `<span style="font-size:12px;color:var(--text-muted);font-weight:600">Phase ${ex.phase}</span>` : ""}
            ${ex.bodyRegion      ? `<span class="ex-meta-chip">${ex.bodyRegion}</span>`      : ""}
            ${ex.movementPattern ? `<span class="ex-meta-chip">${ex.movementPattern}</span>` : ""}
            ${ex.equipment       ? `<span class="ex-meta-chip equip">${ex.equipment}</span>` : ""}
          </div>
          <p style="font-size:14px;color:var(--text-muted);line-height:1.6;margin-bottom:14px">${ex.description}</p>
          ${ex.imageSrc
            ? `<img src="${ex.imageSrc}" alt="${ex.imageAlt}" class="ex-image" style="margin-bottom:14px" loading="lazy">`
            : `<div class="ex-image-placeholder" style="margin-bottom:14px">
                <div class="ex-image-icon">${ex.videoSrc ? ICONS.video : ICONS.image}</div>
                <div class="ex-image-text">
                  <span class="ex-image-name">${ex.name}</span>
                  <span class="ex-image-sub">${ex.imageAlt}</span>
                </div>
              </div>`}
          <div class="ex-specs" style="margin-bottom:12px">
            ${ex.sets  ? `<div class="spec-chip"><strong>${ex.sets}</strong> <span>sets</span></div>` : ""}
            ${ex.reps  ? `<div class="spec-chip"><strong>${ex.reps}</strong> <span>reps</span></div>` : ""}
            ${ex.hold  ? `<div class="spec-chip"><strong>${ex.hold}</strong> <span>hold</span></div>` : ""}
            ${ex.tempo ? `<div class="spec-chip spec-chip-wide"><span>Tempo </span><strong>${ex.tempo}</strong></div>` : ""}
            ${ex.rest  ? `<div class="spec-chip spec-chip-wide"><span>Rest </span><strong>${ex.rest}</strong></div>` : ""}
          </div>
          <div class="ex-cue"><span class="ex-cue-label">Coaching cue</span>${ex.cue}</div>
          ${ex.painNote ? `<div class="ex-pain-note" style="margin-top:8px"><span class="ex-pain-label">&#9888; Pain note</span>${ex.painNote}</div>` : ""}
          ${ex.contraindications?.length ? `<div class="ex-contraindications" style="margin-top:8px"><span class="ex-contra-label">Not suitable if: </span>${ex.contraindications.join(" &middot; ")}</div>` : ""}
          ${ex.videoSrc ? `<a href="${ex.videoSrc}" target="_blank" rel="noopener noreferrer" class="ex-video-link" style="margin-top:14px">${ICONS.play} Watch exercise video</a>` : ""}`;
        document.getElementById("modal-overlay").hidden = false;
        break;
      }

      case "filter-exercises": {
        const f = target.dataset.filter;
        navigate("exercises", f === "all" ? null : f);
        break;
      }

      case "toggle-exercise": {
        const sid = target.dataset.session;
        const eid = target.dataset.exercise;
        ProgressStore.toggleExercise(sid, eid);
        const targetId = MODE === ONE_OFF ? PROGRAM.session?.id : sid;
        navigate("session", targetId);
        break;
      }

      case "open-checkin":   openCheckIn(target.dataset.session); break;
      case "close-modal":    closeModal(); break;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────────────────
  function init() {
    applyBranding();

    // ── Access guard — stop here if access is denied ─────────────────────
    if (!ACCESS.allowed) {
      const nav = document.getElementById("bottom-nav");
      if (nav) nav.classList.add("hidden");
      const main = document.getElementById("app-main");
      main.innerHTML = renderAccessGuard();
      // No routing — the guard IS the app for denied access
      return;
    }

    // ── Header badge ─────────────────────────────────────────────────────
    const badge       = document.createElement("span");
    badge.className   = "header-badge";
    badge.textContent = MODE === ONE_OFF
      ? "Today"
      : MODE === COACHING
      ? "Coaching"
      : `Wk ${PROGRAM.currentWeek || 1}`;
    document.getElementById("header-right")?.appendChild(badge);

    // ── Bottom nav ───────────────────────────────────────────────────────
    document.getElementById("bottom-nav")?.addEventListener("click", e => {
      const btn = e.target.closest(".nav-btn");
      if (btn) navigate(btn.dataset.view);
    });

    // ── Header logo → home ───────────────────────────────────────────────
    document.getElementById("header-logo")?.addEventListener("click", () => {
      if (MODE === ONE_OFF) navigate("session", PROGRAM.session?.id);
      else navigate("dashboard");
    });

    // ── Modal: close button + backdrop ───────────────────────────────────
    document.getElementById("modal-close")?.addEventListener("click", closeModal);
    document.getElementById("modal-overlay")?.addEventListener("click", e => {
      if (e.target === document.getElementById("modal-overlay")) closeModal();
    });

    // ── Default route ─────────────────────────────────────────────────────
    // one_off:   always go straight to the session
    // others:    welcome screen on first visit, dashboard thereafter
    const defaultRoute = MODE === ONE_OFF
      ? `session/${PROGRAM.session?.id}`
      : ProgressStore.hasVisited() ? "dashboard" : "welcome";

    if (!window.location.hash || window.location.hash === "#") {
      window.location.hash = defaultRoute;
    }

    doRender();

    // hashchange re-renders by replacing app-main to drop stale listeners
    window.addEventListener("hashchange", () => {
      const oldMain = document.getElementById("app-main");
      const newMain = oldMain.cloneNode(false);  // shallow clone — no children
      oldMain.parentNode.replaceChild(newMain, oldMain);
      doRender();
    });
  }

  // ── Shell integration ────────────────────────────────────────────────────
  // When loaded inside the MrPainPT shell, expose RehabApp global and wait for
  // the shell to call RehabApp.init() via the module's boot() method.
  // When loaded standalone (rehab-engine-v2 without shell), auto-init as before.
  if (typeof MrPainPT !== "undefined") {
    window.RehabApp = {
      init,
      getStatus() {
        return {
          mode:         MODE,
          accessType:   PROGRAM?.access?.type   || null,
          accessStatus: PROGRAM?.access?.status || null,
        };
      },
    };
  } else {
    // Standalone mode — boot immediately after DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

})();
