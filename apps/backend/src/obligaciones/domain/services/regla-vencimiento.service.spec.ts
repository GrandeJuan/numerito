import { ReglaVencimientoService } from './regla-vencimiento.service';
import { ReglaVencimiento } from '../entities/regla-vencimiento.entity';
import {
  TIPO_OBLIGACION,
  JURISDICCION,
  ESTADO_REGLA,
  ORIGEN_REGLA,
} from '@numerito/shared';

function makeRegla(overrides: Partial<Parameters<typeof ReglaVencimiento.reconstitute>[0]> = {}) {
  return ReglaVencimiento.reconstitute(
    {
      tipoObligacion: TIPO_OBLIGACION.IVA,
      jurisdiccion: JURISDICCION.ARCA,
      regimen: 'GENERAL',
      terminacionCuit: '6',
      diaVencimiento: 18,
      mesSiguiente: true,
      vigenciaDesde: new Date('2026-01-01'),
      vigenciaHasta: null,
      origen: ORIGEN_REGLA.MANUAL,
      estado: ESTADO_REGLA.ACTIVA,
      ...overrides,
    },
    `regla-${Math.random().toString(36).slice(2)}`,
  );
}

describe('ReglaVencimientoService', () => {
  let service: ReglaVencimientoService;
  let mockEntityRepo: any;

  beforeEach(() => {
    mockEntityRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findActivas: jest.fn(),
      findByEstado: jest.fn(),
      findVigentes: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    service = new ReglaVencimientoService(mockEntityRepo);
  });

  describe('calcularFechaVencimiento (legacy)', () => {
    it('should calculate due date from active rules', async () => {
      const regla = makeRegla({ terminacionCuit: '6', diaVencimiento: 18, mesSiguiente: true });
      mockEntityRepo.findActivas.mockResolvedValue([regla]);

      const fecha = await service.calcularFechaVencimiento(
        TIPO_OBLIGACION.IVA,
        '20123456786',
        '2026-03',
      );
      expect(fecha.getDate()).toBe(18);
      expect(fecha.getMonth()).toBe(3); // April
      expect(fecha.getFullYear()).toBe(2026);
    });

    it('should throw if no rule found', async () => {
      mockEntityRepo.findActivas.mockResolvedValue([]);

      await expect(
        service.calcularFechaVencimiento(TIPO_OBLIGACION.IVA, '20123456786', '2026-03'),
      ).rejects.toThrow('No hay regla de vencimiento');
    });
  });

  describe('calcularFechaConPerfil', () => {
    it('should calculate from PerfilFiscal', async () => {
      const regla = makeRegla();
      mockEntityRepo.findVigentes.mockResolvedValue([regla]);

      const fecha = await service.calcularFechaConPerfil(
        TIPO_OBLIGACION.IVA,
        { cuit: '20123456786', jurisdiccion: JURISDICCION.ARCA, regimen: 'GENERAL' },
        '2026-03',
      );
      expect(fecha.getDate()).toBe(18);
      expect(fecha.getMonth()).toBe(3);
      expect(mockEntityRepo.findVigentes).toHaveBeenCalledWith(
        TIPO_OBLIGACION.IVA,
        JURISDICCION.ARCA,
        'GENERAL',
        '6',
        expect.any(Date),
      );
    });

    it('should throw when no vigente rule', async () => {
      mockEntityRepo.findVigentes.mockResolvedValue([]);

      await expect(
        service.calcularFechaConPerfil(
          TIPO_OBLIGACION.IVA,
          { cuit: '20123456786', jurisdiccion: JURISDICCION.ARCA, regimen: 'GENERAL' },
          '2026-03',
        ),
      ).rejects.toThrow('No hay regla de vencimiento');
    });

    it('should throw when multiple vigente rules (ambiguous)', async () => {
      const r1 = makeRegla();
      const r2 = makeRegla();
      mockEntityRepo.findVigentes.mockResolvedValue([r1, r2]);

      await expect(
        service.calcularFechaConPerfil(
          TIPO_OBLIGACION.IVA,
          { cuit: '20123456786', jurisdiccion: JURISDICCION.ARCA, regimen: 'GENERAL' },
          '2026-03',
        ),
      ).rejects.toThrow('se esperaba una sola');
    });
  });

  describe('validarSinConflicto', () => {
    it('should return null when no conflict', async () => {
      mockEntityRepo.findActivas.mockResolvedValue([]);
      const newRegla = makeRegla();

      const conflicto = await service.validarSinConflicto(newRegla);
      expect(conflicto).toBeNull();
    });

    it('should return conflicting rule when overlap exists', async () => {
      const existing = makeRegla();
      mockEntityRepo.findActivas.mockResolvedValue([existing]);

      const newRegla = makeRegla();
      const conflicto = await service.validarSinConflicto(newRegla);
      expect(conflicto).toBe(existing);
    });

    it('should not conflict with different jurisdiccion', async () => {
      const existing = makeRegla({ jurisdiccion: JURISDICCION.ARBA });
      mockEntityRepo.findActivas.mockResolvedValue([existing]);

      const newRegla = makeRegla({ jurisdiccion: JURISDICCION.ARCA });
      const conflicto = await service.validarSinConflicto(newRegla);
      expect(conflicto).toBeNull();
    });
  });

  describe('matrix: tipo × jurisdicción × régimen × terminación × vigencia', () => {
    const terminaciones = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const dias = [18, 18, 19, 19, 20, 20, 21, 21, 22, 22];

    for (let i = 0; i < terminaciones.length; i++) {
      it(`should resolve IVA ARCA GENERAL terminacion=${terminaciones[i]} → dia=${dias[i]}`, async () => {
        const regla = makeRegla({
          terminacionCuit: terminaciones[i],
          diaVencimiento: dias[i],
        });
        mockEntityRepo.findVigentes.mockResolvedValue([regla]);

        const fecha = await service.calcularFechaConPerfil(
          TIPO_OBLIGACION.IVA,
          {
            cuit: `2012345678${terminaciones[i]}`,
            jurisdiccion: JURISDICCION.ARCA,
            regimen: 'GENERAL',
          },
          '2026-03',
        );
        expect(fecha.getDate()).toBe(dias[i]);
      });
    }

    it('should resolve ARBA jurisdiccion separately', async () => {
      const reglaArba = makeRegla({
        jurisdiccion: JURISDICCION.ARBA,
        tipoObligacion: TIPO_OBLIGACION.IIBB_ARBA,
        diaVencimiento: 15,
      });
      mockEntityRepo.findVigentes.mockResolvedValue([reglaArba]);

      const fecha = await service.calcularFechaConPerfil(
        TIPO_OBLIGACION.IIBB_ARBA,
        { cuit: '20123456786', jurisdiccion: JURISDICCION.ARBA, regimen: 'GENERAL' },
        '2026-03',
      );
      expect(fecha.getDate()).toBe(15);
    });

    it('should handle expired vigencia (historical rule not returned)', async () => {
      // The repo only returns vigente rules, so an expired one should not appear
      mockEntityRepo.findVigentes.mockResolvedValue([]);

      await expect(
        service.calcularFechaConPerfil(
          TIPO_OBLIGACION.IVA,
          { cuit: '20123456786', jurisdiccion: JURISDICCION.ARCA, regimen: 'GENERAL' },
          '2026-03',
        ),
      ).rejects.toThrow('No hay regla de vencimiento');
    });
  });
});
