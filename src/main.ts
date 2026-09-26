import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './presentation/modules/app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Transfer Bank API')
    .setDescription('API bancaria con procesamiento asíncrono')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Autenticación de usuarios')
    .addTag('accounts', 'Gestión de cuentas')
    .addTag('transfers', 'Transferencias bancarias')
    .addTag('statements', 'Estados de cuenta')
    .addTag('deposits', 'Depósitos')
    .addTag('withdrawals', 'Retiros')
    .addTag('admin', 'Administración (solo ADMIN)')
    .addTag('health', 'Health check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Servidor corriendo en: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
}

bootstrap();