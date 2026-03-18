import { Module } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { AuthModule } from '../auth/auth.module';
import { MembershipModule } from '../membership/membership.module';
import { R2Service } from '../../integrations/r2/r2.service';

@Module({
  imports:     [AuthModule, MembershipModule],
  controllers: [CommunityController],
  providers:   [CommunityService, R2Service],
  exports:     [CommunityService],
})
export class CommunityModule {}
