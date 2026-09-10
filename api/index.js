const path = require('path');

process.chdir(path.join(__dirname, '..'));

let cachedServer;

async function bootstrap() {
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('../dist/server/app.module.js');
  const serverlessExpress = require('@vendia/serverless-express');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  app.enableCors();
  app.setGlobalPrefix('api');
  await app.init();

  return serverlessExpress({ app: app.getHttpAdapter().getInstance() });
}

module.exports = async (req, res) => {
  if (!cachedServer) {
    cachedServer = bootstrap();
  }
  const serverInstance = await cachedServer;
  return serverInstance(req, res);
};
