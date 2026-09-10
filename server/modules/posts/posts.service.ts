import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { eq, and, desc, count, inArray } from 'drizzle-orm';
import { DRIZZLE_DATABASE } from '../../common/drizzle/drizzle.module';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { post, appUser, postLike } from '../../database/schema';
import type {
  PostItem,
  UserProfile,
  PostListResponse,
  CreatePostRequest,
} from '@shared/api.interface';
import { ModerationService } from '../../common/services/moderation.service';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../common/guards/jwt-auth.guard';

interface JwtPayload {
  userId: string;
  phone: string;
  isAdmin: boolean;
}

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly moderationService: ModerationService,
  ) {}

  private extractOptionalUser(authorization?: string): JwtPayload | null {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null;
    }
    const token = authorization.split(' ')[1];
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return null;
    }
  }

  private mapUserProfile(row: typeof appUser.$inferSelect): UserProfile {
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

  private async buildPostItems(
    postsWithAuthor: Array<{
      post: typeof post.$inferSelect;
      author: typeof appUser.$inferSelect;
    }>,
    userId: string | null,
  ): Promise<PostItem[]> {
    if (postsWithAuthor.length === 0) return [];

    const postIds = postsWithAuthor.map((p) => p.post.id);

    let likedPostIds: Set<string> = new Set();
    if (userId) {
      const likes = await this.db
        .select({ postId: postLike.postId })
        .from(postLike)
        .where(
          and(inArray(postLike.postId, postIds), eq(postLike.userId, userId)),
        );
      likedPostIds = new Set(likes.map((l) => l.postId));
    }

    return postsWithAuthor.map(({ post: p, author }) => ({
      id: p.id,
      authorId: p.authorId,
      author: this.mapUserProfile(author),
      content: p.content,
      imageUrls: p.imageUrls ?? [],
      likeCount: p.likeCount ?? 0,
      commentCount: p.commentCount ?? 0,
      shareCount: p.shareCount ?? 0,
      isVisible: p.isVisible ?? true,
      isLiked: likedPostIds.has(p.id),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  async create(
    dto: CreatePostRequest,
    userId: string,
  ): Promise<{ post: PostItem }> {
    if (!dto.content || dto.content.trim().length === 0) {
      throw new BadRequestException('内容不能为空');
    }
    if (dto.content.length > 500) {
      throw new BadRequestException('内容最多 500 字');
    }
    if (dto.imageUrls && dto.imageUrls.length > 9) {
      throw new BadRequestException('最多上传 9 张图片');
    }

    await this.moderationService.validateContent(dto.content);

    const [newPost] = await this.db
      .insert(post)
      .values({
        authorId: userId,
        content: dto.content,
        imageUrls: dto.imageUrls ?? [],
      })
      .returning();

    const [authorRow] = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.id, userId));

    const postItem: PostItem = {
      id: newPost.id,
      authorId: newPost.authorId,
      author: this.mapUserProfile(authorRow),
      content: newPost.content,
      imageUrls: newPost.imageUrls ?? [],
      likeCount: newPost.likeCount ?? 0,
      commentCount: newPost.commentCount ?? 0,
      shareCount: newPost.shareCount ?? 0,
      isVisible: newPost.isVisible ?? true,
      isLiked: false,
      createdAt: newPost.createdAt.toISOString(),
      updatedAt: newPost.updatedAt.toISOString(),
    };

    this.logger.log(`用户 ${userId} 发布帖子 ${newPost.id}`);
    return { post: postItem };
  }

  async getList(
    page: number,
    pageSize: number,
    authorization?: string,
  ): Promise<PostListResponse> {
    const user = this.extractOptionalUser(authorization);
    const offset = (page - 1) * pageSize;

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(post)
      .where(eq(post.isVisible, true));
    const total = Number(totalResult.count);

    const postRows = await this.db
      .select({
        post: post,
        author: appUser,
      })
      .from(post)
      .leftJoin(appUser, eq(post.authorId, appUser.id))
      .where(eq(post.isVisible, true))
      .orderBy(desc(post.createdAt))
      .limit(pageSize)
      .offset(offset);

    const validRows = postRows.filter(
      (row): row is { post: typeof post.$inferSelect; author: typeof appUser.$inferSelect } =>
        row.author !== null,
    );

    const items = await this.buildPostItems(validRows, user?.userId ?? null);

    return { items, total, page, pageSize };
  }

  async getDetail(
    id: string,
    authorization?: string,
  ): Promise<{ post: PostItem }> {
    const user = this.extractOptionalUser(authorization);

    const result = await this.db
      .select({
        post: post,
        author: appUser,
      })
      .from(post)
      .leftJoin(appUser, eq(post.authorId, appUser.id))
      .where(eq(post.id, id))
      .limit(1);

    if (result.length === 0 || !result[0].author) {
      throw new NotFoundException('帖子不存在');
    }

    const { post: p, author } = result[0] as {
      post: typeof post.$inferSelect;
      author: typeof appUser.$inferSelect;
    };

    let isLiked = false;
    if (user) {
      const [likeRow] = await this.db
        .select()
        .from(postLike)
        .where(
          and(eq(postLike.postId, id), eq(postLike.userId, user.userId)),
        )
        .limit(1);
      isLiked = !!likeRow;
    }

    const postItem: PostItem = {
      id: p.id,
      authorId: p.authorId,
      author: this.mapUserProfile(author),
      content: p.content,
      imageUrls: p.imageUrls ?? [],
      likeCount: p.likeCount ?? 0,
      commentCount: p.commentCount ?? 0,
      shareCount: p.shareCount ?? 0,
      isVisible: p.isVisible ?? true,
      isLiked,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };

    return { post: postItem };
  }

  async delete(id: string, user: JwtPayload): Promise<{ success: boolean }> {
    const [target] = await this.db
      .select()
      .from(post)
      .where(eq(post.id, id))
      .limit(1);

    if (!target) {
      throw new NotFoundException('帖子不存在');
    }

    if (target.authorId !== user.userId && !user.isAdmin) {
      throw new ForbiddenException('无权删除此帖子');
    }

    await this.db.delete(post).where(eq(post.id, id));

    this.logger.log(
      `用户 ${user.userId}${user.isAdmin ? '(管理员)' : ''} 删除帖子 ${id}`,
    );
    return { success: true };
  }

  async share(id: string): Promise<{ shareCount: number }> {
    const [target] = await this.db
      .select()
      .from(post)
      .where(eq(post.id, id))
      .limit(1);

    if (!target) {
      throw new NotFoundException('帖子不存在');
    }

    const [updated] = await this.db
      .update(post)
      .set({ shareCount: (target.shareCount ?? 0) + 1 })
      .where(eq(post.id, id))
      .returning({ shareCount: post.shareCount });

    return { shareCount: updated.shareCount ?? 0 };
  }
}
