import { Injectable, Logger } from '@nestjs/common';
import type { MailSenderPort } from '../../domain/ports/mail-sender.port';

@Injectable()
export class ConsoleMailSender implements MailSenderPort {
  private readonly logger = new Logger(ConsoleMailSender.name);

  async send(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`[DEV MAIL] To: ${to} | Subject: ${subject}`);
    this.logger.debug(`[DEV MAIL] Body:\n${body}`);
  }
}
