import nodemailer from 'nodemailer';

export async function sendEmailCopy(to: string, subject: string, body: string) {
  if (process.env.ENABLE_EMAIL !== 'true') {
    console.log('[EMAIL DISABLED]', { to, subject, body });
    return { disabled: true };
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  return transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text: body,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6">${body.replace(/\n/g, '<br/>')}</div>`
  });
}
