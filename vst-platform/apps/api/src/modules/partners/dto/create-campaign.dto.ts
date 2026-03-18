import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  MinLength,
} from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPct: number;

  @IsString()
  startDate: string;   // ISO date string

  @IsOptional()
  @IsString()
  endDate?: string;    // ISO date string; null = open-ended

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
