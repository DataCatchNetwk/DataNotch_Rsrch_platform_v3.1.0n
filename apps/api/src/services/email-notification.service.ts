import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

interface RegistrationStatusEmailInput {
  to: string;
  applicantName: string;
  applicationId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
}

let transporter: nodemailer.Transporter | null = null;

function isSmtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM);
}

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  return transporter;
}

function getSubject(status: RegistrationStatusEmailInput['status']): string {
  if (status === 'APPROVED') return 'Your researcher application was approved';
  if (status === 'REJECTED') return 'Your researcher application was rejected';
  return 'Your researcher application is pending admin review';
}

function getBody(input: RegistrationStatusEmailInput): string {
  const greeting = `Hello ${input.applicantName},`;
  if (input.status === 'APPROVED') {
    return [
      greeting,
      '',
      'Your researcher application has been approved by an administrator.',
      'Please complete your 2FA setup to activate your account.',
      `Application ID: ${input.applicationId}`,
      input.notes ? `Admin notes: ${input.notes}` : '',
      '',
      'Thank you,',
      'DataNotch Research Platform Team',
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (input.status === 'REJECTED') {
    return [
      greeting,
      '',
      'Your researcher application has been reviewed and rejected by an administrator.',
      `Application ID: ${input.applicationId}`,
      input.notes ? `Admin notes: ${input.notes}` : '',
      '',
      'If you believe this was an error, please contact support.',
      'DataNotch Research Platform Team',
    ]
      .filter(Boolean)
      .join('\n');
  }

  return [
    greeting,
    '',
    'Your researcher application has been submitted and is now pending admin review.',
    `Application ID: ${input.applicationId}`,
    'Estimated review time: 2-5 business days.',
    '',
    'DataNotch Research Platform Team',
  ].join('\n');
}

export async function sendRegistrationStatusEmail(input: RegistrationStatusEmailInput): Promise<void> {
  if (!isSmtpConfigured()) {
    console.warn('[application-mailer] SMTP not configured, email skipped', {
      to: input.to,
      status: input.status,
      applicationId: input.applicationId,
    });
    return;
  }

  const client = getTransporter();
  await client.sendMail({
    from: env.SMTP_FROM,
    to: input.to,
    subject: getSubject(input.status),
    text: getBody(input),
  });
}
