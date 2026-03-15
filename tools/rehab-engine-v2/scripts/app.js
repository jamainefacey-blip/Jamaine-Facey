/* ─────────────────────────────────────────────────────────────────────────────
   Pain System Rehab Engine  v2
   Mode-aware SPA. Reads PROGRAM.mode and renders appropriate views.

   Globals required (loaded before this script):
     CLIENT_CONFIG   — branding, client identity, coach info, disclaimer
     PROGRAM         — mode, sessions, phases, weeks, goals, milestones, notes
     EXERCISE_LIBRARY — enriched exercise definitions
     ProgressStore   — isolated localStorage layer  (scripts/engine/progress.js)
     Validator       — exercise reference validation (scripts/engine/validate.js)
   ───────────────────────────────────────────────────────────────────────────── */

(function () {
  "use strict";

  // ── Derived program constants ──────────────────────────────────────────────
  const MODE = PROGRAM.mode;   // "single-instruction" | "short-block" | "full-program"

  // All sessions as a flat array regardless of mode
  function allSessions() {
    if (MODE === "single-instruction") return PROGRAM.session ? [PROGRAM.session] : [];
    return PROGRAM.sessions || [];
  }

  // Max week number — program length is data-driven, never hard-coded
  const PROGRAM_WEEKS = (function () {
    const sessions = allSessions();
    if (!sessions.length || MODE === "single-instruction") return 1;
    return Math.max(...sessions.map(s => s.weekNumber || 1));
  })();

  // ── Validation ────────────────────────────────────────────────────────────
  const VALIDATION_ERRORS = Validator.validateProgram(PROGRAM, EXERCISE_LIBRARY);

  // ── Seed pre-completed history on first load ──────────────────────────────
  ProgressStore.seedFromProgram(allSessions());

  // ── Branding ──────────────────────────────────────────────────────────────
  function applyBranding() {
    const r = document.documentElement;
    r.style.setProperty("--accent",       CLIENT_CONFIG.accentColor);
    r.style.setProperty("--accent-dark",  shadeColor(CLIENT_CONFIG.accentColor, -18));
    r.style.setProperty("--accent-light", hexToRgba(CLIENT_CONFIG.accentColor, 0.13));
    document.title = CLIENT_CONFIG.appName;
    const logo  = document.getElementById("header-logo");
    const title = document.getElementById("header-title");
    if (logo)  logo.textContent  = CLIENT_CONFIG.logoText;
    if (title) title.textContent = CLIENT_CONFIG.appName;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", CLIENT_CONFIG.accentColor);
  }

  function shadeColor(hex, pct) {
    const n = parseInt(hex.replace("#", ""), 16);
    const clamp = v => Math.min(255, Math.max(0, v));
    const r = clamp((n >> 16) + pct), g = clamp(((n >> 8) & 0xff) + pct), b = clamp((n & 0xff) + pct);
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  function hexToRgba(hex, a) {
    const n = parseInt(hex.replace("#", ""), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // ── Router ────────────────────────────────────────────────────────────────
  const VIEWS = {
    welcome:   renderWelcome,
    dashboard: renderDashboard,
    overview:  renderOverview,
    plan:      renderPlan,
    session:   renderSessionView,
    exercises: renderExerciseLibrary,
    progress:  renderProgress,
    notes:     renderCoachNotes,
  };

  function getRoute() {
    const hash = window.location.hash.replace(/^#/, "").split("/");
    return { view: hash[0] || "welcome", param: hash[1] || null };
  }

  function navigate(view, param) {
    const newHash = param ? `${view}/${param}` : view;
    if (window.location.hash === "#" + newHash) {
      doRender();
    } else {
      window.location.hash = newHash;
    }
  }

  function doRender() {
    const { view, param } = getRoute();
    const main = document.getElementById("app-main");
    const fn   = VIEWS[view] || VIEWS.dashboard;
    main.innerHTML = fn(param);
    main.scrollTop = 0;
    updateNavActive(view === "session" ? "plan" : view === "welcome" ? "" : view);
    updateNavVisibility(view);
    main.addEventListener("click", handleMainClick);
  }

  function updateNavActive(view) {
    document.querySelectorAll(".nav-btn").forEach(b =>
      b.classList.toggle("active", b.dataset.view === view)
    );
  }

  function updateNavVisibility(view) {
    const nav = document.getElementById("bottom-nav");
    if (!nav) return;

    // single-instruction: always hide nav (the session IS the whole app)
    if (MODE === "single-instruction") {
      nav.classList.add("hidden");
      return;
    }

    // welcome: hide nav
    nav.classList.toggle("hidden", view === "welcome");
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
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
    alert:   svgIcon(`<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`),
    warning: svgIcon(`<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`, 'width="16" height="16"'),
  };

  function disclaimer() {
    return `
    <div class="disclaimer-footer">
      <div class="disclaimer-title">&#9888; Important Safety Notice</div>
      <p>${CLIENT_CONFIG.disclaimer}</p>
      <ul class="disclaimer-list">
        <li>This is <strong>not medical advice</strong> — always follow your licensed healthcare provider's guidance.</li>
        <li><strong>Stop immediately</strong> if you experience unusual pain, sharp discomfort, sudden swelling, or numbness.</li>
        <li>This tool supports <strong>coach-led rehab guidance only</strong> and makes no diagnosis or cure claims.</li>
        <li>Individual results vary — <strong>no specific outcome is guaranteed</strong>.</li>
      </ul>
    </div>`;
  }

  // ── Stats helpers ─────────────────────────────────────────────────────────
  function getStats() {
    const all       = allSessions();
    const currentWk = PROGRAM.currentWeek || 1;
    const toDate    = MODE === "single-instruction"
      ? all
      : all.filter(s => (s.weekNumber || 1) <= currentWk);
    const isDone    = s => s._seed?.completed && !ProgressStore.getSession(s.id).completed
      ? false  // override: if seed was completed but progress store is authoritative
      : ProgressStore.isSessionDone(s.id);
    const completed  = all.filter(isDone);
    const doneToDate = toDate.filter(isDone);
    const pct        = toDate.length ? Math.round(doneToDate.length / toDate.length * 100) : 0;
    const ratings    = completed.map(s => ProgressStore.getSession(s.id).painRating).filter(v => v != null);
    const avgPain    = ratings.length
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "—";
    return { completed: completed.length, total: all.length, doneToDate: doneToDate.length, toDate: toDate.length, pct, avgPain };
  }

  function getNextSession() {
    for (const s of allSessions()) {
      if (!ProgressStore.isSessionDone(s.id)) return s;
    }
    return null;
  }

  function getWeekForSession(session) {
    if (!PROGRAM.weeks) return null;
    return PROGRAM.weeks.find(w => w.weekNumber === session.weekNumber) || null;
  }

  function getPhase(phaseId) {
    if (!PROGRAM.phases) return null;
    return PROGRAM.phases.find(p => p.id === phaseId) || null;
  }

  function getExercise(id) {
    return EXERCISE_LIBRARY.find(e => e.id === id) || null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: WELCOME
  // ─────────────────────────────────────────────────────────────────────────
  function renderWelcome() {
    const { client, coach, appName } = CLIENT_CONFIG;
    const next = getNextSession();

    // For single-instruction: welcome leads directly to the one session
    const enterTarget = MODE === "single-instruction"
      ? { action: "enter-program" }
      : { action: "enter-program" };

    const metaRight = MODE === "single-instruction"
      ? `<div class="welcome-meta-item"><span class="welcome-meta-val">${client.conditionDetail}</span><span class="welcome-meta-label">Today's focus</span></div>`
      : `<div class="welcome-meta-item"><span class="welcome-meta-val">${MODE === "full-program" ? `Week ${client.currentWeek || PROGRAM.currentWeek}` : "Block"}</span><span class="welcome-meta-label">of ${PROGRAM_WEEKS}</span></div>
         <div class="welcome-meta-divider"></div>
         <div class="welcome-meta-item"><span class="welcome-meta-val">${coach.name}</span><span class="welcome-meta-label">${coach.credentials}</span></div>`;

    const nextHint = MODE === "single-instruction"
      ? `<div class="welcome-next-hint"><strong>${PROGRAM.session?.label || "Your session"}</strong> · ${PROGRAM.session?.exercises?.length || 0} exercises · ${PROGRAM.session?.duration || ""}</div>`
      : next
      ? `<div class="welcome-next-hint"><span>Next up:</span> <strong>${next.weekNumber ? `Week ${next.weekNumber} · ` : ""}${next.day || ""} · ${next.exercises.length} exercises</strong></div>`
      : `<div class="welcome-next-hint"><strong>🎉 Program complete — speak with your coach about next steps.</strong></div>`;

    return `
    <div class="welcome-screen">
      <div class="welcome-logo">${CLIENT_CONFIG.logoText}</div>
      <h1 class="welcome-app-name">${appName}</h1>
      <p class="welcome-tagline">Your personalised rehab program</p>

      <div class="welcome-hero-card">
        <div class="welcome-client-name">Welcome, ${client.firstName}</div>
        <div class="welcome-condition">${client.condition}</div>
        <div class="welcome-detail">${client.conditionDetail}</div>
        <div class="welcome-meta-row">${metaRight}</div>
      </div>

      ${nextHint}

      <button class="btn-welcome-enter" data-action="${enterTarget.action}">
        ${MODE === "single-instruction" ? "View My Exercises" : "Begin Program"} ${ICONS.arrow}
      </button>

      <p class="welcome-disclaimer-mini">
        This app is not medical advice. It supports coach-led rehabilitation only.
        Stop exercising and contact your provider if symptoms worsen.
      </p>
    </div>`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: DASHBOARD  (not shown in single-instruction mode)
  // ─────────────────────────────────────────────────────────────────────────
  function renderDashboard() {
    const { pct, completed, avgPain } = getStats();
    const next   = getNextSession();
    const client = CLIENT_CONFIG.client;
    const curWk  = PROGRAM.currentWeek || 1;

    const weekMeta   = PROGRAM.weeks?.find(w => w.weekNumber === curWk);
    const phaseMeta  = weekMeta && PROGRAM.phases ? PROGRAM.phases.find(p => p.id === weekMeta.phaseId) : null;

    const radius = 40, circ = 2 * Math.PI * radius;
    const dash   = circ - (pct / 100) * circ;

    let html = `
    <p class="greeting">Hi, ${client.firstName} 👋</p>
    <p class="greeting-sub">Week ${curWk} of ${PROGRAM_WEEKS}${weekMeta ? ` · ${weekMeta.focus}` : ""}</p>

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
            You are making great progress. Keep it consistent.
          </p>
          ${phaseMeta ? `<div class="phase-pill" style="margin-top:10px"><span class="phase-dot" style="background:${phaseMeta.color}"></span><span style="color:${phaseMeta.color};font-size:12px;font-weight:700">${phaseMeta.label}</span></div>` : ""}
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

    if (next) {
      const wkMeta = getWeekForSession(next);
      html += `
      <p class="section-label">Next Session</p>
      <div class="next-session-card">
        <div class="next-session-tag">${next.weekNumber ? `Week ${next.weekNumber}` : ""}${wkMeta ? ` · ${wkMeta.focus}` : ""}</div>
        <div class="next-session-title">${next.day || ""} — ${next.label}</div>
        <div class="next-session-meta">${next.exercises.length} exercises · ${next.duration}</div>
        <button class="btn-start" data-action="start-session" data-session="${next.id}">
          ${ICONS.play} Start Session
        </button>
      </div>`;
    } else {
      html += `<p class="section-label">Program Status</p>
      <div class="card"><p style="font-size:16px;font-weight:700;color:var(--success)">🎉 Program complete!</p>
      <p class="text-muted" style="margin-top:6px;font-size:14px">Speak with your coach about next steps and a maintenance plan.</p></div>`;
    }

    // Profile shortcut
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

    // Milestones
    if (PROGRAM.milestones?.length) {
      html += `<p class="section-label">Milestones</p><div class="card card-flush"><ul class="milestone-list" style="padding:0 18px">`;
      PROGRAM.milestones.forEach(m => {
        html += `<li class="milestone-item">
          <span class="milestone-check ${m.achieved ? "done" : "todo"}">${m.achieved ? ICONS.check : ""}</span>
          <span style="font-size:14px;line-height:1.4">${m.label}</span>
          <span class="milestone-week">Wk ${m.week}</span>
        </li>`;
      });
      html += `</ul></div>`;
    }

    html += disclaimer();
    return html;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: OVERVIEW
  // ─────────────────────────────────────────────────────────────────────────
  function renderOverview() {
    const { client, coach } = CLIENT_CONFIG;
    const goals = PROGRAM.goals || [];

    let html = `
    <div class="overview-hero">
      <div class="overview-client-name">${client.firstName} ${client.lastName}</div>
      <div class="overview-condition">${client.condition}</div>
      <div class="overview-detail">${client.conditionDetail}</div>
    </div>

    <div class="card card-sm" style="margin-bottom:14px">
      ${[
        ["Age",            client.age],
        ["Program Start",  fmtDate(client.startDate)],
        ["Program Length", MODE === "single-instruction" ? "Single session" : `${PROGRAM_WEEKS} weeks`],
        ["Mode",           `<span class="mode-badge mode-${MODE}">${MODE.replace("-", " ")}</span>`],
        ["Current Week",   MODE !== "single-instruction" ? `<span style="color:var(--accent);font-weight:700">Week ${PROGRAM.currentWeek || 1}</span>` : null],
      ].filter(([, v]) => v != null).map(([label, val]) => `
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

    if (goals.length) {
      html += `<p class="section-label">Program Goals</p>
      <div class="card card-flush"><ul class="goals-list" style="padding:0 18px">`;
      goals.forEach((g, i) => {
        html += `<li class="goal-item"><span class="goal-bullet">${i + 1}</span><span>${g}</span></li>`;
      });
      html += `</ul></div>`;
    }

    // Phases — only for full-program
    if (MODE === "full-program" && PROGRAM.phases?.length) {
      html += `<p class="section-label">Program Phases</p>`;
      PROGRAM.phases.forEach(ph => {
        html += `<div class="card card-sm" style="border-left:4px solid ${ph.color};margin-bottom:10px">
          <div style="font-size:14px;font-weight:700;margin-bottom:4px">${ph.label}
            <span style="color:var(--text-muted);font-weight:400;font-size:12px"> (Weeks ${ph.weeks})</span></div>
          <div style="font-size:13px;color:var(--text-muted);line-height:1.5">${ph.focus}</div>
        </div>`;
      });
    }

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
  // ─────────────────────────────────────────────────────────────────────────
  function renderPlan() {
    const sessions   = allSessions();
    const curWk      = PROGRAM.currentWeek || 1;
    const nextSess   = getNextSession();

    let html = `<p class="section-label" style="margin-top:4px">Your ${PROGRAM_WEEKS}-Week Program</p>`;

    // Group sessions by weekNumber
    const byWeek = new Map();
    sessions.forEach(s => {
      const wk = s.weekNumber || 1;
      if (!byWeek.has(wk)) byWeek.set(wk, []);
      byWeek.get(wk).push(s);
    });

    let lastPhaseId = null;

    Array.from(byWeek.keys()).sort((a, b) => a - b).forEach(weekNum => {
      const weekSessions = byWeek.get(weekNum);
      const weekMeta     = PROGRAM.weeks?.find(w => w.weekNumber === weekNum);
      const phaseId      = weekMeta?.phaseId || weekSessions[0]?.phaseId;
      const phase        = getPhase(phaseId);

      // Phase divider — full-program only
      if (MODE === "full-program" && phase && phaseId !== lastPhaseId) {
        html += `<div class="phase-divider">
          <div class="phase-divider-line"></div>
          <span class="phase-divider-label" style="color:${phase.color}">${phase.label}</span>
          <div class="phase-divider-line"></div>
        </div>`;
        lastPhaseId = phaseId;
      }

      const doneCount   = weekSessions.filter(s => ProgressStore.isSessionDone(s.id)).length;
      const allDone     = doneCount === weekSessions.length;
      const isPast      = weekNum < curWk;
      const isCurrent   = weekNum === curWk;

      const badge = isCurrent
        ? `<span class="week-badge current">Current</span>`
        : allDone || isPast
        ? `<span class="week-badge complete">✓ Done</span>`
        : `<span class="week-badge upcoming">Upcoming</span>`;

      html += `<div class="week-card"><div class="week-header">
        <span class="week-num">Week ${weekNum}</span>
        <span class="week-focus">${weekMeta?.focus || ""}</span>
        ${badge}
      </div>`;

      weekSessions.forEach(session => {
        const isDone   = ProgressStore.isSessionDone(session.id);
        const isNext   = !isDone && nextSess?.id === session.id;
        const st       = ProgressStore.getSession(session.id);
        const painVal  = st.painRating;
        const dotClass = isDone ? "done" : isNext ? "next" : "upcoming";
        const dotIcon  = isDone ? ICONS.check : isNext ? "→" : "·";

        html += `<div class="session-row" data-action="open-session" data-session="${session.id}">
          <span class="session-dot ${dotClass}">${dotIcon}</span>
          <div class="session-info">
            <div class="session-day">${session.day || ""} — ${session.label}</div>
            <div class="session-dur">${session.exercises.length} exercises · ${session.duration}</div>
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

    html += disclaimer();
    return html;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: SESSION
  // ─────────────────────────────────────────────────────────────────────────
  function renderSessionView(sessionId) {
    // For single-instruction: sessionId may come from the PROGRAM directly
    let session, weekMeta;
    if (MODE === "single-instruction") {
      session  = PROGRAM.session;
      weekMeta = null;
    } else {
      session  = allSessions().find(s => s.id === sessionId);
      weekMeta = session ? getWeekForSession(session) : null;
    }

    if (!session) {
      return `<button class="back-btn" data-action="back">${ICONS.back} Back</button>
        <div class="card"><p class="text-muted">Session not found.</p></div>`;
    }

    const st          = ProgressStore.getSession(session.id);
    const sessionDone = ProgressStore.isSessionDone(session.id);
    const checkedCount = session.exercises.filter(id => st.exercises[id]).length;
    const allChecked   = checkedCount === session.exercises.length;

    // Validation: find missing exercise IDs for this session
    const valErrors = Validator.errorsForSession(session.id, PROGRAM, EXERCISE_LIBRARY);

    const headerLabel = weekMeta
      ? `Week ${session.weekNumber} — ${session.day || ""}`
      : session.day || session.label;

    let html = MODE !== "single-instruction"
      ? `<button class="back-btn" data-action="back">${ICONS.back} Back to Plan</button>` : "";

    html += `
    <div class="session-header-card">
      <div class="session-header-title">${headerLabel}</div>
      <div class="session-header-meta">${session.label} · ${session.duration} · ${session.exercises.length} exercises</div>
      ${!sessionDone && session.exercises.length > 0 ? `
      <div class="session-progress-row">
        <div class="session-progress-track">
          <div class="session-progress-fill" style="width:${Math.round(checkedCount / session.exercises.length * 100)}%"></div>
        </div>
        <span class="session-progress-label">${checkedCount}/${session.exercises.length}</span>
      </div>` : ""}
    </div>`;

    // Validation error banner
    if (valErrors.length) {
      html += `<div class="validation-error-card">
        <div class="validation-error-title">${ICONS.warning} Missing exercises detected</div>
        <ul class="validation-error-list">
          ${valErrors.map(e => `<li><code>${e.exerciseId}</code> — not found in the exercise library. Ask your coach to update the program.</li>`).join("")}
        </ul>
      </div>`;
    }

    if (!sessionDone) {
      html += `<div class="session-instructions">
        Tap the circle next to each exercise once you have completed it.
        When all exercises are done, the button below will unlock so you can log your session.
      </div>`;
    }

    // Exercise cards
    session.exercises.forEach(exId => {
      const ex = getExercise(exId);

      // Missing exercise — show visible error card instead of silently skipping
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
            aria-label="${checked ? "Mark incomplete" : "Mark complete"}"
            aria-pressed="${checked}">
            ${checked ? ICONS.check : ""}
          </button>
          <div class="ex-body">
            <div class="ex-name">${ex.name}</div>
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:4px">
              <span class="ex-category-badge ${catClass}">${ex.category}</span>
              ${ex.bodyRegion ? `<span class="ex-meta-chip">${ex.bodyRegion}</span>` : ""}
              ${ex.movementType ? `<span class="ex-meta-chip">${ex.movementType}</span>` : ""}
            </div>
            <div class="ex-desc" style="margin-top:8px">${ex.description}</div>

            <div class="ex-specs">
              ${ex.sets   ? `<div class="spec-chip"><strong>${ex.sets}</strong> <span>sets</span></div>` : ""}
              ${ex.reps   ? `<div class="spec-chip"><strong>${ex.reps}</strong> <span>reps</span></div>` : ""}
              ${ex.hold   ? `<div class="spec-chip"><strong>${ex.hold}</strong> <span>hold</span></div>` : ""}
              ${ex.tempo  ? `<div class="spec-chip spec-chip-wide"><span>Tempo </span><strong>${ex.tempo}</strong></div>` : ""}
              ${ex.rest   ? `<div class="spec-chip spec-chip-wide"><span>Rest </span><strong>${ex.rest}</strong></div>` : ""}
            </div>

            <div class="ex-cue">
              <span class="ex-cue-label">Coaching cue</span>
              ${ex.cue}
            </div>
            ${ex.painNote ? `<div class="ex-pain-note">
              <span class="ex-pain-label">&#9888; Pain note</span>
              ${ex.painNote}
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
          </div>
        </div>
      </div>`;
    });

    // Completion / status block
    if (sessionDone) {
      html += `
      <div class="session-complete-card">
        <div style="font-size:40px;margin-bottom:10px">✅</div>
        <div class="session-complete-title">Session Complete!</div>
        <div class="session-complete-meta">
          ${st.painRating != null
            ? `Pain: <span class="${painClass(st.painRating)} inline-pill">${st.painRating}/10</span>
               &nbsp;·&nbsp; Effort: <strong>${st.effortRating}/5</strong>`
            : "Well done on completing this session."}
        </div>
        ${MODE !== "single-instruction"
          ? `<button class="btn-secondary" data-action="back" style="margin-top:16px">Back to Plan</button>`
          : ""}
      </div>`;
    } else {
      // Only show the complete button if there are no blocking validation errors
      const validExercises   = session.exercises.filter(id => getExercise(id) !== null);
      const allValidChecked  = validExercises.length > 0 && validExercises.every(id => st.exercises[id]);

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
  // VIEW: EXERCISE LIBRARY
  // ─────────────────────────────────────────────────────────────────────────
  function renderExerciseLibrary(filter) {
    // Build dynamic filter chips based on what exercises exist in the library
    const hasPhases = EXERCISE_LIBRARY.some(e => e.phase);
    const filters = [{ key: "all", label: "All" }];
    if (hasPhases) {
      [1, 2, 3].forEach(p => {
        if (EXERCISE_LIBRARY.some(e => e.phase === p)) {
          filters.push({ key: String(p), label: `Phase ${p}` });
        }
      });
    }
    // Body region filters
    const regions = [...new Set(EXERCISE_LIBRARY.map(e => e.bodyRegion).filter(Boolean))];
    regions.forEach(r => filters.push({ key: `region:${r}`, label: r.charAt(0).toUpperCase() + r.slice(1) }));

    const activeFilter = filter || "all";
    const filtered = activeFilter === "all"
      ? EXERCISE_LIBRARY
      : activeFilter.startsWith("region:")
      ? EXERCISE_LIBRARY.filter(e => e.bodyRegion === activeFilter.slice(7))
      : EXERCISE_LIBRARY.filter(e => String(e.phase) === activeFilter);

    let html = `<p class="section-label" style="margin-top:4px">Exercise Library</p>
    <div class="filter-row">`;
    filters.forEach(({ key, label }) => {
      html += `<button class="filter-chip ${activeFilter === key ? "active" : ""}"
        data-action="filter-exercises" data-filter="${key}">${label}</button>`;
    });
    html += `</div>`;

    filtered.forEach(ex => {
      const catClass = "cat-" + ex.category.replace(/[\s\/]+/g, "-");
      html += `
      <div class="exercise-lib-card" data-action="open-exercise" data-exercise="${ex.id}">
        <div class="ex-lib-top">
          <span class="ex-category-badge ${catClass}">${ex.category}</span>
          ${ex.phase ? `<span class="ex-lib-phase-badge">Phase ${ex.phase}</span>` : ""}
          ${ex.bodyRegion ? `<span class="ex-meta-chip" style="margin-left:auto;margin-right:24px">${ex.bodyRegion}</span>` : ""}
          <span class="ex-lib-chevron">${ICONS.chevron}</span>
        </div>
        <div class="ex-lib-name">${ex.name}</div>
        <div class="ex-lib-desc">${ex.description}</div>
        <div class="ex-lib-specs">
          ${ex.sets   ? `<span>${ex.sets} sets</span>` : ""}
          ${ex.reps   ? `<span>${ex.reps} reps</span>` : ""}
          ${ex.hold   ? `<span>${ex.hold} hold</span>` : ""}
          ${ex.movementType ? `<span>${ex.movementType}</span>` : ""}
        </div>
      </div>`;
    });

    if (!filtered.length) {
      html += `<div class="empty-state"><p>No exercises in this category yet.</p></div>`;
    }

    html += disclaimer();
    return html;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: PROGRESS
  // ─────────────────────────────────────────────────────────────────────────
  function renderProgress() {
    const { pct, completed, total, avgPain } = getStats();
    const curWk = PROGRAM.currentWeek || 1;

    let html = `
    <p class="section-label" style="margin-top:4px">Overall Progress</p>
    <div class="card" style="margin-bottom:14px">
      <div style="font-size:36px;font-weight:800;color:var(--accent);margin-bottom:2px">${pct}%</div>
      <div style="font-size:14px;color:var(--text-muted);margin-bottom:18px">${completed} of ${total} total sessions completed</div>

      <div class="progress-bar-wrap" style="margin-bottom:14px">
        <div class="progress-bar-label">
          <span style="font-weight:600">Overall</span>
          <span style="color:var(--accent);font-weight:700">${pct}%</span>
        </div>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      </div>`;

    // Phase breakdown — full-program only
    if (MODE === "full-program" && PROGRAM.phases) {
      PROGRAM.phases.forEach((ph, i) => {
        const phaseSessions = allSessions().filter(s => s.phaseId === ph.id);
        const done = phaseSessions.filter(s => ProgressStore.isSessionDone(s.id)).length;
        const ppct = phaseSessions.length ? Math.round(done / phaseSessions.length * 100) : 0;
        html += `
        <div class="progress-bar-wrap"${i < PROGRAM.phases.length - 1 ? ' style="margin-bottom:14px"' : ""}>
          <div class="progress-bar-label">
            <span style="font-weight:600;color:${ph.color}">${ph.label}</span>
            <span style="color:${ph.color};font-weight:700">${done}/${phaseSessions.length}</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width:${ppct}%;background:${ph.color}"></div>
          </div>
        </div>`;
      });
    }

    html += `</div>

    <div class="stat-row" style="margin-bottom:16px">
      <div class="stat-card">
        <div class="stat-value" style="color:${avgPain === "—" ? "var(--text)" : +avgPain <= 2 ? "var(--success)" : +avgPain <= 5 ? "var(--warning)" : "var(--danger)"}">${avgPain}</div>
        <div class="stat-label">Avg Pain</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${curWk}</div>
        <div class="stat-label">Current Week</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${(PROGRAM.milestones || []).filter(m => m.achieved).length}/${(PROGRAM.milestones || []).length || "—"}</div>
        <div class="stat-label">Milestones</div>
      </div>
    </div>

    <p class="section-label">Session History</p>
    <div class="card card-flush">
      <table class="history-table">
        <thead><tr><th>Week</th><th>Day</th><th>Status</th><th>Pain</th><th>Effort</th></tr></thead>
        <tbody>`;

    allSessions().forEach(s => {
      if (s.weekNumber && s.weekNumber > curWk) return;
      const st     = ProgressStore.getSession(s.id);
      const isDone = ProgressStore.isSessionDone(s.id);
      html += `<tr>
        <td style="font-weight:600;white-space:nowrap">${s.weekNumber ? `Wk${s.weekNumber}` : "—"}</td>
        <td>${(s.day || s.label || "").slice(0, 3)}</td>
        <td>${isDone
          ? `<span class="pain-pill pain-low">✓ Done</span>`
          : `<span class="pain-pill" style="background:var(--bg);color:var(--text-muted)">—</span>`}
        </td>
        <td>${st.painRating  != null ? `<span class="pain-pill ${painClass(st.painRating)}">${st.painRating}/10</span>`  : "—"}</td>
        <td>${st.effortRating != null ? `<strong>${st.effortRating}/5</strong>` : "—"}</td>
      </tr>`;
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
  // MODAL: Check-in
  // ─────────────────────────────────────────────────────────────────────────
  function openCheckIn(sessionId) {
    const session = MODE === "single-instruction"
      ? PROGRAM.session
      : allSessions().find(s => s.id === sessionId);
    if (!session) return;

    let painBtns = "";
    for (let i = 0; i <= 10; i++) {
      const col = i <= 2 ? "scale-low" : i <= 5 ? "scale-mid" : "scale-high";
      painBtns += `<button class="scale-btn ${col}" data-scale="pain" data-val="${i}">${i}</button>`;
    }
    let effortBtns = "";
    const effortLabels = ["", "Very Easy", "Easy", "Moderate", "Hard", "Very Hard"];
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

      <div class="checkin-safety-note">
        If your pain was 7 or above, please contact your coach before your next session.
      </div>

      <button class="btn-complete" id="confirm-checkin" data-session="${sessionId}" disabled style="margin-top:16px">
        Save Session
      </button>
      <button class="btn-secondary" data-action="close-modal" style="margin-top:8px">Cancel</button>`;

    document.getElementById("modal-overlay").hidden = false;
    bindModalScales(sessionId);
  }

  function bindModalScales(sessionId) {
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
      ProgressStore.saveSession(sessionId, {
        completed:    true,
        painRating:   painVal,
        effortRating: effortVal,
      });
      closeModal();
      if (MODE === "single-instruction") {
        navigate("session", PROGRAM.session.id);
      } else {
        navigate("session", sessionId);
      }
    });
  }

  function closeModal() {
    document.getElementById("modal-overlay").hidden = true;
    document.getElementById("modal-body").innerHTML = "";
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT DELEGATION — main content area
  // ─────────────────────────────────────────────────────────────────────────
  function handleMainClick(e) {
    const target = e.target.closest("[data-action]");
    if (!target) return;

    switch (target.dataset.action) {

      case "enter-program":
        ProgressStore.markVisited();
        if (MODE === "single-instruction") {
          navigate("session", PROGRAM.session?.id);
        } else {
          navigate("dashboard");
        }
        break;

      case "back":
        if (MODE === "single-instruction") {
          navigate("session", PROGRAM.session?.id);
        } else {
          navigate("plan");
        }
        break;

      case "go-overview":
        navigate("overview");
        break;

      case "go-notes":
        navigate("notes");
        break;

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
            ${ex.bodyRegion ? `<span class="ex-meta-chip">${ex.bodyRegion}</span>` : ""}
            ${ex.movementType ? `<span class="ex-meta-chip">${ex.movementType}</span>` : ""}
          </div>
          <p style="font-size:14px;color:var(--text-muted);line-height:1.6;margin-bottom:14px">${ex.description}</p>

          ${ex.imageSrc
            ? `<img src="${ex.imageSrc}" alt="${ex.imageAlt}" class="ex-image" style="margin-bottom:14px" loading="lazy">`
            : `<div class="ex-image-placeholder" style="margin-bottom:14px">
                <div class="ex-image-icon">${ICONS.image}</div>
                <div class="ex-image-text">
                  <span class="ex-image-name">${ex.name}</span>
                  <span class="ex-image-sub">${ex.imageAlt}</span>
                </div>
              </div>`}

          <div class="ex-specs" style="margin-bottom:12px">
            ${ex.sets   ? `<div class="spec-chip"><strong>${ex.sets}</strong> <span>sets</span></div>` : ""}
            ${ex.reps   ? `<div class="spec-chip"><strong>${ex.reps}</strong> <span>reps</span></div>` : ""}
            ${ex.hold   ? `<div class="spec-chip"><strong>${ex.hold}</strong> <span>hold</span></div>` : ""}
            ${ex.tempo  ? `<div class="spec-chip spec-chip-wide"><span>Tempo </span><strong>${ex.tempo}</strong></div>` : ""}
            ${ex.rest   ? `<div class="spec-chip spec-chip-wide"><span>Rest </span><strong>${ex.rest}</strong></div>` : ""}
          </div>

          <div class="ex-cue"><span class="ex-cue-label">Coaching cue</span>${ex.cue}</div>
          ${ex.painNote ? `<div class="ex-pain-note" style="margin-top:8px"><span class="ex-pain-label">&#9888; Pain note</span>${ex.painNote}</div>` : ""}`;

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
        if (MODE === "single-instruction") {
          navigate("session", PROGRAM.session.id);
        } else {
          navigate("session", sid);
        }
        break;
      }

      case "open-checkin":
        openCheckIn(target.dataset.session);
        break;

      case "close-modal":
        closeModal();
        break;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────────────────
  function init() {
    applyBranding();

    // Show validation warnings in console if any
    if (VALIDATION_ERRORS.length) {
      console.warn(`[Rehab Engine v2] ${VALIDATION_ERRORS.length} validation error(s):`);
      VALIDATION_ERRORS.forEach(e => console.warn(" →", e.message));
    }

    // Week badge in header (not shown for single-instruction)
    if (MODE !== "single-instruction") {
      const badge = document.createElement("span");
      badge.className   = "header-badge";
      badge.textContent = `Wk ${PROGRAM.currentWeek || 1}`;
      document.getElementById("header-right")?.appendChild(badge);
    }

    // Hide nav items not applicable to the current mode
    if (MODE === "single-instruction") {
      // No nav at all — handled in updateNavVisibility
    } else if (MODE === "short-block") {
      // Exercises nav still useful; all others fine
    }

    // Bottom nav
    document.getElementById("bottom-nav")?.addEventListener("click", e => {
      const btn = e.target.closest(".nav-btn");
      if (btn) navigate(btn.dataset.view);
    });

    // Header logo → dashboard (or session for single-instruction)
    document.getElementById("header-logo")?.addEventListener("click", () => {
      MODE === "single-instruction" ? navigate("session", PROGRAM.session?.id) : navigate("dashboard");
    });

    // Modal: close button & backdrop (bound once globally)
    document.getElementById("modal-close")?.addEventListener("click", closeModal);
    document.getElementById("modal-overlay")?.addEventListener("click", e => {
      if (e.target === document.getElementById("modal-overlay")) closeModal();
    });

    // Set default route
    const defaultRoute = MODE === "single-instruction"
      ? `session/${PROGRAM.session?.id}`
      : ProgressStore.hasVisited() ? "dashboard" : "welcome";

    if (!window.location.hash || window.location.hash === "#") {
      window.location.hash = defaultRoute;
    }

    doRender();

    window.addEventListener("hashchange", () => {
      const oldMain = document.getElementById("app-main");
      const newMain = oldMain.cloneNode(false);
      oldMain.parentNode.replaceChild(newMain, oldMain);
      doRender();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
