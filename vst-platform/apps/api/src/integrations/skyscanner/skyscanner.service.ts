import { Injectable, Logger } from '@nestjs/common';
import { FlightSearchDto } from '../../modules/booking/dto/flight-search.dto';
import { FlightResult } from '@vst/types';

/**
 * STUB — Skyscanner RapidAPI integration.
 *
 * Phase 3 implementation:
 * - POST /flights/search to create search session
 * - Poll GET /flights/search/{sessionKey} until status = RESULT_STATUS_COMPLETE
 * - Map response to FlightResult[]
 * - Append VST affiliate tracking code to each deeplink
 * - Cache results in Redis (TTL: 10 min) to avoid redundant API calls
 *
 * Affiliate model: VST earns commission per completed booking via
 * Skyscanner affiliate deeplink. No direct payment processing required.
 */
@Injectable()
export class SkyscannerService {
  private readonly logger = new Logger(SkyscannerService.name);

  async searchFlights(dto: FlightSearchDto): Promise<FlightResult[]> {
    this.logger.debug(`[STUB] Skyscanner search: ${dto.origin}→${dto.destination} ${dto.departureDate}`);

    // Return deterministic mock data — replaced in Phase 3 with real API calls
    return [
      {
        id:                'stub-fl-001',
        price:             18900,  // £189.00 in pence
        currency:          dto.currency ?? 'GBP',
        carrier:           'British Airways',
        carrierLogoUrl:    'https://logos.skyscnr.com/images/airlines/favicon/BA.png',
        origin:            dto.origin,
        destination:       dto.destination,
        departureAt:       `${dto.departureDate}T08:00:00Z`,
        arrivalAt:         `${dto.departureDate}T16:00:00Z`,
        durationMinutes:   480,
        stops:             0,
        affiliateUrl:      `https://www.skyscanner.net/transport/flights/${dto.origin.toLowerCase()}/${dto.destination.toLowerCase()}/?VST_AFF=vst_stub`,
        affiliateCode:     'vst_stub',
      },
      {
        id:                'stub-fl-002',
        price:             12400,
        currency:          dto.currency ?? 'GBP',
        carrier:           'easyJet',
        origin:            dto.origin,
        destination:       dto.destination,
        departureAt:       `${dto.departureDate}T14:30:00Z`,
        arrivalAt:         `${dto.departureDate}T23:15:00Z`,
        durationMinutes:   525,
        stops:             1,
        affiliateUrl:      `https://www.skyscanner.net/transport/flights/${dto.origin.toLowerCase()}/${dto.destination.toLowerCase()}/?VST_AFF=vst_stub`,
        affiliateCode:     'vst_stub',
      },
    ];
  }
}
