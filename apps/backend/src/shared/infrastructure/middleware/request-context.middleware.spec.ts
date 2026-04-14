import { RequestContextMiddleware } from './request-context.middleware';
import { RequestContextService } from '../services/request-context.service';

describe('RequestContextMiddleware', () => {
  let middleware: RequestContextMiddleware;
  let contextService: RequestContextService;
  let next: jest.Mock;

  beforeEach(() => {
    contextService = new RequestContextService();
    middleware = new RequestContextMiddleware(contextService);
    next = jest.fn();
  });

  it('should set estudioId from x-estudio-id header', () => {
    const req: any = { headers: { 'x-estudio-id': 'estudio-abc' }, user: undefined };
    middleware.use(req, {} as any, next);
    expect(contextService.estudioId).toBe('estudio-abc');
    expect(next).toHaveBeenCalled();
  });

  it('should set userId from authenticated user', () => {
    const req: any = { headers: {}, user: { id: 'user-123' } };
    middleware.use(req, {} as any, next);
    expect(contextService.userId).toBe('user-123');
    expect(next).toHaveBeenCalled();
  });

  it('should generate a correlationId when x-correlation-id header is absent', () => {
    const req: any = { headers: {}, user: undefined };
    middleware.use(req, {} as any, next);
    expect(contextService.correlationId).toBeDefined();
    expect(contextService.correlationId!.length).toBeGreaterThan(0);
  });

  it('should use x-correlation-id header when present', () => {
    const req: any = { headers: { 'x-correlation-id': 'corr-custom' }, user: undefined };
    middleware.use(req, {} as any, next);
    expect(contextService.correlationId).toBe('corr-custom');
  });

  it('should not set estudioId when header is absent', () => {
    const req: any = { headers: {}, user: undefined };
    middleware.use(req, {} as any, next);
    expect(contextService.estudioId).toBeUndefined();
  });

  it('should set estudioId on req object for @EstudioId() decorator', () => {
    const req: any = { headers: { 'x-estudio-id': 'estudio-abc' }, user: undefined };
    middleware.use(req, {} as any, next);
    expect(req.estudioId).toBe('estudio-abc');
  });

  it('should not set req.estudioId when header is absent', () => {
    const req: any = { headers: {}, user: undefined };
    middleware.use(req, {} as any, next);
    expect(req.estudioId).toBeUndefined();
  });
});
