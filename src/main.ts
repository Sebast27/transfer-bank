import { NestFactory } from '@nestjs/core';
import { AppModule } from './presentation/modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api/v1');
  
  // Habilitar CORS
  app.enableCors();
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Servidor corriendo en: http://localhost:${port}/api/v1`);
}

bootstrap();