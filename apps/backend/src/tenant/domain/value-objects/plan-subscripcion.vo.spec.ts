import { PlanSubscripcion, PLAN } from './plan-subscripcion.vo';

describe('PlanSubscripcion Value Object', () => {
  it('should create a plan with limits from DB', () => {
    const plan = PlanSubscripcion.create(PLAN.PROFESIONAL, 50, 5);
    expect(plan.value).toBe(PLAN.PROFESIONAL);
    expect(plan.maxClientes).toBe(50);
    expect(plan.maxUsuarios).toBe(5);
  });

  it('should support unlimited for enterprise', () => {
    const plan = PlanSubscripcion.create(PLAN.ENTERPRISE, Infinity, Infinity);
    expect(plan.maxClientes).toBe(Infinity);
    expect(plan.maxUsuarios).toBe(Infinity);
  });

  it('should be equal when all values match', () => {
    const p1 = PlanSubscripcion.create(PLAN.FREE, 5, 1);
    const p2 = PlanSubscripcion.create(PLAN.FREE, 5, 1);
    expect(p1.equals(p2)).toBe(true);
  });

  it('should not be equal when limits differ', () => {
    const p1 = PlanSubscripcion.create(PLAN.FREE, 5, 1);
    const p2 = PlanSubscripcion.create(PLAN.FREE, 10, 2);
    expect(p1.equals(p2)).toBe(false);
  });
});
