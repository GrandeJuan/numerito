import { IS_PUBLIC_KEY, Public } from './public.decorator';

describe('Public decorator', () => {
  it('should set IS_PUBLIC_KEY metadata to true', () => {
    @Public()
    class TestHandler {}

    const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, TestHandler);
    expect(isPublic).toBe(true);
  });

  it('should export IS_PUBLIC_KEY as "isPublic"', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });
});
