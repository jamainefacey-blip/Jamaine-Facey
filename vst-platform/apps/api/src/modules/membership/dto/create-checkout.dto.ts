import { IsEnum, IsIn } from 'class-validator';

export class CreateCheckoutDto {
  @IsEnum(['PREMIUM', 'VOYAGE_ELITE'])
  tier: 'PREMIUM' | 'VOYAGE_ELITE';

  @IsIn(['monthly', 'annual'])
  interval: 'monthly' | 'annual';
}
