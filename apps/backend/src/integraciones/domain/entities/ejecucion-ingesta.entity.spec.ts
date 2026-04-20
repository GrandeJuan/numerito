import {
  EjecucionIngesta,
  ESTADO_EJECUCION,
  DISPARADOR_INGESTA,
} from './ejecucion-ingesta.entity';
import { FUENTE_INGESTA } from './configuracion-ingesta.entity';

describe('EjecucionIngesta', () => {
  it('should create with EN_CURSO estado', () => {
    const ej = EjecucionIngesta.create({
      fuente: FUENTE_INGESTA.ARCA,
      disparador: DISPARADOR_INGESTA.MANUAL,
      disparadoPor: 'user-1',
    });
    expect(ej.fuente).toBe('ARCA');
    expect(ej.estado).toBe(ESTADO_EJECUCION.EN_CURSO);
    expect(ej.disparador).toBe('MANUAL');
    expect(ej.disparadoPor).toBe('user-1');
    expect(ej.inicio).toBeInstanceOf(Date);
    expect(ej.fin).toBeNull();
    expect(ej.reglasNuevas).toBe(0);
    expect(ej.reglasModificadas).toBe(0);
    expect(ej.errores).toEqual([]);
  });

  it('should create with SCHEDULE disparador and null disparadoPor', () => {
    const ej = EjecucionIngesta.create({
      fuente: FUENTE_INGESTA.ARBA,
      disparador: DISPARADOR_INGESTA.SCHEDULE,
    });
    expect(ej.disparador).toBe('SCHEDULE');
    expect(ej.disparadoPor).toBeNull();
  });

  it('should complete as EXITOSA with reglas counts', () => {
    const ej = EjecucionIngesta.create({
      fuente: FUENTE_INGESTA.ARCA,
      disparador: DISPARADOR_INGESTA.MANUAL,
    });
    ej.completarExitosa(5, 3);
    expect(ej.estado).toBe(ESTADO_EJECUCION.EXITOSA);
    expect(ej.fin).toBeInstanceOf(Date);
    expect(ej.reglasNuevas).toBe(5);
    expect(ej.reglasModificadas).toBe(3);
  });

  it('should complete as FALLIDA with errores', () => {
    const ej = EjecucionIngesta.create({
      fuente: FUENTE_INGESTA.AGIP,
      disparador: DISPARADOR_INGESTA.SCHEDULE,
    });
    ej.completarFallida(['timeout', 'parse error']);
    expect(ej.estado).toBe(ESTADO_EJECUCION.FALLIDA);
    expect(ej.fin).toBeInstanceOf(Date);
    expect(ej.errores).toEqual(['timeout', 'parse error']);
  });

  it('should aggregate errors via agregarError', () => {
    const ej = EjecucionIngesta.create({
      fuente: FUENTE_INGESTA.ARCA,
      disparador: DISPARADOR_INGESTA.MANUAL,
    });
    ej.agregarError('err1');
    ej.agregarError('err2');
    expect(ej.errores).toEqual(['err1', 'err2']);
  });

  it('should reconstitute from persistence data', () => {
    const inicio = new Date('2026-04-01T10:00:00Z');
    const fin = new Date('2026-04-01T10:05:00Z');
    const ej = EjecucionIngesta.reconstitute(
      {
        fuente: 'BCRA_FERIADOS',
        estado: 'EXITOSA',
        disparador: 'SCHEDULE',
        disparadoPor: null,
        inicio,
        fin,
        reglasNuevas: 10,
        reglasModificadas: 2,
        errores: [],
      },
      'test-id',
    );
    expect(ej.id).toBe('test-id');
    expect(ej.fuente).toBe('BCRA_FERIADOS');
    expect(ej.estado).toBe('EXITOSA');
    expect(ej.inicio).toEqual(inicio);
    expect(ej.fin).toEqual(fin);
    expect(ej.reglasNuevas).toBe(10);
    expect(ej.reglasModificadas).toBe(2);
  });
});
