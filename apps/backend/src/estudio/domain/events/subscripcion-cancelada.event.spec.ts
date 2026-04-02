import { SubscripcionCancelada } from './subscripcion-cancelada.event';

describe('SubscripcionCancelada Event', () => {
  it('should create event with cancellation data', () => {
    const event = new SubscripcionCancelada('sub-1', 'estudio-1');
    expect(event.eventName).toBe('estudio.subscripcion-cancelada');
    expect(event.subscripcionId).toBe('sub-1');
    expect(event.estudioId).toBe('estudio-1');
    expect(event.occurredOn).toBeInstanceOf(Date);
  });
});
