/* ─────────────────────────────────────────────────────────────────────────────
   VST — Pain Engine Adapter
   Mock-compatible adapter for the Pain Engine control surface.

   Provides a stable read/write interface over localStorage so the Pain Control
   UI works immediately with realistic mock data. When a real backend is wired,
   replace the localStorage reads below with fetch() calls without touching the
   UI layer.

   Public API: window.VSTPainEngine
     .getStatus()     → engine overview object
     .getTasks()      → array of task objects (recent first)
     .getQueue()      → array of queued task objects
     .getLogs()       → array of log line objects (recent first)
     .runOnce()       → mock-triggers a run cycle; returns Promise
     .refresh()       → re-reads state; returns updated status object
     .clearCompleted()→ removes completed tasks from mock store
   ───────────────────────────────────────────────────────────────────────────── */

window.VSTPainEngine = (function () {
  'use strict';

  var STORE_KEY = 'vst_pain_engine_v1';

  /* ── Default mock state ─────────────────────────────────────────────────── */
  var DEFAULT_STATE = {
    engineStatus:   'idle',       /* idle | running | error | offline */
    lastRunStatus:  'success',    /* success | partial | failed | never */
    lastRunAt:      new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    lastDeployAt:   new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastDeployStatus: 'success',
    lastDeployRef:  '70559eb',
    queueCount:     3,
    failedCount:    1,
    tasks: [
      {
        id:        'tsk-001',
        title:     'Trip evaluation batch — March cohort',
        lane:      'eval',
        status:    'completed',
        updatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        summary:   'Processed 18 trip evaluation requests via Ava Phase 5 + Phase 6. All destinations resolved.',
        result:    '18 evaluated · 14 auto-approved · 3 review · 1 escalated',
      },
      {
        id:        'tsk-002',
        title:     'Safety advisory sync — FCDO feed',
        lane:      'data',
        status:    'completed',
        updatedAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
        summary:   'Pulled latest FCDO travel advisory data. 4 destination risk levels updated.',
        result:    '4 destinations updated · 0 errors',
      },
      {
        id:        'tsk-003',
        title:     'Escalation notification dispatch',
        lane:      'notify',
        status:    'failed',
        updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        summary:   'Attempted to send escalation notifications for 2 pending trips. SMTP timeout on retry 3.',
        result:    'Error: connect ETIMEDOUT mail.relay:587 — 2 notifications pending',
      },
      {
        id:        'tsk-004',
        title:     'Weekly trip summary report',
        lane:      'report',
        status:    'queued',
        updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        summary:   'Compile week-ending summary: trip counts, approval rates, escalation list.',
        result:    null,
      },
      {
        id:        'tsk-005',
        title:     'Dashboard cache refresh',
        lane:      'data',
        status:    'queued',
        updatedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        summary:   'Invalidate and rebuild trip dashboard aggregate cache.',
        result:    null,
      },
      {
        id:        'tsk-006',
        title:     'Accessibility audit flag — Q1',
        lane:      'report',
        status:    'queued',
        updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        summary:   'Generate Q1 accessibility needs report across all trip requests.',
        result:    null,
      },
      {
        id:        'tsk-007',
        title:     'Deploy static assets',
        lane:      'deploy',
        status:    'completed',
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        summary:   'Deployed Ava Phase 6 bundle to Vercel production edge. All checks passed.',
        result:    'ref 70559eb · 3 files changed · 1,002 insertions',
      },
    ],
    logs: [
      { time: new Date(Date.now() - 12 * 60 * 1000).toISOString(),  level: 'info',  msg: 'Batch eval tsk-001 completed — 18 trips processed' },
      { time: new Date(Date.now() - 28 * 60 * 1000).toISOString(),  level: 'info',  msg: 'FCDO feed sync complete — 4 advisories updated' },
      { time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),  level: 'error', msg: 'SMTP timeout on tsk-003 — retry limit reached' },
      { time: new Date(Date.now() - 46 * 60 * 1000).toISOString(),  level: 'warn',  msg: 'tsk-003 retry 3/3 — escalation notify stalled' },
      { time: new Date(Date.now() - 120 * 60 * 1000).toISOString(), level: 'info',  msg: 'Deploy tsk-007 complete — ref 70559eb' },
      { time: new Date(Date.now() - 122 * 60 * 1000).toISOString(), level: 'info',  msg: 'Engine cycle started — 3 tasks queued' },
    ],
  };

  /* ── State I/O ──────────────────────────────────────────────────────────── */
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage unavailable */ }
    return JSON.parse(JSON.stringify(DEFAULT_STATE)); /* deep clone */
  }

  function save(state) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  /* Seed localStorage with default state on first load */
  (function seed() {
    try {
      if (!localStorage.getItem(STORE_KEY)) {
        save(JSON.parse(JSON.stringify(DEFAULT_STATE)));
      }
    } catch (e) { /* ignore */ }
  }());

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  function relTime(isoStr) {
    if (!isoStr) return '—';
    var diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
    if (diff < 60)   return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  /* ── Public API ─────────────────────────────────────────────────────────── */
  function getStatus() {
    var s = load();
    return {
      engineStatus:     s.engineStatus,
      lastRunStatus:    s.lastRunStatus,
      lastRunAt:        s.lastRunAt,
      lastRunRelative:  relTime(s.lastRunAt),
      lastDeployAt:     s.lastDeployAt,
      lastDeployStatus: s.lastDeployStatus,
      lastDeployRef:    s.lastDeployRef,
      queueCount:       s.queueCount,
      failedCount:      s.failedCount,
    };
  }

  function getTasks() {
    return load().tasks.slice(); /* copy */
  }

  function getQueue() {
    return load().tasks.filter(function (t) { return t.status === 'queued'; });
  }

  function getLogs() {
    return (load().logs || []).slice();
  }

  function runOnce() {
    return new Promise(function (resolve) {
      var state    = load();
      state.engineStatus = 'running';
      save(state);
      setTimeout(function () {
        var s2 = load();
        s2.engineStatus  = 'idle';
        s2.lastRunStatus = 'success';
        s2.lastRunAt     = new Date().toISOString();
        /* Process first queued task */
        var queued = s2.tasks.filter(function (t) { return t.status === 'queued'; });
        if (queued.length > 0) {
          var t = queued[0];
          t.status    = 'completed';
          t.updatedAt = new Date().toISOString();
          t.result    = 'Completed by manual run trigger';
          s2.queueCount = Math.max(0, s2.queueCount - 1);
        }
        s2.logs.unshift({
          time:  new Date().toISOString(),
          level: 'info',
          msg:   'Manual run triggered — 1 task processed',
        });
        save(s2);
        resolve(getStatus());
      }, 1800);
    });
  }

  function refresh() {
    return getStatus();
  }

  function clearCompleted() {
    var state = load();
    state.tasks = state.tasks.filter(function (t) { return t.status !== 'completed'; });
    save(state);
  }

  return {
    getStatus:      getStatus,
    getTasks:       getTasks,
    getQueue:       getQueue,
    getLogs:        getLogs,
    runOnce:        runOnce,
    refresh:        refresh,
    clearCompleted: clearCompleted,
    relTime:        relTime,
  };

}());
