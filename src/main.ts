import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const requiredEnv = [
    'MONGO_URI',
    'JWT_SECRET',
    'JWT_EXPIRES',
    'CLERK_SECRET_KEY',
  ];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);

  if (missingEnv.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnv.join(', ')}. Add them in Vercel → Project Settings → Environment Variables, then redeploy.`,
    );
  }

  const app = await NestFactory.create(AppModule, { cors: true });

  // Enable CORS
  app.enableCors();

  // Set global prefix for versioning
  app.setGlobalPrefix('v1');

  app.getHttpAdapter().get('/', (_req, res) => {
    res.json({
      status: 'ok',
      message: 'Lahore POS API is running',
      api: '/v1',
      swagger: '/api/swagger',
    });
  });

  // Use global validation pipe for request validation
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

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/swagger', app, swaggerDocument, {
    customSiteTitle: `${apiTitle} API Documentation`,
    customCss: `
      .swagger-ui .topbar { background-color: #1a1a1a; }
      .swagger-ui .topbar .link { color: #ffffff; }
    `,
    customfavIcon: 'https://example.com/favicon.ico',
  });

  // Start the application
  const port = configService.get<number>('PORT', 3001)
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}/v1`);
  console.log(
    `Swagger API documentation is available on: http://localhost:${port}/api/swagger`,
  );
}

bootstrap().catch((error) => {
  console.error('NestJS bootstrap failed:', error?.message || error);
  process.exit(1);
});
