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

type ReceiptForEmail = {
  receiptNumber: string;
  lines: { title: string; type: string; price: number }[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  total: number;
  currency: string;
  razorpayPaymentId: string | null;
  paidAt: Date | string;
};

const inr = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export async function sendReceiptEmail(to: string, r: ReceiptForEmail): Promise<void> {
  const rows = r.lines
    .map(
      (l) =>
        `<tr><td style="padding:4px 0">${l.title} <span style="color:#888">(${l.type})</span></td><td style="text-align:right">${inr(l.price)}</td></tr>`,
    )
    .join('');
  const discountRow = r.discount
    ? `<tr><td style="padding:4px 0">Discount${r.couponCode ? ` (${r.couponCode})` : ''}</td><td style="text-align:right">−${inr(r.discount)}</td></tr>`
    : '';
  const date = new Date(r.paidAt).toLocaleString('en-IN');

  await activeMailer.send({
    to,
    subject: `Your Parallax Flow receipt ${r.receiptNumber}`,
    text: `Receipt ${r.receiptNumber} — paid ${inr(r.total)} on ${date}.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px">
<h2>Parallax Flow</h2>
<p><strong>Receipt ${r.receiptNumber}</strong><br/>${date}</p>
<table style="width:100%;border-collapse:collapse;font-size:14px">
${rows}
${discountRow}
<tr><td style="border-top:1px solid #ddd;padding-top:8px"><strong>Total paid</strong></td><td style="border-top:1px solid #ddd;padding-top:8px;text-align:right"><strong>${inr(r.total)}</strong></td></tr>
</table>
${r.razorpayPaymentId ? `<p style="color:#888;font-size:12px">Payment id: ${r.razorpayPaymentId} · Razorpay</p>` : ''}
<p style="color:#888;font-size:12px">Thank you for your purchase.</p>
</div>`,
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
