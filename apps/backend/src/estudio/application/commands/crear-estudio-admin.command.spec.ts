import { CrearEstudioAdminHandler } from './crear-estudio-admin.command';
import { CuitDuplicadoError, RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

describe('CrearEstudioAdminHandler', () => {
  let handler: CrearEstudioAdminHandler;
  let mockEstudioRepo: any;
  let mockPlanRepo: any;
  let mockEventBus: any;
  let mockSaveSubscripcion: jest.Mock;

  const planData = {
    id: 1,
    codigo: 'PROFESIONAL',
    nombre: 'Profesional',
    descripcion: 'Plan profesional',
    maxClientes: 50,
    maxUsuarios: 5,
    precio: 9999,
    isPublico: true,
    isActivo: true,
  };

  beforeEach(() => {
    mockEstudioRepo = {
      findByCuit: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockPlanRepo = {
      findByCodigo: jest.fn().mockResolvedValue(planData),
    };
    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };
    mockSaveSubscripcion = jest.fn().mockResolvedValue(undefined);

    handler = new CrearEstudioAdminHandler(
      mockEstudioRepo,
      mockPlanRepo,
      mockEventBus,
      mockSaveSubscripcion,
    );
  });

  it('should create estudio and subscripcion', async () => {
    const result = await handler.execute({
      nombre: 'Estudio Test',
      cuit: '20-12345678-6',
      planCodigo: 'PROFESIONAL',
    });

    expect(result.nombre).toBe('Estudio Test');
    expect(result.cuit).toBe('20-12345678-6');
    expect(result.plan).toBe('Profesional');
    expect(result.id).toBeDefined();
    expect(result.subscripcionId).toBeDefined();

    expect(mockEstudioRepo.save).toHaveBeenCalled();
    expect(mockSaveSubscripcion).toHaveBeenCalled();
    expect(mockEventBus.publishAll).toHaveBeenCalled();
  });

  it('should throw CuitDuplicadoError when CUIT already exists', async () => {
    mockEstudioRepo.findByCuit.mockResolvedValue({ id: 'existing' });

    await expect(
      handler.execute({
        nombre: 'Estudio Test',
        cuit: '20-12345678-6',
        planCodigo: 'PROFESIONAL',
      }),
    ).rejects.toThrow(CuitDuplicadoError);

    expect(mockEstudioRepo.save).not.toHaveBeenCalled();
  });

  it('should throw RecursoNoEncontradoError when plan not found', async () => {
    mockPlanRepo.findByCodigo.mockResolvedValue(null);

    await expect(
      handler.execute({
        nombre: 'Estudio Test',
        cuit: '20-12345678-6',
        planCodigo: 'INEXISTENTE',
      }),
    ).rejects.toThrow(RecursoNoEncontradoError);

    expect(mockEstudioRepo.save).not.toHaveBeenCalled();
  });

  it('should use custom trial days', async () => {
    await handler.execute({
      nombre: 'Estudio Trial',
      cuit: '20-99999999-0',
      planCodigo: 'PROFESIONAL',
      trialDias: 60,
    });

    const savedSub = mockSaveSubscripcion.mock.calls[0][0];
    const diffMs = savedSub.fechaFin.getTime() - savedSub.fechaInicio.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(60);
  });

  it('should default to 30-day trial', async () => {
    await handler.execute({
      nombre: 'Estudio Default',
      cuit: '20-88888888-0',
      planCodigo: 'PROFESIONAL',
    });

    const savedSub = mockSaveSubscripcion.mock.calls[0][0];
    const diffMs = savedSub.fechaFin.getTime() - savedSub.fechaInicio.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);
  });

  it('should publish domain events from both entities', async () => {
    await handler.execute({
      nombre: 'Estudio Events',
      cuit: '20-77777777-0',
      planCodigo: 'PROFESIONAL',
    });

    const publishedEvents = mockEventBus.publishAll.mock.calls[0][0];
    expect(publishedEvents.length).toBeGreaterThanOrEqual(1);
  });
});
