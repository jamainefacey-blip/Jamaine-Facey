import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController, SearchController, PriceAlertController } from './booking.controller';
import { SkyscannerService } from '../../integrations/skyscanner/skyscanner.service';
import { BookingComService } from '../../integrations/booking-com/booking-com.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SearchController, BookingController, PriceAlertController],
  providers: [BookingService, SkyscannerService, BookingComService],
  exports: [BookingService],
})
export class BookingModule {}
