import { IsString, IsObject, IsOptional } from 'class-validator';

export class PushSubscriptionDto {
  @IsString()
  endpoint: string;

  @IsOptional()
  @IsObject()
  keys?: {
    p256dh: string;
    auth: string;
  };
}
