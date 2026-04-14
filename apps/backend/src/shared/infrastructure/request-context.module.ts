import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { RequestContextService, REQUEST_CONTEXT } from './services/request-context.service';
import { RequestContextMiddleware } from './middleware/request-context.middleware';

@Global()
@Module({
  providers: [
    {
      provide: REQUEST_CONTEXT,
      useClass: RequestContextService,
    },
  ],
  exports: [REQUEST_CONTEXT],
})
export class RequestContextModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
    // HTTP request logging is now handled by pino-http (via nestjs-pino LoggerModule)
  }
}
