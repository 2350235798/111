import {
  Inject,
  Injectable,
  Logger,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE } from '../../common/drizzle/drizzle.module';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

import { appUser } from '@server/database/schema';
import { generateToken } from '../../common/guards/jwt-auth.guard';
import type { AuthResponse, RegisterRequest, UserProfile } from '@shared/api.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  toUserProfile(row: typeof appUser.$inferSelect): UserProfile {
    return {
      id: row.id,
      phone: row.phone,
      nickname: row.nickname,
      avatarUrl: row.avatarUrl,
      bio: row.bio || '',
      isAdmin: row.isAdmin || false,
      isBanned: row.isBanned || false,
      nicknameUpdatedAt: row.nicknameUpdatedAt
        ? row.nicknameUpdatedAt.toISOString()
        : null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async register(dto: RegisterRequest): Promise<AuthResponse> {
    const existing = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.phone, dto.phone));

    if (existing.length > 0) {
      throw new ConflictException('该手机号已注册');
    }

    const passwordHash = bcrypt.hashSync(dto.password, 10);

    const inserted = await this.db
      .insert(appUser)
      .values({
        phone: dto.phone,
        passwordHash,
        nickname: dto.nickname,
        avatarUrl: null,
        bio: '',
      })
      .returning();

    const user = inserted[0];
    const token = generateToken({
      userId: user.id,
      phone: user.phone,
      isAdmin: user.isAdmin || false,
    });

    this.logger.log(`用户注册成功: ${dto.phone}`);

    return {
      token,
      user: this.toUserProfile(user),
    };
  }

  async login(phone: string, password: string): Promise<AuthResponse> {
    const users = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.phone, phone));

    if (users.length === 0) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const user = users[0];

    if (user.isBanned) {
      throw new ForbiddenException('账号已被封禁');
    }

    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const token = generateToken({
      userId: user.id,
      phone: user.phone,
      isAdmin: user.isAdmin || false,
    });

    this.logger.log(`用户登录成功: ${phone}`);

    return {
      token,
      user: this.toUserProfile(user),
    };
  }

  async getMe(userId: string): Promise<UserProfile> {
    const users = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.id, userId));

    if (users.length === 0) {
      throw new UnauthorizedException('用户不存在');
    }

    return this.toUserProfile(users[0]);
  }
}
