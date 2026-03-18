/**
 * AvaService — Mini Ava Assistant, Phase 5 Scaffold
 *
 * ARCHITECTURE
 * ─────────────────────────────────────────────────────────────────────────────
 * Ava is VST's dual-identity AI assistant. She operates across both modes:
 *
 *   LOCAL mode:
 *     → Local events near the user (EventsService)
 *     → Explorer pins nearby (ExplorerService)
 *     → Accessibility features at a location
 *     → Live transport context (future)
 *
 *   LONG_DISTANCE mode:
 *     → Visa requirements (VisaService)
 *     → Travel safety advisories (SafetyService)
 *     → Booking lookup (BookingService)
 *     → Passport expiry reminders (PassportService via UsersService)
 *     → Weather context (future: OpenWeatherMap integration)
 *
 *   Cross-mode (always available):
 *     → Text translation (TranslationService)
 *     → Membership queries
 *     → General travel advice
 *
 * PHASE 5 SCOPE (scaffold only)
 * ─────────────────────────────────────────────────────────────────────────────
 * - Intent classification: rule-based keyword matching (stub)
 * - Response generation: canned responses per intent class (stub)
 * - Context model: fully typed, session ID tracked but not persisted yet
 * - Suggestions: static chips based on intent (stub)
 * - NO live AI model integration yet (Claude / GPT / Vertex deferred)
 * - NO session persistence yet (Redis session store deferred to Phase 6)
 *
 * PHASE 6 EXPANSION PLAN
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Replace intent classifier with Claude claude-haiku-4-5 (fast, low cost)
 * 2. Replace canned responses with Claude claude-sonnet-4-6 with tool use:
 *      - tool: check_visa(nationality, destination)
 *      - tool: get_local_events(lat, lng, category)
 *      - tool: get_safety_advisory(destination)
 *      - tool: translate_text(text, target_language)
 *      - tool: lookup_booking(bookingRef)
 * 3. Persist session context in Redis with 30-min TTL
 * 4. Stream responses (SSE) for long-form answers
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  AvaQueryDto,
  AvaResponseDto,
  AvaIntent,
  AvaMode,
  AvaAction,
} from './dto/ava.dto';

// ── Keyword-based intent classifier (Phase 5 stub) ────────────────────────────

const INTENT_PATTERNS: Array<{ intent: AvaIntent; keywords: string[] }> = [
  { intent: 'VISA_QUERY',         keywords: ['visa', 'entry', 'require', 'passport', 'border'] },
  { intent: 'SAFETY_QUERY',       keywords: ['safe', 'danger', 'advisory', 'sos', 'emergency', 'risk'] },
  { intent: 'BOOKING_QUERY',      keywords: ['flight', 'hotel', 'book', 'reservation', 'check-in', 'checkout'] },
  { intent: 'LOCAL_EVENT_QUERY',  keywords: ['event', 'happening', 'tonight', 'weekend', 'festival', 'near'] },
  { intent: 'EXPLORER_QUERY',     keywords: ['explore', 'visit', 'see', 'pin', 'place', 'hidden gem', 'local'] },
  { intent: 'TRANSLATION_QUERY',  keywords: ['translate', 'language', 'how do you say', 'meaning', 'phrase'] },
  { intent: 'WEATHER_QUERY',      keywords: ['weather', 'rain', 'temperature', 'forecast', 'pack', 'wear'] },
  { intent: 'PASSPORT_QUERY',     keywords: ['passport', 'renew', 'expir', 'valid'] },
  { intent: 'MEMBERSHIP_QUERY',   keywords: ['premium', 'upgrade', 'tier', 'elite', 'plan', 'membership'] },
];

function classifyIntent(message: string): AvaIntent {
  const lower = message.toLowerCase();
  for (const { intent, keywords } of INTENT_PATTERNS) {
    if (keywords.some(kw => lower.includes(kw))) return intent;
  }
  return 'GENERAL';
}

// ── Canned response builder (Phase 5 stub — replaced by Claude in Phase 6) ───

function buildCannedResponse(
  intent: AvaIntent,
  mode:   AvaMode,
  ctx:    AvaQueryDto['context'],
): Pick<AvaResponseDto, 'reply' | 'suggestions' | 'disclaimer' | 'contextUpdates'> {
  const dest = ctx.destinationCode ? ` for ${ctx.destinationCode}` : '';

  switch (intent) {
    case 'VISA_QUERY':
      return {
        reply:       `I can check entry requirements${dest}. Let me pull up the visa info for your passport nationality.`,
        suggestions: [
          { label: 'Check visa requirements', type: 'DEEP_LINK', value: '/visa' },
          { label: 'View my passport',         type: 'DEEP_LINK', value: '/passport' },
        ],
        disclaimer:      'Visa information may change. Always verify with official embassy sources.',
        contextUpdates:  { mode: 'LONG_DISTANCE' },
      };

    case 'SAFETY_QUERY':
      return {
        reply:       `Safety is our priority. I can show you current travel advisories${dest} and help you set up your SOS contacts.`,
        suggestions: [
          { label: 'View safety advisories', type: 'DEEP_LINK', value: '/safety' },
          { label: 'Set up SOS contacts',    type: 'DEEP_LINK', value: '/safety/contacts' },
        ],
        disclaimer:  'In an emergency, always contact local emergency services (999 / 112) first.',
      };

    case 'BOOKING_QUERY':
      return {
        reply:       `I can help you find flights and hotels. What are your travel dates and destination?`,
        suggestions: [
          { label: 'Search flights', type: 'DEEP_LINK', value: '/search/flights' },
          { label: 'Search hotels',  type: 'DEEP_LINK', value: '/search/hotels' },
        ],
        contextUpdates: { mode: 'LONG_DISTANCE' },
      };

    case 'LOCAL_EVENT_QUERY':
      return {
        reply:       mode === 'LOCAL'
          ? `Let me find events near you right now.`
          : `I can show you events at your destination. Share your location or destination to get started.`,
        suggestions: [
          { label: 'Events near me', type: 'DEEP_LINK', value: '/events' },
          { label: 'Filter by category', type: 'QUERY', value: 'show me food & drink events near me' },
        ],
        contextUpdates: mode !== 'LOCAL' ? { mode: 'LOCAL' } : undefined,
      };

    case 'EXPLORER_QUERY':
      return {
        reply:       `I can show you pins and hidden gems near you or at your destination.`,
        suggestions: [
          { label: 'Open explorer map', type: 'DEEP_LINK', value: '/explorer' },
          { label: 'Accessibility spots', type: 'QUERY', value: 'show accessible places near me' },
        ],
      };

    case 'TRANSLATION_QUERY':
      return {
        reply:       `I can translate text for you. What would you like translated, and into which language?`,
        suggestions: [
          { label: 'Open translation',   type: 'DEEP_LINK', value: '/translate' },
          { label: 'Camera translate',   type: 'DEEP_LINK', value: '/translate/camera' },
        ],
      };

    case 'WEATHER_QUERY':
      return {
        reply:       `Weather forecasts are coming soon. For now, I recommend checking the weather for ${ctx.destinationCode ?? 'your destination'} before you travel.`,
        suggestions: [],
        // STUB: WeatherService integration deferred to Phase 6
      };

    case 'PASSPORT_QUERY':
      return {
        reply:       `I can check your passport expiry and show you renewal guidance.`,
        suggestions: [
          { label: 'View my passport', type: 'DEEP_LINK', value: '/passport' },
          { label: 'Check visa needs',  type: 'DEEP_LINK', value: '/visa' },
        ],
      };

    case 'MEMBERSHIP_QUERY':
      return {
        reply:       `You can unlock more features with Premium or Voyage Elite. Want to see what's included?`,
        suggestions: [
          { label: 'View plans',  type: 'DEEP_LINK', value: '/membership' },
          { label: 'Upgrade now', type: 'DEEP_LINK', value: '/membership/upgrade' },
        ],
      };

    default:
      return {
        reply:       `I'm Ava, your Voyage Smart Travel assistant. I can help with flights, hotels, visa requirements, safety, local events, and translation. What do you need?`,
        suggestions: [
          { label: 'Search flights',   type: 'DEEP_LINK', value: '/search/flights' },
          { label: 'Local events',     type: 'DEEP_LINK', value: '/events' },
          { label: 'Visa check',       type: 'DEEP_LINK', value: '/visa' },
          { label: 'Translate',        type: 'DEEP_LINK', value: '/translate' },
        ],
      };
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class AvaService {
  private readonly logger = new Logger(AvaService.name);

  /**
   * Process a user message and return Ava's structured response.
   *
   * Phase 5: rule-based intent + canned replies.
   * Phase 6: Claude claude-haiku-4-5 intent → Claude claude-sonnet-4-6 with tool use.
   */
  async query(userId: string, dto: AvaQueryDto): Promise<AvaResponseDto> {
    const intent = classifyIntent(dto.message);
    const mode   = dto.context.mode;

    this.logger.debug(`Ava query user=${userId} intent=${intent} mode=${mode}`);

    const { reply, suggestions, disclaimer, contextUpdates } =
      buildCannedResponse(intent, mode, dto.context);

    return {
      reply,
      intent,
      mode,
      suggestions:    suggestions ?? [],
      contextUpdates: contextUpdates ?? undefined,
      disclaimer:     disclaimer ?? undefined,
      sources:        [],   // Phase 6: populated from tool call results
    };
  }

  /**
   * Returns the set of capabilities Ava currently has in a given mode.
   * Used by the frontend to render the Ava feature panel correctly.
   */
  getCapabilities(mode: AvaMode) {
    const shared = [
      'text_translation',
      'membership_info',
      'general_travel_advice',
    ];
    const local = [
      'local_events',
      'explorer_pins',
      'accessibility_info',
    ];
    const longDistance = [
      'flight_search',
      'hotel_search',
      'visa_requirements',
      'safety_advisories',
      'passport_expiry',
      'booking_lookup',
    ];
    const stubbed = [
      'weather_forecast',       // Phase 6
      'camera_translation',     // Phase 6
      'conversation_mode',      // Phase 6
      'ai_itinerary_planning',  // Phase 7
    ];

    return {
      mode,
      active:  [...shared, ...(mode === 'LOCAL' ? local : longDistance)],
      stubbed,
      // Phase 6: replace with Claude tool-use capabilities
      aiModel: null,
    };
  }
}
