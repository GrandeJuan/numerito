import { EstudioPrincipalInterceptor } from './estudio-principal.interceptor';
import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';

describe('EstudioPrincipalInterceptor', () => {
  let interceptor: EstudioPrincipalInterceptor;

  beforeEach(() => {
    interceptor = new EstudioPrincipalInterceptor();
  });

  function mockContext(headers: Record<string, string>, user?: { id: string; roles?: string[] }) {
    const req: Record<string, unknown> = { headers, user };
    return {
      ctx: {
        switchToHttp: () => ({
          getRequest: () => req,
        }),
      } as any,
      req,
    };
  }

  const next = { handle: () => of('ok') };

  it('should build principal when estudioId header and user are present', async () => {
    const { ctx, req } = mockContext(
      { 'x-estudio-id': 'estudio-123' },
      { id: 'user-456', roles: ['ADMIN', 'CONTADOR'] },
    );

    await lastValueFrom(interceptor.intercept(ctx, next));

    expect(req.estudioPrincipal).toEqual({
      estudioId: 'estudio-123',
      userId: 'user-456',
      roles: ['ADMIN', 'CONTADOR'],
    });
  });

  it('should default roles to empty array when user has no roles', async () => {
    const { ctx, req } = mockContext(
      { 'x-estudio-id': 'estudio-123' },
      { id: 'user-456' },
    );

    await lastValueFrom(interceptor.intercept(ctx, next));

    expect(req.estudioPrincipal).toEqual({
      estudioId: 'estudio-123',
      userId: 'user-456',
      roles: [],
    });
  });

  it('should NOT set principal when estudioId header is missing', async () => {
    const { ctx, req } = mockContext({}, { id: 'user-456' });

    await lastValueFrom(interceptor.intercept(ctx, next));

    expect(req.estudioPrincipal).toBeUndefined();
  });

  it('should NOT set principal when user is missing', async () => {
    const { ctx, req } = mockContext({ 'x-estudio-id': 'estudio-123' });

    await lastValueFrom(interceptor.intercept(ctx, next));

    expect(req.estudioPrincipal).toBeUndefined();
  });

  it('should NOT set principal when user has no id', async () => {
    const { ctx, req } = mockContext(
      { 'x-estudio-id': 'estudio-123' },
      { id: '' },
    );

    await lastValueFrom(interceptor.intercept(ctx, next));

    expect(req.estudioPrincipal).toBeUndefined();
  });

  it('should still call next.handle() regardless of principal presence', async () => {
    const { ctx } = mockContext({});
    const result = await lastValueFrom(interceptor.intercept(ctx, next));
    expect(result).toBe('ok');
  });
});
