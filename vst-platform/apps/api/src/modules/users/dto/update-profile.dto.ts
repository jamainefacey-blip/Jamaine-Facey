import {
  IsString,
  IsOptional,
  IsDateString,
  Length,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  // ISO 3166-1 alpha-2 — two uppercase letters
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'nationality must be ISO 3166-1 alpha-2 (e.g. GB)' })
  nationality?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
