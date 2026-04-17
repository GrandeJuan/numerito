import { NotificacionVencimientoService } from './notificacion-vencimiento.service';
import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import type { AlertaConfigRepository } from '../../domain/repositories/alerta-config.repository';
import type { MailSenderPort } from '../../../shared/domain/ports/mail-sender.port';
import { Vencimiento } from '../../domain/entities/vencimiento.entity';
import { TIPO_OBLIGACION } from '@numerito/shared';

describe('NotificacionVencimientoService', () => {
  let service: NotificacionVencimientoService;
  let vencimientoRepo: jest.Mocked<VencimientoRepository>;
  let alertaConfigRepo: jest.Mocked<AlertaConfigRepository>;
  let mailSender: jest.Mocked<MailSenderPort>;

  const estudioId = 'estudio-1';

  beforeEach(() => {
    vencimientoRepo = {
      findProximosAVencer: jest.fn(),
      findByClienteId: jest.fn(),
      findByPeriodo: jest.fn(),
      findByEstado: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any;

    alertaConfigRepo = {
      findConfig: jest.fn(),
      save: jest.fn(),
    };

    mailSender = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    service = new NotificacionVencimientoService(vencimientoRepo, alertaConfigRepo, mailSender);
  });

  it('sends email for each vencimiento proximo', async () => {
    alertaConfigRepo.findConfig.mockResolvedValue({
      estudioId,
      diasAnticipacion: 7,
      canalNotificacion: 'EMAIL',
      activa: true,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);

    const venc1 = Vencimiento.create({
      clienteId: 'cliente-1',
      estudioId,
      tipoObligacion: TIPO_OBLIGACION.IVA,
      periodo: '2026-04',
      fechaVencimiento: tomorrow,
      descripcion: 'IVA Abril 2026',
    });

    const venc2 = Vencimiento.create({
      clienteId: 'cliente-2',
      estudioId,
      tipoObligacion: TIPO_OBLIGACION.MONOTRIBUTO,
      periodo: '2026-04',
      fechaVencimiento: tomorrow,
      descripcion: 'Monotributo Abril 2026',
    });

    vencimientoRepo.findProximosAVencer.mockResolvedValue([venc1, venc2]);

    const count = await service.notificarProximos();

    expect(count).toBe(2);
    expect(alertaConfigRepo.findConfig).toHaveBeenCalled();
    expect(vencimientoRepo.findProximosAVencer).toHaveBeenCalledWith(
      { estudioId, userId: 'SYSTEM', roles: [] },
      7,
    );
    expect(mailSender.send).toHaveBeenCalledTimes(2);
    expect(mailSender.send).toHaveBeenCalledWith(
      estudioId,
      expect.stringContaining('Vencimiento próximo'),
      expect.stringContaining('IVA Abril 2026'),
    );
  });

  it('does nothing when no config exists', async () => {
    alertaConfigRepo.findConfig.mockResolvedValue(null);

    const count = await service.notificarProximos();

    expect(count).toBe(0);
    expect(vencimientoRepo.findProximosAVencer).not.toHaveBeenCalled();
    expect(mailSender.send).not.toHaveBeenCalled();
  });

  it('does nothing when config is inactive', async () => {
    alertaConfigRepo.findConfig.mockResolvedValue({
      estudioId,
      diasAnticipacion: 7,
      canalNotificacion: 'EMAIL',
      activa: false,
    });

    const count = await service.notificarProximos();

    expect(count).toBe(0);
    expect(vencimientoRepo.findProximosAVencer).not.toHaveBeenCalled();
    expect(mailSender.send).not.toHaveBeenCalled();
  });

  it('does nothing when no vencimientos proximos', async () => {
    alertaConfigRepo.findConfig.mockResolvedValue({
      estudioId,
      diasAnticipacion: 7,
      canalNotificacion: 'EMAIL',
      activa: true,
    });

    vencimientoRepo.findProximosAVencer.mockResolvedValue([]);

    const count = await service.notificarProximos();

    expect(count).toBe(0);
    expect(vencimientoRepo.findProximosAVencer).toHaveBeenCalledWith(
      { estudioId, userId: 'SYSTEM', roles: [] },
      7,
    );
    expect(mailSender.send).not.toHaveBeenCalled();
  });

  it('returns correct count', async () => {
    alertaConfigRepo.findConfig.mockResolvedValue({
      estudioId,
      diasAnticipacion: 5,
      canalNotificacion: 'BOTH',
      activa: true,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);

    const vencimientos = Array.from({ length: 5 }, (_, i) =>
      Vencimiento.create({
        clienteId: `cliente-${i}`,
        estudioId,
        tipoObligacion: TIPO_OBLIGACION.IVA,
        periodo: '2026-04',
        fechaVencimiento: tomorrow,
        descripcion: `Vencimiento ${i}`,
      }),
    );

    vencimientoRepo.findProximosAVencer.mockResolvedValue(vencimientos);

    const count = await service.notificarProximos();

    expect(count).toBe(5);
    expect(mailSender.send).toHaveBeenCalledTimes(5);
  });
});
