import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import type { MailSenderPort, MailAttachment } from '../../domain/ports/mail-sender.port';

@Injectable()
export class SesMailSender implements MailSenderPort {
  private readonly logger = new Logger(SesMailSender.name);
  private readonly ses: SESClient;
  private readonly fromEmail: string;

  constructor(private readonly config: ConfigService) {
    this.fromEmail = this.config.getOrThrow<string>('AWS_SES_FROM_EMAIL');
    this.ses = new SESClient({
      region: this.config.getOrThrow<string>('AWS_REGION'),
    });
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    const rawMessage = this.buildMimeMessage(to, subject, body, []);
    await this.sendRaw(rawMessage);
    this.logger.log(`Email sent to ${to} | Subject: ${subject}`);
  }

  async sendWithAttachments(
    to: string,
    subject: string,
    body: string,
    attachments: MailAttachment[],
  ): Promise<void> {
    const rawMessage = this.buildMimeMessage(to, subject, body, attachments);
    await this.sendRaw(rawMessage);
    this.logger.log(
      `Email sent to ${to} | Subject: ${subject} | Attachments: ${attachments.length}`,
    );
  }

  private async sendRaw(rawMessage: Buffer): Promise<void> {
    await this.ses.send(
      new SendRawEmailCommand({
        RawMessage: { Data: rawMessage },
      }),
    );
  }

  private buildMimeMessage(
    to: string,
    subject: string,
    body: string,
    attachments: MailAttachment[],
  ): Buffer {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const lines: string[] = [];

    lines.push(`From: ${this.fromEmail}`);
    lines.push(`To: ${to}`);
    lines.push(`Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`);
    lines.push('MIME-Version: 1.0');

    if (attachments.length === 0) {
      lines.push('Content-Type: text/plain; charset=UTF-8');
      lines.push('Content-Transfer-Encoding: base64');
      lines.push('');
      lines.push(Buffer.from(body).toString('base64'));
    } else {
      lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
      lines.push('');

      // Text body part
      lines.push(`--${boundary}`);
      lines.push('Content-Type: text/plain; charset=UTF-8');
      lines.push('Content-Transfer-Encoding: base64');
      lines.push('');
      lines.push(Buffer.from(body).toString('base64'));
      lines.push('');

      // Attachment parts
      for (const att of attachments) {
        lines.push(`--${boundary}`);
        lines.push(`Content-Type: ${att.contentType}; name="${att.filename}"`);
        lines.push('Content-Transfer-Encoding: base64');
        lines.push(`Content-Disposition: attachment; filename="${att.filename}"`);
        lines.push('');
        lines.push(att.content.toString('base64'));
        lines.push('');
      }

      lines.push(`--${boundary}--`);
    }

    return Buffer.from(lines.join('\r\n'));
  }
}
