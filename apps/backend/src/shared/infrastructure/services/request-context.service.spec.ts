import { RequestContextService } from './request-context.service';

describe('RequestContextService', () => {
  let service: RequestContextService;

  beforeEach(() => {
    service = new RequestContextService();
  });

  it('should store and retrieve estudioId', () => {
    service.estudioId = 'estudio-1';
    expect(service.estudioId).toBe('estudio-1');
  });

  it('should store and retrieve userId', () => {
    service.userId = 'user-1';
    expect(service.userId).toBe('user-1');
  });

  it('should store and retrieve correlationId', () => {
    service.correlationId = 'corr-abc';
    expect(service.correlationId).toBe('corr-abc');
  });

  it('should return undefined for unset values', () => {
    expect(service.estudioId).toBeUndefined();
    expect(service.userId).toBeUndefined();
    expect(service.correlationId).toBeUndefined();
  });
});
