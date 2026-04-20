import {
  SugerenciaProrroga,
  ESTADO_SUGERENCIA,
} from './sugerencia-prorroga.entity';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';

function makeProps(overrides: Partial<Parameters<typeof SugerenciaProrroga.create>[0]> = {}) {
  return {
    vencimientoId: 'venc-1',
    estudioId: 'est-1',
    clienteId: 'cli-1',
    tipoObligacion: 'IVA',
    periodo: '2026-05',
    fechaOriginal: new Date('2026-05-20'),
    fechaSugerida: new Date('2026-05-22'),
    motivo: 'diaVencimiento: 20 → 22',
    reglaActivaId: 'regla-1',
    ejecucionIngestaId: 'ejec-1',
    ...overrides,
  };
}

describe('SugerenciaProrroga', () => {
  describe('create', () => {
    it('crea una sugerencia en estado ABIERTA', () => {
      const s = SugerenciaProrroga.create(makeProps());
      expect(s.estado).toBe(ESTADO_SUGERENCIA.ABIERTA);
      expect(s.vencimientoId).toBe('venc-1');
      expect(s.fechaOriginal).toEqual(new Date('2026-05-20'));
      expect(s.fechaSugerida).toEqual(new Date('2026-05-22'));
      expect(s.motivo).toBe('diaVencimiento: 20 → 22');
      expect(s.reglaActivaId).toBe('regla-1');
      expect(s.ejecucionIngestaId).toBe('ejec-1');
    });

    it('rechaza motivo vacío', () => {
      expect(() => SugerenciaProrroga.create(makeProps({ motivo: '' }))).toThrow(
        OperacionInvalidaError,
      );
    });

    it('rechaza motivo solo espacios', () => {
      expect(() => SugerenciaProrroga.create(makeProps({ motivo: '   ' }))).toThrow(
        OperacionInvalidaError,
      );
    });

    it('trimea el motivo', () => {
      const s = SugerenciaProrroga.create(makeProps({ motivo: '  cambio   ' }));
      expect(s.motivo).toBe('cambio');
    });
  });

  describe('aprobar', () => {
    it('transiciona de ABIERTA a APROBADA', () => {
      const s = SugerenciaProrroga.create(makeProps());
      s.aprobar();
      expect(s.estado).toBe(ESTADO_SUGERENCIA.APROBADA);
    });

    it('no permite aprobar si ya está APROBADA', () => {
      const s = SugerenciaProrroga.create(makeProps());
      s.aprobar();
      expect(() => s.aprobar()).toThrow(OperacionInvalidaError);
    });

    it('no permite aprobar si está DESCARTADA', () => {
      const s = SugerenciaProrroga.create(makeProps());
      s.descartar();
      expect(() => s.aprobar()).toThrow(OperacionInvalidaError);
    });
  });

  describe('descartar', () => {
    it('transiciona de ABIERTA a DESCARTADA', () => {
      const s = SugerenciaProrroga.create(makeProps());
      s.descartar();
      expect(s.estado).toBe(ESTADO_SUGERENCIA.DESCARTADA);
    });

    it('no permite descartar si ya está DESCARTADA', () => {
      const s = SugerenciaProrroga.create(makeProps());
      s.descartar();
      expect(() => s.descartar()).toThrow(OperacionInvalidaError);
    });

    it('no permite descartar si está APROBADA', () => {
      const s = SugerenciaProrroga.create(makeProps());
      s.aprobar();
      expect(() => s.descartar()).toThrow(OperacionInvalidaError);
    });
  });

  describe('reconstitute', () => {
    it('reconstruye desde persistencia', () => {
      const s = SugerenciaProrroga.reconstitute(
        {
          vencimientoId: 'venc-2',
          estudioId: 'est-2',
          clienteId: 'cli-2',
          tipoObligacion: 'SICOSS',
          periodo: '2026-06',
          fechaOriginal: new Date('2026-06-10'),
          fechaSugerida: new Date('2026-06-12'),
          motivo: 'diaVencimiento: 10 → 12',
          estado: ESTADO_SUGERENCIA.APROBADA,
          reglaActivaId: null,
          ejecucionIngestaId: null,
        },
        'reconst-id',
      );
      expect(s.id).toBe('reconst-id');
      expect(s.estado).toBe(ESTADO_SUGERENCIA.APROBADA);
      expect(s.tipoObligacion).toBe('SICOSS');
      expect(s.reglaActivaId).toBeNull();
    });
  });
});
