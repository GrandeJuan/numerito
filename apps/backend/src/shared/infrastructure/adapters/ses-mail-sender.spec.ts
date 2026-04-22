import { SesMailSender } from './ses-mail-sender';

const mockSend = jest.fn().mockResolvedValue({ MessageId: 'test-msg-id' });

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  SendRawEmailCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

import { SendRawEmailCommand } from '@aws-sdk/client-ses';

describe('SesMailSender', () => {
  let sender: SesMailSender;

  const mockConfig = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        AWS_SES_FROM_EMAIL: 'noreply@numerito.com.ar',
        AWS_REGION: 'us-east-1',
      };
      return values[key];
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sender = new SesMailSender(mockConfig as any);
  });

  describe('constructor', () => {
    it('reads from email and region from config', () => {
      expect(mockConfig.getOrThrow).toHaveBeenCalledWith('AWS_SES_FROM_EMAIL');
      expect(mockConfig.getOrThrow).toHaveBeenCalledWith('AWS_REGION');
    });
  });

  describe('send', () => {
    it('sends a plain text email via SendRawEmailCommand', async () => {
      await sender.send('cliente@example.com', 'Vencimientos Mayo', 'Hola, tus vencimientos...');

      expect(SendRawEmailCommand).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledTimes(1);

      const rawCommand = (SendRawEmailCommand as unknown as jest.Mock).mock.calls[0][0];
      expect(rawCommand.RawMessage.Data).toBeInstanceOf(Buffer);

      const rawStr = rawCommand.RawMessage.Data.toString('utf-8');
      expect(rawStr).toContain('From: noreply@numerito.com.ar');
      expect(rawStr).toContain('To: cliente@example.com');
      expect(rawStr).toContain('Content-Type: text/plain; charset=UTF-8');
      // Subject is base64-encoded
      expect(rawStr).toContain('Subject: =?UTF-8?B?');
    });

    it('encodes subject as UTF-8 base64 for special characters', async () => {
      await sender.send('test@example.com', 'Prórroga — Abril 2026', 'Body');

      const rawCommand = (SendRawEmailCommand as unknown as jest.Mock).mock.calls[0][0];
      const rawStr = rawCommand.RawMessage.Data.toString('utf-8');
      const expected = Buffer.from('Prórroga — Abril 2026').toString('base64');
      expect(rawStr).toContain(`=?UTF-8?B?${expected}?=`);
    });
  });

  describe('sendWithAttachments', () => {
    it('sends multipart email with attachments', async () => {
      const pdfBuffer = Buffer.from('fake-pdf-content');

      await sender.sendWithAttachments(
        'cliente@example.com',
        'Calendario Mensual',
        'Adjuntamos su calendario.',
        [
          {
            filename: 'calendario-2026-05.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      );

      expect(SendRawEmailCommand).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledTimes(1);

      const rawCommand = (SendRawEmailCommand as unknown as jest.Mock).mock.calls[0][0];
      const rawStr = rawCommand.RawMessage.Data.toString('utf-8');

      expect(rawStr).toContain('Content-Type: multipart/mixed; boundary=');
      expect(rawStr).toContain('Content-Type: application/pdf; name="calendario-2026-05.pdf"');
      expect(rawStr).toContain(
        'Content-Disposition: attachment; filename="calendario-2026-05.pdf"',
      );
      expect(rawStr).toContain(pdfBuffer.toString('base64'));
    });

    it('includes multiple attachments', async () => {
      const pdf1 = Buffer.from('pdf-1');
      const pdf2 = Buffer.from('pdf-2');

      await sender.sendWithAttachments('test@example.com', 'Docs', 'Adjuntos.', [
        { filename: 'doc1.pdf', content: pdf1, contentType: 'application/pdf' },
        { filename: 'doc2.pdf', content: pdf2, contentType: 'application/pdf' },
      ]);

      const rawCommand = (SendRawEmailCommand as unknown as jest.Mock).mock.calls[0][0];
      const rawStr = rawCommand.RawMessage.Data.toString('utf-8');

      expect(rawStr).toContain('filename="doc1.pdf"');
      expect(rawStr).toContain('filename="doc2.pdf"');
      expect(rawStr).toContain(pdf1.toString('base64'));
      expect(rawStr).toContain(pdf2.toString('base64'));
    });

    it('uses plain text format when attachments array is empty', async () => {
      await sender.sendWithAttachments('test@example.com', 'No attachments', 'Just text.', []);

      const rawCommand = (SendRawEmailCommand as unknown as jest.Mock).mock.calls[0][0];
      const rawStr = rawCommand.RawMessage.Data.toString('utf-8');

      expect(rawStr).toContain('Content-Type: text/plain; charset=UTF-8');
      expect(rawStr).not.toContain('multipart/mixed');
    });
  });

  describe('error propagation', () => {
    it('propagates SES errors to caller', async () => {
      mockSend.mockRejectedValueOnce(new Error('SES rate limit exceeded'));

      await expect(sender.send('test@example.com', 'Test', 'Body')).rejects.toThrow(
        'SES rate limit exceeded',
      );
    });
  });
});
