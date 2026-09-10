import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '../drizzle/drizzle.module';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { sensitiveWord } from '../../database/schema';
import type { ModerationResult } from '@shared/api.interface';

@Injectable()
export class ModerationService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async checkContent(content: string): Promise<ModerationResult> {
    const result = await this.db.select({ word: sensitiveWord.word }).from(sensitiveWord);
    const words = result.map((row: { word: string }) => row.word);

    const blockedWords: string[] = [];
    for (const word of words) {
      if (content.includes(word)) {
        blockedWords.push(word);
      }
    }

    return {
      passed: blockedWords.length === 0,
      blockedWords,
    };
  }

  async validateContent(content: string): Promise<void> {
    const result = await this.checkContent(content);
    if (!result.passed) {
      throw new BadRequestException(
        `内容包含违禁词：${result.blockedWords.slice(0, 3).join('、')}${result.blockedWords.length > 3 ? '等' : ''}`,
      );
    }
  }
}
