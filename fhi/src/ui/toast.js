/**
 * FHI — Toast Notifications
 * Lightweight, auto-dismissing feedback toasts.
 */

let toastEl = null;
let timer = null;

function ensureEl() {
  if (toastEl) return;
  toastEl = document.createElement("div");
  toastEl.className = "toast";
  toastEl.setAttribute("role", "status");
  toastEl.setAttribute("aria-live", "polite");
  document.body.appendChild(toastEl);
}

export function show(message, type = "success", duration = 2500) {
  ensureEl();
  clearTimeout(timer);

  toastEl.textContent = message;
  toastEl.className = `toast toast-${type}`;

  // Force reflow for re-animation
  void toastEl.offsetWidth;
  toastEl.classList.add("visible");

  timer = setTimeout(() => {
    toastEl.classList.remove("visible");
  }, duration);
}

export function success(msg) { show(msg, "success"); }
export function error(msg)   { show(msg, "error", 4000); }
