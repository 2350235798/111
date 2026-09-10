import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE } from '../../common/drizzle/drizzle.module';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  appUser,
  post,
  comment,
  postLike,
} from '@server/database/schema';
import {
  eq,
  desc,
  count,
  gte,
  ilike,
  or,
  and,
} from 'drizzle-orm';
import type {
  AdminStats,
  AdminUserListResponse,
  PostListResponse,
  UserProfile,
  PostItem,
} from '@shared/api.interface';

function toUserProfile(row: typeof appUser.$inferSelect): UserProfile {
  return {
    id: row.id,
    phone: row.phone,
    nickname: row.nickname,
    avatarUrl: row.avatarUrl ?? null,
    bio: row.bio ?? '',
    isAdmin: row.isAdmin ?? false,
    isBanned: row.isBanned ?? false,
    nicknameUpdatedAt: row.nicknameUpdatedAt
      ? row.nicknameUpdatedAt.toISOString()
      : null,
    createdAt: row.createdAt.toISOString(),
  };
}

function toPostItem(
  postRow: typeof post.$inferSelect,
  authorRow: typeof appUser.$inferSelect,
): PostItem {
  return {
    id: postRow.id,
    authorId: postRow.authorId,
    author: toUserProfile(authorRow),
    content: postRow.content,
    imageUrls: postRow.imageUrls ?? [],
    likeCount: postRow.likeCount ?? 0,
    commentCount: postRow.commentCount ?? 0,
    shareCount: postRow.shareCount ?? 0,
    isVisible: postRow.isVisible ?? true,
    isLiked: false,
    createdAt: postRow.createdAt.toISOString(),
    updatedAt: postRow.updatedAt.toISOString(),
  };
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getStats(): Promise<AdminStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsersResult,
      totalPostsResult,
      totalCommentsResult,
      totalLikesResult,
      todayPostsResult,
      todayUsersResult,
      bannedUsersResult,
    ] = await Promise.all([
      this.db.select({ count: count() }).from(appUser),
      this.db.select({ count: count() }).from(post),
      this.db.select({ count: count() }).from(comment),
      this.db.select({ count: count() }).from(postLike),
      this.db
        .select({ count: count() })
        .from(post)
        .where(gte(post.createdAt, today)),
      this.db
        .select({ count: count() })
        .from(appUser)
        .where(gte(appUser.createdAt, today)),
      this.db
        .select({ count: count() })
        .from(appUser)
        .where(eq(appUser.isBanned, true)),
    ]);

    return {
      totalUsers: Number(totalUsersResult[0]?.count ?? 0),
      totalPosts: Number(totalPostsResult[0]?.count ?? 0),
      totalComments: Number(totalCommentsResult[0]?.count ?? 0),
      totalLikes: Number(totalLikesResult[0]?.count ?? 0),
      todayPosts: Number(todayPostsResult[0]?.count ?? 0),
      todayUsers: Number(todayUsersResult[0]?.count ?? 0),
      bannedUsers: Number(bannedUsersResult[0]?.count ?? 0),
    };
  }

  async getUserList(
    page: number,
    pageSize: number,
    keyword?: string,
  ): Promise<AdminUserListResponse> {
    const offset = (page - 1) * pageSize;

    const whereCondition = keyword
      ? or(
          ilike(appUser.nickname, `%${keyword}%`),
          ilike(appUser.phone, `%${keyword}%`),
        )
      : undefined;

    const baseQuery = this.db.select().from(appUser);
    const filteredQuery = whereCondition
      ? baseQuery.where(whereCondition)
      : baseQuery;

    const countQuery = this.db
      .select({ count: count() })
      .from(appUser);
    const filteredCountQuery = whereCondition
      ? countQuery.where(whereCondition)
      : countQuery;

    const [rows, countResult] = await Promise.all([
      filteredQuery
        .orderBy(desc(appUser.createdAt))
        .limit(pageSize)
        .offset(offset),
      filteredCountQuery,
    ]);

    const items: UserProfile[] = rows.map((row: typeof appUser.$inferSelect) =>
      toUserProfile(row),
    );

    return {
      items,
      total: Number(countResult[0]?.count ?? 0),
      page,
      pageSize,
    };
  }

  async setUserBan(
    userId: string,
    banned: boolean,
    currentUserId: string,
  ): Promise<{ user: UserProfile }> {
    if (userId === currentUserId) {
      throw new BadRequestException('不能操作自己的账号');
    }

    const existing = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.id, userId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('用户不存在');
    }

    if (existing[0].isAdmin) {
      throw new ForbiddenException('不能操作管理员账号');
    }

    const updated = await this.db
      .update(appUser)
      .set({ isBanned: banned })
      .where(eq(appUser.id, userId))
      .returning();

    this.logger.log(
      `管理员 ${currentUserId} ${banned ? '封禁' : '解封'} 用户 ${userId}`,
    );

    return { user: toUserProfile(updated[0]) };
  }

  async getPostList(
    page: number,
    pageSize: number,
  ): Promise<PostListResponse> {
    const offset = (page - 1) * pageSize;

    const [rows, totalResult] = await Promise.all([
      this.db
        .select({ post, author: appUser })
        .from(post)
        .innerJoin(appUser, eq(post.authorId, appUser.id))
        .orderBy(desc(post.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(post),
    ]);

    const items: PostItem[] = rows.map(
      (row: { post: typeof post.$inferSelect; author: typeof appUser.$inferSelect }) =>
        toPostItem(row.post, row.author),
    );

    return {
      items,
      total: Number(totalResult[0]?.count ?? 0),
      page,
      pageSize,
    };
  }

  async deletePost(postId: string): Promise<{ success: boolean }> {
    const deleted = await this.db
      .delete(post)
      .where(eq(post.id, postId))
      .returning({ id: post.id });

    if (deleted.length === 0) {
      throw new NotFoundException('帖子不存在');
    }

    this.logger.log(`管理员删除帖子 ${postId}`);

    return { success: true };
  }

  async setPostVisibility(
    postId: string,
    visible: boolean,
  ): Promise<{ post: PostItem }> {
    const updated = await this.db
      .update(post)
      .set({ isVisible: visible })
      .where(eq(post.id, postId))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('帖子不存在');
    }

    const authorRow = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.id, updated[0].authorId))
      .limit(1);

    this.logger.log(
      `管理员将帖子 ${postId} 设置为 ${visible ? '可见' : '隐藏'}`,
    );

    return {
      post: toPostItem(updated[0], authorRow[0]),
    };
  }
}
