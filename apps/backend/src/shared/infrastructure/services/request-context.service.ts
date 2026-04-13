import { Injectable, Scope } from '@nestjs/common';
import { TenantContext } from '../../domain/tenant-context';

@Injectable({ scope: Scope.REQUEST })
export class RequestContextService implements TenantContext {
  estudioId?: string;
  userId?: string;
  correlationId?: string;
}

export const REQUEST_CONTEXT = Symbol('RequestContextService');
