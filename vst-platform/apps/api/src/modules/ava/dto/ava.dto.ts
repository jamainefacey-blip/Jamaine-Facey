/**
 * Ava Assistant DTOs — Phase 5 Scaffold
 *
 * VST DUAL-IDENTITY CONTEXT MODEL
 * ─────────────────────────────────────────────────────────────────────────────
 * Ava operates in two modes simultaneously (not mutually exclusive):
 *
 *   LOCAL mode         — user is at or near a location; uses lat/lng + local
 *                        context (events, explorer pins, accessibility features)
 *
 *   LONG_DISTANCE mode — user is planning or on a long-haul trip; uses
 *                        destination context (visa, safety, bookings, weather)
 *
 * The context object is mutable across a session. Ava may update the mode
 * based on the user's query (e.g. asking about flights → LONG_DISTANCE).
 *
 * INTENT TAXONOMY (Phase 5 stubs, Phase 6 classification)
 * ─────────────────────────────────────────────────────────────────────────────
 *   BOOKING_QUERY      — flight/hotel search intent
 *   VISA_QUERY         — entry requirements, visa type
 *   SAFETY_QUERY       — travel advisories, SOS prep
 *   LOCAL_EVENT_QUERY  — what's on nearby
 *   EXPLORER_QUERY     — pins, places, local discovery
 *   TRANSLATION_QUERY  — language help (routes to TranslationService)
 *   WEATHER_QUERY      — forecast, packing advice
 *   PASSPORT_QUERY     — expiry, renewal guidance
 *   MEMBERSHIP_QUERY   — tier features, upgrade
 *   GENERAL            — catch-all
 */

import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsIn,
  MinLength,
  MaxLength,
} from 'class-validator';

// ── Context model ────────────────────────────────────────────────────────────

export type AvaMode = 'LOCAL' | 'LONG_DISTANCE';

export class AvaLocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsString()
  label?: string;    // human-readable place name
}

export class AvaContextDto {
  /**
   * LOCAL — near a place, using local discovery features
   * LONG_DISTANCE — planning / on a long-haul trip
   * Both may be active simultaneously (e.g. exploring a destination city).
   */
  @IsIn(['LOCAL', 'LONG_DISTANCE'])
  mode: AvaMode;

  /**
   * sessionId groups multi-turn messages.
   * Future: stored in Redis with TTL for context continuity.
   */
  @IsOptional()
  @IsString()
  sessionId?: string;

  /**
   * User's current or intended location (LOCAL mode).
   */
  @IsOptional()
  location?: AvaLocationDto;

  /**
   * ISO country code of destination (LONG_DISTANCE mode).
   */
  @IsOptional()
  @IsString()
  destinationCode?: string;

  /**
   * ISO country code of user's passport nationality.
   * Passed from UserProfile — Ava uses it for visa/entry checks.
   */
  @IsOptional()
  @IsString()
  passportNationality?: string;

  /**
   * Active booking reference (if user is on a trip).
   * Ava uses this to surface booking-specific answers.
   */
  @IsOptional()
  @IsString()
  activeBookingRef?: string;
}

// ── Query DTO ────────────────────────────────────────────────────────────────

export class AvaQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  context: AvaContextDto;
}

// ── Response ─────────────────────────────────────────────────────────────────

export type AvaIntent =
  | 'BOOKING_QUERY'
  | 'VISA_QUERY'
  | 'SAFETY_QUERY'
  | 'LOCAL_EVENT_QUERY'
  | 'EXPLORER_QUERY'
  | 'TRANSLATION_QUERY'
  | 'WEATHER_QUERY'
  | 'PASSPORT_QUERY'
  | 'MEMBERSHIP_QUERY'
  | 'OPPORTUNITY_QUERY'
  | 'GENERAL';

export interface AvaAction {
  label:  string;                          // button/chip label in the UI
  type:   'DEEP_LINK' | 'QUERY' | 'URL';
  value:  string;                          // route path, pre-filled query, or URL
}

export interface AvaResponseDto {
  reply:           string;                 // Ava's text response
  intent:          AvaIntent;             // classified intent of the user message
  mode:            AvaMode;               // mode Ava is responding in
  suggestions:     AvaAction[];           // quick-reply chips / action buttons
  contextUpdates?: Partial<AvaContextDto>; // Ava may update context (mode switch, etc.)
  disclaimer?:     string;               // safety/legal disclaimer when required
  sources?:        string[];             // data sources referenced (visa DB, etc.)
}
