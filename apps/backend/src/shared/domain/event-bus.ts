import type { DomainEvent } from './domain-event';

export interface EventBus {
  publish(event: DomainEvent): void;
  publishAll(events: DomainEvent[]): void;
}

export const EVENT_BUS = Symbol('EventBus');
