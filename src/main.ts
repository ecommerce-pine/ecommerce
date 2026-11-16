import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from 'node_modules/@nestjs/config/dist/config.service';
import { Logger } from 'nestjs-pino';
import { APP_CONFIG } from './config/app/app.config';
import { setupApp } from './bootstrap/setup-app';
import { NestExpressApplication } from '@nestjs/platform-express';
import { setupSwagger } from './bootstrap/setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);
  const appCfg = config.getOrThrow<{ port: number }>(APP_CONFIG);
  const logger = app.get(Logger);

  setupApp(app, logger, config);
  setupSwagger(app);

  const port = appCfg.port;
  await app.listen(port);
  logger.log(`Server is running on port ${port}`);
  logger.log(
    `Swagger documentation available at http://localhost:${port}/api-docs`,
  );
}
bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
