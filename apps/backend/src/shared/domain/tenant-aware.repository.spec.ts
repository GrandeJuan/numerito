import { TenantAwareRepository } from './tenant-aware.repository';

class FakeEntity {
  constructor(
    public id: string,
    public estudioId: string,
    public name: string,
  ) {}
}

class TestTenantRepo extends TenantAwareRepository<FakeEntity> {
  private store: FakeEntity[] = [];

  async findById(id: string): Promise<FakeEntity | null> {
    const tenantId = this.getTenantId();
    return this.store.find((e) => e.id === id && e.estudioId === tenantId) ?? null;
  }

  async findAll(): Promise<FakeEntity[]> {
    const tenantId = this.getTenantId();
    return this.store.filter((e) => e.estudioId === tenantId);
  }

  async save(entity: FakeEntity): Promise<void> {
    const idx = this.store.findIndex((e) => e.id === entity.id);
    if (idx >= 0) this.store[idx] = entity;
    else this.store.push(entity);
  }

  async delete(entity: FakeEntity): Promise<void> {
    this.store = this.store.filter((e) => e.id !== entity.id);
  }

  // expose for testing
  addSeed(entity: FakeEntity) {
    this.store.push(entity);
  }
}

describe('TenantAwareRepository', () => {
  let context: { estudioId?: string };
  let repo: TestTenantRepo;

  beforeEach(() => {
    context = { estudioId: undefined };
    repo = new TestTenantRepo(context);
    repo.addSeed(new FakeEntity('1', 'estudio-a', 'A1'));
    repo.addSeed(new FakeEntity('2', 'estudio-b', 'B1'));
    repo.addSeed(new FakeEntity('3', 'estudio-a', 'A2'));
  });

  it('should throw if estudioId is not set in context', () => {
    expect(() => repo.findAll()).rejects.toThrow('Tenant context not available');
  });

  it('should only return entities for the current tenant', async () => {
    context.estudioId = 'estudio-a';
    const results = await repo.findAll();
    expect(results).toHaveLength(2);
    expect(results.every((e) => e.estudioId === 'estudio-a')).toBe(true);
  });

  it('should not return entities from another tenant', async () => {
    context.estudioId = 'estudio-a';
    const result = await repo.findById('2');
    expect(result).toBeNull();
  });

  it('should find by id when tenant matches', async () => {
    context.estudioId = 'estudio-a';
    const result = await repo.findById('1');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('A1');
  });
});
