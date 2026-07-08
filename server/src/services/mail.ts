import { Resend } from 'resend';
import nodemailer, { type Transporter } from 'nodemailer';
import { env, isProd } from '../config/env.js';
import { logger } from '../lib/logger.js';

export type MailInput = { to: string; subject: string; html: string; text?: string };

export interface Mailer {
  send(input: MailInput): Promise<void>;
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESC[c] as string);
}

/** Dev fallback: logs the email so you can test without a provider. */
class ConsoleMailer implements Mailer {
  async send({ to, subject, text, html }: MailInput): Promise<void> {
    // In dev, include the body so you can read the OTP without a provider set.
    // In prod (only reached on misconfiguration) NEVER log the body — it holds
    // the plaintext OTP / reset code.
    if (isProd) {
      logger.warn({ to, subject }, '📧 email NOT delivered — no mail provider configured');
    } else {
      logger.info({ to, subject, body: text ?? html }, '📧 [dev] email not sent (no mail provider configured)');
    }
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

/** SMTP (incl. Gmail via an App Password). port 465 = implicit TLS, 587 = STARTTLS. */
class SmtpMailer implements Mailer {
  private transporter: Transporter;
  constructor(
    opts: { host: string; port: number; user: string; pass: string },
    private from: string,
  ) {
    this.transporter = nodemailer.createTransport({
      host: opts.host,
      port: opts.port,
      secure: opts.port === 465,
      auth: { user: opts.user, pass: opts.pass },
    });
  }
  async send({ to, subject, html, text }: MailInput): Promise<void> {
    await this.transporter.sendMail({ from: this.from, to, subject, html, text });
  }
}

function createMailer(): Mailer {
  const provider = (env.MAIL_PROVIDER ?? '').toLowerCase();

  // Gmail / generic SMTP (nodemailer). `MAIL_PROVIDER=gmail` fills in the Gmail
  // host/port so you only need SMTP_USER (your address) + SMTP_PASS (App Password).
  const wantsSmtp = provider === 'gmail' || provider === 'smtp' || (!provider && !!env.SMTP_HOST);
  if (wantsSmtp) {
    const host = provider === 'gmail' ? 'smtp.gmail.com' : (env.SMTP_HOST ?? 'smtp.gmail.com');
    const port = env.SMTP_PORT ?? 465;
    const user = env.SMTP_USER;
    const pass = env.SMTP_PASS;
    const from = env.MAIL_FROM ?? user;
    if (user && pass && from) {
      logger.info(`Mail provider: SMTP (${host}:${port})`);
      return new SmtpMailer({ host, port, user, pass }, from);
    }
    logger.warn('Mail: SMTP selected but SMTP_USER/SMTP_PASS/MAIL_FROM incomplete — emails will be logged');
  }

  // Resend (transactional API) — used when a MAIL_API_KEY is set.
  if (provider !== 'gmail' && provider !== 'smtp' && env.MAIL_API_KEY && env.MAIL_FROM) {
    logger.info('Mail provider: Resend');
    return new ResendMailer(env.MAIL_API_KEY, env.MAIL_FROM);
  }

  if (isProd) {
    logger.warn('Mail: no provider configured — emails will be logged, not delivered');
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
        `<tr><td style="padding:4px 0">${escapeHtml(l.title)} <span style="color:#888">(${escapeHtml(l.type)})</span></td><td style="text-align:right">${inr(l.price)}</td></tr>`,
    )
    .join('');
  const discountRow = r.discount
    ? `<tr><td style="padding:4px 0">Discount${r.couponCode ? ` (${escapeHtml(r.couponCode)})` : ''}</td><td style="text-align:right">−${inr(r.discount)}</td></tr>`
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

/** Security confirmation after a successful password change. */
export async function sendPasswordChangedEmail(to: string): Promise<void> {
  await activeMailer.send({
    to,
    subject: 'Your Parallax Flow password was changed',
    text: `Your password was just changed. If this wasn't you, reset it immediately with "Forgot password" and contact support.`,
    html: `<p>Your Parallax Flow password was just changed.</p>
<p>If this wasn't you, use <strong>Forgot password</strong> to reset it immediately and contact support.</p>`,
  });
}

/** Notify a buyer that their order was refunded and access removed. */
export async function sendRefundEmail(
  to: string,
  r: { amount: number; receiptNumber?: string | null; refundedAt: Date | string },
): Promise<void> {
  const when = new Date(r.refundedAt).toLocaleString('en-IN');
  const ref = r.receiptNumber ? ` (${escapeHtml(r.receiptNumber)})` : '';
  await activeMailer.send({
    to,
    subject: 'Your Parallax Flow order was refunded',
    text: `Your order${ref} of ${inr(r.amount)} was refunded on ${when}. Access to the refunded items has been removed. If you believe this is a mistake, contact support.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px">
<h2>Parallax Flow</h2>
<p>Your order${ref} of <strong>${inr(r.amount)}</strong> has been <strong>refunded</strong> on ${when}.</p>
<p>Access to the refunded items has been removed. If you believe this is a mistake, please contact support.</p>
</div>`,
  });
}
