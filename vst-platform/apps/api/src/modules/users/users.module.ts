import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { PassportCryptoService } from '../../common/crypto/passport-crypto.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService, PassportCryptoService],
  exports: [UsersService],
})
export class UsersModule {}
