import { Principal } from './estudio-principal.decorator';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

describe('Principal decorator', () => {
  function getFactory() {
    class Test {
      test(@Principal() _principal: any) {}
    }
    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
    const key = Object.keys(metadata)[0];
    return metadata[key].factory;
  }

  const mockContext = (estudioPrincipal?: unknown) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ estudioPrincipal }),
      }),
    }) as any;

  it('should extract estudioPrincipal from request', () => {
    const factory = getFactory();
    const principal = { estudioId: 'e1', userId: 'u1', roles: ['ADMIN'] };
    expect(factory(undefined, mockContext(principal))).toEqual(principal);
  });

  it('should return undefined when estudioPrincipal is not set', () => {
    const factory = getFactory();
    expect(factory(undefined, mockContext())).toBeUndefined();
  });
});
