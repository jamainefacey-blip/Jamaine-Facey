import { Module } from '@nestjs/common';
import { ExplorerService } from './explorer.service';
import { ExplorerController } from './explorer.controller';
import { AuthModule } from '../auth/auth.module';
import { MembershipModule } from '../membership/membership.module';

@Module({
  imports:     [AuthModule, MembershipModule],
  controllers: [ExplorerController],
  providers:   [ExplorerService],
  exports:     [ExplorerService],
})
export class ExplorerModule {}
