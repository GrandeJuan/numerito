import { EstudioContextMiddleware, ESTUDIO_ID_HEADER } from './estudio-context.middleware';

describe('EstudioContextMiddleware', () => {
  let middleware: EstudioContextMiddleware;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = new EstudioContextMiddleware();
    next = jest.fn();
  });

  it('should set estudioId from header', () => {
    const req: any = { headers: { [ESTUDIO_ID_HEADER]: 'estudio-abc' } };
    middleware.use(req, {} as any, next);
    expect(req.estudioId).toBe('estudio-abc');
    expect(next).toHaveBeenCalled();
  });

  it('should not set estudioId when header is absent', () => {
    const req: any = { headers: {} };
    middleware.use(req, {} as any, next);
    expect(req.estudioId).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('should export ESTUDIO_ID_HEADER as "x-estudio-id"', () => {
    expect(ESTUDIO_ID_HEADER).toBe('x-estudio-id');
  });
});
