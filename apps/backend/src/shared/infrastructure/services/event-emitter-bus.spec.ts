import { EventEmitterBus } from './event-emitter-bus';
import { DomainEvent } from '../../domain/domain-event';

class TestEvent extends DomainEvent {
  constructor(public readonly data: string) {
    super();
  }
  get eventName(): string {
    return 'test.event';
  }
}

class AnotherEvent extends DomainEvent {
  get eventName(): string {
    return 'test.another';
  }
}

describe('EventEmitterBus', () => {
  let bus: EventEmitterBus;
  let mockEmitter: { emit: jest.Mock };

  beforeEach(() => {
    mockEmitter = { emit: jest.fn() };
    bus = new EventEmitterBus(mockEmitter as any);
  });

  describe('publish', () => {
    it('should emit the event using its eventName', () => {
      const event = new TestEvent('hello');
      bus.publish(event);
      expect(mockEmitter.emit).toHaveBeenCalledWith('test.event', event);
    });

    it('should pass the full event object to the emitter', () => {
      const event = new TestEvent('payload');
      bus.publish(event);
      const emitted = mockEmitter.emit.mock.calls[0][1];
      expect(emitted.data).toBe('payload');
      expect(emitted.occurredOn).toBeInstanceOf(Date);
    });
  });

  describe('publishAll', () => {
    it('should emit all events in order', () => {
      const events = [new TestEvent('a'), new AnotherEvent()];
      bus.publishAll(events);
      expect(mockEmitter.emit).toHaveBeenCalledTimes(2);
      expect(mockEmitter.emit.mock.calls[0][0]).toBe('test.event');
      expect(mockEmitter.emit.mock.calls[1][0]).toBe('test.another');
    });

    it('should handle empty array', () => {
      bus.publishAll([]);
      expect(mockEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
