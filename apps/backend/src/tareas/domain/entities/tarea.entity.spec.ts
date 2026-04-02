import { Tarea, ESTADO_TAREA, PRIORIDAD } from './tarea.entity';

describe('Tarea Entity', () => {
  const createTarea = () => {
    return Tarea.create({
      titulo: 'Preparar DDJJ IVA',
      clienteId: 'c1',
      estudioId: 'e1',
      prioridad: PRIORIDAD.ALTA,
    });
  };

  it('should create a tarea in PENDIENTE state', () => {
    const t = createTarea();
    expect(t.estado).toBe(ESTADO_TAREA.PENDIENTE);
    expect(t.prioridad).toBe(PRIORIDAD.ALTA);
    expect(t.horasRegistradas).toBe(0);
  });

  it('should move to EN_PROGRESO', () => {
    const t = createTarea();
    t.iniciar();
    expect(t.estado).toBe(ESTADO_TAREA.EN_PROGRESO);
  });

  it('should complete', () => {
    const t = createTarea();
    t.iniciar();
    t.completar();
    expect(t.estado).toBe(ESTADO_TAREA.COMPLETADO);
  });

  it('should not complete from PENDIENTE', () => {
    const t = createTarea();
    expect(() => t.completar()).toThrow();
  });

  it('should assign responsable', () => {
    const t = createTarea();
    t.asignar('user-1');
    expect(t.responsableId).toBe('user-1');
  });

  it('should register hours', () => {
    const t = createTarea();
    t.iniciar();
    t.registrarHoras(2.5);
    t.registrarHoras(1.5);
    expect(t.horasRegistradas).toBe(4);
  });

  it('should reject zero hours', () => {
    const t = createTarea();
    expect(() => t.registrarHoras(0)).toThrow('Las horas deben ser mayor a 0');
  });

  it('should reject negative hours', () => {
    const t = createTarea();
    expect(() => t.registrarHoras(-1)).toThrow('Las horas deben ser mayor a 0');
  });

  it('should add comment', () => {
    const t = createTarea();
    t.agregarComentario('user-1', 'Avance parcial');
    expect(t.comentarios).toHaveLength(1);
    expect(t.comentarios[0].texto).toBe('Avance parcial');
  });

  it('should expose all getters', () => {
    const t = Tarea.create({
      titulo: 'Tarea test',
      clienteId: 'c1',
      estudioId: 'e1',
      prioridad: PRIORIDAD.MEDIA,
      descripcion: 'Descripcion test',
    });
    expect(t.titulo).toBe('Tarea test');
    expect(t.descripcion).toBe('Descripcion test');
    expect(t.clienteId).toBe('c1');
    expect(t.estudioId).toBe('e1');
    expect(t.estado).toBe(ESTADO_TAREA.PENDIENTE);
    expect(t.prioridad).toBe(PRIORIDAD.MEDIA);
    expect(t.responsableId).toBeUndefined();
    expect(t.horasRegistradas).toBe(0);
    expect(t.comentarios).toEqual([]);
  });

  it('should create tarea without optional fields', () => {
    const t = Tarea.create({
      titulo: 'Sin opcionales',
      estudioId: 'e1',
      prioridad: PRIORIDAD.BAJA,
    });
    expect(t.clienteId).toBeUndefined();
    expect(t.descripcion).toBeUndefined();
  });
});
