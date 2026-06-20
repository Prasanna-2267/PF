/**
 * Receipts smoke test (Phase 7+). Proves a receipt is generated when an order
 * becomes paid (via webhook and via the full-coupon free path), is itemised
 * correctly, is owner-scoped, links from My Library, and is idempotent.
 *
 *   npm run test:smoke:receipts
 */
import dns from 'node:dns';
import { createHmac } from 'node:crypto';
import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { hashPassword } from '../modules/auth/auth.password.js';
import { UserModel } from '../modules/auth/user.model.js';
import { ExamCategoryModel } from '../modules/content/exam-category.model.js';
import { StageModel } from '../modules/content/stage.model.js';
import { SubjectModel } from '../modules/content/subject.model.js';
import { LessonModel } from '../modules/lessons/lesson.model.js';
import { OrderModel } from '../modules/commerce/order.model.js';
import { CouponModel } from '../modules/commerce/coupon.model.js';

const PORT = 4109;
const ROOT = `http://localhost:${PORT}/api`;
const JSON_HEADERS = { 'Content-Type': 'application/json' };

let failures = 0;
function check(name: string, passed: boolean, detail = ''): void {
  if (!passed) failures++;
  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function login(email: string, password: string): Promise<string> {
  const r = await fetch(`${ROOT}/auth/login`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ email, password }) });
  return ((await r.json()) as { accessToken?: string }).accessToken ?? '';
}

type Receipt = {
  id: string;
  receiptNumber: string;
  lines: { type: string; title: string; price: number }[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  total: number;
};

async function main(): Promise<void> {
  if (env.DNS_SERVERS) dns.setServers(env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean));
  await mongoose.connect(env.MONGODB_URI, { dbName: 'parallax_flow_test' });
  await mongoose.connection.dropDatabase();

  const pw = 'password123';
  await UserModel.create({ name: 'Stud', email: `s_${Date.now()}@x.com`, passwordHash: await hashPassword(pw), role: 'student', emailVerified: true, phone: '9998887777' });
  await UserModel.create({ name: 'Other', email: `o_${Date.now()}@x.com`, passwordHash: await hashPassword(pw), role: 'student', emailVerified: true, phone: '9990001111' });
  const student = (await UserModel.findOne({ name: 'Stud' }))!;
  const other = (await UserModel.findOne({ name: 'Other' }))!;

  const cat = await ExamCategoryModel.create({ name: 'CA', slug: `ca-${Date.now()}` });
  const stage = await StageModel.create({ name: 'Inter', examCategoryId: cat._id });
  const subject = await SubjectModel.create({ name: 'Taxation', stageId: stage._id });
  const lessonA = await LessonModel.create({ title: 'Direct Tax', subjectId: subject._id, type: 'pdf', price: 499, isActive: true, fileKey: 'kA', pageCount: 1 });
  const lessonB = await LessonModel.create({ title: 'Indirect Tax', subjectId: subject._id, type: 'pdf', price: 300, isActive: true, fileKey: 'kB', pageCount: 1 });

  // A 'created' order awaiting payment (simulates createOrder having run).
  const order = await OrderModel.create({
    userId: student._id,
    items: [{ type: 'lesson', refId: lessonA._id, title: 'Direct Tax', price: 49900 }],
    amount: 44900, // ₹449 after a ₹50 coupon
    discount: 5000,
    couponCode: 'WELCOME50',
    status: 'created',
    razorpayOrderId: 'order_rcpt_test',
  });

  const app = createApp();
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });

  try {
    const token = await login(student.email, pw);
    const otherToken = await login(other.email, pw);
    const hdr = { Authorization: `Bearer ${token}` };
    const oHdr = { Authorization: `Bearer ${otherToken}` };
    check('student login', !!token);

    // Pay via webhook → should generate a receipt for the order.
    const payload = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { order_id: 'order_rcpt_test', id: 'pay_rcpt_1' } } } });
    const sig = createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET ?? '').update(Buffer.from(payload)).digest('hex');
    let r = await fetch(`${ROOT}/commerce/webhook`, { method: 'POST', headers: { ...JSON_HEADERS, 'x-razorpay-signature': sig }, body: payload });
    check('webhook payment.captured -> 200', r.status === 200, `got ${r.status}`);
    check('order marked paid', (await OrderModel.findById(order._id))?.status === 'paid');

    // Receipt from the webhook order
    r = await fetch(`${ROOT}/commerce/receipts`, { headers: hdr });
    let receipts = ((await r.json()) as { receipts: Receipt[] }).receipts;
    check('one receipt after payment', receipts.length === 1, `got ${receipts.length}`);
    const rec = receipts[0]!;
    check('receipt number format PF-YYYY-NNNN', /^PF-\d{4}-\d{4}$/.test(rec.receiptNumber), rec.receiptNumber);
    check('receipt total = amount paid (44900)', rec.total === 44900, `${rec.total}`);
    check('receipt subtotal = total + discount (49900)', rec.subtotal === 49900, `${rec.subtotal}`);
    check('receipt has the coupon + discount', rec.couponCode === 'WELCOME50' && rec.discount === 5000);
    check('receipt line snapshot correct', rec.lines.length === 1 && rec.lines[0]!.title === 'Direct Tax' && rec.lines[0]!.price === 49900);

    // Fetch one + owner scoping
    r = await fetch(`${ROOT}/commerce/receipts/${rec.id}`, { headers: hdr });
    check('GET own receipt -> 200', r.status === 200, `got ${r.status}`);
    r = await fetch(`${ROOT}/commerce/receipts/${rec.id}`, { headers: oHdr });
    check("other user can't fetch my receipt -> 404", r.status === 404, `got ${r.status}`);

    // My Library links the receipt to the order
    r = await fetch(`${ROOT}/commerce/my`, { headers: hdr });
    const my = (await r.json()) as { orders: { status: string; receiptId: string | null; receiptNumber: string | null }[] };
    const paidOrder = my.orders.find((o) => o.status === 'paid');
    check('my-library order links receiptId + number', !!paidOrder?.receiptId && paidOrder?.receiptNumber === rec.receiptNumber);

    // Idempotency — replaying the webhook must NOT create a second receipt
    r = await fetch(`${ROOT}/commerce/webhook`, { method: 'POST', headers: { ...JSON_HEADERS, 'x-razorpay-signature': sig }, body: payload });
    r = await fetch(`${ROOT}/commerce/receipts`, { headers: hdr });
    check('webhook replay does not duplicate receipt', ((await r.json()) as { receipts: Receipt[] }).receipts.length === 1);

    // Free path: a 100% coupon → free paid order → receipt auto-generated
    await CouponModel.create({ code: 'FREE100', discountType: 'percent', discountValue: 100, appliesTo: 'all', isActive: true });
    r = await fetch(`${ROOT}/commerce/orders`, { method: 'POST', headers: { ...JSON_HEADERS, ...hdr }, body: JSON.stringify({ items: [{ type: 'lesson', id: String(lessonB._id) }], couponCode: 'FREE100' }) });
    check('free-coupon order -> 201', r.status === 201, `got ${r.status}`);
    r = await fetch(`${ROOT}/commerce/receipts`, { headers: hdr });
    receipts = ((await r.json()) as { receipts: Receipt[] }).receipts;
    const free = receipts.find((x) => x.total === 0);
    check('free order also produced a receipt', receipts.length === 2 && !!free, `count=${receipts.length}`);
    check('free receipt line snapshot correct', free?.lines[0]?.title === 'Indirect Tax');
  } finally {
    await mongoose.connection.dropDatabase();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
  }

  console.log(failures === 0 ? '\n✅ All receipt smoke tests passed' : `\n❌ ${failures} test(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
