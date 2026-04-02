import { EstudioRequiredGuard } from './estudio-required.guard';
import { BadRequestException, ExecutionContext } from '@nestjs/common';

describe('EstudioRequiredGuard', () => {
  let guard: EstudioRequiredGuard;

  const mockContext = (estudioId?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ estudioId }),
      }),
    }) as any;

  beforeEach(() => {
    guard = new EstudioRequiredGuard();
  });

  it('should allow when estudioId is present', () => {
    expect(guard.canActivate(mockContext('estudio-123'))).toBe(true);
  });

  it('should throw BadRequestException when estudioId is missing', () => {
    expect(() => guard.canActivate(mockContext())).toThrow(BadRequestException);
    expect(() => guard.canActivate(mockContext())).toThrow(
      'Header x-estudio-id es requerido',
    );
  });

  it('should throw when estudioId is empty string (falsy)', () => {
    expect(() => guard.canActivate(mockContext(''))).toThrow(BadRequestException);
  });
});
