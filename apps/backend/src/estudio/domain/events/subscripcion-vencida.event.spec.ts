import { SubscripcionVencida } from './subscripcion-vencida.event';

describe('SubscripcionVencida Event', () => {
  it('should create event with expiration data', () => {
    const event = new SubscripcionVencida('sub-1', 'estudio-1');
    expect(event.eventName).toBe('estudio.subscripcion-vencida');
    expect(event.subscripcionId).toBe('sub-1');
    expect(event.estudioId).toBe('estudio-1');
    expect(event.occurredOn).toBeInstanceOf(Date);
  });
});
