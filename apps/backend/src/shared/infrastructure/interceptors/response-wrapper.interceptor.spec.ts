import { ResponseWrapperInterceptor } from './response-wrapper.interceptor';
import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';

describe('ResponseWrapperInterceptor', () => {
  let interceptor: ResponseWrapperInterceptor;

  beforeEach(() => {
    interceptor = new ResponseWrapperInterceptor();
  });

  const mockContext = {} as any;

  it('should wrap plain data in successResponse format', async () => {
    const handler = { handle: () => of({ name: 'test' }) };
    const result = await lastValueFrom(interceptor.intercept(mockContext, handler));
    expect(result).toEqual(
      expect.objectContaining({
        data: { name: 'test' },
        meta: expect.objectContaining({ timestamp: expect.any(String) }),
      }),
    );
  });

  it('should pass through already-wrapped responses (data + meta)', async () => {
    const wrapped = { data: [1, 2], meta: { timestamp: '2024-01-01', total: 2 } };
    const handler = { handle: () => of(wrapped) };
    const result = await lastValueFrom(interceptor.intercept(mockContext, handler));
    expect(result).toEqual(wrapped);
  });

  it('should wrap null data', async () => {
    const handler = { handle: () => of(null) };
    const result = await lastValueFrom(interceptor.intercept(mockContext, handler));
    expect(result).toEqual(
      expect.objectContaining({ data: null, meta: expect.any(Object) }),
    );
  });

  it('should wrap primitive data', async () => {
    const handler = { handle: () => of('hello') };
    const result = await lastValueFrom(interceptor.intercept(mockContext, handler));
    expect(result).toEqual(
      expect.objectContaining({ data: 'hello', meta: expect.any(Object) }),
    );
  });
});
