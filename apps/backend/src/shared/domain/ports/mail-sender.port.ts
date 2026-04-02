export interface MailSenderPort {
  send(to: string, subject: string, body: string): Promise<void>;
}

export const MAIL_SENDER = Symbol('MailSender');
