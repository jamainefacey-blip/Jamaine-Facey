import {
  IsString,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class UpsertPassportDto {
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'nationality must be ISO 3166-1 alpha-2 (e.g. GB)' })
  nationality: string;

  @IsOptional()
  @IsString()
  // Stored as-is in Phase 2; encryption at rest added in Phase 3
  passportNumber?: string;

  @IsDateString()
  expiryDate: string;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(365)
  alertDaysBefore?: number;
}
