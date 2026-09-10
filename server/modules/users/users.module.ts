import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CommonModule } from '@server/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
