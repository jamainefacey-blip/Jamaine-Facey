// VST API — Root module

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Phase 2
import { PrismaModule }        from './database/prisma.module';
import { AuthModule }          from './modules/auth/auth.module';
import { UsersModule }         from './modules/users/users.module';
import { SafetyModule }        from './modules/safety/safety.module';
import { BookingModule }       from './modules/booking/booking.module';

// Phase 3
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MembershipModule }    from './modules/membership/membership.module';
import { PaymentsModule }      from './modules/payments/payments.module';

// Phase 4 — deferred
// import { VisaModule }          from './modules/visa/visa.module';
// import { CommunityModule }     from './modules/community/community.module';
// import { ExplorerModule }      from './modules/explorer/explorer.module';
// import { PartnersModule }      from './modules/partners/partners.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    // Phase 2
    AuthModule,
    UsersModule,
    SafetyModule,
    BookingModule,
    // Phase 3
    NotificationsModule,
    MembershipModule,
    PaymentsModule,
  ],
})
export class AppModule {}
