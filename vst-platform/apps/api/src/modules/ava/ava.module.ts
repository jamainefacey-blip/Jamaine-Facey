import { Module } from '@nestjs/common';
import { AvaService } from './ava.service';
import { AvaController } from './ava.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:     [AuthModule],
  controllers: [AvaController],
  providers:   [AvaService],
  exports:     [AvaService],
})
export class AvaModule {}
