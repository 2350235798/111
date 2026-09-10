import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE } from '../../common/drizzle/drizzle.module';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, asc, count, sql } from 'drizzle-orm';
import { comment, post, appUser } from '@server/database/schema';
import type {
  CommentItem,
  CommentListResponse,
  CreateCommentRequest,
  UserProfile,
} from '@shared/api.interface';
import { ModerationService } from '../../common/services/moderation.service';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly moderationService: ModerationService,
  ) {}

  async createComment(
    postId: string,
    dto: CreateCommentRequest,
    userId: string,
  ): Promise<CommentItem> {
    const trimmedContent = dto.content.trim();

    const existingPosts = await this.db
      .select()
      .from(post)
      .where(and(eq(post.id, postId), eq(post.isVisible, true)))
      .limit(1);
    if (existingPosts.length === 0) {
      throw new NotFoundException('帖子不存在或已被删除');
    }

    await this.moderationService.validateContent(trimmedContent);

    const created = await this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(comment)
        .values({
          postId,
          authorId: userId,
          content: trimmedContent,
        })
        .returning();

      await tx
        .update(post)
        .set({ commentCount: sql<number>`${post.commentCount} + 1` })
        .where(eq(post.id, postId));

      return inserted[0];
    });

    this.logger.log(`评论创建成功: ${created.id}, 帖子: ${postId}`);
    return this.getCommentWithAuthor(created.id);
  }

  async getCommentsByPost(postId: string): Promise<CommentListResponse> {
    const existingPosts = await this.db
      .select({ id: post.id })
      .from(post)
      .where(and(eq(post.id, postId), eq(post.isVisible, true)))
      .limit(1);
    if (existingPosts.length === 0) {
      throw new NotFoundException('帖子不存在或已被删除');
    }

    const commentsWithAuthors = await this.db
      .select({
        comment: comment,
        user: appUser,
      })
      .from(comment)
      .leftJoin(appUser, eq(comment.authorId, appUser.id))
      .where(eq(comment.postId, postId))
      .orderBy(asc(comment.createdAt));

    const countResult = await this.db
      .select({ count: count() })
      .from(comment)
      .where(eq(comment.postId, postId));

    const items: CommentItem[] = commentsWithAuthors.map((row) =>
      this.buildCommentItem(row.comment, row.user),
    );

    const total = Number(countResult[0]?.count ?? 0);

    return { items, total };
  }

  async deleteComment(
    commentId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<{ success: boolean }> {
    const existing = await this.db
      .select()
      .from(comment)
      .where(eq(comment.id, commentId))
      .limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('评论不存在');
    }

    const target = existing[0];
    if (target.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('无权删除此评论');
    }

    await this.db.transaction(async (tx) => {
      await tx.delete(comment).where(eq(comment.id, commentId));

      await tx
        .update(post)
        .set({ commentCount: sql<number>`${post.commentCount} - 1` })
        .where(eq(post.id, target.postId));
    });

    this.logger.log(`评论删除成功: ${commentId}`);
    return { success: true };
  }

  private async getCommentWithAuthor(commentId: string): Promise<CommentItem> {
    const rows = await this.db
      .select({
        comment: comment,
        user: appUser,
      })
      .from(comment)
      .leftJoin(appUser, eq(comment.authorId, appUser.id))
      .where(eq(comment.id, commentId))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('评论不存在');
    }

    return this.buildCommentItem(rows[0].comment, rows[0].user);
  }

  private buildCommentItem(
    commentRow: typeof comment.$inferSelect,
    userRow: typeof appUser.$inferSelect | null | undefined,
  ): CommentItem {
    const author: UserProfile = userRow
      ? {
          id: userRow.id,
          phone: userRow.phone,
          nickname: userRow.nickname,
          avatarUrl: userRow.avatarUrl ?? null,
          bio: userRow.bio ?? '',
          isAdmin: userRow.isAdmin ?? false,
          isBanned: userRow.isBanned ?? false,
          nicknameUpdatedAt: userRow.nicknameUpdatedAt
            ? userRow.nicknameUpdatedAt.toISOString()
            : null,
          createdAt: userRow.createdAt.toISOString(),
        }
      : {
          id: commentRow.authorId,
          phone: '',
          nickname: '已注销用户',
          avatarUrl: null,
          bio: '',
          isAdmin: false,
          isBanned: false,
          nicknameUpdatedAt: null,
          createdAt: '',
        };

    return {
      id: commentRow.id,
      postId: commentRow.postId,
      authorId: commentRow.authorId,
      author,
      content: commentRow.content,
      likeCount: commentRow.likeCount ?? 0,
      createdAt: commentRow.createdAt.toISOString(),
    };
  }
}
