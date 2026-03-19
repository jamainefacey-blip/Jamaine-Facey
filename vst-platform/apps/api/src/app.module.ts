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

// Phase 4
import { VisaModule }          from './modules/visa/visa.module';
import { CommunityModule }     from './modules/community/community.module';
import { ExplorerModule }      from './modules/explorer/explorer.module';
import { EventsModule }        from './modules/events/events.module';

// Phase 5
import { PartnersModule }      from './modules/partners/partners.module';
import { AvaModule }           from './modules/ava/ava.module';
import { TranslationModule }   from './modules/translation/translation.module';
import { PreferencesModule }   from './modules/preferences/preferences.module';
import { MatchingModule }      from './modules/matching/matching.module';

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
    // Phase 4
    VisaModule,
    CommunityModule,
    ExplorerModule,
    EventsModule,
    // Phase 5
    PartnersModule,
    AvaModule,
    TranslationModule,
    PreferencesModule,
    MatchingModule,
  ],
})
export class AppModule {}
