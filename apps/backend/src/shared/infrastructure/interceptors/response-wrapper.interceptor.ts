import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { successResponse } from '../responses/api-response';

@Injectable()
export class ResponseWrapperInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return data;
        }
        return successResponse(data);
      }),
    );
  }
}
