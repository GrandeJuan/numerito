import { ReglaVencimientoService } from './regla-vencimiento.service';
import { TIPO_OBLIGACION } from '@numerito/shared';

describe('ReglaVencimientoService (DB-backed)', () => {
  let service: ReglaVencimientoService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findByTipoYTerminacion: jest.fn(),
      findByTipo: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
    };
    service = new ReglaVencimientoService(mockRepo);
  });

  it('should calculate due date from DB rule', async () => {
    mockRepo.findByTipoYTerminacion.mockResolvedValue({
      tipoObligacion: TIPO_OBLIGACION.IVA,
      terminacionCuit: '6',
      diaVencimiento: 18,
      mesSiguiente: true,
    });

    const fecha = await service.calcularFechaVencimiento(TIPO_OBLIGACION.IVA, '20123456786', '2026-03');
    expect(fecha.getDate()).toBe(18);
    expect(fecha.getMonth()).toBe(3); // April
    expect(fecha.getFullYear()).toBe(2026);
    expect(mockRepo.findByTipoYTerminacion).toHaveBeenCalledWith(TIPO_OBLIGACION.IVA, '6');
  });

  it('should calculate Monotributo from DB rule', async () => {
    mockRepo.findByTipoYTerminacion.mockResolvedValue({
      tipoObligacion: TIPO_OBLIGACION.MONOTRIBUTO,
      terminacionCuit: '6',
      diaVencimiento: 20,
      mesSiguiente: true,
    });

    const fecha = await service.calcularFechaVencimiento(TIPO_OBLIGACION.MONOTRIBUTO, '20123456786', '2026-03');
    expect(fecha.getDate()).toBe(20);
    expect(fecha.getMonth()).toBe(3);
  });

  it('should throw if no rule found in DB', async () => {
    mockRepo.findByTipoYTerminacion.mockResolvedValue(null);

    await expect(
      service.calcularFechaVencimiento(TIPO_OBLIGACION.IVA, '20123456786', '2026-03'),
    ).rejects.toThrow('No hay regla de vencimiento');
  });
});
