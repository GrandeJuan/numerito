import { Injectable, Logger } from '@nestjs/common';
import type { MailSenderPort, MailAttachment } from '../../domain/ports/mail-sender.port';

@Injectable()
export class ConsoleMailSender implements MailSenderPort {
  private readonly logger = new Logger(ConsoleMailSender.name);

  async send(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`[DEV MAIL] To: ${to} | Subject: ${subject}`);
    this.logger.debug(`[DEV MAIL] Body:\n${body}`);
  }

  async sendWithAttachments(
    to: string,
    subject: string,
    body: string,
    attachments: MailAttachment[],
  ): Promise<void> {
    this.logger.log(`[DEV MAIL] To: ${to} | Subject: ${subject}`);
    this.logger.debug(`[DEV MAIL] Body:\n${body}`);
    for (const att of attachments) {
      this.logger.log(
        `[DEV MAIL] Attachment: ${att.filename} (${att.contentType}, ${att.content.length} bytes)`,
      );
    }
  }
}
