/**
 * router.ts
 * Pain Engine — PC-ROUTING-02
 *
 * Routes finished builds to Hangar or Showroom.
 *
 * SHOWROOM:  gate pass (status=pass|warn) + monetisation ready + founderReviewReady
 * HANGAR:    everything else — early, needs validation, gate fail, not monetised
 *
 * Persists: RouteRecord to engine/data/routes/{routeId}.json
 * Latest pointer: engine/data/route-latest.json
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ReleaseResult } from './release';

// ── Types ──────────────────────────────────────────────────────────────────

export type RouteDestination = 'SHOWROOM' | 'HANGAR';

export type MonetisationReadiness =
  | 'READY'       // gate pass + monetisation type is revenue-generating
  | 'POTENTIAL'   // has monetisation type but score or gate not fully there
  | 'INTERNAL'    // internal tooling — not commercial
  | 'NONE';       // no monetisation path

export interface RouteRecord {
  routeId:              string;
  releaseId:            string;
  programId:            string;
  lane:                 string;
  intent:               string;
  routedAt:             string;
  destination:          RouteDestination;
  reason:               string;
  monetisationTag:      MonetisationReadiness;
  gateScore:            number | null;
  gateStatus:           string | null;
  founderReviewReady:   boolean;
  releaseState:         string;
  hangarReasons:        string[];
  showroomCriteria:     ShowroomCriteria;
}

export interface ShowroomCriteria {
  gatePass:           boolean;
  monetisationReady:  boolean;
  founderReady:       boolean;
  noHardBlockers:     boolean;
}

export interface RouteResult {
  route:       RouteRecord;
  outputFile:  string;
}

// ── Monetisation classification ────────────────────────────────────────────

const REVENUE_TYPES  = new Set(['direct_revenue', 'subscription_revenue', 'affiliate', 'white_label', 'saas', 'marketplace']);
const GRANT_TYPES    = new Set(['grant_eligible', 'grant_revenue', 'ngo_funded']);
const INTERNAL_TYPES = new Set(['internal_tooling', 'internal', 'none', '']);

function classifyMonetisation(
  monetisationType: string | undefined,
  gateScore: number | null,
  gateStatus: string | null,
): MonetisationReadiness {
  const t = (monetisationType ?? '').toLowerCase();

  if (INTERNAL_TYPES.has(t)) return 'INTERNAL';
  if (!t || t === 'none')    return 'NONE';

  const gateOk = gateStatus === 'pass' || gateStatus === 'warn';
  const scoreOk = (gateScore ?? 0) >= 70;

  if (REVENUE_TYPES.has(t) || GRANT_TYPES.has(t)) {
    if (gateOk && scoreOk) return 'READY';
    return 'POTENTIAL';
  }

  return 'POTENTIAL';
}

// ── Routing logic ──────────────────────────────────────────────────────────

export function routeRelease(
  release: ReleaseResult,
  monetisationType?: string,
): RouteRecord {
  const routeId   = `route-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const routedAt  = new Date().toISOString();
  const hangarReasons: string[] = [];

  const monetisationTag = classifyMonetisation(
    monetisationType,
    release.gateScore,
    release.gateStatus,
  );

  // ── Showroom criteria ──────────────────────────────────────────────────
  const gatePass          = release.gateStatus === 'pass' || release.gateStatus === 'warn';
  const monetisationReady = monetisationTag === 'READY' || monetisationTag === 'POTENTIAL';
  const founderReady      = release.founderReviewReady;
  const noHardBlockers    = release.state !== 'BLOCKED';

  const showroomCriteria: ShowroomCriteria = {
    gatePass,
    monetisationReady,
    founderReady,
    noHardBlockers,
  };

  // ── Hangar reasons ─────────────────────────────────────────────────────
  if (!noHardBlockers)    hangarReasons.push(`Release state=${release.state} — hard blocker present`);
  if (!gatePass)          hangarReasons.push(`Gate status=${release.gateStatus ?? 'null'}, score=${release.gateScore ?? 'null'} — not passing`);
  if (!founderReady)      hangarReasons.push('founderReviewReady=false — needs founder sign-off');
  if (!monetisationReady) hangarReasons.push(`monetisationType=${monetisationType ?? 'unknown'} → tag=${monetisationTag} — not monetisation-ready`);
  if (release.preGateVerdict === 'NEEDS_WORK') hangarReasons.push('Pre-gate returned NEEDS_WORK');
  if ((release.warnings ?? []).length > 0) hangarReasons.push(`${release.warnings.length} release warning(s) present`);

  // ── Route decision ─────────────────────────────────────────────────────
  const allShowroomMet = gatePass && monetisationReady && founderReady && noHardBlockers;
  const destination: RouteDestination = allShowroomMet ? 'SHOWROOM' : 'HANGAR';

  const reason = destination === 'SHOWROOM'
    ? `Gate ${release.gateStatus} (score=${release.gateScore}), monetisation=${monetisationTag}, founderReady=true — Showroom criteria met`
    : `Hangar: ${hangarReasons.join('; ')}`;

  return {
    routeId,
    releaseId:          release.releaseId,
    programId:          release.programId,
    lane:               release.lane,
    intent:             release.intent,
    routedAt,
    destination,
    reason,
    monetisationTag,
    gateScore:          release.gateScore,
    gateStatus:         release.gateStatus,
    founderReviewReady: release.founderReviewReady,
    releaseState:       release.state,
    hangarReasons,
    showroomCriteria,
  };
}

// ── Persistence ────────────────────────────────────────────────────────────

const ROUTES_DIR   = path.join('engine', 'data', 'routes');
const LATEST_FILE  = path.join('engine', 'data', 'route-latest.json');

export function persistRoute(record: RouteRecord): string {
  fs.mkdirSync(ROUTES_DIR, { recursive: true });
  const filePath = path.join(ROUTES_DIR, `${record.routeId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf8');
  fs.writeFileSync(LATEST_FILE, JSON.stringify(record, null, 2), 'utf8');
  return filePath;
}

export function loadLatestRoute(): RouteRecord | null {
  if (!fs.existsSync(LATEST_FILE)) return null;
  return JSON.parse(fs.readFileSync(LATEST_FILE, 'utf8')) as RouteRecord;
}
