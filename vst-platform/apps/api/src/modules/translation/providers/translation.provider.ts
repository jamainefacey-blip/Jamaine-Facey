/**
 * TranslationProvider — abstract interface for all translation backends.
 *
 * PROVIDER ABSTRACTION DESIGN
 * ─────────────────────────────────────────────────────────────────────────────
 * All providers implement this contract. TranslationService selects the active
 * provider via TRANSLATION_PROVIDER env var. Adding a new backend means:
 *   1. Implement TranslationProvider
 *   2. Register in translation.module.ts
 *   3. Set env var — no service changes needed.
 *
 * PLANNED PROVIDERS
 * ─────────────────────────────────────────────────────────────────────────────
 *   stub         — returns input unchanged, development/test default
 *   google       — Google Cloud Translation API v3 (best language coverage)
 *   deepl        — DeepL API (highest quality European languages)
 *   azure        — Azure Cognitive Services Translator (fallback)
 *
 * SUPPORTED MODES (Phase roadmap)
 * ─────────────────────────────────────────────────────────────────────────────
 *   Phase 5: text translation only (all providers)
 *   Phase 6: camera / OCR (image → text → translate)
 *   Phase 6: conversation mode (bidirectional live translation)
 *
 * MEMBER TIER IMPLICATIONS
 * ─────────────────────────────────────────────────────────────────────────────
 *   GUEST         — 5 translations/day, text only, top-20 language pairs
 *   PREMIUM       — 100 translations/day, text + camera OCR
 *   VOYAGE_ELITE  — unlimited, text + camera + conversation mode
 */

export interface TranslationResult {
  translatedText:  string;
  sourceLang:      string;    // ISO 639-1 detected or specified source language
  targetLang:      string;    // ISO 639-1 target language
  provider:        string;    // which provider was used (for transparency)
  characterCount:  number;    // for quota tracking
  confidence?:     number;    // 0–1; available from Google/Azure, null from DeepL
}

export interface TranslationProvider {
  /**
   * The provider identifier — matches TRANSLATION_PROVIDER env var value.
   */
  readonly name: string;

  /**
   * Translate text into the target language.
   *
   * @param text         The text to translate (plain text only for Phase 5)
   * @param targetLang   ISO 639-1 code (e.g. 'fr', 'es', 'ja')
   * @param sourceLang   ISO 639-1 code; omit for auto-detection
   */
  translateText(
    text:        string,
    targetLang:  string,
    sourceLang?: string,
  ): Promise<TranslationResult>;

  /**
   * Returns the list of supported target language codes.
   * Used to validate requests and render the language picker.
   */
  getSupportedLanguages(): Promise<string[]>;
}
