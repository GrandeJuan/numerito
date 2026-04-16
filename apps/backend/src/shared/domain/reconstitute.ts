import type { ZodType } from 'zod';
import type { BaseEntity } from './base.entity';

/**
 * Shared reconstitute helper — rebuilds a domain entity from persisted state
 * without running its constructor, and enforces the BaseEntity contract in
 * one place.
 *
 * What it handles (the boilerplate that lived in every entity's reconstitute):
 *   - bypasses the constructor (Object.create(ctor.prototype))
 *   - wires `id` as an immutable, enumerable own property
 *   - wires `createdAt` as an immutable, enumerable own property
 *   - wires `updatedAt` as a mutable own property
 *   - initialises `_domainEvents` as a non-enumerable empty array (so it
 *     does not leak into JSON serialisation or schema comparisons)
 *   - validates the incoming props against a Zod schema — fails fast on
 *     DB/domain drift instead of producing a silently-wrong aggregate
 *
 * What it does NOT handle (remains the entity's responsibility):
 *   - assigning the entity's own private fields from the validated props
 *     (value objects, enums, arrays, nested state — these are per-aggregate)
 *
 * Usage:
 *   ```ts
 *   const reconstituteSchema = z.object({ usuarioId: z.string().uuid(), ... });
 *
 *   static reconstitute(props: z.input<typeof reconstituteSchema>, id: string): Sesion {
 *     const { instance, props: data } = reconstituteEntity(Sesion, {
 *       schema: reconstituteSchema,
 *       props,
 *       id,
 *     });
 *     instance._usuarioId = data.usuarioId;
 *     // ... assign remaining private fields from `data`
 *     return instance;
 *   }
 *   ```
 *
 * Timestamps:
 *   `createdAt` / `updatedAt` default to `new Date()` when omitted, matching
 *   the pre-helper reconstitute behaviour. Callers migrating to persisted
 *   timestamps can pass them explicitly.
 */
export interface ReconstituteOptions<P> {
  schema: ZodType<P>;
  props: unknown;
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReconstituteResult<T, P> {
  instance: T;
  props: P;
}

export function reconstituteEntity<T extends BaseEntity, P>(
  ctor: { prototype: T },
  options: ReconstituteOptions<P>,
): ReconstituteResult<T, P> {
  const data = options.schema.parse(options.props);
  const instance = Object.create(ctor.prototype) as T;

  Object.defineProperty(instance, 'id', {
    value: options.id,
    writable: false,
    enumerable: true,
    configurable: false,
  });
  Object.defineProperty(instance, 'createdAt', {
    value: options.createdAt ?? new Date(),
    writable: false,
    enumerable: true,
    configurable: false,
  });
  Object.defineProperty(instance, 'updatedAt', {
    value: options.updatedAt ?? new Date(),
    writable: true,
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(instance, '_domainEvents', {
    value: [],
    writable: true,
    enumerable: false,
    configurable: true,
  });

  return { instance, props: data };
}
