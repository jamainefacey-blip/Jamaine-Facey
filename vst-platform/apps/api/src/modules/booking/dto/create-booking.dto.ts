import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

enum BookingType { FLIGHT = 'FLIGHT', HOTEL = 'HOTEL', PACKAGE = 'PACKAGE' }

export class CreateBookingDto {
  @IsEnum(BookingType)
  type: BookingType;

  // Affiliate tracking code — required to attribute commission correctly
  @IsString()
  @MaxLength(100)
  affiliateCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalRef?: string;

  // Raw search params snapshot — stored for record-keeping and support
  @IsOptional()
  @IsObject()
  rawSearchParams?: Record<string, any>;

  // Price at click time — stored to detect bait-and-switch issues
  @IsOptional()
  @IsInt()
  @Min(0)
  totalAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;
}
