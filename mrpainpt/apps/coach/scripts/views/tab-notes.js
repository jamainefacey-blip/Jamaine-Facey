// ─────────────────────────────────────────────────────────────────────────────
// NOTES TAB  —  #client/:slug/notes
//
// Renders existing coachNotes in reverse-chronological order.
// Provides a compose form (date, title, body).
// On submit: generates updated CLIENT_CONFIG text in a <pre> block.
// Provides a copy-to-clipboard button with safe textarea fallback.
//
// This is a Phase 3 manual copy/paste workflow. The generated text must be
// pasted back into clients/<slug>/client.config.js and committed to git.
// Phase 4 will replace this with a POST /api/client/:slug/notes endpoint.
//
// No fetch. No localStorage writes. No file writes.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  // ── Utility ────────────────────────────────────────────────────────────────

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatDate(iso) {
    if (!iso) return iso;
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  // ── Config serialiser ──────────────────────────────────────────────────────
  // Returns updated client.config.js file content as a string.
  // Uses JSON.stringify — produces valid JSON-as-JS object literal.
  // The existing client.config.js format is a pure data object with no
  // functions, so JSON round-trip is safe.

  function generateConfigText(config, newNote) {
    var updated = JSON.parse(JSON.stringify(config)); // deep clone
    updated.coachNotes = [newNote].concat(updated.coachNotes || []);
    return (
      "// ─────────────────────────────────────────────────────────────────────────────\n" +
      "// CLIENT CONFIGURATION\n" +
      "// Edit this file to white-label the app for a new client.\n" +
      "// ─────────────────────────────────────────────────────────────────────────────\n\n" +
      "const CLIENT_CONFIG = " +
      JSON.stringify(updated, null, 2) +
      ";\n"
    );
  }

  // ── Existing notes list ────────────────────────────────────────────────────

  function renderNotesList(notes) {
    if (!Array.isArray(notes) || notes.length === 0) {
      return (
        '<div class="c-empty" style="min-height:8rem;border:2px dashed var(--color-border);border-radius:.5rem;">' +
          '<p class="c-empty__title">No notes yet</p>' +
          '<p class="c-empty__text">Use the compose form below to write the first note.</p>' +
        "</div>"
      );
    }

    // Reverse chronological — newest first
    var sorted = notes.slice().sort(function (a, b) {
      return (b.date || "").localeCompare(a.date || "");
    });

    var html = [];
    sorted.forEach(function (note) {
      html.push(
        '<div class="c-card" style="margin-bottom:.875rem;">' +
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:.625rem;">' +
            '<p style="font-weight:600;font-size:.9375rem;color:var(--color-text);">' + esc(note.title) + "</p>" +
            '<time style="font-size:.8125rem;color:var(--color-text-muted);white-space:nowrap;" datetime="' + esc(note.date) + '">' +
              esc(formatDate(note.date)) +
            "</time>" +
          "</div>" +
          '<p style="font-size:.9rem;color:var(--color-text);line-height:1.65;white-space:pre-line;">' +
            esc(note.body) +
          "</p>" +
        "</div>"
      );
    });
    return html.join("\n");
  }

  // ── Compose form ───────────────────────────────────────────────────────────

  function renderComposeForm() {
    var today = todayISO();
    return [
      '<div class="c-card" id="notes-compose-card" style="margin-top:2rem;">',
      '  <h3 class="c-card__title" style="margin-bottom:1rem;">Add Coach Note</h3>',
      '  <form id="notes-compose-form" novalidate>',
      '    <div style="display:grid;grid-template-columns:1fr 2fr;gap:.75rem;margin-bottom:.75rem;">',
      '      <div class="c-field">',
      '        <label class="c-label" for="note-date">Date</label>',
      '        <input class="c-input" type="date" id="note-date" name="date"',
      '          value="' + esc(today) + '" required />',
      "      </div>",
      '      <div class="c-field">',
      '        <label class="c-label" for="note-title">Title</label>',
      '        <input class="c-input" type="text" id="note-title" name="title"',
      '          placeholder="e.g. Week 4 check-in" required />',
      "      </div>",
      "    </div>",
      '    <div class="c-field" style="margin-bottom:1rem;">',
      '      <label class="c-label" for="note-body">Note body</label>',
      '      <textarea class="c-textarea" id="note-body" name="body"',
      '        placeholder="Clinical observations, cues, adjustments…" rows="5" required></textarea>',
      "    </div>",
      '    <div id="notes-form-error" role="alert" style="display:none;" class="c-alert c-alert--red" style="margin-bottom:.75rem;"></div>',
      '    <button type="submit" class="c-btn c-btn--primary">Generate updated config</button>',
      "  </form>",
      "</div>",
      // Output area — hidden until form is submitted
      '<div id="notes-output-section" style="display:none;margin-top:1.5rem;">',
      '  <div class="c-card">',
      '    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem;margin-bottom:.75rem;">',
      '      <h3 class="c-card__title">Updated client.config.js</h3>',
      '      <button type="button" id="notes-copy-btn" class="c-btn c-btn--secondary">Copy to clipboard</button>',
      "    </div>",
      '    <div class="c-alert c-alert--amber" style="margin-bottom:.875rem;" role="note">',
      '      <p style="font-size:.8125rem;line-height:1.55;">' +
        "<strong>Phase 3 manual workflow:</strong> Copy the text below and paste it into " +
        "<code style=\"font-family:var(--font-mono);font-size:.75rem;\">mrpainpt/clients/&lt;slug&gt;/client.config.js</code>, " +
        "replacing the entire file. Commit the change to git to make it permanent. " +
        "Phase 4 will replace this with an API write." +
      "</p>",
      "    </div>",
      '    <pre id="notes-output-pre" class="c-pre" style="max-height:24rem;overflow:auto;"></pre>',
      "  </div>",
      "</div>",
    ].join("\n");
  }

  // ── Form submission handler ────────────────────────────────────────────────
  // Attached via setTimeout after HTML is injected into the DOM.

  function attachFormHandler(client) {
    var form    = document.getElementById("notes-compose-form");
    var errEl   = document.getElementById("notes-form-error");
    var outSec  = document.getElementById("notes-output-section");
    var outPre  = document.getElementById("notes-output-pre");
    var copyBtn = document.getElementById("notes-copy-btn");

    if (!form) return; // guard: DOM not ready yet (should not happen with setTimeout)

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var dateVal  = (document.getElementById("note-date")  || {}).value || "";
      var titleVal = (document.getElementById("note-title") || {}).value || "";
      var bodyVal  = (document.getElementById("note-body")  || {}).value || "";

      // Validation
      var errs = [];
      if (!dateVal)  errs.push("Date is required.");
      if (!titleVal) errs.push("Title is required.");
      if (!bodyVal)  errs.push("Note body is required.");

      if (errs.length > 0) {
        if (errEl) {
          errEl.style.display = "";
          errEl.innerHTML = "<p>" + errs.map(esc).join(" ") + "</p>";
        }
        return;
      }

      if (errEl) errEl.style.display = "none";

      var newNote = { date: dateVal, title: titleVal, body: bodyVal };
      var text    = generateConfigText(client.config, newNote);

      if (outPre) outPre.textContent = text;
      if (outSec) outSec.style.display = "";

      // Scroll output into view
      if (outSec && outSec.scrollIntoView) {
        outSec.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    // Copy-to-clipboard handler
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var text = outPre ? outPre.textContent : "";
        if (!text) return;

        if (
          typeof navigator !== "undefined" &&
          navigator.clipboard &&
          typeof navigator.clipboard.writeText === "function"
        ) {
          navigator.clipboard.writeText(text).then(function () {
            copyBtn.textContent = "Copied!";
            setTimeout(function () { copyBtn.textContent = "Copy to clipboard"; }, 2000);
          }).catch(function () {
            fallbackSelect(outPre, copyBtn);
          });
        } else {
          fallbackSelect(outPre, copyBtn);
        }
      });
    }
  }

  // Fallback: select text in the pre block so the user can Ctrl+C
  function fallbackSelect(preEl, btn) {
    if (!preEl) return;
    try {
      var range = document.createRange();
      range.selectNodeContents(preEl);
      var sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
      if (btn) {
        btn.textContent = "Text selected — press Ctrl+C / Cmd+C";
        setTimeout(function () { btn.textContent = "Copy to clipboard"; }, 3000);
      }
    } catch (err) {
      // Clipboard and selection both unavailable — user must copy manually
      if (btn) btn.textContent = "Select and copy manually";
    }
  }

  // ── Main render ────────────────────────────────────────────────────────────

  function render(client) {
    var notes = (client.config && client.config.coachNotes) ? client.config.coachNotes : [];
    var html  = [];

    html.push('<h3 style="font-size:1.125rem;font-weight:600;color:var(--color-text);margin-bottom:1rem;">Coach Notes</h3>');
    html.push(renderNotesList(notes));
    html.push(renderComposeForm());

    return html.join("\n");
  }

  // ── Self-register ──────────────────────────────────────────────────────────

  window.COACH_TAB_HANDLERS = window.COACH_TAB_HANDLERS || {};
  window.COACH_TAB_HANDLERS["notes"] = function (client) {
    var html = render(client);
    // Attach form event listeners after the HTML is injected into the DOM.
    // setTimeout(fn, 0) defers until after innerHTML has been set in client-detail.js.
    if (typeof setTimeout === "function" && typeof document !== "undefined") {
      setTimeout(function () { attachFormHandler(client); }, 0);
    }
    return html;
  };

})();
