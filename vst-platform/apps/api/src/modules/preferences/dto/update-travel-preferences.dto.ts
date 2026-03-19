import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsArray,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import {
  BudgetRange,
  CabinClass,
  TravelStyle,
  TripType,
  StayType,
  TransportMode,
} from '@prisma/client';

/**
 * UpdateTravelPreferencesDto
 *
 * Covers both the matching-engine preferences (trip types, stay types,
 * transport modes, budget bands, trip length) and notification toggles.
 *
 * All fields are optional — this is a PATCH/PUT upsert. Any field not
 * supplied is left unchanged.
 *
 * BUDGET BANDS
 * ─────────────────────────────────────────────────────────────────────────────
 * budgetRange     = coarse tier used in UI display and broad filtering
 * budgetMinGbp /  = per-person budget in GBP pence for precise matching
 * budgetMaxGbp      If set, these take precedence over budgetRange in the
 *                   matching engine. Stored in pence to match Booking/Payment.
 *
 * TRIP LENGTH
 * ─────────────────────────────────────────────────────────────────────────────
 * minTripDays / maxTripDays are global defaults.
 * Individual availability windows can override these per-window.
 */
export class UpdateTravelPreferencesDto {
  // ── Travel basics ──────────────────────────────────────────────────────────
  @IsOptional() @IsEnum(CabinClass)   preferredCabinClass?: CabinClass;
  @IsOptional() @IsString()           preferredCurrency?: string;
  @IsOptional() @IsString()           preferredLanguage?: string;
  @IsOptional() @IsEnum(BudgetRange)  budgetRange?: BudgetRange;
  @IsOptional() @IsInt() @Min(0)      budgetMinGbp?: number;   // pence
  @IsOptional() @IsInt() @Min(0)      budgetMaxGbp?: number;   // pence

  // ── Travel style ───────────────────────────────────────────────────────────
  @IsOptional() @IsArray() @IsEnum(TravelStyle, { each: true })
  travelStyle?: TravelStyle[];

  // ── Trip type preferences ──────────────────────────────────────────────────
  @IsOptional() @IsArray() @IsEnum(TripType, { each: true })
  tripTypes?: TripType[];

  @IsOptional() @IsArray() @IsEnum(StayType, { each: true })
  stayTypes?: StayType[];

  @IsOptional() @IsArray() @IsEnum(TransportMode, { each: true })
  transportModes?: TransportMode[];

  @IsOptional() @IsInt() @Min(1) @Max(365)  minTripDays?: number;
  @IsOptional() @IsInt() @Min(1) @Max(365)  maxTripDays?: number;

  // ── Accessibility ──────────────────────────────────────────────────────────
  @IsOptional() @IsBoolean()  requiresWheelchair?: boolean;
  @IsOptional() @IsBoolean()  requiresAssistance?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true })
  dietaryRequirements?: string[];
  @IsOptional() @IsString() @MaxLength(500)  accessibilityNotes?: string;

  // ── Notification preferences ───────────────────────────────────────────────
  @IsOptional() @IsBoolean()  emailAlerts?: boolean;
  @IsOptional() @IsBoolean()  smsAlerts?: boolean;
  @IsOptional() @IsBoolean()  pushNotifications?: boolean;
  @IsOptional() @IsNumber()   priceAlertThreshold?: number;  // % drop
  @IsOptional() @IsBoolean()  opportunityAlerts?: boolean;
  @IsOptional() @IsBoolean()  lastMinuteAlerts?: boolean;
  @IsOptional() @IsBoolean()  longWayRoundAlerts?: boolean;
  @IsOptional() @IsBoolean()  travelRadarAlerts?: boolean;
  @IsOptional() @IsBoolean()  localDiscoveryAlerts?: boolean;
}
