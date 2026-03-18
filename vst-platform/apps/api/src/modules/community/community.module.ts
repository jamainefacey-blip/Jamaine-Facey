import { Module } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { AuthModule } from '../auth/auth.module';
import { MembershipModule } from '../membership/membership.module';

@Module({
  imports:     [AuthModule, MembershipModule],
  controllers: [CommunityController],
  providers:   [CommunityService],
  exports:     [CommunityService],
})
export class CommunityModule {}
