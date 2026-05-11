/* ═══════════════════════════════════════════════════════════════════
   VST — AVA Planner v2  (js/planner.js)
   Real AI chat with session memory + inline itinerary rendering.
   Depends on: js/planner-memory.js, js/premium.js
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── DOM refs ──────────────────────────────────────────────────── */
  var elWelcome    = document.getElementById('planner-welcome');
  var elChatScroll = document.getElementById('chat-scroll');
  var elChatInner  = document.getElementById('chat-inner');
  var elTyping     = document.getElementById('typing-wrap');
  var elInput      = document.getElementById('planner-input');
  var elSend       = document.getElementById('planner-send');
  var elSessions   = document.getElementById('sessions-list');
  var elNewBtn     = document.getElementById('new-session-btn');
  var elSidebar    = document.getElementById('planner-sidebar');
  var elOverlay    = document.getElementById('sidebar-overlay');
  var elSideToggle = document.getElementById('sidebar-toggle');

  /* ── State ─────────────────────────────────────────────────────── */
  var currentSessionId = null;
  var isRequesting     = false;
  var conversationHistory = [];  /* [{role, content}] for API */

  /* ── Utilities ──────────────────────────────────────────────────── */
  function formatTime(isoStr) {
    try {
      var d = new Date(isoStr || Date.now());
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  }

  function formatDate(isoStr) {
    try {
      var d = new Date(isoStr || Date.now());
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) { return ''; }
  }

  function scrollToBottom(force) {
    if (!elChatScroll) return;
    var atBottom = elChatScroll.scrollHeight - elChatScroll.scrollTop - elChatScroll.clientHeight < 120;
    if (force || atBottom) {
      elChatScroll.scrollTop = elChatScroll.scrollHeight;
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Convert newlines to <br> for display */
  function nl2br(str) {
    return escapeHtml(str).replace(/\n/g, '<br>');
  }

  /* ── Show / hide welcome vs chat ────────────────────────────────── */
  function showWelcome() {
    if (elWelcome)    { elWelcome.style.display = '';    elWelcome.setAttribute('aria-hidden', 'false'); }
    if (elChatScroll) { elChatScroll.style.display = 'none'; elChatScroll.setAttribute('aria-hidden', 'true'); }
    if (elSend)       elSend.disabled = false;
  }

  function showChat() {
    if (elWelcome)    { elWelcome.style.display = 'none'; elWelcome.setAttribute('aria-hidden', 'true'); }
    if (elChatScroll) { elChatScroll.style.display = ''; elChatScroll.setAttribute('aria-hidden', 'false'); }
    if (elSend)       elSend.disabled = false;
  }

  /* ── Typing indicator ───────────────────────────────────────────── */
  function showTyping() {
    if (!elTyping) return;
    elTyping.style.display = '';
    scrollToBottom(true);
  }
  function hideTyping() {
    if (elTyping) elTyping.style.display = 'none';
  }

  /* ── Render a single chat message ───────────────────────────────── */
  function renderMessage(role, content, timestamp, itinerary) {
    if (!elChatInner) return;
    var wrap = document.createElement('div');
    wrap.className = 'chat-msg ' + (role === 'assistant' ? 'ava' : 'user');

    if (role === 'assistant') {
      var lbl = document.createElement('div');
      lbl.className = 'chat-label';
      lbl.textContent = 'AVA';
      wrap.appendChild(lbl);
    }

    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + (role === 'assistant' ? 'ava' : 'user');
    bubble.innerHTML = nl2br(content);
    wrap.appendChild(bubble);

    var ts = document.createElement('div');
    ts.className = 'chat-timestamp';
    ts.textContent = formatTime(timestamp);
    wrap.appendChild(ts);

    elChatInner.appendChild(wrap);

    /* Inline itinerary card */
    if (itinerary && role === 'assistant') {
      elChatInner.appendChild(buildItineraryCard(itinerary));
    }

    scrollToBottom(true);
  }

  /* ── Render an error inline ─────────────────────────────────────── */
  function renderError(msg) {
    if (!elChatInner) return;
    var wrap = document.createElement('div');
    wrap.className = 'chat-msg ava';
    var lbl = document.createElement('div');
    lbl.className = 'chat-label';
    lbl.textContent = 'AVA';
    wrap.appendChild(lbl);

    var errEl = document.createElement('div');
    errEl.className = 'chat-error';
    errEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
      + escapeHtml(msg);
    wrap.appendChild(errEl);
    elChatInner.appendChild(wrap);
    scrollToBottom(true);
  }

  /* ── Build itinerary card DOM ────────────────────────────────────── */
  var TYPE_COLORS = {
    transport: 'itin-type-transport',
    sightseeing: 'itin-type-sightseeing',
    dining: 'itin-type-dining',
    accommodation: 'itin-type-accommodation',
    culture: 'itin-type-culture',
    nature: 'itin-type-nature',
    leisure: 'itin-type-leisure',
    shopping: 'itin-type-shopping',
  };

  function buildItineraryCard(itin) {
    var card = document.createElement('div');
    card.className = 'itin-card';

    /* Header */
    var hdr = document.createElement('div');
    hdr.className = 'itin-header';
    hdr.innerHTML = '<div class="itin-dest">' + escapeHtml(itin.destination || '') + '</div>'
      + '<div class="itin-title">' + escapeHtml(itin.title || 'Your Itinerary') + '</div>'
      + (itin.summary ? '<div class="itin-summary">' + escapeHtml(itin.summary) + '</div>' : '');

    /* Meta badges */
    var meta = document.createElement('div');
    meta.className = 'itin-meta';
    if (itin.eco_score != null) {
      meta.innerHTML += '<div class="itin-badge eco">'
        + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2a10 10 0 0 1 10 10c0 5.5-4.5 10-10 10-5.5 0-10-4.5-10-10S6.5 2 12 2z"/><path d="M12 8v8m-4-4h8"/></svg>'
        + 'Eco ' + escapeHtml(String(itin.eco_score)) + '/100</div>';
    }
    if (itin.total_budget && itin.total_budget.min) {
      var curr = itin.total_budget.currency || 'GBP';
      meta.innerHTML += '<div class="itin-badge budget">'
        + escapeHtml(curr) + ' '
        + escapeHtml(String(itin.total_budget.min)) + '–' + escapeHtml(String(itin.total_budget.max || itin.total_budget.min))
        + '</div>';
    }
    if ((itin.days || []).length) {
      meta.innerHTML += '<div class="itin-badge">'
        + escapeHtml(String(itin.days.length)) + ' day' + (itin.days.length !== 1 ? 's' : '') + '</div>';
    }
    hdr.appendChild(meta);
    card.appendChild(hdr);

    /* Days */
    if (Array.isArray(itin.days) && itin.days.length) {
      var daysEl = document.createElement('div');
      daysEl.className = 'itin-days';

      itin.days.forEach(function (day, idx) {
        var dayEl = document.createElement('div');
        dayEl.className = 'itin-day' + (idx === 0 ? ' open' : '');

        /* Toggle button */
        var toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'itin-day-toggle';
        toggle.setAttribute('aria-expanded', idx === 0 ? 'true' : 'false');
        toggle.innerHTML = '<span class="itin-day-num">Day ' + escapeHtml(String(day.day || idx + 1)) + '</span>'
          + '<span class="itin-day-title">' + escapeHtml(day.title || '') + '</span>'
          + '<svg class="itin-day-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">'
          + '<polyline points="6 9 12 15 18 9"/></svg>';

        toggle.addEventListener('click', function () {
          var isOpen = dayEl.classList.toggle('open');
          toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        dayEl.appendChild(toggle);

        /* Activities */
        var body = document.createElement('div');
        body.className = 'itin-day-body';
        if (Array.isArray(day.activities)) {
          day.activities.forEach(function (act) {
            var actEl = document.createElement('div');
            actEl.className = 'itin-activity';

            var dotClass = TYPE_COLORS[act.type] || 'itin-type-leisure';
            actEl.innerHTML = '<div class="itin-type-dot ' + dotClass + '" title="' + escapeHtml(act.type || '') + '"></div>'
              + '<div class="itin-time">' + escapeHtml(act.time || '') + '</div>'
              + '<div class="itin-activity-info">'
              + '<div class="itin-activity-text">' + escapeHtml(act.activity || '') + '</div>'
              + (act.eco_note ? '<div class="itin-eco-note">' + escapeHtml(act.eco_note) + '</div>' : '')
              + '</div>';
            body.appendChild(actEl);
          });
        }
        dayEl.appendChild(body);
        daysEl.appendChild(dayEl);
      });

      card.appendChild(daysEl);
    }

    /* Highlights */
    if (Array.isArray(itin.highlights) && itin.highlights.length) {
      var hlEl = document.createElement('div');
      hlEl.className = 'itin-highlights';
      hlEl.innerHTML = '<div class="itin-highlights-title">Highlights</div>';
      itin.highlights.forEach(function (h) {
        var item = document.createElement('div');
        item.className = 'itin-highlight-item';
        item.textContent = h;
        hlEl.appendChild(item);
      });
      card.appendChild(hlEl);
    }

    /* Footer actions */
    var footer = document.createElement('div');
    footer.className = 'itin-footer';

    var saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'itin-save-btn';
    saveBtn.textContent = 'Save Itinerary';
    saveBtn.addEventListener('click', function () { saveTripToProfile(itin); });

    var bookBtn = document.createElement('button');
    bookBtn.type = 'button';
    bookBtn.className = 'itin-book-btn';
    bookBtn.textContent = 'Book Now';
    bookBtn.addEventListener('click', function () {
      window.location.href = '/';
    });

    footer.appendChild(saveBtn);
    footer.appendChild(bookBtn);
    card.appendChild(footer);

    return card;
  }

  /* ── Save itinerary to profile / localStorage ───────────────────── */
  function saveTripToProfile(itin) {
    if (currentSessionId) {
      PlannerMemory.saveItinerary(currentSessionId, itin);
    }
    /* TODO: if authenticated, POST to /v1/trips */
    showToast('Itinerary saved to your trips!');
  }

  /* ── Simple toast notification ──────────────────────────────────── */
  function showToast(msg) {
    var toast = document.createElement('div');
    toast.textContent = msg;
    Object.assign(toast.style, {
      position: 'fixed', bottom: '2rem', right: '2rem', zIndex: '9999',
      background: 'var(--surface)', border: '1px solid var(--border-gold)',
      color: 'var(--gold)', padding: '0.75rem 1.25rem', borderRadius: '10px',
      fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      animation: 'blur-slide-up 0.3s var(--ease-out) both',
    });
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(function () { document.body.removeChild(toast); }, 350);
    }, 2800);
  }

  /* ── Send message to AVA ─────────────────────────────────────────── */
  function sendMessage(text) {
    text = (text || '').trim();
    if (!text || isRequesting) return;

    /* Create session on first message */
    if (!currentSessionId) {
      currentSessionId = PlannerMemory.createSession('guest', null, {});
      showChat();
    }

    isRequesting = true;
    if (elSend) elSend.disabled = true;

    /* Render user message */
    var now = new Date().toISOString();
    renderMessage('user', text, now);

    /* Persist user message */
    PlannerMemory.saveMessage(currentSessionId, 'user', text, {});

    /* Add to local history for API */
    conversationHistory.push({ role: 'user', content: text });

    /* Clear input */
    if (elInput) { elInput.value = ''; elInput.style.height = ''; }

    /* Show typing */
    showTyping();

    /* Call planner-chat API */
    fetch('/api/planner-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: conversationHistory.slice(0, -1), /* prior turns only */
        destination: null,
        preferences: {},
      }),
    })
    .then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || 'AVA is unavailable right now.');
        return data;
      });
    })
    .then(function (data) {
      hideTyping();

      var reply = data.reply || '';
      var itinerary = data.itinerary || null;
      var replyTs = new Date().toISOString();

      /* Render AVA reply */
      renderMessage('assistant', reply, replyTs, itinerary);

      /* Persist assistant message */
      PlannerMemory.saveMessage(currentSessionId, 'assistant', reply, {
        hasItinerary: data.hasItinerary,
      });

      /* Persist itinerary if present */
      if (itinerary) {
        PlannerMemory.saveItinerary(currentSessionId, itinerary);
        /* Update session title with destination */
        if (itinerary.destination) {
          PlannerMemory.updateSessionMeta(currentSessionId, {
            title: itinerary.destination,
            destination: itinerary.destination,
          });
          refreshSessionsList();
        }
      }

      /* Add assistant reply to local history */
      conversationHistory.push({ role: 'assistant', content: reply });

      /* Refresh sidebar to reflect updated title */
      refreshSessionsList();
    })
    .catch(function (err) {
      hideTyping();
      renderError(err.message || 'Something went wrong. Please try again.');
    })
    .finally(function () {
      isRequesting = false;
      if (elSend) elSend.disabled = false;
      if (elInput) elInput.focus();
    });
  }

  /* ── Load a previous session ────────────────────────────────────── */
  function loadSession(sessionId) {
    var data = PlannerMemory.loadSession(sessionId);
    if (!data) return;

    currentSessionId = sessionId;
    conversationHistory = [];

    /* Clear chat */
    if (elChatInner) elChatInner.innerHTML = '';

    /* Replay messages */
    data.messages.forEach(function (msg) {
      var itin = null;
      if (msg.role === 'assistant' && msg.metadata && msg.metadata.hasItinerary) {
        itin = PlannerMemory.loadItinerary(sessionId);
      }
      renderMessage(msg.role, msg.content, msg.created_at, itin);
      conversationHistory.push({ role: msg.role, content: msg.content });
    });

    showChat();
    refreshSessionsList();
    closeSidebar();
    scrollToBottom(true);
  }

  /* ── Start a new session ────────────────────────────────────────── */
  function startNewSession() {
    currentSessionId = null;
    conversationHistory = [];
    if (elChatInner) elChatInner.innerHTML = '';
    showWelcome();
    refreshSessionsList();
    closeSidebar();
    if (elInput) elInput.focus();
  }

  /* ── Refresh sidebar session list ───────────────────────────────── */
  function refreshSessionsList() {
    if (!elSessions) return;
    var sessions = PlannerMemory.listSessions('guest');

    if (!sessions.length) {
      elSessions.innerHTML = '<div class="sidebar-empty">Your planning history will appear here after your first conversation.</div>';
      return;
    }

    elSessions.innerHTML = '';
    sessions.forEach(function (s) {
      var item = document.createElement('div');
      item.className = 'session-item' + (s.id === currentSessionId ? ' active' : '');
      item.setAttribute('role', 'listitem');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', s.title + ', ' + formatDate(s.updated_at));

      item.innerHTML = '<div class="session-dot"></div>'
        + '<div class="session-info">'
        + '<div class="session-name">' + escapeHtml(s.title) + '</div>'
        + '<div class="session-date">' + formatDate(s.updated_at) + '</div>'
        + '</div>'
        + '<button type="button" class="session-del" data-id="' + escapeHtml(s.id) + '" aria-label="Delete this session" title="Delete">'
        + '✕</button>';

      item.addEventListener('click', function (e) {
        if (e.target.closest('.session-del')) return;
        loadSession(s.id);
      });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadSession(s.id); }
      });

      var delBtn = item.querySelector('.session-del');
      if (delBtn) {
        delBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (confirm('Delete "' + s.title + '"?')) {
            PlannerMemory.deleteSession(s.id);
            if (currentSessionId === s.id) startNewSession();
            else refreshSessionsList();
          }
        });
      }

      elSessions.appendChild(item);
    });
  }

  /* ── Mobile sidebar open/close ──────────────────────────────────── */
  function openSidebar() {
    if (elSidebar) elSidebar.classList.add('open');
    if (elOverlay) { elOverlay.classList.add('visible'); elOverlay.setAttribute('aria-hidden', 'false'); }
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    if (elSidebar) elSidebar.classList.remove('open');
    if (elOverlay) { elOverlay.classList.remove('visible'); elOverlay.setAttribute('aria-hidden', 'true'); }
    document.body.style.overflow = '';
  }

  /* ── Init ────────────────────────────────────────────────────────── */
  function init() {
    /* Input auto-resize + send enable */
    if (elInput) {
      elInput.addEventListener('input', function () {
        this.style.height = '';
        this.style.height = Math.min(this.scrollHeight, 160) + 'px';
        if (elSend) elSend.disabled = !this.value.trim();
      });

      elInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage(elInput.value);
        }
      });
    }

    if (elSend) {
      elSend.addEventListener('click', function () {
        if (elInput) sendMessage(elInput.value);
      });
    }

    /* Suggestion chips */
    document.querySelectorAll('[data-chip]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        if (elInput) {
          elInput.value = chip.textContent.trim();
          elInput.dispatchEvent(new Event('input'));
          elInput.focus();
        }
      });
    });

    /* New session button */
    if (elNewBtn) {
      elNewBtn.addEventListener('click', startNewSession);
    }

    /* Mobile sidebar toggle */
    if (elSideToggle) {
      elSideToggle.addEventListener('click', openSidebar);
    }
    if (elOverlay) {
      elOverlay.addEventListener('click', closeSidebar);
    }

    /* Load sessions into sidebar */
    refreshSessionsList();

    /* Start in welcome state */
    showWelcome();

    /* Pre-fill from URL ?q= param (from hero search bar) */
    var q = new URLSearchParams(location.search).get('q');
    if (q) {
      if (elInput) {
        elInput.value = q;
        elInput.dispatchEvent(new Event('input'));
      }
      setTimeout(function () { sendMessage(q); }, 600);
    }
  }

  /* Run after DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
