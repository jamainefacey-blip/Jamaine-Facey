/* ─────────────────────────────────────────────────────────────────────────────
   Pain System Rehab — App Controller
   Single-file SPA with hash-based routing.
   All views are rendered as HTML strings injected into #app-main.
   ───────────────────────────────────────────────────────────────────────────── */

(function () {
  "use strict";

  // ── Session state (in-memory; survives page refresh via localStorage) ────────
  const STORAGE_KEY = "ps_rehab_session_state";

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (_) { /* quota exceeded — ignore */ }
  }

  // Shape: { [sessionId]: { completed, painRating, effortRating, exercises: {[id]: checked} } }
  let sessionState = loadState();

  // Helper — get or create mutable session state
  function getSessionState(sessionId) {
    if (!sessionState[sessionId]) {
      sessionState[sessionId] = { completed: false, painRating: null, effortRating: null, exercises: {} };
    }
    return sessionState[sessionId];
  }

  // ── Apply accent colour from client config ───────────────────────────────────
  function applyBranding() {
    if (!CLIENT_CONFIG) return;
    const root = document.documentElement;
    root.style.setProperty("--accent", CLIENT_CONFIG.accentColor);
    root.style.setProperty("--accent-dark", shadeColor(CLIENT_CONFIG.accentColor, -15));
    root.style.setProperty("--accent-light", hexToRgba(CLIENT_CONFIG.accentColor, 0.12));
    document.title = CLIENT_CONFIG.appName;
    const logo = document.getElementById("header-logo");
    const title = document.getElementById("header-title");
    if (logo) logo.textContent = CLIENT_CONFIG.logoText;
    if (title) title.textContent = CLIENT_CONFIG.appName;
  }

  function shadeColor(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  function hexToRgba(hex, alpha) {
    const num = parseInt(hex.replace("#", ""), 16);
    return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
  }

  // ── Router ───────────────────────────────────────────────────────────────────
  const VIEWS = {
    dashboard: renderDashboard,
    overview:  renderOverview,
    plan:      renderPlan,
    session:   renderSessionView,
    exercises: renderExerciseLibrary,
    progress:  renderProgress,
    notes:     renderCoachNotes,
  };

  function getRoute() {
    const hash = window.location.hash.replace("#", "").split("/");
    return { view: hash[0] || "dashboard", param: hash[1] || null };
  }

  function navigate(view, param) {
    window.location.hash = param ? `${view}/${param}` : view;
  }

  function renderView() {
    const { view, param } = getRoute();
    const main = document.getElementById("app-main");
    const fn = VIEWS[view];
    if (fn) {
      main.innerHTML = fn(param);
    } else {
      main.innerHTML = renderDashboard();
    }
    updateNavActive(view === "session" ? "plan" : view);
    bindViewEvents(view, param);
  }

  function updateNavActive(view) {
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  }

  function painColor(val) {
    if (val === null || val === undefined) return "";
    if (val <= 2) return "pain-low";
    if (val <= 5) return "pain-mid";
    return "pain-high";
  }

  function svg(d, extra = "") {
    return `<svg ${extra} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  }

  const checkIcon   = svg(`<polyline points="20 6 9 17 4 12"/>`);
  const chevronRight = svg(`<polyline points="9 18 15 12 9 6"/>`);
  const backArrow   = svg(`<polyline points="15 18 9 12 15 6"/>`);
  const videoIcon   = svg(`<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>`);

  function disclaimer() {
    return `<div class="disclaimer-footer">
      <div class="disclaimer-title">⚠ Important Notice</div>
      ${CLIENT_CONFIG.disclaimer}
    </div>`;
  }

  // ── Derived stats ────────────────────────────────────────────────────────────
  function getStats() {
    const allSessions = getAllSessions();
    const completed = allSessions.filter((s) => {
      const st = sessionState[s.id];
      return s.completed || (st && st.completed);
    });
    const totalToDate = getTotalSessionsUpToCurrentWeek();
    const completedToDate = totalToDate.filter((s) => {
      const st = sessionState[s.id];
      return s.completed || (st && st.completed);
    });
    const pct = totalToDate.length
      ? Math.round((completedToDate.length / totalToDate.length) * 100)
      : 0;
    const painRatings = completed
      .map((s) => {
        const st = sessionState[s.id];
        return st && st.painRating != null ? st.painRating : s.painRating;
      })
      .filter((v) => v != null);
    const avgPain = painRatings.length
      ? (painRatings.reduce((a, b) => a + b, 0) / painRatings.length).toFixed(1)
      : "—";
    return { completed: completed.length, total: allSessions.length, pct, avgPain };
  }

  function getNextSession() {
    for (const week of REHAB_PLAN.weeks) {
      for (const s of week.sessions) {
        const st = sessionState[s.id];
        if (!s.completed && !(st && st.completed)) {
          return { session: s, week };
        }
      }
    }
    return null;
  }

  // ── ─── VIEW: DASHBOARD ───────────────────────────────────────────────────
  function renderDashboard() {
    const { pct, completed, avgPain } = getStats();
    const next = getNextSession();
    const client = CLIENT_CONFIG.client;
    const currentWeek = REHAB_PLAN.weeks.find((w) => w.weekNumber === client.currentWeek);
    const phase = currentWeek
      ? REHAB_PLAN.phases.find((p) => p.id === currentWeek.phase)
      : null;

    // SVG progress ring
    const radius = 40; const circ = 2 * Math.PI * radius;
    const dash = circ - (pct / 100) * circ;

    let html = `
    <p class="greeting">Hi, ${client.firstName} 👋</p>
    <p class="greeting-sub">Week ${client.currentWeek} of ${client.programWeeks}</p>

    <!-- Progress ring card -->
    <div class="card" style="margin-bottom:14px">
      <div class="progress-summary">
        <div class="progress-ring-wrap">
          <svg width="100" height="100" style="transform:rotate(-90deg)">
            <circle cx="50" cy="50" r="${radius}" stroke="var(--border)" stroke-width="9" fill="none"/>
            <circle cx="50" cy="50" r="${radius}" stroke="var(--accent)" stroke-width="9" fill="none"
              stroke-dasharray="${circ.toFixed(1)}"
              stroke-dashoffset="${dash.toFixed(1)}"
              stroke-linecap="round"/>
          </svg>
          <div class="progress-ring-label">
            <span class="progress-ring-pct">${pct}%</span>
            <span class="progress-ring-sub">Done</span>
          </div>
        </div>
        <div class="progress-ring-info">
          <h3>${completed} sessions complete</h3>
          <p>You are on track with your rehab program. Keep up the great work.</p>
          ${phase ? `<div class="phase-pill" style="margin-top:10px"><span class="phase-dot"></span>${phase.label}</div>` : ""}
        </div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-value">${client.currentWeek}/${client.programWeeks}</div>
        <div class="stat-label">Weeks</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${avgPain}</div>
        <div class="stat-label">Avg Pain</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${completed}</div>
        <div class="stat-label">Sessions</div>
      </div>
    </div>`;

    // Next session
    if (next) {
      html += `
      <p class="section-label">Next Session</p>
      <div class="next-session-card">
        <div class="next-session-tag">Week ${next.week.weekNumber} · ${next.week.focus}</div>
        <div class="next-session-title">${next.session.day} — ${next.session.label}</div>
        <div class="next-session-meta">${next.session.exercises.length} exercises · ${next.session.duration}</div>
        <button class="btn-start" data-action="start-session" data-session="${next.session.id}">
          ${svg(`<polygon points="5 3 19 12 5 21 5 3"/>`, 'style="fill:var(--accent)"')} Start Session
        </button>
      </div>`;
    } else {
      html += `<p class="section-label">Program Status</p>
      <div class="card"><p style="font-size:16px;font-weight:700;color:var(--success)">🎉 All sessions complete!</p><p class="text-muted mt-8" style="font-size:14px">Excellent work completing your program. Discuss next steps with your coach.</p></div>`;
    }

    // Milestones
    html += `<p class="section-label">Milestones</p><div class="card card-flush">
      <ul class="milestone-list" style="padding: 0 18px">`;
    CLIENT_CONFIG.milestones.forEach((m) => {
      html += `<li class="milestone-item">
        <span class="milestone-check ${m.achieved ? "done" : "todo"}">${m.achieved ? checkIcon : ""}</span>
        <span style="font-size:14px;line-height:1.4">${m.label}</span>
        <span class="milestone-week">Wk ${m.week}</span>
      </li>`;
    });
    html += `</ul></div>`;

    html += disclaimer();
    return html;
  }

  // ── ─── VIEW: CLIENT OVERVIEW ─────────────────────────────────────────────
  function renderOverview() {
    const { client, coach, goals } = CLIENT_CONFIG;
    const startDate = formatDate(client.startDate);

    let html = `
    <div class="overview-hero">
      <div class="overview-client-name">${client.firstName} ${client.lastName}</div>
      <div class="overview-condition">${client.condition}</div>
      <div class="overview-detail">${client.conditionDetail}</div>
    </div>

    <div class="card card-sm" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span class="text-muted" style="font-size:13px">Age</span>
        <span class="font-med" style="font-size:14px">${client.age}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span class="text-muted" style="font-size:13px">Program Start</span>
        <span class="font-med" style="font-size:14px">${startDate}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span class="text-muted" style="font-size:13px">Program Length</span>
        <span class="font-med" style="font-size:14px">${client.programWeeks} weeks</span>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span class="text-muted" style="font-size:13px">Current Week</span>
        <span class="font-med" style="font-size:14px;color:var(--accent)">Week ${client.currentWeek}</span>
      </div>
    </div>

    <div class="coach-card">
      <div class="coach-name">${coach.name}, ${coach.credentials}</div>
      <div class="coach-creds">Your Rehab Coach</div>
      <div class="coach-note">${coach.contactNote}</div>
    </div>

    <p class="section-label">Program Goals</p>
    <div class="card card-flush">
      <ul class="goals-list" style="padding:0 18px">`;
    goals.forEach((g, i) => {
      html += `<li class="goal-item">
        <span class="goal-bullet">${i + 1}</span>
        <span>${g}</span>
      </li>`;
    });
    html += `</ul></div>`;

    // Phase overview
    html += `<p class="section-label">Program Phases</p>`;
    REHAB_PLAN.phases.forEach((phase) => {
      html += `<div class="card card-sm" style="border-left:4px solid ${phase.color};margin-bottom:10px">
        <div style="font-size:14px;font-weight:700;margin-bottom:4px">${phase.label} <span style="color:var(--text-muted);font-weight:400;font-size:12px">(Weeks ${phase.weeks})</span></div>
        <div style="font-size:13px;color:var(--text-muted);line-height:1.5">${phase.focus}</div>
      </div>`;
    });

    html += disclaimer();
    return html;
  }

  // ── ─── VIEW: REHAB PLAN ──────────────────────────────────────────────────
  function renderPlan() {
    let html = `<p class="section-label" style="margin-top:4px">Your 12-Week Program</p>`;

    let lastPhase = null;
    REHAB_PLAN.weeks.forEach((week) => {
      if (week.phase !== lastPhase) {
        const phase = REHAB_PLAN.phases.find((p) => p.id === week.phase);
        html += `<div class="phase-divider">
          <div class="phase-divider-line"></div>
          <span class="phase-divider-label" style="color:${phase.color}">${phase.label}</span>
          <div class="phase-divider-line"></div>
        </div>`;
        lastPhase = week.phase;
      }

      const weekSessions = week.sessions;
      const completedCount = weekSessions.filter((s) => {
        const st = sessionState[s.id];
        return s.completed || (st && st.completed);
      }).length;
      const isCurrentWeek = week.weekNumber === CLIENT_CONFIG.client.currentWeek;
      const allDone = completedCount === weekSessions.length;

      let badge = "";
      if (isCurrentWeek)    badge = `<span class="week-badge current">Current</span>`;
      else if (allDone)     badge = `<span class="week-badge complete">✓ Done</span>`;
      else if (week.weekNumber < CLIENT_CONFIG.client.currentWeek)
                             badge = `<span class="week-badge complete">✓ Done</span>`;
      else                  badge = `<span class="week-badge upcoming">Upcoming</span>`;

      html += `<div class="week-card">
        <div class="week-header">
          <span class="week-num">Week ${week.weekNumber}</span>
          <span class="week-focus">${week.focus}</span>
          ${badge}
        </div>`;

      weekSessions.forEach((session) => {
        const st = sessionState[session.id];
        const isDone = session.completed || (st && st.completed);
        const isNext = !isDone && getNextSession()?.session.id === session.id;

        const dotClass = isDone ? "done" : isNext ? "next" : "upcoming";
        const dotIcon  = isDone ? checkIcon : isNext ? "→" : "○";

        const painVal = (st && st.painRating != null) ? st.painRating : session.painRating;

        html += `<div class="session-row" data-action="open-session" data-session="${session.id}">
          <span class="session-dot ${dotClass}">${dotIcon}</span>
          <div class="session-info">
            <div class="session-day">${session.day} — ${session.label}</div>
            <div class="session-dur">${session.exercises.length} exercises · ${session.duration}</div>
          </div>
          ${painVal != null ? `<div class="session-pain"><span class="session-pain-dot" style="background:${painVal<=2?'var(--success)':painVal<=5?'var(--warning)':'var(--danger)'}"></span><span>${painVal}/10</span></div>` : ""}
          <svg class="session-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`;
      });

      html += `</div>`; // week-card
    });

    html += disclaimer();
    return html;
  }

  // ── ─── VIEW: SESSION ─────────────────────────────────────────────────────
  function renderSessionView(sessionId) {
    const found = getSessionById(sessionId);
    if (!found) return `<p class="text-muted" style="padding:20px">Session not found.</p>`;

    const { session, week } = found;
    const st = getSessionState(session.id);
    const allChecked = session.exercises.every((id) => st.exercises[id]);

    let html = `
    <button class="back-btn" data-action="back">${backArrow} Back to Plan</button>

    <div class="session-header-card">
      <div class="session-header-title">Week ${week.weekNumber} — ${session.day}</div>
      <div class="session-header-meta">${session.label} · ${session.duration} · ${session.exercises.length} exercises</div>
    </div>`;

    // Exercise cards
    session.exercises.forEach((exId) => {
      const ex = getExerciseById(exId);
      if (!ex) return;
      const checked = !!st.exercises[exId];
      const catClass = "cat-" + ex.category.replace(/\s+/g, "-").replace(/\//g, "-");

      html += `
      <div class="exercise-session-card ${checked ? "done" : ""}" id="exc-${exId}">
        <div class="ex-top">
          <button class="ex-check ${checked ? "checked" : ""}" data-action="toggle-exercise"
            data-session="${session.id}" data-exercise="${exId}" aria-label="Mark complete">
            ${checked ? checkIcon : ""}
          </button>
          <div class="ex-body">
            <div class="ex-name">${ex.name}</div>
            <span class="ex-category-badge ${catClass}">${ex.category}</span>
            <div class="ex-desc" style="margin-top:8px">${ex.description}</div>

            <div class="ex-specs">
              ${ex.sets ? `<div class="spec-chip">${ex.sets} <span>sets</span></div>` : ""}
              ${ex.reps ? `<div class="spec-chip">${ex.reps} <span>reps</span></div>` : ""}
              ${ex.hold ? `<div class="spec-chip">${ex.hold} <span>hold</span></div>` : ""}
              ${ex.tempo ? `<div class="spec-chip" style="max-width:160px;white-space:normal"><span>Tempo: </span>${ex.tempo}</div>` : ""}
              ${ex.rest ? `<div class="spec-chip" style="max-width:160px;white-space:normal"><span>Rest: </span>${ex.rest}</div>` : ""}
            </div>

            <div class="ex-cue"><strong>Coaching cue:</strong> ${ex.cue}</div>
            ${ex.painNote ? `<div class="ex-pain-note"><strong>Pain note:</strong> ${ex.painNote}</div>` : ""}

            <div class="ex-image-placeholder">
              ${videoIcon}
              <span>Image / video placeholder</span>
            </div>
          </div>
        </div>
      </div>`;
    });

    // Complete session button
    const sessionDone = st.completed || session.completed;
    if (sessionDone) {
      html += `<div class="card" style="text-align:center;padding:20px">
        <div style="font-size:32px;margin-bottom:8px">✅</div>
        <div style="font-size:17px;font-weight:700;color:var(--success)">Session Complete!</div>
        ${st.painRating != null ? `<div style="font-size:13px;color:var(--text-muted);margin-top:6px">Pain: ${st.painRating}/10 · Effort: ${st.effortRating}/5</div>` : ""}
      </div>`;
    } else {
      html += `<button class="btn-complete" data-action="open-checkin" data-session="${session.id}"
        ${allChecked ? "" : "disabled"}>
        ${allChecked ? "Complete Session" : "Complete all exercises to finish"}
      </button>`;
    }

    html += disclaimer();
    return html;
  }

  // ── ─── VIEW: EXERCISE LIBRARY ────────────────────────────────────────────
  function renderExerciseLibrary(filter) {
    const phases = [
      { key: "all",   label: "All" },
      { key: "1",     label: "Phase 1" },
      { key: "2",     label: "Phase 2" },
      { key: "3",     label: "Phase 3" },
    ];

    const activeFilter = filter || "all";

    let html = `<p class="section-label" style="margin-top:4px">Exercise Library</p>
    <div class="filter-row">`;
    phases.forEach(({ key, label }) => {
      html += `<button class="filter-chip ${activeFilter === key ? "active" : ""}"
        data-action="filter-exercises" data-filter="${key}">${label}</button>`;
    });
    html += `</div>`;

    const filtered = activeFilter === "all"
      ? EXERCISE_LIBRARY
      : EXERCISE_LIBRARY.filter((ex) => String(ex.phase) === activeFilter);

    filtered.forEach((ex) => {
      const catClass = "cat-" + ex.category.replace(/\s+/g, "-").replace(/\//g, "-");
      html += `
      <div class="exercise-lib-card" data-action="open-exercise" data-exercise="${ex.id}">
        <div class="ex-lib-top">
          <span class="ex-category-badge ${catClass}">${ex.category}</span>
          <span class="ex-lib-chevron">${chevronRight}</span>
        </div>
        <div class="ex-lib-name">${ex.name}</div>
        <div class="ex-lib-phase" style="margin-top:4px">Phase ${ex.phase}</div>
        <div class="ex-lib-desc">${ex.description}</div>
      </div>`;
    });

    if (!filtered.length) {
      html += `<div class="empty-state"><p>No exercises in this phase yet.</p></div>`;
    }

    html += disclaimer();
    return html;
  }

  // ── ─── VIEW: PROGRESS ────────────────────────────────────────────────────
  function renderProgress() {
    const { pct, completed, total, avgPain } = getStats();
    const client = CLIENT_CONFIG.client;

    // Build phase progress
    const phaseStats = REHAB_PLAN.phases.map((phase) => {
      const phaseSessions = REHAB_PLAN.weeks
        .filter((w) => w.phase === phase.id)
        .flatMap((w) => w.sessions);
      const done = phaseSessions.filter((s) => {
        const st = sessionState[s.id];
        return s.completed || (st && st.completed);
      }).length;
      const phasePct = phaseSessions.length ? Math.round((done / phaseSessions.length) * 100) : 0;
      return { phase, done, total: phaseSessions.length, pct: phasePct };
    });

    let html = `
    <p class="section-label" style="margin-top:4px">Overall Progress</p>
    <div class="card" style="margin-bottom:14px">
      <div style="font-size:32px;font-weight:800;color:var(--accent);margin-bottom:4px">${pct}%</div>
      <div style="font-size:14px;color:var(--text-muted);margin-bottom:16px">${completed} of ${total} total sessions completed</div>

      <div class="progress-bar-wrap" style="margin-bottom:12px">
        <div class="progress-bar-label">
          <span>Overall</span><span style="color:var(--accent)">${pct}%</span>
        </div>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      </div>

      ${phaseStats.map((ps, i) => `
      <div class="progress-bar-wrap" style="margin-bottom:${i < phaseStats.length-1 ? "12px" : "0"}">
        <div class="progress-bar-label">
          <span style="color:${ps.phase.color}">${ps.phase.label}</span>
          <span style="color:${ps.phase.color}">${ps.pct}%</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width:${ps.pct}%;background:${ps.phase.color}"></div>
        </div>
      </div>`).join("")}
    </div>

    <div class="stat-row" style="margin-bottom:14px">
      <div class="stat-card">
        <div class="stat-value" style="color:${parseFloat(avgPain)<=2?"var(--success)":parseFloat(avgPain)<=5?"var(--warning)":"var(--danger)"}">${avgPain}</div>
        <div class="stat-label">Avg Pain</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${client.currentWeek}</div>
        <div class="stat-label">Current Week</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${CLIENT_CONFIG.milestones.filter(m=>m.achieved).length}</div>
        <div class="stat-label">Milestones</div>
      </div>
    </div>

    <p class="section-label">Session History</p>
    <div class="card card-flush">
      <table class="history-table">
        <thead>
          <tr>
            <th>Session</th>
            <th>Day</th>
            <th>Status</th>
            <th>Pain</th>
          </tr>
        </thead>
        <tbody>`;

    REHAB_PLAN.weeks.forEach((week) => {
      week.sessions.forEach((s) => {
        const st = sessionState[s.id];
        const isDone = s.completed || (st && st.completed);
        const painVal = (st && st.painRating != null) ? st.painRating : s.painRating;
        const weekNum = week.weekNumber;

        if (weekNum > CLIENT_CONFIG.client.currentWeek) return; // only show past sessions

        html += `<tr>
          <td style="font-weight:600">Wk${weekNum} ${s.label}</td>
          <td>${s.day.slice(0,3)}</td>
          <td>${isDone ? `<span class="pain-pill pain-low">✓ Done</span>` : `<span class="pain-pill" style="background:var(--bg);color:var(--text-muted)">—</span>`}</td>
          <td>${painVal != null ? `<span class="pain-pill ${painColor(painVal)}">${painVal}/10</span>` : "—"}</td>
        </tr>`;
      });
    });

    html += `</tbody></table></div>`;
    html += disclaimer();
    return html;
  }

  // ── ─── VIEW: COACH NOTES ─────────────────────────────────────────────────
  function renderCoachNotes() {
    const { coach, coachNotes } = CLIENT_CONFIG;

    let html = `
    <div class="coach-card">
      <div class="coach-name">${coach.name}, ${coach.credentials}</div>
      <div class="coach-creds">Your Rehab Coach</div>
      <div class="coach-note">${coach.contactNote}</div>
    </div>

    <p class="section-label">Notes From Your Coach</p>`;

    coachNotes.forEach((note) => {
      html += `<div class="note-card">
        <div class="note-date">${formatDate(note.date)}</div>
        <div class="note-title">${note.title}</div>
        <div class="note-body">${note.body}</div>
      </div>`;
    });

    if (!coachNotes.length) {
      html += `<div class="empty-state"><p>No coach notes yet. Check back after your next session.</p></div>`;
    }

    html += disclaimer();
    return html;
  }

  // ── ─── MODAL: Session Check-in ───────────────────────────────────────────
  function openCheckIn(sessionId) {
    const found = getSessionById(sessionId);
    if (!found) return;
    const { session, week } = found;

    const modalBody = document.getElementById("modal-body");
    const overlay   = document.getElementById("modal-overlay");

    let html = `<div class="modal-title">Session Check-in</div>
    <p style="font-size:15px;color:var(--text-muted);margin-bottom:16px">
      Week ${week.weekNumber} · ${session.day} · ${session.label}
    </p>

    <p class="scale-label">Pain level during session (0 = none, 10 = severe)</p>
    <div class="scale-row" id="pain-scale">`;
    for (let i = 0; i <= 10; i++) {
      html += `<button class="scale-btn" data-scale="pain" data-val="${i}">${i}</button>`;
    }
    html += `</div>

    <p class="scale-label">Effort / difficulty (1 = very easy, 5 = very hard)</p>
    <div class="scale-row" id="effort-scale">`;
    for (let i = 1; i <= 5; i++) {
      html += `<button class="scale-btn" data-scale="effort" data-val="${i}">${i}</button>`;
    }
    html += `</div>

    <button class="btn-complete" id="confirm-checkin" data-session="${sessionId}" disabled>Save & Complete Session</button>
    <button class="btn-secondary" data-action="close-modal">Cancel</button>`;

    modalBody.innerHTML = html;
    overlay.hidden = false;
    bindModalEvents();
  }

  function bindModalEvents() {
    const overlay = document.getElementById("modal-overlay");
    let painVal = null, effortVal = null;

    overlay.querySelectorAll(".scale-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const scale = btn.dataset.scale;
        const val   = parseInt(btn.dataset.val);
        overlay.querySelectorAll(`.scale-btn[data-scale="${scale}"]`).forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        if (scale === "pain")   painVal   = val;
        if (scale === "effort") effortVal = val;
        const confirm = document.getElementById("confirm-checkin");
        if (confirm && painVal !== null && effortVal !== null) confirm.disabled = false;
      });
    });

    const confirm = document.getElementById("confirm-checkin");
    if (confirm) {
      confirm.addEventListener("click", () => {
        const sessionId = confirm.dataset.session;
        const st = getSessionState(sessionId);
        st.completed   = true;
        st.painRating  = painVal;
        st.effortRating = effortVal;
        saveState(sessionState);
        closeModal();
        navigate("session", sessionId);
      });
    }

    const closeBtn = document.getElementById("modal-close");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
  }

  function closeModal() {
    document.getElementById("modal-overlay").hidden = true;
  }

  // ── ─── EVENT DELEGATION ──────────────────────────────────────────────────
  function bindViewEvents(view, param) {
    const main = document.getElementById("app-main");

    main.addEventListener("click", handleMainClick);
    return () => main.removeEventListener("click", handleMainClick);
  }

  function handleMainClick(e) {
    const target = e.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;

    switch (action) {
      case "back":
        navigate("plan");
        break;

      case "start-session":
      case "open-session":
        navigate("session", target.dataset.session);
        break;

      case "open-exercise": {
        // Show exercise detail in modal
        const ex = getExerciseById(target.dataset.exercise);
        if (!ex) break;
        const catClass = "cat-" + ex.category.replace(/\s+/g, "-").replace(/\//g, "-");
        document.getElementById("modal-body").innerHTML = `
          <div class="modal-title">${ex.name}</div>
          <span class="ex-category-badge ${catClass}">${ex.category}</span>
          <p style="font-size:14px;color:var(--text-muted);margin:12px 0">${ex.description}</p>
          <div class="ex-specs" style="margin-bottom:12px">
            ${ex.sets ? `<div class="spec-chip">${ex.sets} <span>sets</span></div>` : ""}
            ${ex.reps ? `<div class="spec-chip">${ex.reps} <span>reps</span></div>` : ""}
            ${ex.hold ? `<div class="spec-chip">${ex.hold} <span>hold</span></div>` : ""}
            ${ex.tempo ? `<div class="spec-chip" style="max-width:none;white-space:normal"><span>Tempo: </span>${ex.tempo}</div>` : ""}
            ${ex.rest ? `<div class="spec-chip" style="max-width:none;white-space:normal"><span>Rest: </span>${ex.rest}</div>` : ""}
          </div>
          <div class="ex-cue"><strong>Coaching cue:</strong> ${ex.cue}</div>
          ${ex.painNote ? `<div class="ex-pain-note" style="margin-top:8px"><strong>Pain note:</strong> ${ex.painNote}</div>` : ""}
          <div class="ex-image-placeholder" style="margin-top:14px">${videoIcon}<span>Image / video placeholder</span></div>
        `;
        document.getElementById("modal-overlay").hidden = false;
        document.getElementById("modal-close").addEventListener("click", closeModal);
        break;
      }

      case "filter-exercises":
        navigate("exercises", target.dataset.filter === "all" ? null : target.dataset.filter);
        break;

      case "toggle-exercise": {
        const sessionId = target.dataset.session;
        const exId      = target.dataset.exercise;
        const st = getSessionState(sessionId);
        st.exercises[exId] = !st.exercises[exId];
        saveState(sessionState);
        // Re-render session view
        navigate("session", sessionId);
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

  // ── Bottom nav click ──────────────────────────────────────────────────────
  document.getElementById("bottom-nav").addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-btn");
    if (!btn) return;
    navigate(btn.dataset.view);
  });

  // Header logo click → dashboard
  document.getElementById("header-logo").addEventListener("click", () => navigate("dashboard"));

  // Modal overlay backdrop click → close
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-overlay")) closeModal();
  });

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    applyBranding();

    // Set header badge to current week
    const badge = document.createElement("span");
    badge.className = "header-badge";
    badge.textContent = `Wk ${CLIENT_CONFIG.client.currentWeek}`;
    document.getElementById("header-right").appendChild(badge);

    // Render initial view
    renderView();

    // Listen for hash changes
    window.addEventListener("hashchange", () => {
      // Remove stale event listeners by replacing the main element
      const oldMain = document.getElementById("app-main");
      const newMain = oldMain.cloneNode(false);
      oldMain.parentNode.replaceChild(newMain, oldMain);
      renderView();
    });
  }

  // Wait for DOM + data
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
