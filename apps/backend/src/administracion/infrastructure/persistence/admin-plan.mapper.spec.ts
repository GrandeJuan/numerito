import {
  AdminPlanMapper,
  adminPlanPersistenceSchema,
  type AdminPlanPersistence,
} from './admin-plan.mapper';
import type { PlanEntity } from '../../../shared/infrastructure/persistence/plan.schema';

describe('AdminPlanMapper', () => {
  const mapper = new AdminPlanMapper();

  const validPersistence: AdminPlanPersistence = {
    id: 1,
    codigo: 'PROFESIONAL',
    nombre: 'Plan Profesional',
    descripcion: 'Plan para estudios medianos',
    maxClientes: 50,
    maxUsuarios: 5,
    precio: 9999.99,
    isPublico: true,
    isActivo: true,
    condiciones: { features: ['multi-user', 'api-access'] },
  };

  describe('toDomain', () => {
    it('reconstitutes an AdminPlanData preserving all fields', () => {
      const plan = mapper.toDomain(validPersistence);

      expect(plan.id).toBe(1);
      expect(plan.codigo).toBe('PROFESIONAL');
      expect(plan.nombre).toBe('Plan Profesional');
      expect(plan.descripcion).toBe('Plan para estudios medianos');
      expect(plan.maxClientes).toBe(50);
      expect(plan.maxUsuarios).toBe(5);
      expect(plan.precio).toBe(9999.99);
      expect(plan.isPublico).toBe(true);
      expect(plan.isActivo).toBe(true);
      expect(plan.condiciones).toEqual({ features: ['multi-user', 'api-access'] });
    });

    it('handles optional fields as undefined', () => {
      const { id: _id, descripcion: _desc, condiciones: _cond, ...rest } = validPersistence;
      const plan = mapper.toDomain(rest as AdminPlanPersistence);
      expect(plan.id).toBeUndefined();
      expect(plan.descripcion).toBeUndefined();
      expect(plan.condiciones).toBeUndefined();
    });

    it('rejects missing required fields (Zod validation)', () => {
      const bad = { ...validPersistence } as Partial<AdminPlanPersistence>;
      delete bad.codigo;
      expect(() => mapper.toDomain(bad as AdminPlanPersistence)).toThrow();
    });

    it('rejects empty codigo (Zod validation)', () => {
      expect(() => mapper.toDomain({ ...validPersistence, codigo: '' })).toThrow();
    });

    it('rejects empty nombre (Zod validation)', () => {
      expect(() => mapper.toDomain({ ...validPersistence, nombre: '' })).toThrow();
    });

    it('rejects wrong types (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        isPublico: 'true' as unknown as boolean,
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects negative maxClientes (Zod validation)', () => {
      expect(() => mapper.toDomain({ ...validPersistence, maxClientes: -1 })).toThrow();
    });

    it('rejects negative precio (Zod validation)', () => {
      expect(() => mapper.toDomain({ ...validPersistence, precio: -100 })).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from an AdminPlanData', () => {
      const plan = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(plan)).toEqual(validPersistence);
    });

    it('omits optional fields when absent', () => {
      const minimal = {
        codigo: 'BASICO',
        nombre: 'Plan Básico',
        maxClientes: 10,
        maxUsuarios: 1,
        precio: 0,
        isPublico: true,
        isActivo: true,
      };
      const plan = mapper.toDomain(minimal);
      const out = mapper.toPersistence(plan);
      expect(out.id).toBeUndefined();
      expect(out.descripcion).toBeUndefined();
      expect(out.condiciones).toBeUndefined();
    });

    it('produces output that satisfies the persistence schema', () => {
      const plan = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(plan);
      expect(() => adminPlanPersistenceSchema.parse(out)).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const plan = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(plan)).toEqual(validPersistence);
    });
  });

  describe('fromSchema', () => {
    const schemaEntity = {
      id: 1,
      codigo: 'PROFESIONAL',
      nombre: 'Plan Profesional',
      descripcion: 'Plan para estudios medianos',
      maxClientes: 50,
      maxUsuarios: 5,
      precio: 9999.99,
      isPublico: true,
      isActivo: true,
      condiciones: { features: ['multi-user', 'api-access'] },
    } as unknown as PlanEntity;

    it('maps PlanEntity to persistence shape', () => {
      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('preserves undefined optional fields', () => {
      const withoutOptionals = {
        ...schemaEntity,
        descripcion: undefined,
        condiciones: undefined,
      } as unknown as PlanEntity;
      const result = mapper.fromSchema(withoutOptionals);
      expect(result.descripcion).toBeUndefined();
      expect(result.condiciones).toBeUndefined();
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const plan = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(plan.id).toBe(1);
      expect(plan.codigo).toBe('PROFESIONAL');
      expect(plan.maxClientes).toBe(50);
    });
  });
});
