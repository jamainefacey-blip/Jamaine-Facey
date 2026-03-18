import {
  IsOptional,
  IsBoolean,
  IsNumber,
  IsString,
  IsEnum,
  IsArray,
  Min,
  Max,
  Length,
} from 'class-validator';

enum CabinClass    { ECONOMY = 'ECONOMY', PREMIUM_ECONOMY = 'PREMIUM_ECONOMY', BUSINESS = 'BUSINESS', FIRST = 'FIRST' }
enum BudgetRange   { BUDGET = 'BUDGET', MODERATE = 'MODERATE', PREMIUM = 'PREMIUM', LUXURY = 'LUXURY' }
enum TravelStyle   { ADVENTURE = 'ADVENTURE', LUXURY = 'LUXURY', CULTURAL = 'CULTURAL', BEACH = 'BEACH', FAMILY = 'FAMILY', SOLO = 'SOLO', BUSINESS = 'BUSINESS', BACKPACKER = 'BACKPACKER' }

export class UpdatePreferencesDto {
  @IsOptional()
  @IsEnum(CabinClass)
  preferredCabinClass?: CabinClass;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  preferredCurrency?: string;

  @IsOptional()
  @IsString()
  @Length(2, 10)
  preferredLanguage?: string;

  @IsOptional()
  @IsEnum(BudgetRange)
  budgetRange?: BudgetRange;

  @IsOptional()
  @IsArray()
  @IsEnum(TravelStyle, { each: true })
  travelStyle?: TravelStyle[];

  // Accessibility
  @IsOptional()
  @IsBoolean()
  requiresWheelchair?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresAssistance?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryRequirements?: string[];

  @IsOptional()
  @IsString()
  accessibilityNotes?: string;

  // Notification preferences
  @IsOptional()
  @IsBoolean()
  emailAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  smsAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  priceAlertThreshold?: number;
}
