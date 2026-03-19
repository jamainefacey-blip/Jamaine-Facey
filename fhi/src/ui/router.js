/**
 * FHI — Hash Router
 * Parses hash, updates state, calls registered view renderers.
 */

import * as appState from "../state/appState.js";

const viewRenderers = {};

export function registerView(name, renderFn) {
  viewRenderers[name] = renderFn;
}

export function navigate(hash) {
  window.location.hash = hash;
}

export function start() {
  window.addEventListener("hashchange", onRoute);
  onRoute();
}

function onRoute() {
  const hash = window.location.hash.replace("#", "") || "feed";
  const [view, ...params] = hash.split("/");

  appState.set({ view, viewParams: params });

  // Update nav active state
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  const renderer = viewRenderers[view] || viewRenderers["feed"];
  if (renderer) {
    renderer(params);
  }
}

export function currentView() {
  return appState.get("view");
}
