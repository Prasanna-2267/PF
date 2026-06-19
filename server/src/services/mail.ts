import { Resend } from 'resend';
import { env, isProd } from '../config/env.js';
import { logger } from '../lib/logger.js';

export type MailInput = { to: string; subject: string; html: string; text?: string };

export interface Mailer {
  send(input: MailInput): Promise<void>;
}

/** Dev fallback: logs the email (incl. OTP) so you can test without a provider. */
class ConsoleMailer implements Mailer {
  async send({ to, subject, text, html }: MailInput): Promise<void> {
    logger.info({ to, subject, body: text ?? html }, '📧 [dev] email not sent (no mail provider configured)');
  }
}

class ResendMailer implements Mailer {
  private client: Resend;
  constructor(
    apiKey: string,
    private from: string,
  ) {
    this.client = new Resend(apiKey);
  }
  async send({ to, subject, html, text }: MailInput): Promise<void> {
    const { error } = await this.client.emails.send({ from: this.from, to, subject, html, text });
    if (error) throw new Error(`Resend error: ${error.message}`);
  }
}

function createMailer(): Mailer {
  if (env.MAIL_API_KEY && env.MAIL_FROM) {
    logger.info('Mail provider: Resend');
    return new ResendMailer(env.MAIL_API_KEY, env.MAIL_FROM);
  }
  if (isProd) {
    logger.warn('Mail: MAIL_API_KEY/MAIL_FROM not set — emails will be logged, not delivered');
  }
  return new ConsoleMailer();
}

let activeMailer: Mailer = createMailer();

/** Override the mailer (used by tests to capture OTPs). */
export function setMailer(mailer: Mailer): void {
  activeMailer = mailer;
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  await activeMailer.send({
    to,
    subject: 'Your Parallax Flow verification code',
    text: `Your verification code is ${code}. It expires in 30 minutes.`,
    html: `<p>Your Parallax Flow verification code is:</p>
<h2 style="letter-spacing:4px;font-family:monospace">${code}</h2>
<p>It expires in 30 minutes. If you didn't request this, you can ignore this email.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, code: string): Promise<void> {
  await activeMailer.send({
    to,
    subject: 'Reset your Parallax Flow password',
    text: `Your password reset code is ${code}. It expires in 15 minutes.`,
    html: `<p>Your Parallax Flow password reset code is:</p>
<h2 style="letter-spacing:4px;font-family:monospace">${code}</h2>
<p>It expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>`,
  });
}
