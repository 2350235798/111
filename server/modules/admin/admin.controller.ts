import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard, AdminGuard } from '@server/common/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import type {
  ApiResponse,
  AdminStats,
  AdminUserListResponse,
  PostListResponse,
  PostItem,
  UserProfile,
} from '@shared/api.interface';

interface AuthenticatedRequest extends Request {
  user: { userId: string; phone: string; isAdmin: boolean };
}

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats(): Promise<ApiResponse<AdminStats>> {
    const data = await this.adminService.getStats();
    return { code: 0, message: 'success', data };
  }

  @Get('users')
  async getUserList(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
    @Query('keyword') keyword?: string,
  ): Promise<ApiResponse<AdminUserListResponse>> {
    const data = await this.adminService.getUserList(
      page ?? 1,
      pageSize ?? 20,
      keyword,
    );
    return { code: 0, message: 'success', data };
  }

  @Post('users/:id/ban')
  async setUserBan(
    @Param('id') id: string,
    @Body() body: { banned: boolean },
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponse<{ user: UserProfile }>> {
    const { userId } = req.user;
    const data = await this.adminService.setUserBan(id, body.banned, userId);
    return { code: 0, message: 'success', data };
  }

  @Get('posts')
  async getPostList(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ): Promise<ApiResponse<PostListResponse>> {
    const data = await this.adminService.getPostList(
      page ?? 1,
      pageSize ?? 20,
    );
    return { code: 0, message: 'success', data };
  }

  @Delete('posts/:id')
  async deletePost(
    @Param('id') id: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const data = await this.adminService.deletePost(id);
    return { code: 0, message: 'success', data };
  }

  @Patch('posts/:id/visibility')
  async setPostVisibility(
    @Param('id') id: string,
    @Body() body: { visible: boolean },
  ): Promise<ApiResponse<{ post: PostItem }>> {
    const data = await this.adminService.setPostVisibility(id, body.visible);
    return { code: 0, message: 'success', data };
  }
}
