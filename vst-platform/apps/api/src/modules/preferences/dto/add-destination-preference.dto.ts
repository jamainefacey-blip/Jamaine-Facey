import {
  IsString,
  IsEnum,
  IsOptional,
  Length,
  MaxLength,
} from 'class-validator';
import { DestinationPrefType } from '@prisma/client';

export class AddDestinationPreferenceDto {
  /**
   * ISO 3166-1 alpha-2 country code (e.g. 'JP', 'IT')
   * or IATA city code (e.g. 'NYC', 'LON') for city-level preferences.
   */
  @IsString()
  @Length(2, 5)
  destinationCode: string;

  /**
   * PREFERRED — actively wants to visit
   * DREAM     — bucket-list / someday
   * EXCLUDED  — do not show (bad experience, political concerns, etc.)
   */
  @IsEnum(DestinationPrefType)
  type: DestinationPrefType;

  /**
   * Optional user-written memo.
   * e.g. "Honeymoon goal", "Avoid — visited during unrest"
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
