import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { DomainEvent } from '../../domain/domain-event';
import type { EventBus } from '../../domain/event-bus';

@Injectable()
export class EventEmitterBus implements EventBus {
  constructor(private readonly emitter: EventEmitter2) {}

  publish(event: DomainEvent): void {
    this.emitter.emit(event.eventName, event);
  }

  publishAll(events: DomainEvent[]): void {
    for (const event of events) {
      this.publish(event);
    }
  }
}
