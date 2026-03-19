/**
 * Matching Engine DTOs
 *
 * OPPORTUNITY TYPES
 * ─────────────────────────────────────────────────────────────────────────────
 *   LOCAL_DISCOVERY   — nearby events / pins matching interests (LOCAL mode)
 *   SHORT_BREAK       — 2–4 day trip matching an availability window
 *   WEEK_HOLIDAY      — 7–14 day trip
 *   LONG_HAUL         — 14+ day trip to a dream destination
 *   LAST_MINUTE       — any trip departing within 14 days at a good price
 *   LONG_WAY_ROUND    — multi-stop itinerary across dream destinations
 *   PRICE_DROP_MATCH  — price drop on a destination the user has PREFERRED/DREAM
 *
 * MATCH SCORE
 * ─────────────────────────────────────────────────────────────────────────────
 * 0–100 composite score. Signals contribute positively or negatively:
 *   +20 destination is PREFERRED or DREAM
 *   +15 trip type matches user tripTypes[]
 *   +10 duration fits minTripDays / maxTripDays
 *   +10 travel style alignment (ADVENTURE, BEACH, etc.)
 *   +10 budget within budgetMinGbp / budgetMaxGbp band
 *   +10 availability window overlap
 *   +10 transport mode match
 *   +5  accessibility features present (if user needs them)
 *   -30 destination is EXCLUDED
 *   -10 transport mode not in transportModes
 *
 * ACTION TYPES
 * ─────────────────────────────────────────────────────────────────────────────
 *   SEARCH        — deep link to flight/hotel search with params pre-filled
 *   SET_ALERT     — create a price alert for this destination
 *   VIEW_EVENTS   — show local events at this destination
 *   VIEW_EXPLORER — open explorer map for this destination
 *   ASK_AVA       — send a pre-filled query to Ava about this opportunity
 *   SHARE         — share the opportunity (future: community / friends)
 */

export type OpportunityType =
  | 'LOCAL_DISCOVERY'
  | 'SHORT_BREAK'
  | 'WEEK_HOLIDAY'
  | 'LONG_HAUL'
  | 'LAST_MINUTE'
  | 'LONG_WAY_ROUND'
  | 'PRICE_DROP_MATCH';

export type OpportunityActionType =
  | 'SEARCH'
  | 'SET_ALERT'
  | 'VIEW_EVENTS'
  | 'VIEW_EXPLORER'
  | 'ASK_AVA'
  | 'SHARE';

export interface OpportunityAction {
  type:  OpportunityActionType;
  label: string;
  value: string;    // deep-link path, pre-filled query, or search params JSON
}

export interface MatchResult {
  id:              string;         // deterministic ID for dedup (hash of type+dest+date)
  type:            OpportunityType;
  destinationCode: string;         // ISO 3166-1 alpha-2 or IATA city code
  destinationName: string;
  tripType?:       string;         // matched TripType enum value
  score:           number;         // 0–100
  signals:         string[];       // human-readable reasons why this was surfaced
  actions:         OpportunityAction[];
  estimatedDays?:  number;         // suggested trip duration
  priceHint?:      string;         // "from £299" — stub until live pricing
  windowLabel?:    string;         // availability window that enables this (if any)
  expiresAt?:      string;         // ISO date — for LAST_MINUTE opportunities
  isLastMinute:    boolean;
  requiresUpgrade: boolean;        // true if tier gate applies
}

export interface MatchingResultsDto {
  userId:       string;
  generatedAt:  string;         // ISO timestamp
  mode:         'LOCAL' | 'LONG_DISTANCE' | 'BOTH';
  opportunities: MatchResult[];
  meta: {
    total:            number;
    localCount:       number;
    longDistCount:    number;
    excludedCount:    number;   // destinations that were suppressed
    hasAvailability:  boolean;  // user has at least one active window
  };
}

// ── Query filters ─────────────────────────────────────────────────────────────

export interface MatchingQueryOptions {
  mode?:      'LOCAL' | 'LONG_DISTANCE' | 'BOTH';
  limit?:     number;          // max results (default 10)
  tripType?:  string;          // filter to a specific TripType
  lat?:       number;          // user latitude (LOCAL mode)
  lng?:       number;          // user longitude (LOCAL mode)
}
