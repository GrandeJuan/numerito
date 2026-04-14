import { LibroContable, TIPO_LIBRO } from './libro-contable.entity';

describe('LibroContable Entity', () => {
  it('should create a libro contable', () => {
    const libro = LibroContable.create({
      clienteId: 'c1',
      estudioId: 'e1',
      tipo: TIPO_LIBRO.IVA_COMPRAS,
      periodo: '2026',
    });
    expect(libro.id).toBeDefined();
    expect(libro.tipo).toBe(TIPO_LIBRO.IVA_COMPRAS);
    expect(libro.isRubricado).toBe(false);
  });

  it('should rubricar a libro', () => {
    const libro = LibroContable.create({
      clienteId: 'c1',
      estudioId: 'e1',
      tipo: TIPO_LIBRO.DIARIO,
      periodo: '2026',
    });
    libro.rubricar('RUB-2026-001');
    expect(libro.isRubricado).toBe(true);
    expect(libro.numeroRubrica).toBe('RUB-2026-001');
  });

  it('should not rubricar twice', () => {
    const libro = LibroContable.create({
      clienteId: 'c1',
      estudioId: 'e1',
      tipo: TIPO_LIBRO.DIARIO,
      periodo: '2026',
    });
    libro.rubricar('RUB-2026-001');
    expect(() => libro.rubricar('RUB-2026-002')).toThrow('El libro ya está rubricado');
  });

  it('should expose all getters', () => {
    const libro = LibroContable.create({
      clienteId: 'c1',
      estudioId: 'e1',
      tipo: TIPO_LIBRO.IVA_VENTAS,
      periodo: '2025',
    });
    expect(libro.clienteId).toBe('c1');
    expect(libro.estudioId).toBe('e1');
    expect(libro.tipo).toBe(TIPO_LIBRO.IVA_VENTAS);
    expect(libro.periodo).toBe('2025');
    expect(libro.isRubricado).toBe(false);
    expect(libro.numeroRubrica).toBeUndefined();
  });

  describe('reconstitute', () => {
    it('should preserve all fields including persisted state', () => {
      const libro = LibroContable.reconstitute(
        {
          clienteId: 'c1',
          estudioId: 'e1',
          tipo: TIPO_LIBRO.DIARIO,
          periodo: '2026',
          isRubricado: true,
          numeroRubrica: 'RUB-2026-001',
        },
        'existing-id',
      );

      expect(libro.id).toBe('existing-id');
      expect(libro.clienteId).toBe('c1');
      expect(libro.estudioId).toBe('e1');
      expect(libro.tipo).toBe(TIPO_LIBRO.DIARIO);
      expect(libro.periodo).toBe('2026');
      expect(libro.isRubricado).toBe(true);
      expect(libro.numeroRubrica).toBe('RUB-2026-001');
    });

    it('should not emit domain events on reconstitute', () => {
      const libro = LibroContable.reconstitute(
        {
          clienteId: 'c1',
          estudioId: 'e1',
          tipo: TIPO_LIBRO.IVA_COMPRAS,
          periodo: '2026',
          isRubricado: false,
        },
        'id-1',
      );

      expect(libro.getDomainEvents()).toHaveLength(0);
    });

    it('should allow domain operations on reconstituted entities', () => {
      const libro = LibroContable.reconstitute(
        {
          clienteId: 'c1',
          estudioId: 'e1',
          tipo: TIPO_LIBRO.SUELDOS,
          periodo: '2026',
          isRubricado: false,
        },
        'id-1',
      );

      libro.rubricar('RUB-2026-002');
      expect(libro.isRubricado).toBe(true);
      expect(libro.numeroRubrica).toBe('RUB-2026-002');
    });
  });
});
