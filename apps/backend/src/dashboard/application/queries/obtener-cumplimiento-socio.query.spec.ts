import { ObtenerCumplimientoSocioHandler } from './obtener-cumplimiento-socio.query';
import { RecursoNoEncontradoError, OperacionInvalidaError } from '../../../shared/domain/exceptions';

describe('ObtenerCumplimientoSocioHandler', () => {
  let handler: ObtenerCumplimientoSocioHandler;
  let mockCumplimientoView: any;
  let mockMembershipView: any;

  const mockCumplimientoResult = {
    periodo: '2026-04',
    resumenGeneral: {
      total: 15,
      presentados: 10,
      vencidos: 2,
      prorrogados: 1,
      pendientes: 2,
      enRiesgo: 1,
      porcentajeCumplimiento: 67,
    },
    porResponsable: [
      {
        responsableId: 'user-1',
        responsableNombre: 'Juan Pérez',
        total: 15,
        presentados: 10,
        vencidos: 2,
        prorrogados: 1,
        pendientes: 2,
        enRiesgo: 1,
        porcentajeCumplimiento: 67,
      },
    ],
  };

  beforeEach(() => {
    mockCumplimientoView = { execute: jest.fn().mockResolvedValue(mockCumplimientoResult) };
    mockMembershipView = {
      execute: jest.fn().mockResolvedValue({
        isActive: true,
        rol: 'SOCIO',
        permisos: ['VER_FACTURACION'],
      }),
    };
    handler = new ObtenerCumplimientoSocioHandler(mockCumplimientoView, mockMembershipView);
  });

  it('should return cumplimiento data for SOCIO role', async () => {
    const result = await handler.execute({
      estudioId: 'estudio-1',
      usuarioId: 'user-1',
      periodo: '2026-04',
    });

    expect(result).toEqual(mockCumplimientoResult);
    expect(mockCumplimientoView.execute).toHaveBeenCalledWith({
      estudioId: 'estudio-1',
      periodo: '2026-04',
      tipoObligacionId: undefined,
      clienteId: undefined,
      responsableId: undefined,
      diasRiesgo: undefined,
    });
  });

  it('should allow RESPONSABLE role', async () => {
    mockMembershipView.execute.mockResolvedValue({
      isActive: true,
      rol: 'RESPONSABLE',
      permisos: [],
    });

    const result = await handler.execute({
      estudioId: 'estudio-1',
      usuarioId: 'user-1',
    });

    expect(result).toEqual(mockCumplimientoResult);
  });

  it('should throw for EMPLEADO role', async () => {
    mockMembershipView.execute.mockResolvedValue({
      isActive: true,
      rol: 'EMPLEADO',
      permisos: [],
    });

    await expect(
      handler.execute({ estudioId: 'estudio-1', usuarioId: 'user-1' }),
    ).rejects.toThrow(OperacionInvalidaError);
  });

  it('should throw when membership not found', async () => {
    mockMembershipView.execute.mockResolvedValue(null);

    await expect(
      handler.execute({ estudioId: 'estudio-1', usuarioId: 'user-1' }),
    ).rejects.toThrow(RecursoNoEncontradoError);
  });

  it('should throw when membership is inactive', async () => {
    mockMembershipView.execute.mockResolvedValue({
      isActive: false,
      rol: 'SOCIO',
      permisos: [],
    });

    await expect(
      handler.execute({ estudioId: 'estudio-1', usuarioId: 'user-1' }),
    ).rejects.toThrow(RecursoNoEncontradoError);
  });

  it('should forward all filter parameters to the view', async () => {
    await handler.execute({
      estudioId: 'estudio-1',
      usuarioId: 'user-1',
      periodo: '2026-03',
      tipoObligacionId: 5,
      clienteId: 'cli-1',
      responsableId: 'resp-1',
      diasRiesgo: 7,
    });

    expect(mockCumplimientoView.execute).toHaveBeenCalledWith({
      estudioId: 'estudio-1',
      periodo: '2026-03',
      tipoObligacionId: 5,
      clienteId: 'cli-1',
      responsableId: 'resp-1',
      diasRiesgo: 7,
    });
  });
});
