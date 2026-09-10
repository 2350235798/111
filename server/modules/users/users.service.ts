import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_DATABASE } from '../../common/drizzle/drizzle.module';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { appUser } from '../../database/schema';
import type { UserProfile, UpdateProfileRequest } from '@shared/api.interface';
import { ModerationService } from '../../common/services/moderation.service';

type AppUserRow = typeof appUser.$inferSelect;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly moderationService: ModerationService,
  ) {}

  private toUserProfile(row: AppUserRow): UserProfile {
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

  async findById(userId: string): Promise<UserProfile> {
    const rows: AppUserRow[] = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.id, userId))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('用户不存在');
    }

    return this.toUserProfile(rows[0]);
  }

  async getProfile(userId: string): Promise<UserProfile> {
    return this.findById(userId);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileRequest,
  ): Promise<UserProfile> {
    const rows: AppUserRow[] = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.id, userId))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('用户不存在');
    }

    const row: AppUserRow = rows[0];
    const patch: Partial<typeof appUser.$inferInsert> = {};

    if (dto.nickname !== undefined) {
      const nickname = dto.nickname;
      if (nickname.length < 2 || nickname.length > 20) {
        throw new BadRequestException('昵称长度需在 2-20 字符之间');
      }

      await this.moderationService.validateContent(nickname);

      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      );
      if (row.nicknameUpdatedAt && row.nicknameUpdatedAt > thirtyDaysAgo) {
        throw new ConflictException('昵称每30天只能修改一次');
      }

      patch.nickname = nickname;
      patch.nicknameUpdatedAt = new Date();
    }

    if (dto.avatarUrl !== undefined) {
      patch.avatarUrl = dto.avatarUrl || null;
    }

    if (dto.bio !== undefined) {
      const bio = dto.bio;
      if (bio.length > 200) {
        throw new BadRequestException('简介最多 200 字');
      }
      await this.moderationService.validateContent(bio);
      patch.bio = bio;
    }

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    patch.updatedAt = new Date();

    const updated: AppUserRow[] = await this.db
      .update(appUser)
      .set(patch)
      .where(eq(appUser.id, userId))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('用户不存在');
    }

    this.logger.log(`用户 ${userId} 更新资料成功`);
    return this.toUserProfile(updated[0]);
  }
}
