import { BaseRepository } from './base.repository';

export abstract class GlobalRepository<T> implements BaseRepository<T> {
  abstract findById(id: string): Promise<T | null>;
  abstract findAll(): Promise<T[]>;
  abstract save(entity: T): Promise<void>;
  abstract delete(entity: T): Promise<void>;
}
