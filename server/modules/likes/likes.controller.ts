import { Controller, Post, Get, Param, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { ApiResponse } from '@shared/api.interface';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    phone: string;
    isAdmin: boolean;
  };
}

@Controller('api/likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @UseGuards(JwtAuthGuard)
  @Post('post/:postId/toggle')
  async toggleLike(
    @Param('postId') postId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponse<{ liked: boolean; likeCount: number }>> {
    const { userId } = req.user;
    const data = await this.likesService.toggleLike(postId, userId);
    return {
      code: 0,
      message: 'success',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('post/:postId/status')
  async getLikeStatus(
    @Param('postId') postId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponse<{ liked: boolean; likeCount: number }>> {
    const { userId } = req.user;
    const data = await this.likesService.getLikeStatus(postId, userId);
    return {
      code: 0,
      message: 'success',
      data,
    };
  }
}
