import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE } from '../../common/drizzle/drizzle.module';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, sql } from 'drizzle-orm';
import { postLike, post } from '@server/database/schema';

@Injectable()
export class LikesService {
  private readonly logger = new Logger(LikesService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async toggleLike(
    postId: string,
    userId: string,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const existingPosts = await this.db
      .select({ id: post.id, likeCount: post.likeCount })
      .from(post)
      .where(eq(post.id, postId))
      .limit(1);
    if (existingPosts.length === 0) {
      throw new NotFoundException('帖子不存在');
    }

    const existingLikes = await this.db
      .select()
      .from(postLike)
      .where(and(eq(postLike.postId, postId), eq(postLike.userId, userId)))
      .limit(1);

    const isLiked = existingLikes.length > 0;

    const result = await this.db.transaction(async (tx) => {
      if (isLiked) {
        await tx
          .delete(postLike)
          .where(and(eq(postLike.postId, postId), eq(postLike.userId, userId)));

        const updated = await tx
          .update(post)
          .set({ likeCount: sql<number>`${post.likeCount} - 1` })
          .where(eq(post.id, postId))
          .returning({ likeCount: post.likeCount });

        return { liked: false, likeCount: updated[0]?.likeCount ?? 0 };
      } else {
        await tx.insert(postLike).values({
          postId,
          userId,
        });

        const updated = await tx
          .update(post)
          .set({ likeCount: sql<number>`${post.likeCount} + 1` })
          .where(eq(post.id, postId))
          .returning({ likeCount: post.likeCount });

        return { liked: true, likeCount: updated[0]?.likeCount ?? 0 };
      }
    });

    this.logger.log(
      `点赞切换: 帖子 ${postId}, 用户 ${userId}, 状态: ${result.liked ? '已点赞' : '已取消'}`,
    );
    return result;
  }

  async getLikeStatus(
    postId: string,
    userId: string,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const existingPosts = await this.db
      .select({ id: post.id, likeCount: post.likeCount })
      .from(post)
      .where(eq(post.id, postId))
      .limit(1);
    if (existingPosts.length === 0) {
      throw new NotFoundException('帖子不存在');
    }

    const existingLikes = await this.db
      .select()
      .from(postLike)
      .where(and(eq(postLike.postId, postId), eq(postLike.userId, userId)))
      .limit(1);

    return {
      liked: existingLikes.length > 0,
      likeCount: existingPosts[0].likeCount ?? 0,
    };
  }
}
