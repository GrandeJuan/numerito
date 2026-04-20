import { ConfiguracionIngesta, FUENTE_INGESTA } from './configuracion-ingesta.entity';

describe('ConfiguracionIngesta Entity', () => {
  const defaults = {
    fuente: FUENTE_INGESTA.ARCA,
    cadenciaDias: 7,
  } as const;

  it('should create with default habilitado=false', () => {
    const c = ConfiguracionIngesta.create(defaults);
    expect(c.id).toBeDefined();
    expect(c.fuente).toBe('ARCA');
    expect(c.habilitado).toBe(false);
    expect(c.cadenciaDias).toBe(7);
    expect(c.proximaEjecucion).toBeNull();
    expect(c.ultimaEjecucion).toBeNull();
    expect(c.ultimoResultado).toBeNull();
  });

  it('should create with explicit habilitado=true', () => {
    const c = ConfiguracionIngesta.create({ ...defaults, habilitado: true });
    expect(c.habilitado).toBe(true);
  });

  it('should reject cadenciaDias < 1', () => {
    expect(() => ConfiguracionIngesta.create({ ...defaults, cadenciaDias: 0 })).toThrow(
      'cadenciaDias debe ser >= 1',
    );
  });

  it('should habilitar', () => {
    const c = ConfiguracionIngesta.create(defaults);
    c.habilitar();
    expect(c.habilitado).toBe(true);
  });

  it('should deshabilitar and clear proximaEjecucion', () => {
    const c = ConfiguracionIngesta.create({ ...defaults, habilitado: true });
    c.registrarEjecucion('OK');
    expect(c.proximaEjecucion).not.toBeNull();
    c.deshabilitar();
    expect(c.habilitado).toBe(false);
    expect(c.proximaEjecucion).toBeNull();
  });

  it('should actualizarCadencia', () => {
    const c = ConfiguracionIngesta.create(defaults);
    c.actualizarCadencia(14);
    expect(c.cadenciaDias).toBe(14);
  });

  it('should reject actualizarCadencia < 1', () => {
    const c = ConfiguracionIngesta.create(defaults);
    expect(() => c.actualizarCadencia(0)).toThrow('cadenciaDias debe ser >= 1');
  });

  it('should registrarEjecucion and compute proximaEjecucion when habilitado', () => {
    const c = ConfiguracionIngesta.create({ ...defaults, habilitado: true });
    c.registrarEjecucion('OK: 5 reglas');
    expect(c.ultimaEjecucion).toBeInstanceOf(Date);
    expect(c.ultimoResultado).toBe('OK: 5 reglas');
    expect(c.proximaEjecucion).toBeInstanceOf(Date);
    // proxima = ultima + cadenciaDias
    const diff =
      c.proximaEjecucion!.getTime() - c.ultimaEjecucion!.getTime();
    expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('should NOT set proximaEjecucion when deshabilitado', () => {
    const c = ConfiguracionIngesta.create(defaults); // habilitado=false
    c.registrarEjecucion('OK');
    expect(c.ultimaEjecucion).toBeInstanceOf(Date);
    expect(c.proximaEjecucion).toBeNull();
  });

  it('should reconstitute from persisted state', () => {
    const now = new Date();
    const c = ConfiguracionIngesta.reconstitute(
      {
        fuente: 'BCRA_FERIADOS',
        habilitado: true,
        cadenciaDias: 30,
        proximaEjecucion: now,
        ultimaEjecucion: now,
        ultimoResultado: 'OK',
      },
      'reconstituted-id',
    );
    expect(c.id).toBe('reconstituted-id');
    expect(c.fuente).toBe('BCRA_FERIADOS');
    expect(c.habilitado).toBe(true);
    expect(c.cadenciaDias).toBe(30);
    expect(c.proximaEjecucion).toEqual(now);
    expect(c.ultimaEjecucion).toEqual(now);
    expect(c.ultimoResultado).toBe('OK');
  });

  it('should actualizar with both habilitado and cadenciaDias', () => {
    const c = ConfiguracionIngesta.create(defaults);
    c.actualizar({ habilitado: true, cadenciaDias: 14 });
    expect(c.habilitado).toBe(true);
    expect(c.cadenciaDias).toBe(14);
  });
});
