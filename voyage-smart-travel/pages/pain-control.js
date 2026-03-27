/* ─────────────────────────────────────────────────────────────────────────────
   VST — Pain Control Page
   Founder control surface for the Pain Engine.
   Mobile-first. Dark/gold design system. Mock-safe — reads VSTPainEngine adapter.
   ───────────────────────────────────────────────────────────────────────────── */

window.renderPainControl = function () {
  var PE     = window.VSTPainEngine;
  var status = PE.getStatus();
  var tasks  = PE.getTasks();

  /* ── Helpers ──────────────────────────────────────────────────────────────── */
  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Engine status dot ────────────────────────────────────────────────────── */
  var statusDotMod = {
    running: 'pc-engine-dot--running',
    idle:    'pc-engine-dot--idle',
    error:   'pc-engine-dot--error',
    offline: 'pc-engine-dot--offline',
  }[status.engineStatus] || 'pc-engine-dot--offline';

  var statusLabel = {
    running: 'Running',
    idle:    'Idle',
    error:   'Error',
    offline: 'Offline',
  }[status.engineStatus] || 'Unknown';

  /* ── Last run badge ───────────────────────────────────────────────────────── */
  var runBadgeMod = {
    success: 'pc-badge--success',
    partial: 'pc-badge--warn',
    failed:  'pc-badge--danger',
    never:   'pc-badge--muted',
  }[status.lastRunStatus] || 'pc-badge--muted';

  var runBadgeLabel = {
    success: 'Success',
    partial: 'Partial',
    failed:  'Failed',
    never:   'Never run',
  }[status.lastRunStatus] || 'Unknown';

  /* ── Deploy badge ─────────────────────────────────────────────────────────── */
  var deployBadgeMod = status.lastDeployStatus === 'success' ? 'pc-badge--success' : 'pc-badge--danger';
  var deployBadgeLabel = status.lastDeployStatus === 'success' ? 'Deployed' : 'Deploy failed';

  /* ── Overview section ─────────────────────────────────────────────────────── */
  var overviewHtml = '<section class="pc-overview" aria-label="Engine overview">'

    /* Engine status card */
    + '<div class="pc-stat pc-stat--wide">'
    +   '<div class="pc-stat-header">'
    +     '<span class="pc-stat-title">Pain Engine</span>'
    +     '<span class="pc-engine-dot ' + statusDotMod + '" aria-hidden="true"></span>'
    +   '</div>'
    +   '<div class="pc-stat-value pc-stat-status">' + esc(statusLabel) + '</div>'
    +   '<div class="pc-stat-sub">Last run: ' + esc(status.lastRunRelative) + '</div>'
    + '</div>'

    /* Queue count */
    + '<div class="pc-stat">'
    +   '<div class="pc-stat-title">Queued</div>'
    +   '<div class="pc-stat-value">' + status.queueCount + '</div>'
    +   '<div class="pc-stat-sub">Pending tasks</div>'
    + '</div>'

    /* Failed count */
    + '<div class="pc-stat pc-stat--alert">'
    +   '<div class="pc-stat-title">Failed</div>'
    +   '<div class="pc-stat-value">' + status.failedCount + '</div>'
    +   '<div class="pc-stat-sub">Need attention</div>'
    + '</div>'

    /* Last run result */
    + '<div class="pc-stat">'
    +   '<div class="pc-stat-title">Last run</div>'
    +   '<div class="pc-stat-value-sm"><span class="pc-badge ' + runBadgeMod + '">' + esc(runBadgeLabel) + '</span></div>'
    +   '<div class="pc-stat-sub">' + esc(status.lastRunRelative) + '</div>'
    + '</div>'

    /* Last deploy */
    + '<div class="pc-stat">'
    +   '<div class="pc-stat-title">Last deploy</div>'
    +   '<div class="pc-stat-value-sm"><span class="pc-badge ' + deployBadgeMod + '">' + esc(deployBadgeLabel) + '</span></div>'
    +   '<div class="pc-stat-sub">ref ' + esc(status.lastDeployRef) + '</div>'
    + '</div>'

    + '</section>';

  /* ── Quick actions ────────────────────────────────────────────────────────── */
  var actionsHtml = '<section class="pc-actions" aria-label="Quick actions">'
    + '<button class="pc-action-btn pc-action-btn--primary" id="pc-run-once">'
    +   '<span class="pc-action-icon">&#9654;</span> Run Engine Once'
    + '</button>'
    + '<button class="pc-action-btn" id="pc-refresh">'
    +   '<span class="pc-action-icon">&#8635;</span> Refresh Status'
    + '</button>'
    + '<button class="pc-action-btn" id="pc-view-queue">'
    +   '<span class="pc-action-icon">&#9776;</span> View Queue'
    + '</button>'
    + '<button class="pc-action-btn" id="pc-view-logs">'
    +   '<span class="pc-action-icon">&#128196;</span> View Logs'
    + '</button>'
    + '</section>';

  /* ── Lane chip helper ─────────────────────────────────────────────────────── */
  function laneChip(lane) {
    var mod = {
      eval:   'pc-lane--eval',
      data:   'pc-lane--data',
      notify: 'pc-lane--notify',
      deploy: 'pc-lane--deploy',
      report: 'pc-lane--report',
    }[lane] || 'pc-lane--data';
    return '<span class="pc-lane ' + mod + '">' + esc(lane) + '</span>';
  }

  /* ── Status chip helper ───────────────────────────────────────────────────── */
  function statusChip(s) {
    var mod = {
      completed: 'pc-task-status--done',
      failed:    'pc-task-status--fail',
      queued:    'pc-task-status--queue',
      running:   'pc-task-status--run',
    }[s] || 'pc-task-status--queue';
    var label = { completed: 'Done', failed: 'Failed', queued: 'Queued', running: 'Running' }[s] || s;
    return '<span class="pc-task-status ' + mod + '">' + esc(label) + '</span>';
  }

  /* ── Task list ────────────────────────────────────────────────────────────── */
  var taskRowsHtml = tasks.map(function (t) {
    return '<button class="pc-task-item" data-task-id="' + esc(t.id) + '" aria-label="View task ' + esc(t.title) + '">'
      + '<div class="pc-task-left">'
      +   '<div class="pc-task-title">' + esc(t.title) + '</div>'
      +   '<div class="pc-task-meta">'
      +     laneChip(t.lane)
      +     '<span class="pc-task-time">' + esc(PE.relTime(t.updatedAt)) + '</span>'
      +   '</div>'
      + '</div>'
      + '<div class="pc-task-right">'
      +   statusChip(t.status)
      +   '<span class="pc-task-chevron" aria-hidden="true">&#8250;</span>'
      + '</div>'
      + '</button>';
  }).join('');

  var tasksHtml = '<section class="pc-tasks-section" aria-label="Active tasks">'
    + '<div class="pc-section-header">'
    +   '<h2 class="pc-section-title">Recent Tasks</h2>'
    +   '<span class="pc-section-count">' + tasks.length + '</span>'
    + '</div>'
    + '<div class="pc-task-list" id="pc-task-list">' + taskRowsHtml + '</div>'
    + '</section>';

  /* ── Detail sheet (hidden by default) ────────────────────────────────────── */
  var detailSheetHtml = '<div class="pc-detail-overlay" id="pc-detail-overlay" aria-hidden="true"></div>'
    + '<div class="pc-detail-sheet" id="pc-detail-sheet" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="pc-detail-title">'
    +   '<div class="pc-detail-handle" aria-hidden="true"></div>'
    +   '<div class="pc-detail-head">'
    +     '<h3 class="pc-detail-title" id="pc-detail-title">Task Detail</h3>'
    +     '<button class="pc-detail-close" id="pc-detail-close" aria-label="Close task detail">&#10005;</button>'
    +   '</div>'
    +   '<div class="pc-detail-body" id="pc-detail-body"></div>'
    + '</div>';

  /* ── Toast ────────────────────────────────────────────────────────────────── */
  var toastHtml = '<div class="pc-toast" id="pc-toast" role="status" aria-live="polite"></div>';

  /* ── Log panel (hidden toggle) ────────────────────────────────────────────── */
  var logs = PE.getLogs();
  var logRowsHtml = logs.map(function (l) {
    var levelMod = { info: '', warn: 'pc-log-warn', error: 'pc-log-error' }[l.level] || '';
    return '<div class="pc-log-row ' + levelMod + '">'
      + '<span class="pc-log-time">' + esc(PE.relTime(l.time)) + '</span>'
      + '<span class="pc-log-msg">' + esc(l.msg) + '</span>'
      + '</div>';
  }).join('');

  var logPanelHtml = '<section class="pc-log-panel" id="pc-log-panel" aria-label="Engine logs" aria-hidden="true">'
    + '<div class="pc-section-header">'
    +   '<h2 class="pc-section-title">Engine Log</h2>'
    +   '<button class="pc-log-close" id="pc-log-close" aria-label="Close log panel">&#10005;</button>'
    + '</div>'
    + '<div class="pc-log-list">' + logRowsHtml + '</div>'
    + '</section>';

  /* ── Full page ────────────────────────────────────────────────────────────── */
  return '<div class="pc-page">'
    + '<div class="pc-page-header">'
    +   '<div class="pc-header-text">'
    +     '<h1 class="pc-page-title">Pain Control</h1>'
    +     '<p class="pc-page-subtitle">Engine control surface &middot; Founder access</p>'
    +   '</div>'
    +   '<div class="pc-header-badge"><span class="pc-engine-dot ' + statusDotMod + '"></span> ' + esc(statusLabel) + '</div>'
    + '</div>'
    + overviewHtml
    + actionsHtml
    + tasksHtml
    + logPanelHtml
    + detailSheetHtml
    + toastHtml
    + '</div>';
};

/* ── Detail body builder ──────────────────────────────────────────────────── */
window.buildPainTaskDetail = function (taskId) {
  var PE    = window.VSTPainEngine;
  var tasks = PE.getTasks();
  var task  = null;
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].id === taskId) { task = tasks[i]; break; }
  }
  if (!task) return '<p class="pc-detail-empty">Task not found.</p>';

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var statusLabel = { completed: 'Completed', failed: 'Failed', queued: 'Queued', running: 'Running' }[task.status] || task.status;
  var statusMod   = { completed: 'pc-badge--success', failed: 'pc-badge--danger', queued: 'pc-badge--muted', running: 'pc-badge--info' }[task.status] || 'pc-badge--muted';

  return '<div class="pc-detail-meta">'
    + '<div class="pc-detail-row">'
    +   '<span class="pc-detail-label">Status</span>'
    +   '<span class="pc-badge ' + statusMod + '">' + esc(statusLabel) + '</span>'
    + '</div>'
    + '<div class="pc-detail-row">'
    +   '<span class="pc-detail-label">Lane</span>'
    +   '<span class="pc-detail-val">' + esc(task.lane) + '</span>'
    + '</div>'
    + '<div class="pc-detail-row">'
    +   '<span class="pc-detail-label">Updated</span>'
    +   '<span class="pc-detail-val">' + esc(PE.relTime(task.updatedAt)) + '</span>'
    + '</div>'
    + '</div>'
    + '<div class="pc-detail-section">'
    +   '<div class="pc-detail-label">Summary</div>'
    +   '<p class="pc-detail-summary">' + esc(task.summary) + '</p>'
    + '</div>'
    + (task.result
      ? '<div class="pc-detail-section">'
      +   '<div class="pc-detail-label">Result</div>'
      +   '<div class="pc-detail-result">' + esc(task.result) + '</div>'
      + '</div>'
      : '')
    + '<div class="pc-detail-section">'
    +   '<div class="pc-detail-label">Task ID</div>'
    +   '<div class="pc-detail-id">' + esc(task.id) + '</div>'
    + '</div>';
};
