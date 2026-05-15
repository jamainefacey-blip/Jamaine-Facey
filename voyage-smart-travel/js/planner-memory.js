/* ─────────────────────────────────────────────────────────────────────────────
   VST — Planner Memory (window.PlannerMemory)
   localStorage-based session/message/itinerary persistence.
   Matches the Supabase schema in migrations/003_planner_memory.sql
   so a future server-side swap is straightforward.
   ───────────────────────────────────────────────────────────────────────────── */

window.PlannerMemory = (function () {
  'use strict';

  var SESSIONS_KEY = 'vst_planner_sessions';
  var MAX_MSGS_PER_SESSION = 100;

  /* ── UUID v4 ─────────────────────────────────────────────────────────────── */
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  /* ── Sessions store ──────────────────────────────────────────────────────── */
  function readSessions() {
    try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function writeSessions(arr) {
    try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(arr)); }
    catch (e) { /* quota exceeded — silently ignore */ }
  }

  /* ── Messages store ──────────────────────────────────────────────────────── */
  function msgKey(sessionId) { return 'vst_planner_msgs_' + sessionId; }

  function readMessages(sessionId) {
    try { return JSON.parse(localStorage.getItem(msgKey(sessionId)) || '[]'); }
    catch (e) { return []; }
  }

  function writeMessages(sessionId, msgs) {
    try { localStorage.setItem(msgKey(sessionId), JSON.stringify(msgs)); }
    catch (e) {}
  }

  /* ── Itinerary store ─────────────────────────────────────────────────────── */
  function itinKey(sessionId) { return 'vst_planner_itin_' + sessionId; }

  /* ── Public API ──────────────────────────────────────────────────────────── */

  function createSession(userId, destination, preferences) {
    var now = new Date().toISOString();
    var session = {
      id:          uuid(),
      user_id:     userId || 'guest',
      title:       destination || 'New Trip',
      destination: destination || null,
      start_date:  null,
      end_date:    null,
      preferences: preferences || {},
      created_at:  now,
      updated_at:  now,
    };
    var sessions = readSessions();
    sessions.unshift(session);
    writeSessions(sessions);
    return session.id;
  }

  function loadSession(sessionId) {
    var sessions = readSessions();
    var session  = null;
    for (var i = 0; i < sessions.length; i++) {
      if (sessions[i].id === sessionId) { session = sessions[i]; break; }
    }
    if (!session) return null;
    return { session: session, messages: readMessages(sessionId) };
  }

  function saveMessage(sessionId, role, content, metadata) {
    var now = new Date().toISOString();
    var msg = {
      id:         uuid(),
      session_id: sessionId,
      role:       role,
      content:    content,
      metadata:   metadata || {},
      created_at: now,
    };
    var msgs = readMessages(sessionId);
    msgs.push(msg);
    if (msgs.length > MAX_MSGS_PER_SESSION) msgs = msgs.slice(-MAX_MSGS_PER_SESSION);
    writeMessages(sessionId, msgs);

    /* Touch updated_at on the parent session */
    var sessions = readSessions();
    for (var i = 0; i < sessions.length; i++) {
      if (sessions[i].id === sessionId) {
        sessions[i].updated_at = now;
        /* Auto-update title from first user message if still default */
        if (role === 'user' && sessions[i].title === 'New Trip' && content) {
          sessions[i].title = content.length > 48
            ? content.substring(0, 45) + '…'
            : content;
        }
        break;
      }
    }
    writeSessions(sessions);
    return msg.id;
  }

  function listSessions(userId) {
    var sessions = readSessions();
    if (userId) {
      sessions = sessions.filter(function (s) { return s.user_id === userId; });
    }
    return sessions;
  }

  function updateSessionMeta(sessionId, patch) {
    var sessions = readSessions();
    for (var i = 0; i < sessions.length; i++) {
      if (sessions[i].id === sessionId) {
        Object.assign(sessions[i], patch, { updated_at: new Date().toISOString() });
        break;
      }
    }
    writeSessions(sessions);
  }

  function saveItinerary(sessionId, itinerary) {
    var record = Object.assign({}, itinerary, {
      session_id: sessionId,
      saved_at:   new Date().toISOString(),
    });
    try { localStorage.setItem(itinKey(sessionId), JSON.stringify(record)); }
    catch (e) { return null; }
    return sessionId;
  }

  function loadItinerary(sessionId) {
    try { return JSON.parse(localStorage.getItem(itinKey(sessionId))); }
    catch (e) { return null; }
  }

  function deleteSession(sessionId) {
    var sessions = readSessions().filter(function (s) { return s.id !== sessionId; });
    writeSessions(sessions);
    try { localStorage.removeItem(msgKey(sessionId)); } catch (e) {}
    try { localStorage.removeItem(itinKey(sessionId)); } catch (e) {}
  }

  return {
    createSession:    createSession,
    loadSession:      loadSession,
    saveMessage:      saveMessage,
    listSessions:     listSessions,
    updateSessionMeta: updateSessionMeta,
    saveItinerary:    saveItinerary,
    loadItinerary:    loadItinerary,
    deleteSession:    deleteSession,
  };

})();
