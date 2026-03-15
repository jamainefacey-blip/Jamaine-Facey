/* ─────────────────────────────────────────────────────────────────────────────
   Mr Pain PT — Coach Portal  v1.0
   ─────────────────────────────────────────────────────────────────────────────

   Admin SPA for managing clients and programs without editing source files.

   Views
   ──────
   #clients                          — client list dashboard
   #client/{slug}/profile            — edit client details + goals
   #client/{slug}/program            — edit mode, sessions, milestones
   #client/{slug}/access             — edit access.type + access.status + outcomes
   #client/{slug}/notes              — add/edit/delete coach notes
   #session/{slug}/{sid}             — session editor (exercises, metadata)

   Data flow
   ──────────
   Static client files (scripts/data/clients/*.js) are the source of truth.
   The first time a client is opened, the static file is loaded and cached in
   CoachStore (localStorage). Coach edits are saved back to CoachStore.
   When the rehab module loads the same client, loader.js calls
   CoachStore.applyToGlobals(slug) to merge edits onto the static globals.
   The Export button generates the full updated JS file for permanent storage.

   Globals required:
     MrPainPT    — shell (shell.js)
     CoachStore  — adapter layer (shared/coachstore.js)
   ───────────────────────────────────────────────────────────────────────────── */

(function () {
  "use strict";

  // ── Constants ──────────────────────────────────────────────────────────────

  // Fallback client list used when API is unavailable and local cache is empty.
  // This is no longer the source of truth — the API or CoachStore cache takes precedence.
  const FALLBACK_CLIENTS = [
    { slug: "sarah-thompson", label: "Sarah Thompson" },
    { slug: "james-chen",     label: "James Chen"     },
    { slug: "maria-santos",   label: "Maria Santos"   },
    { slug: "david-park",     label: "David Park"     },
  ];

  const MODES          = ["one_off", "multi_week", "ongoing_coaching"];
  const ACCESS_TYPES   = ["subscription", "one_off_purchase", "complimentary", "trial"];
  const ACCESS_STATUSES = ["active", "expired", "suspended", "pending"];

  // ── Module state ───────────────────────────────────────────────────────────

  let _hashchangeAttached = false;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function navigate(hash) {
    if (location.hash === "#" + hash) doRender();
    else location.hash = hash;
  }

  function showToast(msg, type) {
    let t = document.getElementById("coach-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "coach-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = "coach-toast" + (type === "error" ? " error" : "");
    t.classList.add("visible");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("visible"), 2400);
  }

  // ── Client loading ─────────────────────────────────────────────────────────
  // Priority: CoachStore.getClientAsync (API or local cache) → static file inject.

  function loadClient(slug) {
    return new Promise((resolve) => {
      CoachStore.getClientAsync(slug, (err, stored) => {
        if (stored) { resolve(stored); return; }

        // Not in API or local cache — load from static file as fallback
        const prevCfg = window.CLIENT_CONFIG;
        const prevPrg = window.PROGRAM;

        const s   = document.createElement("script");
        s.src     = `scripts/data/clients/${slug}.js`;
        s.onload  = () => {
          const data = {
            clientConfig: window.CLIENT_CONFIG || {},
            program:      window.PROGRAM       || {},
          };
          window.CLIENT_CONFIG = prevCfg;
          window.PROGRAM       = prevPrg;
          CoachStore.cacheClient(slug, data);
          resolve(data);
        };
        s.onerror = () => {
          window.CLIENT_CONFIG = prevCfg;
          window.PROGRAM       = prevPrg;
          resolve(null);
        };
        document.head.appendChild(s);
      });
    });
  }

  // ── Router ────────────────────────────────────────────────────────────────

  function doRender() {
    const parts = location.hash.replace(/^#/, "").split("/");
    const view  = parts[0] || "clients";
    const p1    = parts[1] || null;   // slug (client) or slug (session)
    const p2    = parts[2] || null;   // tab  (client) or sid  (session)

    updateNav(view);

    if (view === "session") {
      renderSessionEditor(p1, p2);  // p1=slug, p2=sid
      return;
    }

    const main = document.getElementById("app-main");
    if (!main) return;

    if (view === "new-client") {
      renderNewClientForm();
    } else if (view === "client" && p1) {
      renderClientView(p1, p2 || "profile");
    } else {
      renderClientList();
    }
  }

  // ── View: Client list ────────────────────────────────────────────────────
  // Fetches list from CoachStore (API or local cache) and merges with
  // FALLBACK_CLIENTS so known static clients always appear even before caching.

  function renderClientList() {
    const main = document.getElementById("app-main");
    main.innerHTML = `<div class="coach-loading"><div class="coach-spinner"></div><span>Loading clients…</span></div>`;

    CoachStore.listClientsAsync((err, clientList) => {
      // Merge fallback clients not yet in the live list
      const slugsKnown = new Set(clientList.map(c => c.slug));
      FALLBACK_CLIENTS.forEach(c => {
        if (!slugsKnown.has(c.slug)) clientList.push({ slug: c.slug, name: c.label });
      });

      const isApi   = CoachStore.getMode() === "api";
      const connCls = isApi ? "online" : "offline";
      const connTxt = isApi ? "● API" : "● Local";

      const cards = clientList.map(c => {
        const name     = c.name || c.slug;
        const initials = name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
        return `
          <div class="coach-client-card" data-slug="${c.slug}" role="button" tabindex="0">
            <div class="coach-client-avatar">${esc(initials)}</div>
            <div class="coach-client-info">
              <div class="coach-client-name">${esc(name)}</div>
              <div class="coach-client-badges">
                ${c.accessType   ? `<span class="coach-badge mode-${c.accessType}">${c.accessType.replace(/_/g, " ")}</span>` : ""}
                ${c.accessStatus ? `<span class="coach-badge access-${c.accessStatus}">${c.accessStatus}</span>`               : ""}
                ${c._hasEdits    ? `<span class="coach-badge edited">edited</span>`                                            : ""}
              </div>
            </div>
            <svg class="coach-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>`;
      }).join("") || `<p class="coach-empty" style="padding:24px 16px">No clients yet — add one with the + button.</p>`;

      main.innerHTML = `
        <div class="coach-view">
          <div class="coach-view-header">
            <h1 class="coach-view-title">Clients</h1>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
              <span class="coach-connection-badge ${connCls}">${connTxt}</span>
              <button class="coach-new-btn" id="coach-new-btn" title="Add new client">+</button>
            </div>
          </div>
          <div class="coach-client-list">${cards}</div>
          <p class="coach-hint">${isApi
            ? "Changes sync to the backend API and apply to clients on next load."
            : "Running in local mode. Start the backend server for persistent storage."
          }</p>
        </div>`;

      main.querySelectorAll(".coach-client-card").forEach(card => {
        const open = () => navigate(`client/${card.dataset.slug}/profile`);
        card.addEventListener("click", open);
        card.addEventListener("keydown", e => { if (e.key === "Enter") open(); });
      });

      document.getElementById("coach-new-btn")?.addEventListener("click", () => navigate("new-client"));

      // Background-cache all fallback clients for snappier subsequent opens
      FALLBACK_CLIENTS.forEach(c => {
        if (!CoachStore.getClient(c.slug)) loadClient(c.slug);
      });
    });
  }

  // ── View: Client profile (tabbed) ────────────────────────────────────────

  async function renderClientView(slug, tab) {
    const main = document.getElementById("app-main");
    main.innerHTML = `<div class="coach-loading"><div class="coach-spinner"></div><span>Loading…</span></div>`;

    const data = await loadClient(slug);
    if (!data) {
      main.innerHTML = `<div class="coach-error">Client file for "<strong>${esc(slug)}</strong>" could not be loaded.</div>`;
      return;
    }

    const cfg   = data.clientConfig || {};
    const prog  = data.program      || {};
    const name  = [cfg.client?.firstName, cfg.client?.lastName].filter(Boolean).join(" ") || slug;
    const hasEdits = CoachStore.hasEdits(slug);

    const TABS = ["profile", "program", "access", "notes"];
    const tabBar = TABS.map(t =>
      `<button class="coach-tab${t === tab ? " active" : ""}" data-tab="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</button>`
    ).join("");

    let tabContent = "";
    switch (tab) {
      case "profile":  tabContent = renderProfileTab(slug, cfg, prog);  break;
      case "program":  tabContent = renderProgramTab(slug, cfg, prog);  break;
      case "access":   tabContent = renderAccessTab(slug, cfg, prog);   break;
      case "notes":    tabContent = renderNotesTab(slug, cfg, prog);    break;
      default:         tabContent = renderProfileTab(slug, cfg, prog);
    }

    main.innerHTML = `
      <div class="coach-view">
        <div class="coach-view-header">
          <button class="coach-back-btn" id="coach-back" aria-label="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="coach-view-title-wrap">
            <h1 class="coach-view-title">${esc(name)}</h1>
            ${hasEdits ? `<span class="coach-badge edited" style="font-size:10px">edited</span>` : ""}
          </div>
          <button class="coach-action-btn" id="coach-export-btn" title="Export JS file">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
        </div>
        <div class="coach-tab-bar">${tabBar}</div>
        <div id="coach-tab-content">${tabContent}</div>
      </div>`;

    document.getElementById("coach-back")?.addEventListener("click", () => navigate("clients"));
    document.getElementById("coach-export-btn")?.addEventListener("click", () => showExport(slug, data));

    main.querySelectorAll(".coach-tab").forEach(btn => {
      btn.addEventListener("click", () => navigate(`client/${slug}/${btn.dataset.tab}`));
    });

    if (tab === "program") {
      main.querySelectorAll(".coach-edit-session-btn").forEach(btn => {
        btn.addEventListener("click", e => {
          e.stopPropagation();
          navigate(`session/${slug}/${btn.dataset.sid}`);
        });
      });
      main.querySelectorAll(".coach-milestone-input").forEach(inp => {
        inp.addEventListener("change", () => {
          const idx  = parseInt(inp.dataset.idx);
          const data2 = CoachStore.getClient(slug);
          if (data2?.program?.milestones?.[idx] !== undefined) {
            data2.program.milestones[idx].label = inp.value.trim();
            CoachStore.saveClient(slug, data2);
          }
        });
      });
    }

    if (tab === "notes") {
      document.getElementById("coach-add-note-btn")?.addEventListener("click", () => addNote(slug, data));
      main.querySelectorAll(".coach-note-delete-btn").forEach(btn => {
        btn.addEventListener("click", () => deleteNote(slug, data, parseInt(btn.dataset.idx)));
      });
    }

    const saveBtn = document.getElementById("coach-save-btn");
    if (saveBtn) saveBtn.addEventListener("click", () => saveTab(slug, tab, data));

    if (tab === "access") {
      const revertBtn = document.getElementById("coach-revert-btn");
      if (revertBtn) {
        revertBtn.addEventListener("click", () => {
          CoachStore.clearClient(slug);
          showToast("Reverted to original file data");
          navigate(`client/${slug}/access`);
        });
      }
    }
  }

  // ── Tab: Profile ──────────────────────────────────────────────────────────

  function renderProfileTab(slug, cfg, prog) {
    const c     = cfg.client || {};
    const goals = (prog.goals || []).join("\n");
    return `
      <div class="coach-form">
        <div class="coach-form-section">
          <h3 class="coach-section-title">Client Details</h3>
          <label class="coach-field"><span>First Name</span>
            <input type="text" name="client.firstName" value="${esc(c.firstName || "")}" />
          </label>
          <label class="coach-field"><span>Last Name</span>
            <input type="text" name="client.lastName" value="${esc(c.lastName || "")}" />
          </label>
          <label class="coach-field"><span>Condition</span>
            <input type="text" name="client.condition" value="${esc(c.condition || "")}" />
          </label>
          <label class="coach-field"><span>Age</span>
            <input type="number" name="client.age" value="${esc(c.age || "")}" min="1" max="120" />
          </label>
          <label class="coach-field"><span>Injury / Surgery Date</span>
            <input type="text" name="client.injuryDate" value="${esc(c.injuryDate || c.surgeryDate || "")}" placeholder="e.g. 2024-11-15" />
          </label>
        </div>
        <div class="coach-form-section">
          <h3 class="coach-section-title">Program Goals</h3>
          <label class="coach-field"><span>One goal per line</span>
            <textarea name="goals" rows="5" placeholder="Return to running&#10;Full knee flexion&#10;Independent ADLs">${esc(goals)}</textarea>
          </label>
        </div>
        <div class="coach-form-actions">
          <button class="coach-save-btn" id="coach-save-btn" data-slug="${slug}" data-tab="profile">Save Profile</button>
        </div>
      </div>`;
  }

  // ── Tab: Program ──────────────────────────────────────────────────────────

  function renderProgramTab(slug, cfg, prog) {
    const sessions   = prog.sessions || (prog.session ? [prog.session] : []);
    const milestones = prog.milestones || [];
    const mode       = prog.mode || "multi_week";

    const sessionCards = sessions.length
      ? sessions.map(s => `
          <div class="coach-session-card">
            <div class="coach-session-card-inner">
              <div>
                <div class="coach-session-label">${esc(s.label || s.id)}</div>
                <div class="coach-session-meta">
                  ${s.weekNumber ? `Wk ${s.weekNumber} &middot; ` : ""}${(s.exercises || []).length} exercises
                  ${s.phase ? ` &middot; ${esc(s.phase)}` : ""}
                </div>
              </div>
              <button class="coach-edit-session-btn" data-sid="${s.id}">Edit</button>
            </div>
          </div>`).join("")
      : `<p class="coach-empty">No sessions defined.</p>`;

    const milestoneRows = milestones.map((m, i) => `
      <div class="coach-milestone-row">
        <span class="coach-milestone-week">Wk ${m.week}</span>
        <input type="text" class="coach-milestone-input" data-idx="${i}" value="${esc(m.label || m.title || "")}" />
      </div>`).join("");

    return `
      <div class="coach-form">
        <div class="coach-form-section">
          <h3 class="coach-section-title">Program Mode</h3>
          <label class="coach-field"><span>Mode</span>
            <select name="mode">
              ${MODES.map(m => `<option value="${m}"${mode === m ? " selected" : ""}>${m.replace(/_/g, " ")}</option>`).join("")}
            </select>
          </label>
          ${mode !== "one_off" ? `
          <label class="coach-field"><span>Current Week</span>
            <input type="number" name="currentWeek" value="${prog.currentWeek || 1}" min="1" />
          </label>` : ""}
        </div>
        <div class="coach-form-section">
          <h3 class="coach-section-title">Sessions <span class="coach-count-badge">${sessions.length}</span></h3>
          <div class="coach-session-list">${sessionCards}</div>
        </div>
        ${milestones.length ? `
        <div class="coach-form-section">
          <h3 class="coach-section-title">Milestones</h3>
          <div class="coach-milestones">${milestoneRows}</div>
        </div>` : ""}
        <div class="coach-form-actions">
          <button class="coach-save-btn" id="coach-save-btn" data-slug="${slug}" data-tab="program">Save Program</button>
        </div>
      </div>`;
  }

  // ── Tab: Access ───────────────────────────────────────────────────────────

  function renderAccessTab(slug, cfg, prog) {
    const acc = prog.access   || {};
    const out = prog.outcomes || {};
    return `
      <div class="coach-form">
        <div class="coach-form-section">
          <h3 class="coach-section-title">Access Control</h3>
          <label class="coach-field"><span>Access Type</span>
            <select name="access.type">
              ${ACCESS_TYPES.map(t => `<option value="${t}"${acc.type === t ? " selected" : ""}>${t.replace(/_/g, " ")}</option>`).join("")}
            </select>
          </label>
          <label class="coach-field"><span>Access Status</span>
            <select name="access.status">
              ${ACCESS_STATUSES.map(s => `<option value="${s}"${acc.status === s ? " selected" : ""}>${s}</option>`).join("")}
            </select>
          </label>
          <p class="coach-field-hint">Changing status to <em>expired</em> or <em>suspended</em> locks the client out of the rehab module immediately.</p>
        </div>
        <div class="coach-form-section">
          <h3 class="coach-section-title">Outcomes &amp; Reassessment</h3>
          <label class="coach-field"><span>Reassessment Notes</span>
            <textarea name="outcomes.reassessmentNotes" rows="3" placeholder="ROM improved to 120°. Pain down to 2/10 on stairs.">${esc(out.reassessmentNotes || "")}</textarea>
          </label>
          <label class="coach-field"><span>Discharge Date</span>
            <input type="date" name="outcomes.dischargeDate" value="${esc(out.dischargeDate || "")}" />
          </label>
        </div>
        <div class="coach-form-actions">
          <button class="coach-save-btn" id="coach-save-btn" data-slug="${slug}" data-tab="access">Save Access &amp; Outcomes</button>
          ${CoachStore.hasEdits(slug) ? `<button class="coach-revert-btn" id="coach-revert-btn">Revert to Original</button>` : ""}
        </div>
      </div>`;
  }

  // ── Tab: Notes ────────────────────────────────────────────────────────────

  function renderNotesTab(slug, cfg, prog) {
    const notes = prog.coach_notes || [];
    const noteItems = notes.map((n, i) => `
      <div class="coach-note-item" data-idx="${i}">
        <div class="coach-note-header">
          <input type="text" class="coach-note-date" data-idx="${i}" data-field="date"
            value="${esc(n.date || "")}" placeholder="Date (e.g. 2025-03-10)" />
          <button class="coach-note-delete-btn" data-idx="${i}" aria-label="Delete note">&#x2715;</button>
        </div>
        <textarea class="coach-note-body" data-idx="${i}" data-field="text"
          rows="3" placeholder="Note text…">${esc(n.text || n.note || "")}</textarea>
      </div>`).join("");

    return `
      <div class="coach-form">
        <div class="coach-form-section">
          <h3 class="coach-section-title">Coach Notes <span class="coach-count-badge">${notes.length}</span></h3>
          <div id="coach-notes-list">
            ${noteItems || `<p class="coach-empty">No notes yet. Add one below.</p>`}
          </div>
          <button class="coach-add-note-btn" id="coach-add-note-btn">+ Add Note</button>
        </div>
        <div class="coach-form-actions">
          <button class="coach-save-btn" id="coach-save-btn" data-slug="${slug}" data-tab="notes">Save Notes</button>
        </div>
      </div>`;
  }

  // ── View: Session editor ──────────────────────────────────────────────────

  async function renderSessionEditor(slug, sid) {
    const main = document.getElementById("app-main");
    main.innerHTML = `<div class="coach-loading"><div class="coach-spinner"></div><span>Loading session…</span></div>`;

    const data = await loadClient(slug);
    if (!data) { main.innerHTML = `<div class="coach-error">Client not found.</div>`; return; }

    const prog     = data.program || {};
    const sessions = prog.sessions || (prog.session ? [prog.session] : []);
    const session  = sessions.find(s => s.id === sid);

    if (!session) {
      main.innerHTML = `<div class="coach-error">Session "<strong>${esc(sid)}</strong>" not found in ${esc(slug)}.</div>`;
      return;
    }

    // Maintain a live exercises array for add/remove
    let liveExercises = [...(session.exercises || [])];

    const exRows = () => liveExercises.map((eid, i) => `
      <div class="coach-ex-row" data-idx="${i}">
        <span class="coach-ex-id">${esc(eid)}</span>
        <button class="coach-ex-remove" data-idx="${i}" aria-label="Remove">&#x2715;</button>
      </div>`).join("") || `<p class="coach-empty">No exercises. Add one below.</p>`;

    main.innerHTML = `
      <div class="coach-view">
        <div class="coach-view-header">
          <button class="coach-back-btn" id="coach-back" aria-label="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 class="coach-view-title">${esc(session.label || sid)}</h1>
        </div>
        <div class="coach-form">
          <div class="coach-form-section">
            <h3 class="coach-section-title">Session Info</h3>
            <label class="coach-field"><span>Label</span>
              <input type="text" id="s-label" value="${esc(session.label || "")}" />
            </label>
            <label class="coach-field"><span>Duration</span>
              <input type="text" id="s-duration" value="${esc(session.duration || "")}" placeholder="e.g. 20–30 min" />
            </label>
            <label class="coach-field"><span>Phase</span>
              <input type="text" id="s-phase" value="${esc(session.phase || "")}" placeholder="e.g. Phase 1 — Protection" />
            </label>
            ${session.weekNumber !== undefined ? `
            <label class="coach-field"><span>Week Number</span>
              <input type="number" id="s-week" value="${session.weekNumber}" min="1" />
            </label>` : ""}
            ${session.day !== undefined ? `
            <label class="coach-field"><span>Day Label</span>
              <input type="text" id="s-day" value="${esc(session.day || "")}" />
            </label>` : ""}
          </div>
          <div class="coach-form-section">
            <h3 class="coach-section-title">Exercises</h3>
            <div id="coach-ex-list">${exRows()}</div>
            <div class="coach-add-ex-row">
              <input type="text" id="coach-new-ex" placeholder="Exercise ID (e.g. quad-sets)" autocomplete="off" />
              <button id="coach-add-ex-btn" class="coach-add-ex-btn">+ Add</button>
            </div>
            <p class="coach-field-hint">Exercise IDs must match entries in <code>scripts/data/exercises.js</code>.</p>
          </div>
          <div class="coach-form-actions">
            <button class="coach-save-btn" id="coach-save-session-btn">Save Session</button>
          </div>
        </div>
      </div>`;

    // ── Bindings ────────────────────────────────────────────────────────────

    document.getElementById("coach-back")?.addEventListener("click", () => navigate(`client/${slug}/program`));

    function rebindRemoveButtons() {
      main.querySelectorAll(".coach-ex-remove").forEach(btn => {
        btn.addEventListener("click", () => {
          liveExercises.splice(parseInt(btn.dataset.idx), 1);
          document.getElementById("coach-ex-list").innerHTML = exRows();
          rebindRemoveButtons();
        });
      });
    }
    rebindRemoveButtons();

    document.getElementById("coach-add-ex-btn")?.addEventListener("click", () => {
      const inp = document.getElementById("coach-new-ex");
      const val = inp.value.trim();
      if (!val) return;
      liveExercises.push(val);
      inp.value = "";
      document.getElementById("coach-ex-list").innerHTML = exRows();
      rebindRemoveButtons();
    });

    document.getElementById("coach-new-ex")?.addEventListener("keydown", e => {
      if (e.key === "Enter") document.getElementById("coach-add-ex-btn")?.click();
    });

    document.getElementById("coach-save-session-btn")?.addEventListener("click", async () => {
      const latest = await loadClient(slug);
      if (!latest) return;

      const prog2    = latest.program || {};
      const sessions2 = prog2.sessions || (prog2.session ? [prog2.session] : []);
      const idx      = sessions2.findIndex(s => s.id === sid);
      if (idx < 0) { showToast("Session not found", "error"); return; }

      const updates = {
        label:     document.getElementById("s-label")?.value?.trim()    || session.label,
        duration:  document.getElementById("s-duration")?.value?.trim() || session.duration,
        phase:     document.getElementById("s-phase")?.value?.trim()    || session.phase,
        exercises: liveExercises,
      };

      const wkEl  = document.getElementById("s-week");
      const dayEl = document.getElementById("s-day");
      if (wkEl)  updates.weekNumber = parseInt(wkEl.value) || session.weekNumber;
      if (dayEl) updates.day        = dayEl.value.trim()   || session.day;

      sessions2[idx] = { ...sessions2[idx], ...updates };

      if (prog2.sessions) prog2.sessions = sessions2;
      else                prog2.session  = sessions2[0];

      CoachStore.saveClient(slug, latest);
      showToast("Session saved ✓");
      navigate(`client/${slug}/program`);
    });
  }

  // ── Save handlers ─────────────────────────────────────────────────────────

  async function saveTab(slug, tab, originalData) {
    const data  = JSON.parse(JSON.stringify(originalData));  // deep clone
    const root  = document.getElementById("coach-tab-content");
    if (!root) return;

    const get = name => root.querySelector(`[name="${name}"]`)?.value?.trim() ?? "";

    switch (tab) {

      case "profile": {
        if (!data.clientConfig.client) data.clientConfig.client = {};
        const cl = data.clientConfig.client;
        cl.firstName  = get("client.firstName")  || cl.firstName;
        cl.lastName   = get("client.lastName")   || cl.lastName;
        cl.condition  = get("client.condition")  || cl.condition;
        const age     = get("client.age");
        if (age) cl.age = parseInt(age);
        const injDate = get("client.injuryDate");
        if (injDate) { cl.injuryDate = injDate; cl.surgeryDate = injDate; }
        const goalsRaw = get("goals");
        data.program.goals = goalsRaw ? goalsRaw.split("\n").map(g => g.trim()).filter(Boolean) : (data.program.goals || []);
        break;
      }

      case "program": {
        data.program.mode = get("mode") || data.program.mode;
        const wk = get("currentWeek");
        if (wk) data.program.currentWeek = parseInt(wk) || data.program.currentWeek;
        // Milestone labels are saved inline on change — nothing extra needed here.
        // But re-read them to be safe:
        root.querySelectorAll(".coach-milestone-input").forEach(inp => {
          const i = parseInt(inp.dataset.idx);
          if (data.program.milestones?.[i] !== undefined) {
            data.program.milestones[i].label = inp.value.trim() || data.program.milestones[i].label;
          }
        });
        break;
      }

      case "access": {
        if (!data.program.access)   data.program.access   = {};
        if (!data.program.outcomes) data.program.outcomes = {};
        data.program.access.type   = get("access.type")   || data.program.access.type;
        data.program.access.status = get("access.status") || data.program.access.status;
        const rn = get("outcomes.reassessmentNotes");
        const dd = get("outcomes.dischargeDate");
        if (rn) data.program.outcomes.reassessmentNotes = rn;
        if (dd) data.program.outcomes.dischargeDate     = dd;
        break;
      }

      case "notes": {
        const items = root.querySelectorAll(".coach-note-item");
        const notes = [];
        items.forEach(item => {
          const i    = item.dataset.idx;
          const date = item.querySelector(`[data-idx="${i}"][data-field="date"]`)?.value?.trim() || "";
          const text = item.querySelector(`[data-idx="${i}"][data-field="text"]`)?.value?.trim() || "";
          if (text) notes.push({ date, text });
        });
        data.program.coach_notes = notes;
        break;
      }
    }

    CoachStore.saveClientAsync(slug, data, (saveErr) => {
      showToast(saveErr ? "Saved locally (API unavailable)" : "Saved ✓");
    });
  }

  // ── Note helpers ──────────────────────────────────────────────────────────

  function addNote(slug, data) {
    const clone = JSON.parse(JSON.stringify(data));
    if (!clone.program.coach_notes) clone.program.coach_notes = [];
    clone.program.coach_notes.push({ date: new Date().toISOString().split("T")[0], text: "" });
    CoachStore.saveClientAsync(slug, clone, () => navigate(`client/${slug}/notes`));
  }

  function deleteNote(slug, data, idx) {
    const clone = JSON.parse(JSON.stringify(data));
    clone.program.coach_notes = (clone.program.coach_notes || []).filter((_, i) => i !== idx);
    CoachStore.saveClientAsync(slug, clone, () => navigate(`client/${slug}/notes`));
  }

  // ── View: New client form ─────────────────────────────────────────────────

  function renderNewClientForm() {
    const main = document.getElementById("app-main");
    main.innerHTML = `
      <div class="coach-view">
        <div class="coach-view-header">
          <button class="coach-back-btn" id="coach-back" aria-label="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 class="coach-view-title">New Client</h1>
        </div>
        <div class="coach-form">
          <div class="coach-form-section">
            <h3 class="coach-section-title">Client Details</h3>
            <label class="coach-field"><span>First Name *</span>
              <input type="text" id="nc-first" autocomplete="given-name" />
            </label>
            <label class="coach-field"><span>Last Name *</span>
              <input type="text" id="nc-last" autocomplete="family-name" />
            </label>
            <label class="coach-field"><span>Condition</span>
              <input type="text" id="nc-condition" placeholder="e.g. ACL Reconstruction" />
            </label>
            <label class="coach-field"><span>Client ID (slug) *</span>
              <input type="text" id="nc-slug" placeholder="e.g. john-smith" pattern="[a-z0-9\\-]+" />
              <span class="coach-field-hint">Lowercase letters, numbers, hyphens. Auto-generated from name.</span>
            </label>
          </div>
          <div class="coach-form-section">
            <h3 class="coach-section-title">Program</h3>
            <label class="coach-field"><span>Mode</span>
              <select id="nc-mode">
                ${MODES.map(m => `<option value="${m}">${m.replace(/_/g, " ")}</option>`).join("")}
              </select>
            </label>
          </div>
          <div class="coach-form-section">
            <h3 class="coach-section-title">Access</h3>
            <label class="coach-field"><span>Access Type</span>
              <select id="nc-access-type">
                ${ACCESS_TYPES.map(t => `<option value="${t}">${t.replace(/_/g, " ")}</option>`).join("")}
              </select>
            </label>
            <label class="coach-field"><span>Access Status</span>
              <select id="nc-access-status">
                ${ACCESS_STATUSES.map(s => `<option value="${s}">${s}</option>`).join("")}
              </select>
            </label>
          </div>
          <div class="coach-form-actions">
            <button class="coach-save-btn" id="nc-save-btn">Create Client</button>
          </div>
        </div>
      </div>`;

    document.getElementById("coach-back")?.addEventListener("click", () => navigate("clients"));

    // Auto-generate slug from first + last name
    const syncSlug = () => {
      const slugEl = document.getElementById("nc-slug");
      if (slugEl?._userEdited) return;
      const first = document.getElementById("nc-first")?.value?.trim() || "";
      const last  = document.getElementById("nc-last")?.value?.trim()  || "";
      if (slugEl) slugEl.value = `${first} ${last}`.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    };
    document.getElementById("nc-first")?.addEventListener("input", syncSlug);
    document.getElementById("nc-last")?.addEventListener("input",  syncSlug);
    document.getElementById("nc-slug")?.addEventListener("input",  e => { e.target._userEdited = true; });

    document.getElementById("nc-save-btn")?.addEventListener("click", createClient);
  }

  function createClient() {
    const firstName    = document.getElementById("nc-first")?.value?.trim()       || "";
    const lastName     = document.getElementById("nc-last")?.value?.trim()        || "";
    const condition    = document.getElementById("nc-condition")?.value?.trim()   || "";
    const slug         = document.getElementById("nc-slug")?.value?.trim()        || "";
    const mode         = document.getElementById("nc-mode")?.value                || "multi_week";
    const accessType   = document.getElementById("nc-access-type")?.value         || "subscription";
    const accessStatus = document.getElementById("nc-access-status")?.value       || "active";

    if (!firstName || !lastName) { showToast("First and last name are required", "error"); return; }
    if (!slug)                   { showToast("Client ID (slug) is required", "error"); return; }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      showToast("Slug must be lowercase letters, numbers and hyphens only", "error");
      return;
    }

    const data = {
      clientConfig: { client: { firstName, lastName, condition } },
      program: {
        id:           slug,
        mode,
        access:       { type: accessType, status: accessStatus },
        sessions:     [],
        goals:        [],
        milestones:   [],
        coach_notes:  [],
      },
    };

    const btn = document.getElementById("nc-save-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Creating…"; }

    CoachStore.createClientAsync(slug, data, (err) => {
      if (err) {
        showToast(err.error || "Failed to create client", "error");
        if (btn) { btn.disabled = false; btn.textContent = "Create Client"; }
        return;
      }
      showToast(`${firstName} ${lastName} created ✓`);
      navigate(`client/${slug}/profile`);
    });
  }

  // ── Export ────────────────────────────────────────────────────────────────

  function showExport(slug, data) {
    const js = [
      `// ${slug}.js — generated by Mr Pain PT Coach Portal`,
      `// Generated: ${new Date().toISOString()}`,
      `// To apply permanently: replace scripts/data/clients/${slug}.js with this content.`,
      ``,
      `const CLIENT_CONFIG = ${JSON.stringify(data.clientConfig, null, 2)};`,
      ``,
      `const PROGRAM = ${JSON.stringify(data.program, null, 2)};`,
    ].join("\n");

    const overlay = document.getElementById("modal-overlay");
    const body    = document.getElementById("modal-body");
    if (!overlay || !body) { showToast("Modal not available", "error"); return; }

    body.innerHTML = `
      <h2 class="coach-export-title">Export: ${esc(slug)}.js</h2>
      <p class="coach-export-sub">Copy and replace <code>scripts/data/clients/${esc(slug)}.js</code> to make edits permanent.</p>
      <textarea id="coach-export-ta" class="coach-export-ta" readonly spellcheck="false">${esc(js)}</textarea>
      <button id="coach-copy-btn" class="coach-copy-btn">Copy to clipboard</button>`;

    overlay.hidden = false;
    document.getElementById("modal-close")?.addEventListener("click", () => { overlay.hidden = true; });

    document.getElementById("coach-copy-btn")?.addEventListener("click", () => {
      navigator.clipboard.writeText(js)
        .then(() => showToast("Copied to clipboard ✓"))
        .catch(() => {
          const ta = document.getElementById("coach-export-ta");
          ta?.select();
          showToast("Select all + copy manually");
        });
    });
  }

  // ── Nav ───────────────────────────────────────────────────────────────────

  function updateNav(view) {
    const nav = document.getElementById("bottom-nav");
    if (!nav) return;
    nav.classList.remove("hidden");
    const isApi = CoachStore.getMode() === "api";
    nav.innerHTML = `
      <button class="nav-btn${(view === "clients" || view === "new-client") ? " active" : ""}" data-action="clients">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        Clients
      </button>
      <button class="nav-btn" data-action="rehab">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 3 21 3 21 9"/>
          <polyline points="9 21 3 21 3 15"/>
          <line x1="21" y1="3" x2="14" y2="10"/>
          <line x1="3"  y1="21" x2="10" y2="14"/>
        </svg>
        Rehab View
      </button>
      <button class="nav-btn" data-action="toggle-api" title="${isApi ? "Connected to API" : "Using local storage"}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/>
          <path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>
        </svg>
        <span style="color:${isApi ? "var(--coach-success,#16a34a)" : "var(--muted)"}">${isApi ? "API" : "Local"}</span>
      </button>`;

    nav.querySelectorAll(".nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        if (action === "clients") navigate("clients");
        if (action === "rehab") {
          if (typeof MrPainPT !== "undefined") MrPainPT.switchModule("rehab");
          else location.href = "index.html?module=rehab";
        }
        if (action === "toggle-api") {
          if (CoachStore.getMode() === "api") {
            CoachStore.clearAuthToken();
            CoachStore.setMode("local");
            showToast("Disconnected — using local mode");
            doRender();
          } else {
            const url = window.MRPAINPT_API_BASE || "";
            fetch(`${url}/api/health`, { signal: AbortSignal.timeout(2000) })
              .then(r => r.json())
              .then(h => {
                if (h.status !== "ok") { showToast("Server unreachable"); return; }
                CoachStore.setMode("api", url);
                if (h.auth) {
                  renderLoginScreen();
                } else {
                  showToast("Connected to API ✓");
                  doRender();
                }
              })
              .catch(() => showToast("Server unreachable — still in local mode"));
          }
        }
      });
    });
  }

  // ── Login screen ──────────────────────────────────────────────────────────

  function renderLoginScreen(errorMsg) {
    const main = document.getElementById("app-main");
    if (!main) return;
    const nav = document.getElementById("bottom-nav");
    if (nav) nav.classList.add("hidden");

    main.innerHTML = `
      <div class="coach-login-wrap">
        <div class="coach-login-card">
          <div class="coach-login-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 class="coach-login-title">Coach Portal</h1>
          <p class="coach-login-sub">Enter your API key to connect</p>
          ${errorMsg ? `<p class="coach-login-error">${esc(errorMsg)}</p>` : ""}
          <div class="coach-login-form">
            <label class="coach-field">
              <span>API URL</span>
              <input type="url" id="login-api-url" value="${esc(window.MRPAINPT_API_BASE || "")}" autocomplete="off" />
            </label>
            <label class="coach-field">
              <span>API Key</span>
              <input type="password" id="login-api-key" placeholder="Enter your COACH_API_KEY" autocomplete="current-password" />
            </label>
            <button class="coach-save-btn" id="login-submit-btn">Connect</button>
            <button class="coach-login-local-btn" id="login-local-btn">Use Local Mode Instead</button>
          </div>
        </div>
      </div>`;

    document.getElementById("login-submit-btn")?.addEventListener("click", handleLogin);
    document.getElementById("login-api-key")?.addEventListener("keydown", e => {
      if (e.key === "Enter") handleLogin();
    });
    document.getElementById("login-local-btn")?.addEventListener("click", () => {
      CoachStore.setMode("local");
      showToast("Running in local mode");
      startApp();
    });
  }

  function handleLogin() {
    const urlEl = document.getElementById("login-api-url");
    const keyEl = document.getElementById("login-api-key");
    const btn   = document.getElementById("login-submit-btn");

    const url = (urlEl?.value?.trim() || window.MRPAINPT_API_BASE || "").replace(/\/$/, "");
    const key = keyEl?.value?.trim() || "";

    if (!key) { showToast("API key is required", "error"); return; }

    if (btn) { btn.disabled = true; btn.textContent = "Connecting…"; }

    CoachStore.testAuth(url, key, (err) => {
      if (btn) { btn.disabled = false; btn.textContent = "Connect"; }
      if (err) {
        const msg = (err.status === 401 || err.status === 403)
          ? "Invalid API key — check your COACH_API_KEY"
          : "Could not reach the server — check the API URL";
        renderLoginScreen(msg);
        return;
      }
      showToast("Connected to API ✓");
      startApp();
    });
  }

  function _onHashChange() {
    const parts = location.hash.replace(/^#/, "").split("/");
    const view  = parts[0];
    const p1    = parts[1];
    const p2    = parts[2];
    const main  = document.getElementById("app-main");

    if (view === "session") {
      main.innerHTML = `<div class="coach-loading"><div class="coach-spinner"></div><span>Loading session…</span></div>`;
      renderSessionEditor(p1, p2);
    } else if (view === "client") {
      main.innerHTML = `<div class="coach-loading"><div class="coach-spinner"></div><span>Loading…</span></div>`;
      renderClientView(p1, p2 || "profile");
    } else {
      const neu = main.cloneNode(false);
      main.parentNode.replaceChild(neu, main);
      doRender();
    }
  }

  function startApp() {
    if (!location.hash || location.hash === "#") location.hash = "clients";
    const nav = document.getElementById("bottom-nav");
    if (nav) nav.classList.remove("hidden");
    doRender();
    if (!_hashchangeAttached) {
      window.addEventListener("hashchange", _onHashChange);
      _hashchangeAttached = true;
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    const titleEl = document.getElementById("header-title");
    if (titleEl) titleEl.textContent = "Coach Portal";

    // Register unauthorized callback — fires on 401/403 from any API call
    CoachStore.onUnauthorized(() => {
      CoachStore.clearAuthToken();
      CoachStore.setMode("local");
      showToast("Session expired — please log in again", "error");
      renderLoginScreen("Your session has expired");
    });

    // Restore previous session if token is saved
    const existingToken = CoachStore.getAuthToken();
    if (existingToken) {
      CoachStore.testAuth(window.MRPAINPT_API_BASE || "", existingToken, (err) => {
        if (!err) { startApp(); return; }
        CoachStore.clearAuthToken();
        if (err.status === 401 || err.status === 403) {
          renderLoginScreen("API key no longer valid — please re-enter");
        } else {
          showToast("Server unreachable — using local mode");
          CoachStore.setMode("local");
          startApp();
        }
      });
      return;
    }

    // No saved token — probe server to decide next step
    const _apiBase = window.MRPAINPT_API_BASE || "";
    fetch(`${_apiBase}/api/health`, { signal: AbortSignal.timeout(2000) })
      .then(r => r.json())
      .then(h => {
        if (h.status !== "ok") { startApp(); return; }
        CoachStore.setMode("api", _apiBase);
        if (h.auth) {
          renderLoginScreen();  // server requires a key
        } else {
          console.log("[Coach] API connected (dev mode, no auth)");
          startApp();
        }
      })
      .catch(() => startApp());  // server unreachable — local mode
  }

  // ── Shell integration ─────────────────────────────────────────────────────

  if (typeof MrPainPT !== "undefined") {
    window.CoachApp = {
      init,
      getStatus() { return { module: "coach", activeClient: null }; },
    };
  } else {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

})();
