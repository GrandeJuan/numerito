import 'reflect-metadata';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/infrastructure/filters/global-exception.filter';
import { ResponseWrapperInterceptor } from './shared/infrastructure/interceptors/response-wrapper.interceptor';
import { parseAllowedOrigins } from './shared/infrastructure/cors-origins';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Use Pino as the application logger (captures all NestJS internal logs)
  const logger = app.get(Logger);
  app.useLogger(logger);

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalFilters(new GlobalExceptionFilter(logger));
  app.useGlobalInterceptors(new ResponseWrapperInterceptor());
  app.enableCors({
    origin: parseAllowedOrigins(process.env.FRONTEND_URL),
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Numerito API')
    .setDescription('ERP Contable Argentino — REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Numerito API running on port ${port}`);
}
bootstrap();
