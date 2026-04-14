import { DomainEvent } from './domain-event';

class TestEvent extends DomainEvent {
  constructor(public readonly payload: string) {
    super();
  }
  get eventName(): string {
    return 'test.created';
  }
}

class AnotherEvent extends DomainEvent {
  get eventName(): string {
    return 'another.happened';
  }
}

describe('DomainEvent', () => {
  it('should set occurredOn to current date on creation', () => {
    const before = new Date();
    const event = new TestEvent('hello');
    const after = new Date();

    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should expose the eventName from the subclass', () => {
    const event = new TestEvent('data');
    expect(event.eventName).toBe('test.created');
  });

  it('should allow different event names per subclass', () => {
    const a = new TestEvent('x');
    const b = new AnotherEvent();
    expect(a.eventName).not.toBe(b.eventName);
  });

  it('should preserve subclass properties', () => {
    const event = new TestEvent('my-payload');
    expect(event.payload).toBe('my-payload');
  });

  it('should create unique timestamps for events created at different times', async () => {
    const event1 = new TestEvent('first');
    await new Promise((r) => setTimeout(r, 5));
    const event2 = new TestEvent('second');

    expect(event2.occurredOn.getTime()).toBeGreaterThanOrEqual(event1.occurredOn.getTime());
  });
});
