import { ResumenMensualListener } from './resumen-mensual.listener';
import { ResumenMensual, EstadoResumen } from '../../domain/entities/resumen-mensual.entity';
import type { PdfGeneratorPort } from '../../../shared/domain/ports/pdf-generator.port';
import type { MailSenderPort } from '../../../shared/domain/ports/mail-sender.port';
import type { ResumenMensualRepository } from '../../domain/repositories/resumen-mensual.repository';
import type { NotificacionRepository } from '../../domain/repositories/notificacion.repository';
import type { CalendarioMensualListoPayload } from '../../../obligaciones/application/public-events';

describe('ResumenMensualListener', () => {
  let listener: ResumenMensualListener;
  let pdfGenerator: jest.Mocked<PdfGeneratorPort>;
  let mailSender: jest.Mocked<MailSenderPort>;
  let resumenRepo: jest.Mocked<ResumenMensualRepository>;
  let notificacionRepo: jest.Mocked<NotificacionRepository>;
  let em: any;

  const event: CalendarioMensualListoPayload = {
    estudioId: 'estudio-1',
    clienteId: 'cliente-1',
    clienteNombre: 'Empresa Test SRL',
    periodo: '2026-05',
    totalVencimientos: 5,
    occurredOn: new Date(),
  };

  beforeEach(() => {
    pdfGenerator = {
      generarCalendarioMensual: jest.fn().mockResolvedValue(Buffer.from('PDF content')),
    };
    mailSender = {
      send: jest.fn().mockResolvedValue(undefined),
      sendWithAttachments: jest.fn().mockResolvedValue(undefined),
    };
    resumenRepo = {
      findById: jest.fn(),
      findByClienteAndPeriodo: jest.fn().mockResolvedValue(null),
      findByEstudioAndPeriodo: jest.fn(),
      findByClienteRecientes: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    notificacionRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByUsuario: jest.fn(),
      countUnread: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    em = {
      getConnection: jest.fn().mockReturnValue({
        execute: jest.fn().mockResolvedValue([]),
      }),
    };

    listener = new ResumenMensualListener(
      pdfGenerator,
      mailSender,
      resumenRepo,
      notificacionRepo,
      em,
    );
  });

  it('should generate PDF and save resumen', async () => {
    await listener.handleCalendarioMensualListo(event);

    expect(pdfGenerator.generarCalendarioMensual).toHaveBeenCalledTimes(1);
    expect(resumenRepo.save).toHaveBeenCalled();
    const savedResumen = (resumenRepo.save as jest.Mock).mock.calls[0][0] as ResumenMensual;
    expect(savedResumen.estado).toBe(EstadoResumen.LISTO);
    expect(savedResumen.clienteId).toBe('cliente-1');
    expect(savedResumen.periodo).toBe('2026-05');
  });

  it('should send email with attachment', async () => {
    await listener.handleCalendarioMensualListo(event);

    expect(mailSender.sendWithAttachments).toHaveBeenCalledTimes(1);
    const [_to, subject, _body, attachments] = (mailSender.sendWithAttachments as jest.Mock).mock.calls[0];
    expect(subject).toContain('Mayo 2026');
    expect(attachments).toHaveLength(1);
    expect(attachments[0].filename).toContain('calendario-2026-05');
  });

  it('should skip if resumen already exists (idempotency)', async () => {
    const existingResumen = ResumenMensual.create({
      estudioId: 'estudio-1',
      clienteId: 'cliente-1',
      clienteNombre: 'Empresa Test SRL',
      periodo: '2026-05',
      totalVencimientos: 5,
    });
    resumenRepo.findByClienteAndPeriodo.mockResolvedValue(existingResumen);

    await listener.handleCalendarioMensualListo(event);

    expect(pdfGenerator.generarCalendarioMensual).not.toHaveBeenCalled();
    expect(resumenRepo.save).not.toHaveBeenCalled();
  });

  it('should create portal notification when user found', async () => {
    em.getConnection.mockReturnValue({
      execute: jest.fn()
        .mockResolvedValueOnce([]) // buildPdfSections — no vencimientos
        .mockResolvedValueOnce([{ usuario_id: 'user-portal' }]), // createPortalNotification
    });

    await listener.handleCalendarioMensualListo(event);

    expect(notificacionRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should not fail when no portal user found', async () => {
    em.getConnection.mockReturnValue({
      execute: jest.fn().mockResolvedValue([]),
    });

    await expect(
      listener.handleCalendarioMensualListo(event),
    ).resolves.not.toThrow();
  });

  it('should handle PDF generation errors gracefully', async () => {
    pdfGenerator.generarCalendarioMensual.mockRejectedValue(new Error('PDF lib crashed'));

    // Should not throw — errors are caught and logged
    await expect(
      listener.handleCalendarioMensualListo(event),
    ).resolves.not.toThrow();
  });

  it('should fall back to simple send when sendWithAttachments not available', async () => {
    const simpleSender: jest.Mocked<MailSenderPort> = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    const listenerWithSimpleSender = new ResumenMensualListener(
      pdfGenerator,
      simpleSender,
      resumenRepo,
      notificacionRepo,
      em,
    );

    await listenerWithSimpleSender.handleCalendarioMensualListo(event);

    expect(simpleSender.send).toHaveBeenCalledTimes(1);
  });
});
