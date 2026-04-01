import { VencimientoVencido } from './vencimiento-vencido.event';

describe('VencimientoVencido Event', () => {
  it('should create event with correct properties', () => {
    const event = new VencimientoVencido('v1', 'c1', 'IIBB', '2026-03');
    expect(event.vencimientoId).toBe('v1');
    expect(event.clienteId).toBe('c1');
    expect(event.tipoObligacion).toBe('IIBB');
    expect(event.periodo).toBe('2026-03');
    expect(event.eventName).toBe('obligaciones.vencimiento-vencido');
    expect(event.occurredOn).toBeInstanceOf(Date);
  });
});
