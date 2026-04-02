import { EstudioId } from './estudio-id.decorator';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

describe('EstudioId decorator', () => {
  function getFactory() {
    class Test {
      test(@EstudioId() _id: any) {}
    }
    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
    const key = Object.keys(metadata)[0];
    return metadata[key].factory;
  }

  const mockContext = (estudioId?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ estudioId }),
      }),
    }) as any;

  it('should extract estudioId from request', () => {
    const factory = getFactory();
    expect(factory(undefined, mockContext('estudio-123'))).toBe('estudio-123');
  });

  it('should return undefined when estudioId is not set', () => {
    const factory = getFactory();
    expect(factory(undefined, mockContext())).toBeUndefined();
  });
});
