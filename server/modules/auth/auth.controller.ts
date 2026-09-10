import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserProfile,
} from '@shared/api.interface';

interface AuthRequest extends Request {
  user: {
    userId: string;
    phone: string;
    isAdmin: boolean;
  };
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterRequest,
  ): Promise<ApiResponse<AuthResponse>> {
    if (!dto.phone || !/^\d{11}$/.test(dto.phone)) {
      throw new BadRequestException('手机号格式不正确');
    }
    if (!dto.password || dto.password.length < 6 || dto.password.length > 20) {
      throw new BadRequestException('密码长度需在6-20位之间');
    }
    if (!dto.nickname || dto.nickname.length < 2 || dto.nickname.length > 20) {
      throw new BadRequestException('昵称长度需在2-20字符之间');
    }

    const data = await this.authService.register(dto);
    return { code: 0, message: 'success', data };
  }

  @Post('login')
  async login(
    @Body() dto: LoginRequest,
  ): Promise<ApiResponse<AuthResponse>> {
    if (!dto.phone || !dto.password) {
      throw new BadRequestException('手机号和密码不能为空');
    }

    const data = await this.authService.login(dto.phone, dto.password);
    return { code: 0, message: 'success', data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: AuthRequest): Promise<ApiResponse<{ user: UserProfile }>> {
    const { userId } = req.user;
    const user = await this.authService.getMe(userId);
    return { code: 0, message: 'success', data: { user } };
  }
}
