import { GlobalRepository } from './global.repository';

class FakeEntity {
  constructor(
    public id: string,
    public name: string,
  ) {}
}

class TestGlobalRepo extends GlobalRepository<FakeEntity> {
  private store: FakeEntity[] = [];

  async findById(id: string): Promise<FakeEntity | null> {
    return this.store.find((e) => e.id === id) ?? null;
  }

  async findAll(): Promise<FakeEntity[]> {
    return [...this.store];
  }

  async save(entity: FakeEntity): Promise<void> {
    const idx = this.store.findIndex((e) => e.id === entity.id);
    if (idx >= 0) this.store[idx] = entity;
    else this.store.push(entity);
  }

  async delete(entity: FakeEntity): Promise<void> {
    this.store = this.store.filter((e) => e.id !== entity.id);
  }

  addSeed(entity: FakeEntity) {
    this.store.push(entity);
  }
}

describe('GlobalRepository', () => {
  let repo: TestGlobalRepo;

  beforeEach(() => {
    repo = new TestGlobalRepo();
    repo.addSeed(new FakeEntity('1', 'A'));
    repo.addSeed(new FakeEntity('2', 'B'));
  });

  it('should return all entities without tenant filtering', async () => {
    const results = await repo.findAll();
    expect(results).toHaveLength(2);
  });

  it('should find by id globally', async () => {
    const result = await repo.findById('2');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('B');
  });
});
