import { Estudio } from './estudio.entity';
import { NombreEstudio } from '../value-objects/nombre-estudio.vo';
import { PlanSubscripcion } from '../value-objects/plan-subscripcion.vo';
import { PLAN } from '@numerito/shared';

describe('Estudio Entity (Aggregate Root)', () => {
  const createEstudio = () => {
    return Estudio.create({
      nombre: NombreEstudio.create('Grande & Asociados'),
      plan: PlanSubscripcion.create(PLAN.PROFESIONAL, 50, 5),
      cuit: '20-12345678-6',
    });
  };

  it('should create an estudio with valid data', () => {
    const estudio = createEstudio();
    expect(estudio.id).toBeDefined();
    expect(estudio.nombre.value).toBe('Grande & Asociados');
    expect(estudio.plan.value).toBe(PLAN.PROFESIONAL);
    expect(estudio.cuit).toBe('20-12345678-6');
    expect(estudio.isActive).toBe(true);
  });

  it('should change plan', () => {
    const estudio = createEstudio();
    const newPlan = PlanSubscripcion.create(PLAN.ENTERPRISE, Infinity, Infinity);
    estudio.changePlan(newPlan);
    expect(estudio.plan.value).toBe(PLAN.ENTERPRISE);
  });

  it('should update nombre', () => {
    const estudio = createEstudio();
    const newNombre = NombreEstudio.create('Perez Contadores');
    estudio.updateNombre(newNombre);
    expect(estudio.nombre.value).toBe('Perez Contadores');
  });

  it('should deactivate', () => {
    const estudio = createEstudio();
    estudio.deactivate();
    expect(estudio.isActive).toBe(false);
  });

  it('should check if can add clientes based on plan', () => {
    const estudio = createEstudio();
    expect(estudio.canAddCliente(49)).toBe(true);
    expect(estudio.canAddCliente(50)).toBe(false);
  });

  it('should check if can add usuarios based on plan', () => {
    const estudio = createEstudio();
    expect(estudio.canAddUsuario(4)).toBe(true);
    expect(estudio.canAddUsuario(5)).toBe(false);
  });

  it('should activate after deactivation', () => {
    const estudio = createEstudio();
    estudio.deactivate();
    expect(estudio.isActive).toBe(false);
    estudio.activate();
    expect(estudio.isActive).toBe(true);
  });

  describe('reconstitute', () => {
    it('should reconstitute preserving all fields including inactive state', () => {
      const estudio = Estudio.reconstitute({
        nombre: NombreEstudio.create('Reconstituted Studio'),
        plan: PlanSubscripcion.create(PLAN.ENTERPRISE, Infinity, Infinity),
        cuit: '20-12345678-6',
        isActive: false,
      }, 'existing-id');

      expect(estudio.id).toBe('existing-id');
      expect(estudio.nombre.value).toBe('Reconstituted Studio');
      expect(estudio.plan.value).toBe(PLAN.ENTERPRISE);
      expect(estudio.cuit).toBe('20-12345678-6');
      expect(estudio.isActive).toBe(false);
    });

    it('should not emit domain events on reconstitution', () => {
      const estudio = Estudio.reconstitute({
        nombre: NombreEstudio.create('Test'),
        plan: PlanSubscripcion.create(PLAN.FREE, 10, 2),
        cuit: '20-12345678-6',
        isActive: true,
      }, 'some-id');

      expect(estudio.getDomainEvents()).toHaveLength(0);
    });

    it('should allow domain operations on reconstituted entities', () => {
      const estudio = Estudio.reconstitute({
        nombre: NombreEstudio.create('Test'),
        plan: PlanSubscripcion.create(PLAN.FREE, 10, 2),
        cuit: '20-12345678-6',
        isActive: true,
      }, 'some-id');

      const newPlan = PlanSubscripcion.create(PLAN.PROFESIONAL, 50, 5);
      estudio.changePlan(newPlan);
      expect(estudio.plan.value).toBe(PLAN.PROFESIONAL);
    });
  });
});
