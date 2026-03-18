// VST API — Root module
// Phase 2: import all feature modules here

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Phase 2 modules:
import { AuthModule }          from './modules/auth/auth.module';
import { UsersModule }          from './modules/users/users.module';
import { SafetyModule }          from './modules/safety/safety.module';
import { BookingModule }         from './modules/booking/booking.module';
// Remaining modules imported as built:
// import { UsersModule }         from './modules/users/users.module';
// import { BookingModule }       from './modules/booking/booking.module';
// import { SafetyModule }        from './modules/safety/safety.module';
// import { NotificationsModule } from './modules/notifications/notifications.module';
// import { MembershipModule }    from './modules/membership/membership.module';
// import { PaymentsModule }      from './modules/payments/payments.module';
// import { PartnersModule }      from './modules/partners/partners.module';
// import { VisaModule }          from './modules/visa/visa.module';
// import { CommunityModule }     from './modules/community/community.module';
// import { ExplorerModule }      from './modules/explorer/explorer.module';
import { PrismaModule }        from './database/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    SafetyModule,
    BookingModule,
    // Additional modules added as each phase completes
  ],
})
export class AppModule {}
