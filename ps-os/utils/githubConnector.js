'use strict';

/**
 * PS-OS GitHub Connector — Read-Only
 *
 * Safety contract (hardcoded, not configurable):
 *   - Never writes to disk
 *   - Never executes any external content
 *   - Never evals strings
 *   - All external content returned as plain strings only
 *   - README content truncated to 1500 chars BEFORE any processing
 */

const SEARCH_URL   = 'https://api.github.com/search/repositories';
const README_URL   = (owner, repo) =>
  `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`;
const MAX_RESULTS  = 5;
const TIMEOUT_MS   = 5000;
const CACHE_TTL_MS = 60_000;
const THROTTLE_MS  = 2_000;

// In-memory cache: query → { ts, result }
const _cache     = new Map();
const _lastFetch = new Map();

function buildHeaders() {
  const headers = {
    'Accept':               'application/vnd.github+json',
    'User-Agent':           'ps-os/1.0',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function timedFetch(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

/**
 * Search GitHub repositories.
 * Returns { results: NormalisedRepo[], rateLimited: boolean, error?: string }
 *
 * NormalisedRepo: { name, description, url, stars, owner, repoName, readmeSummary }
 * README fetched for the top result only (max 1 per search call).
 */
export async function searchGitHub(query) {
  const now = Date.now();
  const key = query;

  // Cache hit (within TTL)
  const cached = _cache.get(key);
  if (cached && (now - cached.ts) < CACHE_TTL_MS) {
    return cached.result;
  }

  // Throttle: same query within 2s and no valid cache → return stale or empty
  const last = _lastFetch.get(key) || 0;
  if ((now - last) < THROTTLE_MS) {
    return cached?.result || { results: [], rateLimited: false };
  }
  _lastFetch.set(key, now);

  const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&per_page=${MAX_RESULTS}&sort=stars&order=desc`;

  let res;
  try {
    res = await timedFetch(url, { headers: buildHeaders() });
  } catch (err) {
    return {
      results: [],
      rateLimited: false,
      error: err.name === 'AbortError' ? 'timeout' : err.message,
    };
  }

  // Rate limit via response header
  const remaining = parseInt(res.headers.get('x-ratelimit-remaining') ?? '1', 10);
  if (res.status === 403 || res.status === 429 || remaining === 0) {
    return { results: [], rateLimited: true };
  }

  if (!res.ok) {
    return { results: [], rateLimited: false, error: `GitHub API error: ${res.status}` };
  }

  let body;
  try {
    body = await res.json();
  } catch {
    return { results: [], rateLimited: false, error: 'Invalid JSON from GitHub' };
  }

  const items = (body.items || []).slice(0, MAX_RESULTS);
  const results = items.map(item => ({
    name:         String(item.full_name || item.name || ''),
    description:  String(item.description || ''),
    url:          String(item.html_url || ''),
    stars:        Number(item.stargazers_count) || 0,
    owner:        String(item.owner?.login || ''),
    repoName:     String(item.name || ''),
    readmeSummary: null,
  }));

  // Fetch README for top result only (max 1 per search)
  if (results.length > 0) {
    results[0].readmeSummary = await fetchReadme(results[0].owner, results[0].repoName);
  }

  const result = { results, rateLimited: false };
  _cache.set(key, { ts: now, result });
  return result;
}

/**
 * Fetch README for a repo.
 * Returns first 1500 chars of decoded text, or null on any failure.
 * NEVER throws.
 */
export async function fetchReadme(owner, repo) {
  try {
    const res = await timedFetch(README_URL(owner, repo), { headers: buildHeaders() });
    if (!res.ok) return null;
    const body = await res.json();
    // GitHub returns base64-encoded content
    const raw = Buffer.from(body.content || '', 'base64').toString('utf8');
    return raw.slice(0, 1500); // TRUNCATE BEFORE PROCESSING
  } catch {
    return null;
  }
}
