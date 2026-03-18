import {
  IsString,
  IsDateString,
  IsInt,
  IsOptional,
  Min,
  Max,
  MaxLength,
  Length,
} from 'class-validator';

export class HotelSearchDto {
  @IsString()
  @MaxLength(200)
  destination: string;

  @IsDateString()
  checkIn: string;

  @IsDateString()
  checkOut: string;

  @IsInt()
  @Min(1)
  @Max(10)
  rooms: number = 1;

  @IsInt()
  @Min(1)
  @Max(30)
  guests: number = 1;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string = 'GBP';
}
