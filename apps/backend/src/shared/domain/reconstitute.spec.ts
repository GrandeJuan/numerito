import { z } from 'zod';
import { BaseEntity } from './base.entity';
import { DomainEvent } from './domain-event';
import { reconstituteEntity } from './reconstitute';

class TestEvent extends DomainEvent {
  get eventName(): string {
    return 'test.event';
  }
}

class TestEntity extends BaseEntity {
  _name!: string;
  _count!: number;

  private constructor(name: string, count: number, id?: string) {
    super(id);
    this._name = name;
    this._count = count;
  }

  static create(name: string, count: number): TestEntity {
    return new TestEntity(name, count);
  }

  emit(): void {
    this.addDomainEvent(new TestEvent());
  }
}

const testPropsSchema = z.object({
  name: z.string().min(1),
  count: z.number().int(),
});

describe('reconstituteEntity', () => {
  const validId = '11111111-1111-1111-1111-111111111111';
  const validProps = { name: 'alpha', count: 7 };

  describe('constructor bypass', () => {
    it('does not invoke the entity constructor', () => {
      const { instance } = reconstituteEntity(TestEntity, {
        schema: testPropsSchema,
        props: validProps,
        id: validId,
      });

      expect(instance).toBeInstanceOf(TestEntity);
      // The private constructor was skipped — own fields are undefined until
      // the caller assigns them from the validated props.
      expect(instance._name).toBeUndefined();
      expect(instance._count).toBeUndefined();
    });
  });

  describe('identity immutability', () => {
    it('sets id as a non-writable enumerable property', () => {
      const { instance } = reconstituteEntity(TestEntity, {
        schema: testPropsSchema,
        props: validProps,
        id: validId,
      });

      expect(instance.id).toBe(validId);

      const descriptor = Object.getOwnPropertyDescriptor(instance, 'id');
      expect(descriptor?.writable).toBe(false);
      expect(descriptor?.enumerable).toBe(true);
      expect(descriptor?.configurable).toBe(false);

      expect(() => {
        (instance as { id: string }).id = 'other';
      }).toThrow();
    });

    it('sets createdAt as a non-writable enumerable property', () => {
      const { instance } = reconstituteEntity(TestEntity, {
        schema: testPropsSchema,
        props: validProps,
        id: validId,
      });

      expect(instance.createdAt).toBeInstanceOf(Date);

      const descriptor = Object.getOwnPropertyDescriptor(instance, 'createdAt');
      expect(descriptor?.writable).toBe(false);
      expect(descriptor?.enumerable).toBe(true);

      expect(() => {
        (instance as { createdAt: Date }).createdAt = new Date(0);
      }).toThrow();
    });
  });

  describe('timestamp wiring', () => {
    it('defaults createdAt and updatedAt to a fresh Date when omitted', () => {
      const before = Date.now();
      const { instance } = reconstituteEntity(TestEntity, {
        schema: testPropsSchema,
        props: validProps,
        id: validId,
      });
      const after = Date.now();

      expect(instance.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(instance.createdAt.getTime()).toBeLessThanOrEqual(after);
      expect(instance.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(instance.updatedAt.getTime()).toBeLessThanOrEqual(after);
    });

    it('uses the provided createdAt and updatedAt when passed', () => {
      const createdAt = new Date('2024-01-01T00:00:00.000Z');
      const updatedAt = new Date('2024-06-15T12:30:00.000Z');

      const { instance } = reconstituteEntity(TestEntity, {
        schema: testPropsSchema,
        props: validProps,
        id: validId,
        createdAt,
        updatedAt,
      });

      expect(instance.createdAt).toBe(createdAt);
      expect(instance.updatedAt).toBe(updatedAt);
    });

    it('allows updatedAt to be reassigned (mutable)', () => {
      const { instance } = reconstituteEntity(TestEntity, {
        schema: testPropsSchema,
        props: validProps,
        id: validId,
      });

      const next = new Date('2030-01-01T00:00:00.000Z');
      instance.updatedAt = next;
      expect(instance.updatedAt).toBe(next);
    });
  });

  describe('_domainEvents initialisation', () => {
    it('initialises an empty, non-enumerable domain events array', () => {
      const { instance } = reconstituteEntity(TestEntity, {
        schema: testPropsSchema,
        props: validProps,
        id: validId,
      });

      expect(instance.getDomainEvents()).toEqual([]);

      const descriptor = Object.getOwnPropertyDescriptor(
        instance,
        '_domainEvents',
      );
      expect(descriptor?.enumerable).toBe(false);
      expect(descriptor?.writable).toBe(true);
    });

    it('produces an instance that can collect domain events after reconstitution', () => {
      const { instance } = reconstituteEntity(TestEntity, {
        schema: testPropsSchema,
        props: validProps,
        id: validId,
      });

      instance.emit();

      expect(instance.getDomainEvents()).toHaveLength(1);
      expect(instance.getDomainEvents()[0]).toBeInstanceOf(TestEvent);
    });

    it('clearDomainEvents resets the array without breaking further emits', () => {
      const { instance } = reconstituteEntity(TestEntity, {
        schema: testPropsSchema,
        props: validProps,
        id: validId,
      });

      instance.emit();
      instance.clearDomainEvents();
      expect(instance.getDomainEvents()).toEqual([]);

      instance.emit();
      expect(instance.getDomainEvents()).toHaveLength(1);
    });
  });

  describe('Zod validation', () => {
    it('returns the parsed props so callers can assign from validated data', () => {
      const { props } = reconstituteEntity(TestEntity, {
        schema: testPropsSchema,
        props: validProps,
        id: validId,
      });

      expect(props).toEqual(validProps);
    });

    it('rejects props that violate the schema', () => {
      expect(() =>
        reconstituteEntity(TestEntity, {
          schema: testPropsSchema,
          props: { name: '', count: 7 },
          id: validId,
        }),
      ).toThrow();

      expect(() =>
        reconstituteEntity(TestEntity, {
          schema: testPropsSchema,
          props: { name: 'alpha', count: 3.14 },
          id: validId,
        }),
      ).toThrow();
    });

    it('rejects missing required fields', () => {
      expect(() =>
        reconstituteEntity(TestEntity, {
          schema: testPropsSchema,
          props: { name: 'alpha' },
          id: validId,
        }),
      ).toThrow();
    });

    it('rejects wrong-type fields', () => {
      expect(() =>
        reconstituteEntity(TestEntity, {
          schema: testPropsSchema,
          props: { name: 'alpha', count: 'seven' },
          id: validId,
        }),
      ).toThrow();
    });

    it('applies Zod transformations/defaults to the returned props', () => {
      const schemaWithDefault = z.object({
        name: z.string().min(1),
        count: z.number().int().default(0),
      });

      const { props } = reconstituteEntity(TestEntity, {
        schema: schemaWithDefault,
        props: { name: 'alpha' },
        id: validId,
      });

      expect(props.count).toBe(0);
    });
  });
});
