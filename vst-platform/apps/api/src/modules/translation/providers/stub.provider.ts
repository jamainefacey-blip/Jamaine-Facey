/**
 * StubTranslationProvider — development and test default.
 *
 * Returns the input text unchanged with a [STUB:{targetLang}] prefix.
 * Useful for testing the full request/response pipeline without a live API key.
 *
 * Replace by setting TRANSLATION_PROVIDER=google (or deepl / azure) in env.
 */

import { Injectable } from '@nestjs/common';
import { TranslationProvider, TranslationResult } from './translation.provider';

// Top-20 most common languages in travel — stub supports all
const STUB_SUPPORTED_LANGUAGES = [
  'en', 'fr', 'es', 'de', 'it', 'pt', 'nl', 'pl', 'ru',
  'zh', 'ja', 'ko', 'ar', 'hi', 'tr', 'sv', 'da', 'no', 'fi', 'el',
];

@Injectable()
export class StubTranslationProvider implements TranslationProvider {
  readonly name = 'stub';

  async translateText(
    text:        string,
    targetLang:  string,
    sourceLang?: string,
  ): Promise<TranslationResult> {
    // Stub: prefix text to make it obvious this is not a real translation
    return {
      translatedText: `[STUB:${targetLang}] ${text}`,
      sourceLang:     sourceLang ?? 'en',
      targetLang,
      provider:       this.name,
      characterCount: text.length,
      confidence:     null,
    };
  }

  async getSupportedLanguages(): Promise<string[]> {
    return STUB_SUPPORTED_LANGUAGES;
  }
}
