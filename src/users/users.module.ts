import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PasswordService } from '../common/security/password.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, PasswordService],
  controllers: [UsersController],
  exports: [UsersService, PasswordService],
})
export class UsersModule {}