import { Module } from '@nestjs/common';
import { ExplorerService } from './explorer.service';
import { ExplorerController } from './explorer.controller';
import { AuthModule } from '../auth/auth.module';
import { MembershipModule } from '../membership/membership.module';
import { R2Service } from '../../integrations/r2/r2.service';

@Module({
  imports:     [AuthModule, MembershipModule],
  controllers: [ExplorerController],
  providers:   [ExplorerService, R2Service],
  exports:     [ExplorerService],
})
export class ExplorerModule {}
