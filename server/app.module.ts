import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// eslint-disable-next-line import/no-extraneous-dependencies
import { LoggerModule } from '@lark-apaas/nestjs-logger';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { DrizzleModule } from './common/drizzle/drizzle.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';
import { LikesModule } from './modules/likes/likes.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    DrizzleModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    LikesModule,
    UsersModule,
    AdminModule,
    UploadModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
