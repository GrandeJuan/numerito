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
});
