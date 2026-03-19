/**
 * FHI — Confirmation Modal
 * Promise-based confirm/cancel dialogs. No native confirm().
 */

import { escapeHtml } from "../../utils/sanitise.js";

export function confirm({ title, body, confirmLabel = "Confirm", confirmClass = "btn-danger", cancelLabel = "Cancel" }) {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-title">${escapeHtml(title)}</div>
        <div class="modal-body">${escapeHtml(body)}</div>
        <div class="modal-actions">
          <button class="btn btn-ghost" id="modal-cancel">${escapeHtml(cancelLabel)}</button>
          <button class="btn ${confirmClass}" id="modal-confirm">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cleanup = (result) => {
      overlay.remove();
      resolve(result);
    };

    overlay.querySelector("#modal-confirm").addEventListener("click", () => cleanup(true));
    overlay.querySelector("#modal-cancel").addEventListener("click", () => cleanup(false));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanup(false);
    });
  });
}
