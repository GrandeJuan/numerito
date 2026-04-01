import { LibroContable, TIPO_LIBRO } from './libro-contable.entity';

describe('LibroContable Entity', () => {
  it('should create a libro contable', () => {
    const libro = LibroContable.create({
      clienteId: 'c1',
      tenantId: 't1',
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
      tenantId: 't1',
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
      tenantId: 't1',
      tipo: TIPO_LIBRO.DIARIO,
      periodo: '2026',
    });
    libro.rubricar('RUB-2026-001');
    expect(() => libro.rubricar('RUB-2026-002')).toThrow('El libro ya está rubricado');
  });

  it('should expose all getters', () => {
    const libro = LibroContable.create({
      clienteId: 'c1',
      tenantId: 't1',
      tipo: TIPO_LIBRO.IVA_VENTAS,
      periodo: '2025',
    });
    expect(libro.clienteId).toBe('c1');
    expect(libro.tenantId).toBe('t1');
    expect(libro.tipo).toBe(TIPO_LIBRO.IVA_VENTAS);
    expect(libro.periodo).toBe('2025');
    expect(libro.isRubricado).toBe(false);
    expect(libro.numeroRubrica).toBeUndefined();
  });
});
