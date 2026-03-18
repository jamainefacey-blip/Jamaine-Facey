import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  Length,
  Matches,
} from 'class-validator';

export class CreateSafetyContactDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @Length(1, 50)
  relationship: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  // E.164 format required for Twilio SMS delivery
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'phone must be in E.164 format e.g. +447700900000' })
  phone: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnSos?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnCheckin?: boolean;
}
