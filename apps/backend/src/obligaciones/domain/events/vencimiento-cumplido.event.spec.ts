import { VencimientoCumplido } from './vencimiento-cumplido.event';

describe('VencimientoCumplido Event', () => {
  it('should create event with correct properties', () => {
    const event = new VencimientoCumplido('v1', 'c1', 'IVA', '2026-03');
    expect(event.vencimientoId).toBe('v1');
    expect(event.clienteId).toBe('c1');
    expect(event.tipoObligacion).toBe('IVA');
    expect(event.periodo).toBe('2026-03');
    expect(event.eventName).toBe('obligaciones.vencimiento-cumplido');
    expect(event.occurredOn).toBeInstanceOf(Date);
  });
});
