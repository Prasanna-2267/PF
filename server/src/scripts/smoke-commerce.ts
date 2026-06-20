/**
 * Commerce integration test (Phase 4): package RBAC, order validation, the
 * payments-not-configured gate, and entitlements unlocking paid lessons
 * (directly and via packages).
 *
 *   npm run test:smoke:commerce
 */
import dns from 'node:dns';
import { rm } from 'node:fs/promises';
import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { PDFDocument } from 'pdf-lib';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { hashPassword } from '../modules/auth/auth.password.js';
import { UserModel } from '../modules/auth/user.model.js';
import { ExamCategoryModel } from '../modules/content/exam-category.model.js';
import { StageModel } from '../modules/content/stage.model.js';
import { SubjectModel } from '../modules/content/subject.model.js';
import { OrderModel } from '../modules/commerce/order.model.js';
import { CouponModel } from '../modules/commerce/coupon.model.js';

const PORT = 4105;
const ROOT = `http://localhost:${PORT}/api`;
const JSON_HEADERS = { 'Content-Type': 'application/json' };

let failures = 0;
function check(name: string, passed: boolean, detail = ''): void {
  if (!passed) failures++;
  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function loginToken(email: string, password: string): Promise<string> {
  const r = await fetch(`${ROOT}/auth/login`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ email, password }) });
  return ((await r.json()) as { accessToken?: string }).accessToken ?? '';
}

async function main(): Promise<void> {
  if (env.DNS_SERVERS) dns.setServers(env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean));
  await mongoose.connect(env.MONGODB_URI, { dbName: 'parallax_flow_test' });
  await mongoose.connection.dropDatabase();

  const pw = 'password123';
  await UserModel.create({ name: 'Admin', email: `a_${Date.now()}@x.com`, passwordHash: await hashPassword(pw), role: 'admin', emailVerified: true });
  await UserModel.create({ name: 'Stud', email: `s_${Date.now()}@x.com`, passwordHash: await hashPassword(pw), role: 'student', emailVerified: true, phone: '9998887777' });
  const admin = (await UserModel.findOne({ role: 'admin' }))!;
  const student = (await UserModel.findOne({ role: 'student' }))!;

  const cat = await ExamCategoryModel.create({ name: 'CA', slug: `ca-${Date.now()}` });
  const stage = await StageModel.create({ name: 'Inter', examCategoryId: cat._id });
  const subject = await SubjectModel.create({ name: 'Taxation', stageId: stage._id });
  const subjectId = String(subject._id);

  const pdf = await PDFDocument.create();
  pdf.addPage([300, 400]);
  pdf.addPage([300, 400]);
  const pdfBytes = await pdf.save();
  const pdfForm = (price: number, free = false) => {
    const fd = new FormData();
    fd.append('title', free ? 'Free notes' : 'Paid notes');
    fd.append('subjectId', subjectId);
    fd.append('price', String(price));
    if (free) fd.append('isFree', 'true');
    fd.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'n.pdf');
    return fd;
  };

  const app = createApp();
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });

  try {
    const adminTok = await loginToken(admin.email, pw);
    const studTok = await loginToken(student.email, pw);
    const adminHdr = { Authorization: `Bearer ${adminTok}` };
    const studHdr = { Authorization: `Bearer ${studTok}` };

    const paidId = ((await (await fetch(`${ROOT}/admin/lessons/pdf`, { method: 'POST', headers: adminHdr, body: pdfForm(99) })).json()) as { lesson?: { id?: string } }).lesson?.id ?? '';
    const pkgLessonId = ((await (await fetch(`${ROOT}/admin/lessons/pdf`, { method: 'POST', headers: adminHdr, body: pdfForm(149) })).json()) as { lesson?: { id?: string } }).lesson?.id ?? '';
    const freeId = ((await (await fetch(`${ROOT}/admin/lessons/pdf`, { method: 'POST', headers: adminHdr, body: pdfForm(0, true) })).json()) as { lesson?: { id?: string } }).lesson?.id ?? '';
    const couponL1 = ((await (await fetch(`${ROOT}/admin/lessons/pdf`, { method: 'POST', headers: adminHdr, body: pdfForm(100) })).json()) as { lesson?: { id?: string } }).lesson?.id ?? '';
    const couponL2 = ((await (await fetch(`${ROOT}/admin/lessons/pdf`, { method: 'POST', headers: adminHdr, body: pdfForm(100) })).json()) as { lesson?: { id?: string } }).lesson?.id ?? '';
    check('uploaded paid + package + free lessons', !!paidId && !!pkgLessonId && !!freeId && !!couponL1 && !!couponL2);

    // Package RBAC
    const pkgBody = JSON.stringify({ title: 'Tax bundle', lessonIds: [pkgLessonId], price: 199 });
    let r = await fetch(`${ROOT}/admin/commerce/packages`, { method: 'POST', headers: { ...JSON_HEADERS, ...studHdr }, body: pkgBody });
    check('student create package -> 403 (RBAC)', r.status === 403, `got ${r.status}`);
    r = await fetch(`${ROOT}/admin/commerce/packages`, { method: 'POST', headers: { ...JSON_HEADERS, ...adminHdr }, body: pkgBody });
    const pkgId = ((await r.json()) as { package?: { id?: string } }).package?.id ?? '';
    check('admin create package -> 201', r.status === 201 && !!pkgId, `got ${r.status}`);

    // Paid lesson locked before purchase
    r = await fetch(`${ROOT}/lessons/${paidId}/view`, { headers: studHdr });
    check('paid lesson view (not owned) -> 402', r.status === 402, `got ${r.status}`);
    r = await fetch(`${ROOT}/lessons?subjectId=${subjectId}`, { headers: studHdr });
    const list = (await r.json()) as { lessons?: { id: string; locked: boolean }[] };
    check('paid lesson reported locked=true', list.lessons?.find((l) => l.id === paidId)?.locked === true);

    // Order validation + payments gate
    r = await fetch(`${ROOT}/commerce/orders`, { method: 'POST', headers: { ...JSON_HEADERS, ...studHdr }, body: JSON.stringify({ items: [{ type: 'lesson', id: '0123456789abcdef01234567' }] }) });
    check('order for invalid lesson -> 400', r.status === 400, `got ${r.status}`);
    r = await fetch(`${ROOT}/commerce/orders`, { method: 'POST', headers: { ...JSON_HEADERS, ...studHdr }, body: JSON.stringify({ items: [{ type: 'lesson', id: freeId }] }) });
    check('order for FREE lesson -> 400', r.status === 400, `got ${r.status}`);
    r = await fetch(`${ROOT}/commerce/orders`, { method: 'POST', headers: { ...JSON_HEADERS, ...studHdr }, body: JSON.stringify({ items: [{ type: 'lesson', id: paidId }] }) });
    check('order for paid lesson (no Razorpay keys) -> 503', r.status === 503, `got ${r.status}`);

    // Idempotency: the same key must not create a second order
    const idemKey = `idem-${Date.now()}`;
    const idemBody = JSON.stringify({ items: [{ type: 'lesson', id: paidId }], idempotencyKey: idemKey });
    await fetch(`${ROOT}/commerce/orders`, { method: 'POST', headers: { ...JSON_HEADERS, ...studHdr }, body: idemBody });
    await fetch(`${ROOT}/commerce/orders`, { method: 'POST', headers: { ...JSON_HEADERS, ...studHdr }, body: idemBody });
    const dupCount = await OrderModel.countDocuments({ idempotencyKey: idemKey });
    check('idempotency key dedupes order creation', dupCount === 1, `${dupCount} orders`);

    // Grant entitlement directly (simulating a paid order), then it unlocks
    await OrderModel.create({ userId: student._id, items: [{ type: 'lesson', refId: paidId }], amount: 9900, status: 'paid' });
    r = await fetch(`${ROOT}/lessons/${paidId}/view`, { headers: studHdr });
    check('after direct purchase: view -> 200', r.status === 200, `got ${r.status}`);
    r = await fetch(`${ROOT}/lessons?subjectId=${subjectId}`, { headers: studHdr });
    const list2 = (await r.json()) as { lessons?: { id: string; locked: boolean }[] };
    check('owned lesson now locked=false', list2.lessons?.find((l) => l.id === paidId)?.locked === false);

    // Package entitlement unlocks its lessons
    r = await fetch(`${ROOT}/lessons/${pkgLessonId}/view`, { headers: studHdr });
    check('package lesson view (not owned) -> 402', r.status === 402, `got ${r.status}`);
    await OrderModel.create({ userId: student._id, items: [{ type: 'package', refId: pkgId }], amount: 19900, status: 'paid' });
    r = await fetch(`${ROOT}/lessons/${pkgLessonId}/view`, { headers: studHdr });
    check('after package purchase: lesson view -> 200', r.status === 200, `got ${r.status}`);

    // Cannot pay twice for something already owned
    r = await fetch(`${ROOT}/commerce/orders`, { method: 'POST', headers: { ...JSON_HEADERS, ...studHdr }, body: JSON.stringify({ items: [{ type: 'lesson', id: paidId }] }) });
    check('order for already-owned lesson -> 409', r.status === 409, `got ${r.status}`);

    // ── Coupons ──
    const mkCoupon = (body: object, hdr = adminHdr) =>
      fetch(`${ROOT}/admin/commerce/coupons`, { method: 'POST', headers: { ...JSON_HEADERS, ...hdr }, body: JSON.stringify(body) });
    const order = (items: object, couponCode?: string) =>
      fetch(`${ROOT}/commerce/orders`, { method: 'POST', headers: { ...JSON_HEADERS, ...studHdr }, body: JSON.stringify({ items, couponCode }) });

    r = await mkCoupon({ code: 'NOPERM', discountType: 'percent', discountValue: 50 }, studHdr);
    check('student create coupon -> 403 (RBAC)', r.status === 403, `got ${r.status}`);

    r = await mkCoupon({ code: 'fifty', discountType: 'percent', discountValue: 50, appliesTo: 'all' });
    check('admin create coupon -> 201 (uppercased)', r.status === 201);
    await mkCoupon({ code: 'FREEALL', discountType: 'percent', discountValue: 100, appliesTo: 'all', maxRedemptions: 1 });
    await mkCoupon({ code: 'PKGONLY', discountType: 'flat', discountValue: 50, appliesTo: 'packages', packageIds: [pkgId] });
    await mkCoupon({ code: 'EXPIRED', discountType: 'percent', discountValue: 50, appliesTo: 'all', expiresAt: new Date(Date.now() - 86_400_000).toISOString() });

    r = await order([{ type: 'lesson', id: couponL2 }], 'NOPE999');
    check('invalid coupon -> 400', r.status === 400, `got ${r.status}`);
    r = await order([{ type: 'lesson', id: couponL2 }], 'PKGONLY');
    check('coupon scoped to packages on a lesson -> 400', r.status === 400, `got ${r.status}`);

    // 50% off ₹100 lesson → order stored at ₹50 (then 503 since Razorpay unset)
    r = await order([{ type: 'lesson', id: couponL2 }], 'FIFTY');
    const fiftyOrder = await OrderModel.findOne({ userId: student._id, couponCode: 'FIFTY' }).lean();
    check('50% coupon computes discount (amount 5000, discount 5000)', fiftyOrder?.amount === 5000 && fiftyOrder?.discount === 5000, `amt=${fiftyOrder?.amount}`);

    // 100% coupon → free order, granted immediately, redemption counted
    r = await order([{ type: 'lesson', id: couponL1 }], 'FREEALL');
    const freeRes = (await r.json()) as { free?: boolean };
    check('100% coupon -> 200 free order', r.status === 201 && freeRes.free === true, `got ${r.status}`);
    r = await fetch(`${ROOT}/lessons/${couponL1}/view`, { headers: studHdr });
    check('coupon-granted lesson unlocks -> 200', r.status === 200, `got ${r.status}`);
    const usedCoupon = await CouponModel.findOne({ code: 'FREEALL' }).lean();
    check('coupon redemption counted on payment', usedCoupon?.redemptions === 1, `${usedCoupon?.redemptions}`);

    // usage limit + expiry
    r = await order([{ type: 'lesson', id: couponL2 }], 'FREEALL');
    check('coupon over usage limit -> 400', r.status === 400, `got ${r.status}`);
    r = await order([{ type: 'lesson', id: couponL2 }], 'EXPIRED');
    check('expired coupon -> 400', r.status === 400, `got ${r.status}`);

    // Library
    r = await fetch(`${ROOT}/commerce/my`, { headers: studHdr });
    const lib = (await r.json()) as { ownedLessonIds?: string[]; orders?: unknown[] };
    check('my purchases lists owned lessons + orders', (lib.ownedLessonIds?.length ?? 0) >= 2 && (lib.orders?.length ?? 0) >= 2, `${lib.ownedLessonIds?.length} owned`);

    // Packages listing
    r = await fetch(`${ROOT}/commerce/packages`, { headers: studHdr });
    const pk = (await r.json()) as { packages?: unknown[]; paymentsEnabled?: boolean };
    check('packages listing works + paymentsEnabled=false', Array.isArray(pk.packages) && pk.paymentsEnabled === false);
  } finally {
    await mongoose.connection.dropDatabase();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
    await rm(env.STORAGE_DIR ?? 'storage', { recursive: true, force: true });
  }

  console.log(failures === 0 ? '\n✅ All commerce smoke tests passed' : `\n❌ ${failures} test(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
