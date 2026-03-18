import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsUrl,
  MinLength,
} from 'class-validator';
import { PartnerType } from '@prisma/client';

export class CreatePartnerDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(PartnerType)
  type: PartnerType;

  @IsEmail()
  contactEmail: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;
}
