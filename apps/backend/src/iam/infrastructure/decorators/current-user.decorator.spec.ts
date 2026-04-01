import { CurrentUser } from './current-user.decorator';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

describe('CurrentUser decorator', () => {
  // Extract the factory function from the decorator metadata
  function getParamDecoratorFactory() {
    class Test {
      test(@CurrentUser() _user: any) {}
    }
    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
    const key = Object.keys(metadata)[0];
    return metadata[key].factory;
  }

  const mockContext = (user: any) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as any;

  it('should return the full user when no data specified', () => {
    const factory = getParamDecoratorFactory();
    const user = { sub: '1', email: 'a@b.com', rol: 'SOCIO' };
    expect(factory(undefined, mockContext(user))).toEqual(user);
  });

  it('should return a specific property when data is provided', () => {
    class Test {
      test(@CurrentUser('email') _email: any) {}
    }
    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
    const key = Object.keys(metadata)[0];
    const factory = metadata[key].factory;

    const user = { sub: '1', email: 'a@b.com', rol: 'SOCIO' };
    expect(factory('email', mockContext(user))).toBe('a@b.com');
  });

  it('should return undefined when user is not set', () => {
    const factory = getParamDecoratorFactory();
    expect(factory(undefined, mockContext(undefined))).toBeUndefined();
  });
});
