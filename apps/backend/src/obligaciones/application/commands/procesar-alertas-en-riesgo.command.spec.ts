import { ProcesarAlertasEnRiesgoHandler } from './procesar-alertas-en-riesgo.command';
import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import type { AlertaConfigRepository, AlertaConfigData } from '../../domain/repositories/alerta-config.repository';
import type { RecordatorioEnviadoRepository } from '../../domain/repositories/recordatorio-enviado.repository';
import type { NotificacionRepository } from '../../../notificaciones/domain/repositories/notificacion.repository';
import { Vencimiento } from '../../domain/entities/vencimiento.entity';
import { TIPO_OBLIGACION } from '@numerito/shared';
import { TIPO_RECORDATORIO } from '../../domain/entities/recordatorio-enviado.entity';

describe('ProcesarAlertasEnRiesgoHandler', () => {
  let handler: ProcesarAlertasEnRiesgoHandler;
  let alertaConfigRepo: jest.Mocked<AlertaConfigRepository>;
  let vencimientoRepo: jest.Mocked<VencimientoRepository>;
  let recordatorioRepo: jest.Mocked<RecordatorioEnviadoRepository>;
  let notificacionRepo: jest.Mocked<NotificacionRepository>;

  const estudioId = 'estudio-1';
  const config: AlertaConfigData = {
    estudioId,
    diasAnticipacion: 3,
    canalNotificacion: 'BOTH',
    activa: true,
  };

  const createVencimiento = (overrides: Partial<{ responsableId: string | null }> = {}) => {
    const inTwoDays = new Date();
    inTwoDays.setDate(inTwoDays.getDate() + 1);
    return Vencimiento.create({
      clienteId: 'cliente-1',
      estudioId,
      tipoObligacion: TIPO_OBLIGACION.IVA,
      periodo: '2026-04',
      fechaVencimiento: inTwoDays,
      descripcion: 'IVA Abril 2026',
      responsableId: overrides.responsableId !== undefined ? overrides.responsableId : 'user-resp-1',
    });
  };

  beforeEach(() => {
    alertaConfigRepo = {
      findConfig: jest.fn(),
      findByEstudioId: jest.fn(),
      findAllActivas: jest.fn(),
      save: jest.fn(),
    };

    vencimientoRepo = {
      findProximosAVencer: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByClienteId: jest.fn(),
      findByPeriodo: jest.fn(),
      findByEstado: jest.fn(),
      findByClienteAndPeriodo: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any;

    recordatorioRepo = {
      save: jest.fn(),
      existsForVencimiento: jest.fn().mockResolvedValue(false),
      findByVencimientoId: jest.fn(),
    };

    notificacionRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      findByUsuario: jest.fn(),
      countUnread: jest.fn(),
    };

    handler = new ProcesarAlertasEnRiesgoHandler(
      alertaConfigRepo,
      vencimientoRepo,
      recordatorioRepo,
      notificacionRepo,
    );
  });

  it('should do nothing when no active configs', async () => {
    alertaConfigRepo.findAllActivas.mockResolvedValue([]);

    const result = await handler.execute();

    expect(result.estudiosProcessados).toBe(0);
    expect(result.alertasEnviadas).toBe(0);
  });

  it('should create internal notification for responsable on at-risk vencimiento', async () => {
    alertaConfigRepo.findAllActivas.mockResolvedValue([config]);
    const venc = createVencimiento();
    vencimientoRepo.findProximosAVencer.mockResolvedValue([venc]);

    const result = await handler.execute();

    expect(result.alertasEnviadas).toBe(1);
    expect(notificacionRepo.save).toHaveBeenCalledTimes(1);
    expect(recordatorioRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should skip vencimiento without responsable', async () => {
    alertaConfigRepo.findAllActivas.mockResolvedValue([config]);
    const venc = createVencimiento({ responsableId: null });
    vencimientoRepo.findProximosAVencer.mockResolvedValue([venc]);

    const result = await handler.execute();

    expect(result.alertasEnviadas).toBe(0);
    expect(notificacionRepo.save).not.toHaveBeenCalled();
  });

  it('should be idempotent — skip already-alerted vencimiento', async () => {
    alertaConfigRepo.findAllActivas.mockResolvedValue([config]);
    const venc = createVencimiento();
    vencimientoRepo.findProximosAVencer.mockResolvedValue([venc]);
    recordatorioRepo.existsForVencimiento.mockResolvedValue(true);

    const result = await handler.execute();

    expect(result.alertasEnviadas).toBe(0);
    expect(notificacionRepo.save).not.toHaveBeenCalled();
  });

  it('should use 2-day window for findProximosAVencer', async () => {
    alertaConfigRepo.findAllActivas.mockResolvedValue([config]);
    vencimientoRepo.findProximosAVencer.mockResolvedValue([]);

    await handler.execute();

    expect(vencimientoRepo.findProximosAVencer).toHaveBeenCalledWith(
      { estudioId, userId: 'SYSTEM', roles: [] },
      2,
    );
  });

  it('should continue on individual error', async () => {
    alertaConfigRepo.findAllActivas.mockResolvedValue([config]);
    const venc1 = createVencimiento();
    const venc2 = createVencimiento();
    vencimientoRepo.findProximosAVencer.mockResolvedValue([venc1, venc2]);

    notificacionRepo.save
      .mockRejectedValueOnce(new Error('DB error'))
      .mockResolvedValueOnce(undefined);

    const result = await handler.execute();

    expect(result.alertasEnviadas).toBe(1);
    expect(result.errores).toHaveLength(1);
    expect(result.errores[0]).toContain('DB error');
  });
});
