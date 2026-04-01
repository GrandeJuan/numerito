import { TenantId } from './tenant-id.decorator';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

describe('TenantId decorator', () => {
  function getFactory() {
    class Test {
      test(@TenantId() _id: any) {}
    }
    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
    const key = Object.keys(metadata)[0];
    return metadata[key].factory;
  }

  const mockContext = (tenantId?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ tenantId }),
      }),
    }) as any;

  it('should extract tenantId from request', () => {
    const factory = getFactory();
    expect(factory(undefined, mockContext('tenant-123'))).toBe('tenant-123');
  });

  it('should return undefined when tenantId is not set', () => {
    const factory = getFactory();
    expect(factory(undefined, mockContext())).toBeUndefined();
  });
});
