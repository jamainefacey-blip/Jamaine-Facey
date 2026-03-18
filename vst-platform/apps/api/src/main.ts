// VST API — Entry point
// Phase 2: wire up AppModule, global pipes, guards, Swagger

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true required for svix webhook signature verification in AuthController
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.setGlobalPrefix('v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.NEXT_PUBLIC_APP_URL,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
  console.log(`VST API running on port ${process.env.PORT ?? 3001}`);
}

bootstrap();
