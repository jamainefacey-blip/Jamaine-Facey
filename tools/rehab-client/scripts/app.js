/* ─────────────────────────────────────────────────────────────────────────────
   Pain System Rehab — App Controller  v1.1
   Single-file SPA with hash-based routing.
   ───────────────────────────────────────────────────────────────────────────── */

(function () {
  "use strict";

  // ── Session state ─────────────────────────────────────────────────────────
  const STORAGE_KEY    = "ps_rehab_session_state";
  const VISITED_KEY    = "ps_rehab_visited";

  function loadState() {
    try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : {}; }
    catch (_) { return {}; }
  }
  function saveState(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (_) {}
  }
  function hasVisited() {
    try { return !!localStorage.getItem(VISITED_KEY); } catch (_) { return false; }
  }
  function markVisited() {
    try { localStorage.setItem(VISITED_KEY, "1"); } catch (_) {}
  }

  let sessionState = loadState();

  function getSessionState(sid) {
    if (!sessionState[sid]) sessionState[sid] = { completed: false, painRating: null, effortRating: null, exercises: {} };
    return sessionState[sid];
  }

  // ── Branding ──────────────────────────────────────────────────────────────
  function applyBranding() {
    if (!CLIENT_CONFIG) return;
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
    const n = parseInt(hex.replace("#",""), 16);
    const clamp = v => Math.min(255, Math.max(0, v));
    const r = clamp((n >> 16) + pct),
          g = clamp(((n >> 8) & 0xff) + pct),
          b = clamp((n & 0xff) + pct);
    return "#" + ((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);
  }
  function hexToRgba(hex, a) {
    const n = parseInt(hex.replace("#",""), 16);
    return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
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

  // Fix: navigate() detects same-route and force-re-renders instead of relying
  // on hashchange (which silently no-ops when the hash doesn't actually change).
  function navigate(view, param) {
    const newHash = param ? `${view}/${param}` : view;
    if (window.location.hash === "#" + newHash) {
      doRender();          // same route — re-render in place
    } else {
      window.location.hash = newHash;
    }
  }

  function doRender() {
    const { view, param } = getRoute();
    const main = document.getElementById("app-main");
    const fn   = VIEWS[view] || VIEWS.dashboard;
    main.innerHTML = fn(param);
    main.scrollTop = 0;                                     // reset scroll
    updateNavActive(view === "session" ? "plan" : view === "welcome" ? "" : view);
    toggleNavVisibility(view === "welcome");
    main.addEventListener("click", handleMainClick);        // fresh listener on fresh element
  }

  function updateNavActive(view) {
    document.querySelectorAll(".nav-btn").forEach(b =>
      b.classList.toggle("active", b.dataset.view === view)
    );
  }

  function toggleNavVisibility(hideNav) {
    document.getElementById("bottom-nav").classList.toggle("hidden", hideNav);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function fmtDate(d) {
    return new Date(d).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
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
    play:    svgIcon(`<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>`),
    person:  svgIcon(`<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`),
    arrow:   svgIcon(`<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>`),
    alert:   svgIcon(`<triangle points="10.29 3.86 1.82 18 22.18 18"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></triangle>`),
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
        <li>Individual results vary — <strong>no specific recovery outcome is guaranteed</strong>.</li>
      </ul>
    </div>`;
  }

  // ── Stats helpers ─────────────────────────────────────────────────────────
  function getStats() {
    const all       = getAllSessions();
    const toDate    = getTotalSessionsUpToCurrentWeek();
    const isDone    = s => s.completed || (sessionState[s.id] && sessionState[s.id].completed);
    const completed = all.filter(isDone);
    const doneToDate = toDate.filter(isDone);
    const pct = toDate.length ? Math.round(doneToDate.length / toDate.length * 100) : 0;
    const ratings = completed
      .map(s => { const st = sessionState[s.id]; return st?.painRating ?? s.painRating; })
      .filter(v => v != null);
    const avgPain = ratings.length
      ? (ratings.reduce((a,b) => a+b, 0) / ratings.length).toFixed(1) : "—";
    return { completed: completed.length, total: all.length, doneToDate: doneToDate.length, toDate: toDate.length, pct, avgPain };
  }

  function getNextSession() {
    for (const week of REHAB_PLAN.weeks)
      for (const s of week.sessions)
        if (!s.completed && !(sessionState[s.id]?.completed)) return { session: s, week };
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: WELCOME
  // ─────────────────────────────────────────────────────────────────────────
  function renderWelcome() {
    const { client, coach, appName, accentColor } = CLIENT_CONFIG;
    const next = getNextSession();
    return `
    <div class="welcome-screen">
      <div class="welcome-logo">${CLIENT_CONFIG.logoText}</div>
      <h1 class="welcome-app-name">${appName}</h1>
      <p class="welcome-tagline">Your personalised rehab program</p>

      <div class="welcome-hero-card">
        <div class="welcome-client-name">Welcome, ${client.firstName}</div>
        <div class="welcome-condition">${client.condition}</div>
        <div class="welcome-detail">${client.conditionDetail}</div>
        <div class="welcome-meta-row">
          <div class="welcome-meta-item">
            <span class="welcome-meta-val">Week ${client.currentWeek}</span>
            <span class="welcome-meta-label">of ${client.programWeeks}</span>
          </div>
          <div class="welcome-meta-divider"></div>
          <div class="welcome-meta-item">
            <span class="welcome-meta-val">${coach.name}</span>
            <span class="welcome-meta-label">${coach.credentials}</span>
          </div>
        </div>
      </div>

      ${next ? `
      <div class="welcome-next-hint">
        <span>Next up:</span>
        <strong>Week ${next.week.weekNumber} · ${next.session.day} · ${next.session.exercises.length} exercises</strong>
      </div>` : `
      <div class="welcome-next-hint"><strong>🎉 Program complete — speak with your coach about next steps.</strong></div>`}

      <button class="btn-welcome-enter" data-action="enter-program">
        Begin Program ${ICONS.arrow}
      </button>

      <p class="welcome-disclaimer-mini">
        This app is not medical advice. It supports coach-led rehabilitation only.
        Stop exercising and contact your provider if symptoms worsen.
      </p>
    </div>`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  function renderDashboard() {
    const { pct, completed, avgPain } = getStats();
    const next   = getNextSession();
    const client = CLIENT_CONFIG.client;
    const curWeek = REHAB_PLAN.weeks.find(w => w.weekNumber === client.currentWeek);
    const phase   = curWeek ? REHAB_PLAN.phases.find(p => p.id === curWeek.phase) : null;

    const radius = 40, circ = 2 * Math.PI * radius;
    const dash = circ - (pct / 100) * circ;

    let html = `
    <p class="greeting">Hi, ${client.firstName} 👋</p>
    <p class="greeting-sub">Week ${client.currentWeek} of ${client.programWeeks} · ${curWeek?.focus || ""}</p>

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
          ${phase ? `<div class="phase-pill" style="margin-top:10px"><span class="phase-dot" style="background:${phase.color}"></span><span style="color:${phase.color};font-size:12px;font-weight:700">${phase.label}</span></div>` : ""}
        </div>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-value">${client.currentWeek}/${client.programWeeks}</div>
        <div class="stat-label">Weeks</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:${avgPain==="—"?"var(--text)":+avgPain<=2?"var(--success)":+avgPain<=5?"var(--warning)":"var(--danger)"}">${avgPain}</div>
        <div class="stat-label">Avg Pain</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${completed}</div>
        <div class="stat-label">Sessions</div>
      </div>
    </div>`;

    if (next) {
      html += `
      <p class="section-label">Next Session</p>
      <div class="next-session-card">
        <div class="next-session-tag">Week ${next.week.weekNumber} · ${next.week.focus}</div>
        <div class="next-session-title">${next.session.day} — ${next.session.label}</div>
        <div class="next-session-meta">${next.session.exercises.length} exercises · ${next.session.duration}</div>
        <button class="btn-start" data-action="start-session" data-session="${next.session.id}">
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
        <div class="profile-avatar">${CLIENT_CONFIG.client.firstName[0]}${CLIENT_CONFIG.client.lastName[0]}</div>
        <div>
          <div style="font-size:15px;font-weight:700">${client.firstName} ${client.lastName}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:2px">${client.condition}</div>
        </div>
      </div>
      <div class="profile-shortcut-right">${ICONS.chevron}</div>
    </div>`;

    // Milestones
    html += `<p class="section-label">Milestones</p><div class="card card-flush"><ul class="milestone-list" style="padding:0 18px">`;
    CLIENT_CONFIG.milestones.forEach(m => {
      html += `<li class="milestone-item">
        <span class="milestone-check ${m.achieved ? "done" : "todo"}">${m.achieved ? ICONS.check : ""}</span>
        <span style="font-size:14px;line-height:1.4">${m.label}</span>
        <span class="milestone-week">Wk ${m.week}</span>
      </li>`;
    });
    html += `</ul></div>`;
    html += disclaimer();
    return html;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: OVERVIEW
  // ─────────────────────────────────────────────────────────────────────────
  function renderOverview() {
    const { client, coach, goals } = CLIENT_CONFIG;

    let html = `
    <div class="overview-hero">
      <div class="overview-client-name">${client.firstName} ${client.lastName}</div>
      <div class="overview-condition">${client.condition}</div>
      <div class="overview-detail">${client.conditionDetail}</div>
    </div>

    <div class="card card-sm" style="margin-bottom:14px">
      ${[
        ["Age", client.age],
        ["Program Start", fmtDate(client.startDate)],
        ["Program Length", `${client.programWeeks} weeks`],
        ["Current Week", `<span style="color:var(--accent);font-weight:700">Week ${client.currentWeek}</span>`],
      ].map(([label, val]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:13px;color:var(--text-muted)">${label}</span>
          <span style="font-size:14px;font-weight:600">${val}</span>
        </div>`).join("")
        .replace(/border-bottom[^;]+;(?=[^{]*<\/div>\s*<\/div>)/, "")}
    </div>

    <div class="coach-card">
      <div class="coach-name">${coach.name}, ${coach.credentials}</div>
      <div class="coach-creds">Your Rehab Coach</div>
      <div class="coach-note">${coach.contactNote}</div>
    </div>

    <p class="section-label">Program Goals</p>
    <div class="card card-flush"><ul class="goals-list" style="padding:0 18px">`;
    goals.forEach((g, i) => {
      html += `<li class="goal-item">
        <span class="goal-bullet">${i+1}</span>
        <span>${g}</span>
      </li>`;
    });
    html += `</ul></div>

    <p class="section-label">Program Phases</p>`;
    REHAB_PLAN.phases.forEach(ph => {
      html += `<div class="card card-sm" style="border-left:4px solid ${ph.color};margin-bottom:10px">
        <div style="font-size:14px;font-weight:700;margin-bottom:4px">${ph.label}
          <span style="color:var(--text-muted);font-weight:400;font-size:12px"> (Weeks ${ph.weeks})</span></div>
        <div style="font-size:13px;color:var(--text-muted);line-height:1.5">${ph.focus}</div>
      </div>`;
    });

    // Link to coach notes
    html += `
    <p class="section-label">Coach Notes</p>
    <div class="profile-shortcut-card" data-action="go-notes">
      <div style="flex:1">
        <div style="font-size:15px;font-weight:700">${CLIENT_CONFIG.coachNotes.length} notes from ${coach.name}</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:2px">Tap to read latest updates</div>
      </div>
      <div class="profile-shortcut-right">${ICONS.chevron}</div>
    </div>`;

    html += disclaimer();
    return html;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: PLAN
  // ─────────────────────────────────────────────────────────────────────────
  function renderPlan() {
    let html = `<p class="section-label" style="margin-top:4px">Your ${CLIENT_CONFIG.client.programWeeks}-Week Program</p>`;
    let lastPhase = null;

    REHAB_PLAN.weeks.forEach(week => {
      if (week.phase !== lastPhase) {
        const ph = REHAB_PLAN.phases.find(p => p.id === week.phase);
        html += `<div class="phase-divider">
          <div class="phase-divider-line"></div>
          <span class="phase-divider-label" style="color:${ph.color}">${ph.label}</span>
          <div class="phase-divider-line"></div>
        </div>`;
        lastPhase = week.phase;
      }

      const sessions = week.sessions;
      const doneCount = sessions.filter(s => s.completed || sessionState[s.id]?.completed).length;
      const isCurrentWeek = week.weekNumber === CLIENT_CONFIG.client.currentWeek;
      const allDone = doneCount === sessions.length;
      const isPast  = week.weekNumber < CLIENT_CONFIG.client.currentWeek;

      let badge = isCurrentWeek
        ? `<span class="week-badge current">Current</span>`
        : allDone || isPast
        ? `<span class="week-badge complete">✓ Done</span>`
        : `<span class="week-badge upcoming">Upcoming</span>`;

      html += `<div class="week-card"><div class="week-header">
        <span class="week-num">Week ${week.weekNumber}</span>
        <span class="week-focus">${week.focus}</span>
        ${badge}
      </div>`;

      sessions.forEach(session => {
        const st     = sessionState[session.id];
        const isDone = session.completed || (st?.completed);
        const isNext = !isDone && getNextSession()?.session.id === session.id;
        const painVal = st?.painRating ?? session.painRating;

        const dotClass = isDone ? "done" : isNext ? "next" : "upcoming";
        const dotIcon  = isDone ? ICONS.check : isNext ? "→" : "·";

        html += `<div class="session-row" data-action="open-session" data-session="${session.id}">
          <span class="session-dot ${dotClass}">${dotIcon}</span>
          <div class="session-info">
            <div class="session-day">${session.day} — ${session.label}</div>
            <div class="session-dur">${session.exercises.length} exercises · ${session.duration}</div>
          </div>
          ${painVal != null ? `
          <div class="session-pain">
            <span class="session-pain-dot" style="background:${painVal<=2?"var(--success)":painVal<=5?"var(--warning)":"var(--danger)"}"></span>
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
    const found = getSessionById(sessionId);
    if (!found) return `<button class="back-btn" data-action="back">${ICONS.back} Back</button>
      <div class="card"><p class="text-muted">Session not found.</p></div>`;

    const { session, week } = found;
    const st          = getSessionState(session.id);
    const sessionDone = session.completed || st.completed;
    const allChecked  = session.exercises.every(id => st.exercises[id]);
    const checkedCount = session.exercises.filter(id => st.exercises[id]).length;

    let html = `
    <button class="back-btn" data-action="back">${ICONS.back} Back to Plan</button>

    <div class="session-header-card">
      <div class="session-header-title">Week ${week.weekNumber} — ${session.day}</div>
      <div class="session-header-meta">${session.label} · ${session.duration} · ${session.exercises.length} exercises</div>
      ${!sessionDone ? `
      <div class="session-progress-row">
        <div class="session-progress-track">
          <div class="session-progress-fill" style="width:${Math.round(checkedCount/session.exercises.length*100)}%"></div>
        </div>
        <span class="session-progress-label">${checkedCount}/${session.exercises.length}</span>
      </div>` : ""}
    </div>

    ${!sessionDone ? `<div class="session-instructions">
      Tap the circle next to each exercise once you have completed it.
      When all exercises are done, the button below will unlock so you can log your session.
    </div>` : ""}`;

    // Exercise cards
    session.exercises.forEach(exId => {
      const ex = getExerciseById(exId);
      if (!ex) return;
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
            <span class="ex-category-badge ${catClass}">${ex.category}</span>
            <div class="ex-desc" style="margin-top:8px">${ex.description}</div>

            <div class="ex-specs">
              ${ex.sets ? `<div class="spec-chip"><strong>${ex.sets}</strong> <span>sets</span></div>` : ""}
              ${ex.reps ? `<div class="spec-chip"><strong>${ex.reps}</strong> <span>reps</span></div>` : ""}
              ${ex.hold ? `<div class="spec-chip"><strong>${ex.hold}</strong> <span>hold</span></div>` : ""}
              ${ex.tempo ? `<div class="spec-chip spec-chip-wide"><span>Tempo </span><strong>${ex.tempo}</strong></div>` : ""}
              ${ex.rest ? `<div class="spec-chip spec-chip-wide"><span>Rest </span><strong>${ex.rest}</strong></div>` : ""}
            </div>

            <div class="ex-cue">
              <span class="ex-cue-label">Coaching cue</span>
              ${ex.cue}
            </div>
            ${ex.painNote ? `<div class="ex-pain-note">
              <span class="ex-pain-label">&#9888; Pain note</span>
              ${ex.painNote}
            </div>` : ""}

            <div class="ex-image-placeholder">
              <div class="ex-image-icon">${ICONS.image}</div>
              <div class="ex-image-text">
                <span class="ex-image-name">${ex.name}</span>
                <span class="ex-image-sub">Anatomy diagram / video coming soon</span>
              </div>
            </div>
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
        <button class="btn-secondary" data-action="back" style="margin-top:16px">Back to Plan</button>
      </div>`;
    } else {
      html += `
      <div class="complete-btn-wrap">
        ${!allChecked ? `<p class="complete-hint">Complete all ${session.exercises.length} exercises above to unlock session log.</p>` : ""}
        <button class="btn-complete" data-action="open-checkin" data-session="${session.id}"
          ${allChecked ? "" : "disabled"}>
          ${allChecked ? "Log Session &amp; Check In" : `${checkedCount} / ${session.exercises.length} exercises done`}
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
    const filters = [
      { key: "all", label: "All Phases" },
      { key: "1",   label: "Phase 1"    },
      { key: "2",   label: "Phase 2"    },
      { key: "3",   label: "Phase 3"    },
    ];
    const activeFilter = filter || "all";
    const filtered = activeFilter === "all"
      ? EXERCISE_LIBRARY
      : EXERCISE_LIBRARY.filter(ex => String(ex.phase) === activeFilter);

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
          <span class="ex-lib-phase-badge">Phase ${ex.phase}</span>
          <span class="ex-lib-chevron">${ICONS.chevron}</span>
        </div>
        <div class="ex-lib-name">${ex.name}</div>
        <div class="ex-lib-desc">${ex.description}</div>
        <div class="ex-lib-specs">
          ${ex.sets ? `<span>${ex.sets} sets</span>` : ""}
          ${ex.reps ? `<span>${ex.reps} reps</span>` : ""}
          ${ex.hold ? `<span>${ex.hold} hold</span>` : ""}
        </div>
      </div>`;
    });

    if (!filtered.length) {
      html += `<div class="empty-state"><p>No exercises in this phase yet.</p></div>`;
    }

    html += disclaimer();
    return html;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: PROGRESS
  // ─────────────────────────────────────────────────────────────────────────
  function renderProgress() {
    const { pct, completed, total, avgPain } = getStats();
    const client = CLIENT_CONFIG.client;

    const phaseStats = REHAB_PLAN.phases.map(ph => {
      const sessions = REHAB_PLAN.weeks.filter(w => w.phase === ph.id).flatMap(w => w.sessions);
      const done = sessions.filter(s => s.completed || sessionState[s.id]?.completed).length;
      return { ph, done, total: sessions.length, pct: sessions.length ? Math.round(done/sessions.length*100) : 0 };
    });

    let html = `
    <p class="section-label" style="margin-top:4px">Overall Progress</p>
    <div class="card" style="margin-bottom:14px">
      <div style="font-size:36px;font-weight:800;color:var(--accent);margin-bottom:2px">${pct}%</div>
      <div style="font-size:14px;color:var(--text-muted);margin-bottom:18px">${completed} of ${total} total sessions completed</div>

      <div class="progress-bar-wrap" style="margin-bottom:14px">
        <div class="progress-bar-label">
          <span style="font-weight:600">Overall</span><span style="color:var(--accent);font-weight:700">${pct}%</span>
        </div>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      </div>

      ${phaseStats.map((ps, i) => `
      <div class="progress-bar-wrap" ${i < phaseStats.length-1 ? 'style="margin-bottom:14px"' : ""}>
        <div class="progress-bar-label">
          <span style="font-weight:600;color:${ps.ph.color}">${ps.ph.label}</span>
          <span style="color:${ps.ph.color};font-weight:700">${ps.done}/${ps.total}</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width:${ps.pct}%;background:${ps.ph.color}"></div>
        </div>
      </div>`).join("")}
    </div>

    <div class="stat-row" style="margin-bottom:16px">
      <div class="stat-card">
        <div class="stat-value" style="color:${avgPain==="—"?"var(--text)":+avgPain<=2?"var(--success)":+avgPain<=5?"var(--warning)":"var(--danger)"}">${avgPain}</div>
        <div class="stat-label">Avg Pain</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${client.currentWeek}</div>
        <div class="stat-label">Current Week</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${CLIENT_CONFIG.milestones.filter(m=>m.achieved).length}/${CLIENT_CONFIG.milestones.length}</div>
        <div class="stat-label">Milestones</div>
      </div>
    </div>

    <p class="section-label">Session History</p>
    <div class="card card-flush">
      <table class="history-table">
        <thead><tr><th>Week</th><th>Day</th><th>Status</th><th>Pain</th><th>Effort</th></tr></thead>
        <tbody>`;

    REHAB_PLAN.weeks.forEach(week => {
      if (week.weekNumber > client.currentWeek) return;
      week.sessions.forEach(s => {
        const st      = sessionState[s.id];
        const isDone  = s.completed || st?.completed;
        const painVal = st?.painRating  ?? s.painRating;
        const effVal  = st?.effortRating ?? s.effortRating;
        html += `<tr>
          <td style="font-weight:600;white-space:nowrap">Wk${week.weekNumber}</td>
          <td>${s.day.slice(0,3)}</td>
          <td>${isDone
            ? `<span class="pain-pill pain-low">✓ Done</span>`
            : `<span class="pain-pill" style="background:var(--bg);color:var(--text-muted)">—</span>`}
          </td>
          <td>${painVal != null ? `<span class="pain-pill ${painClass(painVal)}">${painVal}/10</span>` : "—"}</td>
          <td>${effVal  != null ? `<strong>${effVal}/5</strong>` : "—"}</td>
        </tr>`;
      });
    });

    html += `</tbody></table></div>`;
    html += disclaimer();
    return html;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: COACH NOTES
  // ─────────────────────────────────────────────────────────────────────────
  function renderCoachNotes() {
    const { coach, coachNotes } = CLIENT_CONFIG;

    let html = `
    <div class="coach-card">
      <div class="coach-name">${coach.name}, ${coach.credentials}</div>
      <div class="coach-creds">Your Rehab Coach</div>
      <div class="coach-note">${coach.contactNote}</div>
    </div>
    <p class="section-label">Notes From Your Coach</p>`;

    if (!coachNotes.length) {
      html += `<div class="empty-state"><p>No coach notes yet. Check back after your next session.</p></div>`;
    } else {
      coachNotes.forEach(note => {
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
    const found = getSessionById(sessionId);
    if (!found) return;
    const { session, week } = found;

    // Pain scale: 11 items (0–10) in two rows via grid
    let painBtns = "";
    for (let i = 0; i <= 10; i++) {
      const col = i <= 2 ? "scale-low" : i <= 5 ? "scale-mid" : "scale-high";
      painBtns += `<button class="scale-btn ${col}" data-scale="pain" data-val="${i}">${i}</button>`;
    }
    // Effort: 5 items
    let effortBtns = "";
    const effortLabels = ["","Very Easy","Easy","Moderate","Hard","Very Hard"];
    for (let i = 1; i <= 5; i++) {
      effortBtns += `<button class="scale-btn" data-scale="effort" data-val="${i}" title="${effortLabels[i]}">${i}</button>`;
    }

    document.getElementById("modal-body").innerHTML = `
      <div class="modal-title">Session Log</div>
      <p style="font-size:14px;color:var(--text-muted);margin-bottom:20px">
        Week ${week.weekNumber} &middot; ${session.day} &middot; ${session.label}
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
      const st       = getSessionState(sessionId);
      st.completed   = true;
      st.painRating  = painVal;
      st.effortRating = effortVal;
      saveState(sessionState);
      closeModal();
      navigate("session", sessionId);  // re-renders (same hash → forceRerender)
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
        markVisited();
        navigate("dashboard");
        break;

      case "back":
        navigate("plan");
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
        const ex = getExerciseById(target.dataset.exercise);
        if (!ex) break;
        const catClass = "cat-" + ex.category.replace(/[\s\/]+/g, "-");
        document.getElementById("modal-body").innerHTML = `
          <div class="modal-title">${ex.name}</div>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
            <span class="ex-category-badge ${catClass}">${ex.category}</span>
            <span style="font-size:12px;color:var(--text-muted);font-weight:600">Phase ${ex.phase}</span>
          </div>
          <p style="font-size:14px;color:var(--text-muted);line-height:1.6;margin-bottom:14px">${ex.description}</p>

          <div class="ex-image-placeholder" style="margin-bottom:14px">
            <div class="ex-image-icon">${ICONS.image}</div>
            <div class="ex-image-text">
              <span class="ex-image-name">${ex.name}</span>
              <span class="ex-image-sub">Anatomy diagram coming soon</span>
            </div>
          </div>

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

      case "filter-exercises":
        navigate("exercises", target.dataset.filter === "all" ? null : target.dataset.filter);
        break;

      case "toggle-exercise": {
        const sid = target.dataset.session;
        const eid = target.dataset.exercise;
        const st  = getSessionState(sid);
        st.exercises[eid] = !st.exercises[eid];
        saveState(sessionState);
        navigate("session", sid);   // navigate() handles same-hash re-render
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

    // Week badge in header
    const badge    = document.createElement("span");
    badge.className = "header-badge";
    badge.textContent = `Wk ${CLIENT_CONFIG.client.currentWeek}`;
    document.getElementById("header-right").appendChild(badge);

    // Bottom nav
    document.getElementById("bottom-nav").addEventListener("click", e => {
      const btn = e.target.closest(".nav-btn");
      if (btn) navigate(btn.dataset.view);
    });

    // Header logo → dashboard
    document.getElementById("header-logo").addEventListener("click", () => navigate("dashboard"));

    // Modal: close button & backdrop (bound once globally)
    document.getElementById("modal-close").addEventListener("click", closeModal);
    document.getElementById("modal-overlay").addEventListener("click", e => {
      if (e.target === document.getElementById("modal-overlay")) closeModal();
    });

    // Set default route
    if (!window.location.hash || window.location.hash === "#") {
      window.location.hash = hasVisited() ? "dashboard" : "welcome";
    }

    // Render initial view
    doRender();

    // hashchange → re-render (replace main to drop stale event listeners)
    window.addEventListener("hashchange", () => {
      const oldMain = document.getElementById("app-main");
      const newMain = oldMain.cloneNode(false);    // empty clone — no old listeners
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
