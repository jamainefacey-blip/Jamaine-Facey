import { IsOptional, IsNumber, IsString, Min, Max, MaxLength } from 'class-validator';

export class TriggerSosDto {
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
  message?: string;
}
