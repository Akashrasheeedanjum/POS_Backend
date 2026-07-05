// src/bootstrap.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

export async function bootstrapApp(isServerless = false) {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Enable CORS
  app.enableCors();

  // Set global prefix for versioning
  app.setGlobalPrefix('v1');

  // Use global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // Load configuration
  const configService = app.get(ConfigService);
  const apiTitle = configService.get<string>('API_TITLE', 'Flexo');
  const apiDescription = configService.get<string>(
    'API_DESCRIPTION',
    'Flexo API Endpoint to test',
  );
  const apiVersion = configService.get<string>('API_VERSION', '1.0');

  // Configure Swagger
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
  SwaggerModule.setup('api/swagger', app, document, {
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css',
    ],
  });

  if (isServerless) {
    return app;
  } else {
    const port = configService.get<number>('PORT', 3001);
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}/v1`);
    console.log(
      `Swagger API documentation is available on: http://localhost:${port}/api/swagger`,
    );
  }
}
