import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// eslint-disable-next-line import/no-extraneous-dependencies
import { put } from '@vercel/blob';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { Request } from 'express';

interface JwtPayload {
  userId: string;
}

@Controller('api/upload')
export class UploadController {
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: { buffer: Buffer; originalname: string; size: number; mimetype: string } | any,
    @Req() req: Request & { user?: JwtPayload },
  ) {
    if (!file) {
      throw new BadRequestException('请选择文件');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('图片大小不能超过 5MB');
    }

    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('仅支持图片文件');
    }

    const user = req.user;
    const prefix = user?.userId
      ? `user-${user.userId}`
      : 'anonymous';
    const fileName = `${prefix}/${Date.now()}-${file.originalname}`;

    const blob = await put(fileName, file.buffer, {
      access: 'public',
    });

    return {
      code: 0,
      message: 'success',
      data: {
        url: blob.url,
      },
    };
  }
}
