/**
 * Port for email parsing of fiscal notifications.
 *
 * Infrastructure options:
 * - AWS SES receiving → S3 → Lambda trigger
 * - IMAP polling via Lambda every 5-15 min
 * - Gmail API with push notifications (webhook)
 */

export interface EmailFiscal {
  from: string;
  to: string;
  subject: string;
  body: string;
  htmlBody?: string;
  date: Date;
  attachments: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

export interface EmailParsed {
  cuitCliente: string | null;
  organismoId: string | null;
  asunto: string;
  contenidoRelevante: string;
  esNotificacionFiscal: boolean;
}

export interface EmailParserPort {
  fetchNewEmails(): Promise<EmailFiscal[]>;
  parseEmail(email: EmailFiscal): EmailParsed;
}

export const EMAIL_PARSER = Symbol('EmailParser');
