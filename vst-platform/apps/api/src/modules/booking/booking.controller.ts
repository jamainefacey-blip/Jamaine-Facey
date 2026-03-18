import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  UseGuards,
  Optional,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { FlightSearchDto } from './dto/flight-search.dto';
import { HotelSearchDto } from './dto/hotel-search.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

// ── Search (no auth required — publicly searchable) ───────────────────────────

@Controller('search')
export class SearchController {
  constructor(private readonly bookingService: BookingService) {}

  // GET /v1/search/flights?origin=LHR&destination=JFK&departureDate=2025-06-01&adults=1
  @Get('flights')
  searchFlights(@Query() dto: FlightSearchDto) {
    return this.bookingService.searchFlights(dto);
  }

  // GET /v1/search/hotels?destination=Paris&checkIn=2025-06-01&checkOut=2025-06-07&guests=2
  @Get('hotels')
  searchHotels(@Query() dto: HotelSearchDto) {
    return this.bookingService.searchHotels(dto);
  }
}

// ── Bookings (auth required) ───────────────────────────────────────────────────

@Controller('bookings')
@UseGuards(ClerkAuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // POST /v1/bookings — record affiliate booking completion
  @Post()
  @HttpCode(201)
  createBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingService.createBooking(user.id, dto);
  }

  // GET /v1/bookings
  @Get()
  getBookings(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingService.getBookings(user.id);
  }

  // GET /v1/bookings/:id
  @Get(':id')
  getBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bookingService.getBooking(user.id, id);
  }
}

// ── Price Alerts (auth required) ──────────────────────────────────────────────

@Controller('price-alerts')
@UseGuards(ClerkAuthGuard)
export class PriceAlertController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @HttpCode(201)
  createPriceAlert(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: {
      type: 'FLIGHT' | 'HOTEL' | 'PACKAGE';
      origin?: string;
      destination: string;
      targetPrice?: number;
      thresholdPct?: number;
    },
  ) {
    return this.bookingService.createPriceAlert(user.id, body);
  }

  @Get()
  getPriceAlerts(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingService.getPriceAlerts(user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  deletePriceAlert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bookingService.deletePriceAlert(user.id, id);
  }
}
