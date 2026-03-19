import { Module } from '@nestjs/common';
import { AvaService } from './ava.service';
import { AvaController } from './ava.controller';
import { AuthModule } from '../auth/auth.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports:     [AuthModule, MatchingModule],
  controllers: [AvaController],
  providers:   [AvaService],
  exports:     [AvaService],
})
export class AvaModule {}
