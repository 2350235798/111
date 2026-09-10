import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type {
  ApiResponse,
  UserProfile,
  UpdateProfileRequest,
} from '@shared/api.interface';

interface AuthRequest extends Request {
  user: {
    userId: string;
    phone: string;
    isAdmin: boolean;
  };
}

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<ApiResponse<{ user: UserProfile }>> {
    const user: UserProfile = await this.usersService.findById(id);
    return {
      code: 0,
      message: 'success',
      data: { user },
    };
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(
    @Req() req: AuthRequest,
  ): Promise<ApiResponse<{ user: UserProfile }>> {
    const { userId } = req.user;
    const user: UserProfile = await this.usersService.getProfile(userId);
    return {
      code: 0,
      message: 'success',
      data: { user },
    };
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(
    @Req() req: AuthRequest,
    @Body() dto: UpdateProfileRequest,
  ): Promise<ApiResponse<{ user: UserProfile }>> {
    const { userId } = req.user;
    const user: UserProfile = await this.usersService.updateProfile(userId, dto);
    return {
      code: 0,
      message: 'success',
      data: { user },
    };
  }
}
