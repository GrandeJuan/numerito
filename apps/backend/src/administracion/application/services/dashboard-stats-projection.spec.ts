import { DashboardStatsProjection } from './dashboard-stats-projection';

describe('DashboardStatsProjection', () => {
  let projection: DashboardStatsProjection;

  beforeEach(() => {
    projection = new DashboardStatsProjection();
  });

  it('should start with zero deltas', () => {
    const deltas = projection.getDeltas();
    expect(deltas.usuariosRegistrados).toBe(0);
    expect(deltas.subscripcionesCreadas).toBe(0);
    expect(deltas.subscripcionesCanceladas).toBe(0);
    expect(deltas.churnEvents).toBe(0);
    expect(deltas.sinceTimestamp).toBeInstanceOf(Date);
  });

  it('should increment usuarios', () => {
    projection.incrementUsuarios();
    projection.incrementUsuarios();
    expect(projection.getDeltas().usuariosRegistrados).toBe(2);
  });

  it('should increment subscripciones', () => {
    projection.incrementSubscripciones();
    expect(projection.getDeltas().subscripcionesCreadas).toBe(1);
  });

  it('should decrement subscripciones', () => {
    projection.decrementSubscripciones();
    projection.decrementSubscripciones();
    expect(projection.getDeltas().subscripcionesCanceladas).toBe(2);
  });

  it('should increment churn', () => {
    projection.incrementChurn();
    expect(projection.getDeltas().churnEvents).toBe(1);
  });

  it('should reset all counters', () => {
    projection.incrementUsuarios();
    projection.incrementSubscripciones();
    projection.decrementSubscripciones();
    projection.incrementChurn();

    projection.reset();
    const deltas = projection.getDeltas();
    expect(deltas.usuariosRegistrados).toBe(0);
    expect(deltas.subscripcionesCreadas).toBe(0);
    expect(deltas.subscripcionesCanceladas).toBe(0);
    expect(deltas.churnEvents).toBe(0);
  });

  it('should update sinceTimestamp on reset', () => {
    const beforeReset = projection.getDeltas().sinceTimestamp;
    projection.reset();
    const afterReset = projection.getDeltas().sinceTimestamp;
    expect(afterReset.getTime()).toBeGreaterThanOrEqual(beforeReset.getTime());
  });
});
