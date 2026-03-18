import { IsOptional, IsNumber, IsString, IsDateString, Min, Max, MaxLength } from 'class-validator';

export class CreateCheckInDto {
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  // When this check-in was scheduled for — used by escalation logic
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
