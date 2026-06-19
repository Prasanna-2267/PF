/**
 * List admin accounts (quick ops check).
 *
 *   npm run admins
 */
import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { UserModel } from '../modules/auth/user.model.js';

async function main(): Promise<void> {
  if (env.DNS_SERVERS) {
    dns.setServers(
      env.DNS_SERVERS.split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }
  await mongoose.connect(env.MONGODB_URI);

  const total = await UserModel.countDocuments();
  const admins = await UserModel.find({ role: { $in: ['admin', 'superadmin'] } })
    .select('email role createdAt')
    .lean();

  console.log(`Total users: ${total}`);
  if (admins.length === 0) {
    console.log('No admin accounts found. Create one with: npm run seed:admin');
  } else {
    console.log(`Admins (${admins.length}):`);
    for (const a of admins) console.log(`  - ${a.email}  [${a.role}]`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
