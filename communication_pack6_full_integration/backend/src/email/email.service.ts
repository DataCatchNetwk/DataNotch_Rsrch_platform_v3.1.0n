import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { PrismaService } from '../prisma.service';

@Injectable()
export class EmailService {
  constructor(private prisma: PrismaService) {}
  private transporter() {
    return nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }});
  }
  async send(to: string, subject: string, html: string, messageId?: string) {
    let status = 'QUEUED'; let providerMessageId: string | undefined;
    try {
      const info = await this.transporter().sendMail({ from: process.env.SMTP_USER, to, subject, html });
      status = 'SENT'; providerMessageId = info.messageId;
    } catch (e) { status = 'FAILED'; }
    return this.prisma.emailLog.create({ data: { to, from: process.env.SMTP_USER || 'system', subject, status, providerMessageId, messageId }});
  }
}
