import { HistorialPlan } from './historial-plan.entity';

describe('HistorialPlan Entity', () => {
  it('should create a historial plan entry', () => {
    const historial = HistorialPlan.create({
      estudioId: 'estudio-1',
      planAnteriorId: 'FREE',
      planNuevoId: 'PROFESIONAL',
      motivo: 'Upgrade de plan',
    });

    expect(historial.id).toBeDefined();
    expect(historial.estudioId).toBe('estudio-1');
    expect(historial.planAnteriorId).toBe('FREE');
    expect(historial.planNuevoId).toBe('PROFESIONAL');
    expect(historial.fechaCambio).toBeInstanceOf(Date);
    expect(historial.motivo).toBe('Upgrade de plan');
  });

  it('should create with provided id', () => {
    const historial = HistorialPlan.create({
      estudioId: 'estudio-1',
      planAnteriorId: 'FREE',
      planNuevoId: 'PROFESIONAL',
      motivo: 'Upgrade',
    }, 'custom-id');

    expect(historial.id).toBe('custom-id');
  });

  it('should allow null motivo', () => {
    const historial = HistorialPlan.create({
      estudioId: 'estudio-1',
      planAnteriorId: 'FREE',
      planNuevoId: 'ENTERPRISE',
    });

    expect(historial.motivo).toBeUndefined();
  });

  describe('reconstitute', () => {
    it('should reconstitute preserving all fields including fechaCambio', () => {
      const fechaCambio = new Date('2025-06-15');
      const historial = HistorialPlan.reconstitute({
        estudioId: 'estudio-1',
        planAnteriorId: 'FREE',
        planNuevoId: 'PROFESIONAL',
        motivo: 'Upgrade',
        fechaCambio,
      }, 'existing-id');

      expect(historial.id).toBe('existing-id');
      expect(historial.estudioId).toBe('estudio-1');
      expect(historial.planAnteriorId).toBe('FREE');
      expect(historial.planNuevoId).toBe('PROFESIONAL');
      expect(historial.fechaCambio).toBe(fechaCambio);
      expect(historial.motivo).toBe('Upgrade');
    });

    it('should not emit domain events on reconstitution', () => {
      const historial = HistorialPlan.reconstitute({
        estudioId: 'estudio-1',
        planAnteriorId: 'FREE',
        planNuevoId: 'PROFESIONAL',
        fechaCambio: new Date(),
      }, 'some-id');

      expect(historial.getDomainEvents()).toHaveLength(0);
    });
  });
});
