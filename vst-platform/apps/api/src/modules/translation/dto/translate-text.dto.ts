import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Length,
} from 'class-validator';

export class TranslateTextDto {
  /**
   * The text to translate. Plain text only in Phase 5.
   * Max 5000 characters to cap provider costs.
   */
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  text: string;

  /**
   * ISO 639-1 target language code (e.g. 'fr', 'ja', 'ar').
   */
  @IsString()
  @Length(2, 5)   // e.g. 'fr', 'zh-TW'
  targetLang: string;

  /**
   * ISO 639-1 source language code.
   * Omit for automatic detection (recommended).
   */
  @IsOptional()
  @IsString()
  @Length(2, 5)
  sourceLang?: string;
}
