import { v4 } from 'uuid';

export abstract class BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(id?: string) {
    this.id = id ?? v4();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
