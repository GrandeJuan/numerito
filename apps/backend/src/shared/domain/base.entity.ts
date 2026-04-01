import { randomUUID } from 'crypto';

export abstract class BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(id?: string) {
    this.id = id ?? randomUUID();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
