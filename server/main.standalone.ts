import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: process.env.NODE_ENV !== 'development',
  });

  app.enableCors();
  app.setGlobalPrefix('api');

  const logger = new Logger('Bootstrap');
  const host = process.env.SERVER_HOST || '0.0.0.0';
  const port = Number(process.env.SERVER_PORT || '3000');

  app.useStaticAssets(join(process.cwd(), 'dist/client'));
  app.setBaseViewsDir(join(process.cwd(), 'dist/client'));
  app.setViewEngine('html');

  await app.listen(port, host);
  logger.log(`Server running on ${host}:${port}`);
  logger.log(`API endpoints ready at http://${host}:${port}/api`);
}

bootstrap();
