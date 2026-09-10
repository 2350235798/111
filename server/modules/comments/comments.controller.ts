import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type {
  ApiResponse,
  CommentItem,
  CommentListResponse,
  CreateCommentRequest,
} from '@shared/api.interface';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    phone: string;
    isAdmin: boolean;
  };
}

@Controller('api/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('post/:postId')
  async createComment(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentRequest,
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponse<{ comment: CommentItem }>> {
    const { userId } = req.user;

    if (!dto.content || dto.content.trim().length === 0) {
      throw new BadRequestException('评论内容不能为空');
    }
    if (dto.content.trim().length > 200) {
      throw new BadRequestException('评论内容不能超过200字');
    }

    const comment = await this.commentsService.createComment(postId, dto, userId);
    return {
      code: 0,
      message: 'success',
      data: { comment },
    };
  }

  @Get('post/:postId')
  async getComments(
    @Param('postId') postId: string,
  ): Promise<ApiResponse<CommentListResponse>> {
    const data = await this.commentsService.getCommentsByPost(postId);
    return {
      code: 0,
      message: 'success',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteComment(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const { userId, isAdmin } = req.user;
    const result = await this.commentsService.deleteComment(id, userId, isAdmin);
    return {
      code: 0,
      message: 'success',
      data: result,
    };
  }
}
