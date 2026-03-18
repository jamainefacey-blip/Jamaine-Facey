import {
  IsString,
  IsDateString,
  IsInt,
  IsOptional,
  IsEnum,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';

enum CabinClass { ECONOMY = 'ECONOMY', PREMIUM_ECONOMY = 'PREMIUM_ECONOMY', BUSINESS = 'BUSINESS', FIRST = 'FIRST' }

export class FlightSearchDto {
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: 'origin must be a 3-letter IATA code e.g. LHR' })
  origin: string;

  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: 'destination must be a 3-letter IATA code e.g. JFK' })
  destination: string;

  @IsDateString()
  departureDate: string;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsInt()
  @Min(1)
  @Max(9)
  adults: number = 1;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(8)
  children?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  infants?: number;

  @IsOptional()
  @IsEnum(CabinClass)
  cabinClass?: CabinClass = CabinClass.ECONOMY;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string = 'GBP';
}
