import { Injectable, Logger } from '@nestjs/common';
import { HotelSearchDto } from '../../modules/booking/dto/hotel-search.dto';
import { HotelResult } from '@vst/types';

/**
 * STUB — Booking.com Affiliate API integration.
 *
 * Phase 3 implementation:
 * - Use Booking.com Affiliate Partner API (searchHotels endpoint)
 * - Map response to HotelResult[] — including accessibilityFeatures[]
 * - accessibilityFeatures is a first-class field, not an afterthought.
 *   Pull from Booking.com's facilities data: wheelchair, accessible bathroom, etc.
 * - Cache results in Redis (TTL: 15 min)
 *
 * Affiliate model: VST earns commission per confirmed stay via
 * Booking.com affiliate deep link. No direct payment processing.
 */
@Injectable()
export class BookingComService {
  private readonly logger = new Logger(BookingComService.name);

  async searchHotels(dto: HotelSearchDto): Promise<HotelResult[]> {
    this.logger.debug(`[STUB] Booking.com search: ${dto.destination} ${dto.checkIn}→${dto.checkOut}`);

    return [
      {
        id:                    'stub-ht-001',
        name:                  'The Grand Example Hotel',
        destination:           dto.destination,
        starRating:            4,
        reviewScore:           8.6,
        reviewCount:           2341,
        pricePerNight:         12000,  // £120.00 in pence
        totalPrice:            12000 * this.nights(dto.checkIn, dto.checkOut),
        currency:              dto.currency ?? 'GBP',
        thumbnailUrl:          null,
        affiliateUrl:          `https://www.booking.com/hotel/gb/the-grand-example.html?aid=VST_STUB`,
        affiliateCode:         'VST_STUB',
        amenities:             ['Free WiFi', 'Parking', 'Restaurant', 'Gym'],
        accessibilityFeatures: ['Wheelchair accessible', 'Accessible bathroom', 'Lift'],
      },
      {
        id:                    'stub-ht-002',
        name:                  'Budget Stay Central',
        destination:           dto.destination,
        starRating:            3,
        reviewScore:           7.2,
        reviewCount:           891,
        pricePerNight:         5500,
        totalPrice:            5500 * this.nights(dto.checkIn, dto.checkOut),
        currency:              dto.currency ?? 'GBP',
        thumbnailUrl:          null,
        affiliateUrl:          `https://www.booking.com/hotel/gb/budget-stay.html?aid=VST_STUB`,
        affiliateCode:         'VST_STUB',
        amenities:             ['Free WiFi'],
        accessibilityFeatures: [],
      },
    ];
  }

  private nights(checkIn: string, checkOut: string): number {
    const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(1, Math.round(ms / 86_400_000));
  }
}
