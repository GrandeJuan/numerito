import { SubscripcionRenovada } from './subscripcion-renovada.event';

describe('SubscripcionRenovada Event', () => {
  it('should create event with renovation data', () => {
    const nuevaFechaFin = new Date('2028-01-01');
    const event = new SubscripcionRenovada('sub-1', 'estudio-1', nuevaFechaFin);
    expect(event.eventName).toBe('estudio.subscripcion-renovada');
    expect(event.subscripcionId).toBe('sub-1');
    expect(event.estudioId).toBe('estudio-1');
    expect(event.nuevaFechaFin).toEqual(nuevaFechaFin);
    expect(event.occurredOn).toBeInstanceOf(Date);
  });
});
