/**
 * Content + RBAC integration smoke test. Proves admin-only routes reject
 * students/anonymous and accept admins, and that the category→stage→subject
 * tree works. Runs against an isolated test DB.
 *
 *   npm run test:smoke:content
 */
import dns from 'node:dns';
import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { hashPassword } from '../modules/auth/auth.password.js';
import { UserModel } from '../modules/auth/user.model.js';

const PORT = 4101;
const ROOT = `http://localhost:${PORT}/api`;
const JSON_HEADERS = { 'Content-Type': 'application/json' };

let failures = 0;
function check(name: string, passed: boolean, detail = ''): void {
  if (!passed) failures++;
  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

function authHeaders(token?: string) {
  return token ? { ...JSON_HEADERS, Authorization: `Bearer ${token}` } : JSON_HEADERS;
}

async function loginToken(email: string, password: string): Promise<string> {
  const r = await fetch(`${ROOT}/auth/login`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password }),
  });
  const data = (await r.json()) as { accessToken?: string };
  return data.accessToken ?? '';
}

async function main(): Promise<void> {
  if (env.DNS_SERVERS) {
    dns.setServers(
      env.DNS_SERVERS.split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }
  await mongoose.connect(env.MONGODB_URI, { dbName: 'parallax_flow_test' });
  await mongoose.connection.dropDatabase();

  const adminEmail = `admin_${Date.now()}@example.com`;
  const studentEmail = `student_${Date.now()}@example.com`;
  const pw = 'password123';
  await UserModel.create({
    name: 'Admin',
    email: adminEmail,
    passwordHash: await hashPassword(pw),
    role: 'admin',
    emailVerified: true,
  });
  await UserModel.create({
    name: 'Student',
    email: studentEmail,
    passwordHash: await hashPassword(pw),
    role: 'student',
    emailVerified: true,
  });

  const app = createApp();
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });

  try {
    const adminToken = await loginToken(adminEmail, pw);
    const studentToken = await loginToken(studentEmail, pw);
    check('admin login', !!adminToken);
    check('student login', !!studentToken);

    const cat = JSON.stringify({ name: 'CA', slug: `ca-${Date.now()}` });

    // RBAC: anonymous + student must be blocked from admin writes
    let r = await fetch(`${ROOT}/admin/content/categories`, { method: 'POST', headers: JSON_HEADERS, body: cat });
    check('create category anonymous -> 401', r.status === 401, `got ${r.status}`);

    r = await fetch(`${ROOT}/admin/content/categories`, { method: 'POST', headers: authHeaders(studentToken), body: cat });
    check('create category as STUDENT -> 403 (RBAC)', r.status === 403, `got ${r.status}`);

    r = await fetch(`${ROOT}/admin/content/categories`, { method: 'POST', headers: authHeaders(adminToken), body: cat });
    const created = (await r.json()) as { category?: { _id?: string } };
    const categoryId = created.category?._id ?? '';
    check('create category as ADMIN -> 201', r.status === 201, `got ${r.status}`);
    check('category id returned', !!categoryId);

    // Public read
    r = await fetch(`${ROOT}/content/categories`);
    const pub = (await r.json()) as { categories?: unknown[] };
    check('public GET categories -> 200', r.status === 200 && Array.isArray(pub.categories) && pub.categories.length >= 1);

    // Stage
    r = await fetch(`${ROOT}/admin/content/stages`, {
      method: 'POST',
      headers: authHeaders(adminToken),
      body: JSON.stringify({ name: 'Intermediate', examCategoryId: categoryId }),
    });
    const stageRes = (await r.json()) as { stage?: { _id?: string } };
    const stageId = stageRes.stage?._id ?? '';
    check('create stage as admin -> 201', r.status === 201, `got ${r.status}`);

    // Subject tree: parent + child
    r = await fetch(`${ROOT}/admin/content/subjects`, {
      method: 'POST',
      headers: authHeaders(adminToken),
      body: JSON.stringify({ name: 'Taxation', stageId }),
    });
    const parentRes = (await r.json()) as { subject?: { _id?: string } };
    const parentId = parentRes.subject?._id ?? '';
    check('create parent subject -> 201', r.status === 201, `got ${r.status}`);

    r = await fetch(`${ROOT}/admin/content/subjects`, {
      method: 'POST',
      headers: authHeaders(adminToken),
      body: JSON.stringify({ name: 'Direct Tax', stageId, parentSubjectId: parentId }),
    });
    check('create sub-subject -> 201', r.status === 201, `got ${r.status}`);

    // wrong-stage parent is rejected
    r = await fetch(`${ROOT}/admin/content/subjects`, {
      method: 'POST',
      headers: authHeaders(adminToken),
      body: JSON.stringify({ name: 'Bad', stageId: '0123456789abcdef01234567', parentSubjectId: parentId }),
    });
    check('subject with invalid stage -> 400', r.status === 400, `got ${r.status}`);

    // Tree shape
    r = await fetch(`${ROOT}/content/stages/${stageId}/subjects`);
    const tree = (await r.json()) as { subjects?: { children?: unknown[] }[] };
    const ok = r.status === 200 && tree.subjects?.length === 1 && tree.subjects[0]?.children?.length === 1;
    check('subject tree nests child under parent', !!ok, `roots=${tree.subjects?.length}`);

    // Guard: deleting a non-empty category
    r = await fetch(`${ROOT}/admin/content/categories/${categoryId}`, { method: 'DELETE', headers: authHeaders(adminToken) });
    check('delete category with stages -> 409', r.status === 409, `got ${r.status}`);

    // Validation
    r = await fetch(`${ROOT}/admin/content/categories`, {
      method: 'POST',
      headers: authHeaders(adminToken),
      body: JSON.stringify({ name: 'X', slug: 'Bad Slug!' }),
    });
    check('invalid slug -> 400', r.status === 400, `got ${r.status}`);
  } finally {
    await mongoose.connection.dropDatabase();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
  }

  console.log(failures === 0 ? '\n✅ All content/RBAC smoke tests passed' : `\n❌ ${failures} test(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
