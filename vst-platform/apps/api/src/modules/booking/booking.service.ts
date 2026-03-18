import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SkyscannerService } from '../../integrations/skyscanner/skyscanner.service';
import { BookingComService } from '../../integrations/booking-com/booking-com.service';
import { FlightSearchDto } from './dto/flight-search.dto';
import { HotelSearchDto } from './dto/hotel-search.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skyscanner: SkyscannerService,
    private readonly bookingCom: BookingComService,
  ) {}

  // ── Search (proxy to affiliate APIs) ─────────────────────────────────────

  async searchFlights(dto: FlightSearchDto) {
    // Phase 3: add Redis cache layer before calling Skyscanner
    return this.skyscanner.searchFlights(dto);
  }

  async searchHotels(dto: HotelSearchDto) {
    // Phase 3: add Redis cache layer before calling Booking.com
    return this.bookingCom.searchHotels(dto);
  }

  // ── Booking record (user clicked affiliate link and completed booking) ────

  /**
   * Record a completed booking.
   *
   * VST does NOT process payment — bookings are completed on the partner site
   * via affiliate deeplink. This endpoint records the booking event for:
   * - User booking history
   * - Affiliate commission attribution
   * - Support / dispute reference
   */
  async createBooking(userId: string, dto: CreateBookingDto) {
    return this.prisma.booking.create({
      data: {
        userId,
        type:            dto.type,
        status:          'CONFIRMED',  // affiliate booking = already confirmed on partner site
        affiliateCode:   dto.affiliateCode,
        externalRef:     dto.externalRef ?? null,
        rawSearchParams: dto.rawSearchParams ?? {},
        totalAmount:     dto.totalAmount ?? null,
        currency:        dto.currency ?? 'GBP',
      },
    });
  }

  async getBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: { flightBooking: true, hotelBooking: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { flightBooking: true, hotelBooking: true },
    });
    if (!booking || booking.userId !== userId) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  // ── Price Alerts ──────────────────────────────────────────────────────────

  async createPriceAlert(userId: string, data: {
    type: 'FLIGHT' | 'HOTEL' | 'PACKAGE';
    origin?: string;
    destination: string;
    targetPrice?: number;
    thresholdPct?: number;
  }) {
    return this.prisma.priceAlert.create({
      data: {
        userId,
        type:         data.type,
        origin:       data.origin ?? null,
        destination:  data.destination,
        targetPrice:  data.targetPrice ?? null,
        thresholdPct: data.thresholdPct ?? null,
        isActive:     true,
      },
    });
  }

  async getPriceAlerts(userId: string) {
    return this.prisma.priceAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deletePriceAlert(userId: string, alertId: string) {
    const alert = await this.prisma.priceAlert.findUnique({ where: { id: alertId } });
    if (!alert || alert.userId !== userId) throw new NotFoundException('Price alert not found');
    await this.prisma.priceAlert.delete({ where: { id: alertId } });
  }
}
