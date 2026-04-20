import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { IngestaWebhookGuard } from './ingesta-webhook.guard';

function createGuard(secret: string | undefined) {
  const configService = { get: jest.fn().mockReturnValue(secret) };
  return new IngestaWebhookGuard(configService as any);
}

function mockContext(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

describe('IngestaWebhookGuard', () => {
  it('should allow request with valid x-ingesta-secret', () => {
    const guard = createGuard('my-secret');
    const ctx = mockContext({ 'x-ingesta-secret': 'my-secret' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should reject request with invalid secret', () => {
    const guard = createGuard('my-secret');
    const ctx = mockContext({ 'x-ingesta-secret': 'wrong' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should reject request with missing secret header', () => {
    const guard = createGuard('my-secret');
    const ctx = mockContext({});
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should reject when INGESTA_SECRET is not configured', () => {
    const guard = createGuard(undefined);
    const ctx = mockContext({ 'x-ingesta-secret': 'anything' });
    expect(() => guard.canActivate(ctx)).toThrow('INGESTA_SECRET not configured');
  });
});
