import { randomUUID } from 'crypto';
import type { DomainEvent } from './domain-event';

export abstract class BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  updatedAt: Date;

  private _domainEvents: DomainEvent[] = [];

  constructor(id?: string) {
    this.id = id ?? randomUUID();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
