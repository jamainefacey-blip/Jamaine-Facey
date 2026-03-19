/**
 * FHI — Centralised App State
 * Single source of truth for view state, role, filters.
 * Lightweight observable: subscribe to changes.
 */

import * as store from "../../utils/store.js";

const listeners = new Set();

const state = {
  view: "feed",
  viewParams: [],
  role: store.getSettings().role || "reporter",
  feedFilter: "",
  searchQuery: "",
  searchCategory: "",
};

export function get(key) {
  return key ? state[key] : { ...state };
}

export function set(updates) {
  Object.assign(state, updates);
  notify();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn(state);
}

export function toggleRole() {
  state.role = state.role === "reporter" ? "moderator" : "reporter";
  store.saveSettings({ role: state.role });
  notify();
}

export function isModerator() {
  return state.role === "moderator";
}
