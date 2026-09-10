import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  Headers,
} from '@nestjs/common';
import type { Request } from 'express';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type {
  ApiResponse,
  CreatePostRequest,
  PostItem,
  PostListResponse,
} from '@shared/api.interface';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    phone: string;
    isAdmin: boolean;
  };
}

@Controller('api/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePostRequest,
  ): Promise<ApiResponse<{ post: PostItem }>> {
    const result = await this.postsService.create(dto, req.user.userId);
    return { code: 0, message: 'success', data: result };
  }

  @Get()
  async getList(
    @Query('page') pageParam = '1',
    @Query('pageSize') pageSizeParam = '10',
    @Headers('authorization') authorization?: string,
  ): Promise<ApiResponse<PostListResponse>> {
    const page = parseInt(pageParam, 10) || 1;
    const pageSize = parseInt(pageSizeParam, 10) || 10;
    const result = await this.postsService.getList(page, pageSize, authorization);
    return { code: 0, message: 'success', data: result };
  }

  @Get(':id')
  async getDetail(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ): Promise<ApiResponse<{ post: PostItem }>> {
    const result = await this.postsService.getDetail(id, authorization);
    return { code: 0, message: 'success', data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const result = await this.postsService.delete(id, req.user);
    return { code: 0, message: 'success', data: result };
  }

  @Post(':id/share')
  async share(
    @Param('id') id: string,
  ): Promise<ApiResponse<{ shareCount: number }>> {
    const result = await this.postsService.share(id);
    return { code: 0, message: 'success', data: result };
  }
}
