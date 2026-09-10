import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { CommonModule } from '@server/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
