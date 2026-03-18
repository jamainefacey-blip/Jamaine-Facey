// VST API — Root module
// Phase 2: import all feature modules here

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Feature modules imported in Phase 2:
// import { AuthModule }          from './modules/auth/auth.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    ScheduleModule.forRoot(),
    // Feature modules go here (Phase 2)
  ],
})
export class AppModule {}
