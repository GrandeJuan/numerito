import { ProcesarRecordatoriosDiariosHandler } from './procesar-recordatorios-diarios.command';
import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import type {
  AlertaConfigRepository,
  AlertaConfigData,
} from '../../domain/repositories/alerta-config.repository';
import type { RecordatorioEnviadoRepository } from '../../domain/repositories/recordatorio-enviado.repository';
import type { ClienteRepository } from '../../../clientes/domain/repositories/cliente.repository';
import type { NotificacionRepository } from '../../../notificaciones/domain/repositories/notificacion.repository';
import type { MailSenderPort } from '../../../shared/domain/ports/mail-sender.port';
import { Vencimiento } from '../../domain/entities/vencimiento.entity';
import { TIPO_OBLIGACION } from '@numerito/shared';

describe('ProcesarRecordatoriosDiariosHandler', () => {
  let handler: ProcesarRecordatoriosDiariosHandler;
  let alertaConfigRepo: jest.Mocked<AlertaConfigRepository>;
  let vencimientoRepo: jest.Mocked<VencimientoRepository>;
  let clienteRepo: jest.Mocked<ClienteRepository>;
  let recordatorioRepo: jest.Mocked<RecordatorioEnviadoRepository>;
  let notificacionRepo: jest.Mocked<NotificacionRepository>;
  let mailSender: jest.Mocked<MailSenderPort>;

  const estudioId = 'estudio-1';
  const config: AlertaConfigData = {
    estudioId,
    diasAnticipacion: 3,
    canalNotificacion: 'BOTH',
    activa: true,
  };

  const createVencimiento = (
    overrides: Partial<{
      clienteId: string;
      responsableId: string | undefined;
      descripcion: string;
    }> = {},
  ) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const responsableId = 'responsableId' in overrides ? overrides.responsableId : 'user-resp-1';
    return Vencimiento.create({
      clienteId: overrides.clienteId ?? 'cliente-1',
      estudioId,
      tipoObligacion: TIPO_OBLIGACION.IVA,
      periodo: '2026-04',
      fechaVencimiento: tomorrow,
      descripcion: overrides.descripcion ?? 'IVA Abril 2026',
      responsableId,
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

    clienteRepo = {
      findById: jest.fn().mockResolvedValue(null),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByCuit: jest.fn(),
      findByResponsableId: jest.fn(),
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

    mailSender = { send: jest.fn().mockResolvedValue(undefined) };

    handler = new ProcesarRecordatoriosDiariosHandler(
      alertaConfigRepo,
      vencimientoRepo,
      clienteRepo,
      recordatorioRepo,
      notificacionRepo,
      mailSender,
    );
  });

  it('should do nothing when no active configs exist', async () => {
    alertaConfigRepo.findAllActivas.mockResolvedValue([]);

    const result = await handler.execute();

    expect(result.estudiosProcessados).toBe(0);
    expect(result.recordatoriosEnviados).toBe(0);
    expect(mailSender.send).not.toHaveBeenCalled();
  });

  it('should send email and internal notification for BOTH channel', async () => {
    alertaConfigRepo.findAllActivas.mockResolvedValue([config]);
    const venc = createVencimiento();
    vencimientoRepo.findProximosAVencer.mockResolvedValue([venc]);

    const result = await handler.execute();

    expect(result.recordatoriosEnviados).toBe(1);
    expect(mailSender.send).toHaveBeenCalledTimes(1);
    expect(mailSender.send).toHaveBeenCalledWith(
      'cliente-1',
      expect.stringContaining('Recordatorio'),
      expect.stringContaining('IVA Abril 2026'),
    );
    expect(notificacionRepo.save).toHaveBeenCalledTimes(1);
    expect(recordatorioRepo.save).toHaveBeenCalledTimes(2); // email + internal
  });

  it('should skip already-sent recordatorios (idempotent)', async () => {
    alertaConfigRepo.findAllActivas.mockResolvedValue([config]);
    const venc = createVencimiento();
    vencimientoRepo.findProximosAVencer.mockResolvedValue([venc]);
    recordatorioRepo.existsForVencimiento.mockResolvedValue(true);

    const result = await handler.execute();

    expect(result.recordatoriosEnviados).toBe(0);
    expect(mailSender.send).not.toHaveBeenCalled();
    expect(notificacionRepo.save).not.toHaveBeenCalled();
  });

  it('should send only email for EMAIL channel', async () => {
    alertaConfigRepo.findAllActivas.mockResolvedValue([
      { ...config, canalNotificacion: 'EMAIL' as const },
    ]);
    const venc = createVencimiento();
    vencimientoRepo.findProximosAVencer.mockResolvedValue([venc]);

    const result = await handler.execute();

    expect(result.recordatoriosEnviados).toBe(1);
    expect(mailSender.send).toHaveBeenCalledTimes(1);
    expect(notificacionRepo.save).not.toHaveBeenCalled();
    expect(recordatorioRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should send only internal notification for INTERNAL channel', async () => {
    alertaConfigRepo.findAllActivas.mockResolvedValue([
      { ...config, canalNotificacion: 'INTERNAL' as const },
    ]);
    const venc = createVencimiento();
    vencimientoRepo.findProximosAVencer.mockResolvedValue([venc]);

    const result = await handler.execute();

    expect(result.recordatoriosEnviados).toBe(1);
    expect(mailSender.send).not.toHaveBeenCalled();
    expect(notificacionRepo.save).toHaveBeenCalledTimes(1);
    expect(recordatorioRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should skip notification when vencimiento has no responsable', async () => {
    alertaConfigRepo.findAllActivas.mockResolvedValue([
      { ...config, canalNotificacion: 'INTERNAL' as const },
    ]);
    const venc = createVencimiento({ responsableId: undefined });
    vencimientoRepo.findProximosAVencer.mockResolvedValue([venc]);

    await handler.execute();

    // No responsable → no internal notification, but still counted as processed
    expect(notificacionRepo.save).not.toHaveBeenCalled();
  });

  it('should process multiple estudios', async () => {
    const config2: AlertaConfigData = {
      estudioId: 'estudio-2',
      diasAnticipacion: 5,
      canalNotificacion: 'EMAIL',
      activa: true,
    };
    alertaConfigRepo.findAllActivas.mockResolvedValue([config, config2]);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);

    const venc1 = createVencimiento();
    const venc2 = Vencimiento.create({
      clienteId: 'cliente-2',
      estudioId: 'estudio-2',
      tipoObligacion: TIPO_OBLIGACION.MONOTRIBUTO,
      periodo: '2026-04',
      fechaVencimiento: tomorrow,
      descripcion: 'Monotributo Abril',
      responsableId: 'user-resp-2',
    });

    vencimientoRepo.findProximosAVencer
      .mockResolvedValueOnce([venc1])
      .mockResolvedValueOnce([venc2]);

    const result = await handler.execute();

    expect(result.estudiosProcessados).toBe(2);
    expect(result.recordatoriosEnviados).toBe(2);
  });

  it('should continue processing on individual vencimiento error', async () => {
    alertaConfigRepo.findAllActivas.mockResolvedValue([config]);

    const venc1 = createVencimiento({ clienteId: 'c1', descripcion: 'Venc 1' });
    const venc2 = createVencimiento({ clienteId: 'c2', descripcion: 'Venc 2' });
    vencimientoRepo.findProximosAVencer.mockResolvedValue([venc1, venc2]);

    mailSender.send.mockRejectedValueOnce(new Error('SMTP error')).mockResolvedValueOnce(undefined);

    const result = await handler.execute();

    expect(result.recordatoriosEnviados).toBe(1);
    expect(result.errores).toHaveLength(1);
    expect(result.errores[0]).toContain('SMTP error');
  });

  it('should use SYSTEM principal for repo calls', async () => {
    alertaConfigRepo.findAllActivas.mockResolvedValue([config]);
    vencimientoRepo.findProximosAVencer.mockResolvedValue([]);

    await handler.execute();

    expect(vencimientoRepo.findProximosAVencer).toHaveBeenCalledWith(
      { estudioId, userId: 'SYSTEM', roles: [] },
      3,
    );
  });
});
