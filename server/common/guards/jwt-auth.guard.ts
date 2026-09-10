import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';

export const JWT_SECRET =
  process.env.JWT_SECRET || 'jidian_campus_default_secret_change_in_production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  phone: string;
  isAdmin: boolean;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('请先登录');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      throw new UnauthorizedException('请先登录');
    }

    if (!user.isAdmin) {
      throw new ForbiddenException('需要管理员权限');
    }

    return true;
  }
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload as object, JWT_SECRET as jwt.Secret, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}
