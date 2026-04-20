export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface MailSenderPort {
  send(to: string, subject: string, body: string): Promise<void>;
  sendWithAttachments?(
    to: string,
    subject: string,
    body: string,
    attachments: MailAttachment[],
  ): Promise<void>;
}

export const MAIL_SENDER = Symbol('MailSender');
