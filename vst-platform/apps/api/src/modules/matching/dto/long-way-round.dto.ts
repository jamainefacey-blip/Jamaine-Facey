/**
 * Long Way Round DTOs — Phase 6 Architecture Scaffold
 *
 * DATA MODEL
 * ─────────────────────────────────────────────────────────────────────────────
 * LongWayRoundRoute — the overall journey (owned by a user)
 * LongWayRoundStop  — ordered individual stops on the route
 *
 * PHASE 6 SCOPE
 * ─────────────────────────────────────────────────────────────────────────────
 * - Route and stop CRUD (create, read, update, delete)
 * - Route status lifecycle: DRAFT → PLANNED → BOOKED → COMPLETED
 * - Accessibility notes per stop
 * - Integration with UserDestinationPreference (DREAM destinations as source)
 *
 * PHASE 7 DEFERRED
 * ─────────────────────────────────────────────────────────────────────────────
 * - Route feasibility analysis (transit availability between stops)
 * - Total cost estimation (affiliate partner feed integration)
 * - Optimal stop ordering (TSP heuristic on preferred destinations)
 * - Booking handoff (generate affiliate search links per leg)
 * - Visa chain analysis (multi-country entry requirements)
 * - Carbon footprint estimate
 *
 * ROUTE TIER GATE
 * ─────────────────────────────────────────────────────────────────────────────
 *   GUEST         — read only (can view shared routes)
 *   PREMIUM       — up to 3 active routes, max 8 stops per route
 *   VOYAGE_ELITE  — unlimited routes, unlimited stops, full analysis
 */

import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  MinLength,
  MaxLength,
  Length,
} from 'class-validator';

// ── Create Route ──────────────────────────────────────────────────────────────

export class CreateLongWayRoundRouteDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;         // e.g. "Asia Loop 2026"

  @IsOptional()
  @IsInt()
  @Min(0)
  budgetGbp?: number;   // total trip budget in pence

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// ── Add/Update Stop ───────────────────────────────────────────────────────────

export class UpsertLongWayRoundStopDto {
  @IsInt()
  @Min(1)
  position: number;      // 1-based order; re-ordering is client responsibility

  @IsString()
  @Length(2, 5)
  destinationCode: string;   // ISO 3166-1 alpha-2 or IATA city code

  @IsOptional()
  @IsString()
  @MaxLength(100)
  destinationName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  durationDays?: number;

  @IsOptional()
  @IsDateString()
  arrivalAfter?: string;     // ISO 8601 — earliest acceptable arrival date

  @IsOptional()
  @IsBoolean()
  isFlexible?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

// ── Response shapes ───────────────────────────────────────────────────────────

export interface LongWayRoundStopDto {
  id:              string;
  position:        number;
  destinationCode: string;
  destinationName: string | null;
  durationDays:    number | null;
  arrivalAfter:    string | null;    // ISO string
  isFlexible:      boolean;
  notes:           string | null;
}

export interface LongWayRoundRouteDto {
  id:         string;
  name:       string | null;
  status:     string;
  totalDays:  number | null;         // sum of stop.durationDays
  budgetGbp:  number | null;         // pence
  notes:      string | null;
  stops:      LongWayRoundStopDto[];
  createdAt:  string;
  updatedAt:  string;

  // Phase 7: populated by feasibility analyser
  analysis?: {
    estimatedTotalCostGbp: null;
    visaChain:             null;
    carbonKg:              null;
    feasible:              null;
  };
}
