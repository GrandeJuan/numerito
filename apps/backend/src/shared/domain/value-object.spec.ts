import { ValueObject } from './value-object';

class TestVO extends ValueObject<{ value: string }> {
  get value(): string {
    return this.props.value;
  }
}

describe('ValueObject', () => {
  it('should be equal when props match', () => {
    const vo1 = new TestVO({ value: 'test' });
    const vo2 = new TestVO({ value: 'test' });
    expect(vo1.equals(vo2)).toBe(true);
  });

  it('should not be equal when props differ', () => {
    const vo1 = new TestVO({ value: 'a' });
    const vo2 = new TestVO({ value: 'b' });
    expect(vo1.equals(vo2)).toBe(false);
  });

  it('should freeze props', () => {
    const vo = new TestVO({ value: 'test' });
    expect(Object.isFrozen(vo['props'])).toBe(true);
  });
});
