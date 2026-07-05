import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import express from 'express';
import { AppModule } from '../src/app.module';

const expressApp = express();

export async function bootstrapApp(isServerless = false) {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { cors: true },
  );

  app.enableCors();
  app.setGlobalPrefix('v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  const configService = app.get(ConfigService);
  const apiTitle = configService.get<string>('API_TITLE', 'Lahore POS API');
  const apiDescription = configService.get<string>(
    'API_DESCRIPTION',
    'Lahore POS Backend API',
  );
  const apiVersion = configService.get<string>('API_VERSION', '1.0');

  const swaggerConfig = new DocumentBuilder()
    .setTitle(apiTitle)
    .setDescription(apiDescription)
    .setVersion(apiVersion)
    .addTag('Default', 'Default Endpoint to test App')
    .addTag('Auth', 'Authentication-related endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'Bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token in the format: Bearer <JWT>',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/swagger', app, document);

  expressApp.get('/', (_req, res) => {
    res.json({
      status: 'ok',
      message: 'Lahore POS API is running',
      api: '/v1',
      swagger: '/api/swagger',
    });
  });

  if (isServerless) {
    return app;
  }

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/v1`);
  console.log(
    `Swagger API documentation is available on: http://localhost:${port}/api/swagger`,
  );
}
