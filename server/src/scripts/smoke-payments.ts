/**
 * Payment signature verification (the security core of checkout). Runs with
 * fixed test secrets so the HMAC logic is deterministically validated.
 *
 *   npm run test:smoke:payments
 */
import { createHmac } from 'node:crypto';
import { env } from '../config/env.js';
import { verifyPaymentSignature, verifyWebhookSignature } from '../services/razorpay.js';

let failures = 0;
function check(name: string, passed: boolean): void {
  if (!passed) failures++;
  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}`);
}

function flipLast(hex: string): string {
  return hex.slice(0, -1) + (hex.at(-1) === '0' ? '1' : '0');
}

function main(): void {
  const secret = env.RAZORPAY_KEY_SECRET ?? '';
  const orderId = 'order_TEST123';
  const paymentId = 'pay_TEST456';
  const sig = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

  check('test secret is set', secret.length > 0);
  check('valid payment signature accepted', verifyPaymentSignature(orderId, paymentId, sig));
  check('tampered payment signature rejected', !verifyPaymentSignature(orderId, paymentId, flipLast(sig)));
  check('mismatched order id rejected', !verifyPaymentSignature('order_OTHER', paymentId, sig));
  check('garbage signature rejected', !verifyPaymentSignature(orderId, paymentId, 'not-a-signature'));

  const whSecret = env.RAZORPAY_WEBHOOK_SECRET ?? '';
  const body = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
  const whSig = createHmac('sha256', whSecret).update(body).digest('hex');
  check('valid webhook signature accepted', verifyWebhookSignature(body, whSig));
  check('tampered webhook signature rejected', !verifyWebhookSignature(body, flipLast(whSig)));

  console.log(failures === 0 ? '\n✅ Payment signature tests passed' : `\n❌ ${failures} test(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
