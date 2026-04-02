import { SubscripcionCreada } from './subscripcion-creada.event';

describe('SubscripcionCreada Event', () => {
  it('should create event with subscripcion data', () => {
    const event = new SubscripcionCreada('sub-1', 'estudio-1', 'PROFESIONAL');
    expect(event.eventName).toBe('estudio.subscripcion-creada');
    expect(event.subscripcionId).toBe('sub-1');
    expect(event.estudioId).toBe('estudio-1');
    expect(event.planId).toBe('PROFESIONAL');
    expect(event.occurredOn).toBeInstanceOf(Date);
  });
});
