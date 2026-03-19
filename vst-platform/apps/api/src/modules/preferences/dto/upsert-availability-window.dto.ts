import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { AvailabilityType } from '@prisma/client';

/**
 * UpsertAvailabilityWindowDto
 *
 * Used for both POST (create) and PATCH (update).
 * All fields except startDate + endDate are optional on updates.
 *
 * DATE RANGE SEMANTICS
 * ─────────────────────────────────────────────────────────────────────────────
 * startDate = earliest departure date
 * endDate   = latest return date
 * The effective window for a trip of N days is:
 *   departure ≥ startDate - flexDaysBefore
 *   return    ≤ endDate   + flexDaysAfter
 *
 * TRIP LENGTH WITHIN WINDOW
 * ─────────────────────────────────────────────────────────────────────────────
 * minTripDays / maxTripDays on a window override the global UserPreferences
 * values for this specific window. Useful for: "I have 3 weeks summer but
 * only want to do 7–10 days at a time."
 */
export class UpsertAvailabilityWindowDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;       // human name: "Easter 2026", "Long weekend Oct"

  @IsDateString()
  startDate: string;    // ISO 8601 date string (YYYY-MM-DD)

  @IsDateString()
  endDate: string;      // ISO 8601 date string (YYYY-MM-DD)

  @IsOptional() @IsBoolean()
  isFlexible?: boolean;

  @IsOptional() @IsInt() @Min(0) @Max(30)
  flexDaysBefore?: number;

  @IsOptional() @IsInt() @Min(0) @Max(30)
  flexDaysAfter?: number;

  @IsOptional() @IsInt() @Min(1) @Max(365)
  minTripDays?: number;

  @IsOptional() @IsInt() @Min(1) @Max(365)
  maxTripDays?: number;

  @IsOptional() @IsEnum(AvailabilityType)
  windowType?: AvailabilityType;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
