/**
 * Create (or promote) the first admin. Idempotent — safe to re-run.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=secret12345 npm run seed:admin
 *
 * Reads ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME / ADMIN_ROLE from the env
 * (or your .env). There is no public admin signup — this is the only way in.
 */
import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { hashPassword } from '../modules/auth/auth.password.js';
import { UserModel } from '../modules/auth/user.model.js';

async function main(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD ?? '';
  const name = process.env.ADMIN_NAME?.trim() || 'Administrator';
  const role = process.env.ADMIN_ROLE === 'superadmin' ? 'superadmin' : 'admin';

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (in .env or the environment) first.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  if (env.DNS_SERVERS) {
    dns.setServers(
      env.DNS_SERVERS.split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }
  await mongoose.connect(env.MONGODB_URI);

  const existing = await UserModel.findOne({ email });
  if (existing) {
    existing.role = role;
    existing.emailVerified = true;
    if (!existing.name) existing.name = name;
    await existing.save();
    console.log(`✅ Updated ${email} → role=${role}`);
  } else {
    await UserModel.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      role,
      emailVerified: true,
    });
    console.log(`✅ Created ${role}: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
