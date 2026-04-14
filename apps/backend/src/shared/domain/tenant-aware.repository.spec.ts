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
    const tenantId = this.getTenantId();
    const idx = this.store.findIndex((e) => e.id === entity.id && e.estudioId === tenantId);
    if (idx >= 0) this.store[idx] = entity;
    else this.store.push(entity);
  }

  async delete(entity: FakeEntity): Promise<void> {
    const tenantId = this.getTenantId();
    this.store = this.store.filter((e) => !(e.id === entity.id && e.estudioId === tenantId));
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

  describe('delete tenant isolation', () => {
    it('should delete entity when tenant matches', async () => {
      context.estudioId = 'estudio-a';
      const entity = new FakeEntity('1', 'estudio-a', 'A1');
      await repo.delete(entity);
      const result = await repo.findById('1');
      expect(result).toBeNull();
    });

    it('should NOT delete entity from another tenant', async () => {
      context.estudioId = 'estudio-a';
      const entityFromB = new FakeEntity('2', 'estudio-b', 'B1');
      await repo.delete(entityFromB);
      // Switch to tenant B and verify entity still exists
      context.estudioId = 'estudio-b';
      const result = await repo.findById('2');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('B1');
    });
  });

  describe('save tenant isolation', () => {
    it('should save new entity for current tenant', async () => {
      context.estudioId = 'estudio-a';
      const newEntity = new FakeEntity('4', 'estudio-a', 'A3');
      await repo.save(newEntity);
      const result = await repo.findById('4');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('A3');
    });

    it('should update entity when tenant matches', async () => {
      context.estudioId = 'estudio-a';
      const updated = new FakeEntity('1', 'estudio-a', 'A1-updated');
      await repo.save(updated);
      const result = await repo.findById('1');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('A1-updated');
    });

    it('should NOT update entity from another tenant (creates new instead)', async () => {
      context.estudioId = 'estudio-a';
      // Try to save entity with ID from estudio-b — should not find existing, so creates new
      const crossTenant = new FakeEntity('2', 'estudio-a', 'HIJACKED');
      await repo.save(crossTenant);
      // Estudio-b's entity should be untouched
      context.estudioId = 'estudio-b';
      const original = await repo.findById('2');
      expect(original).not.toBeNull();
      expect(original!.name).toBe('B1');
    });
  });

  describe('data isolation between tenants', () => {
    it('should completely isolate data between two tenants', async () => {
      // Tenant A sees only their data
      context.estudioId = 'estudio-a';
      const tenantAData = await repo.findAll();
      expect(tenantAData.every((e) => e.estudioId === 'estudio-a')).toBe(true);

      // Tenant B sees only their data
      context.estudioId = 'estudio-b';
      const tenantBData = await repo.findAll();
      expect(tenantBData.every((e) => e.estudioId === 'estudio-b')).toBe(true);

      // No overlap
      const aIds = tenantAData.map((e) => e.id);
      const bIds = tenantBData.map((e) => e.id);
      expect(aIds.filter((id) => bIds.includes(id))).toHaveLength(0);
    });

    it('should not allow tenant A to access tenant B entity by ID', async () => {
      context.estudioId = 'estudio-a';
      // ID '2' belongs to estudio-b
      const result = await repo.findById('2');
      expect(result).toBeNull();
    });
  });
});
