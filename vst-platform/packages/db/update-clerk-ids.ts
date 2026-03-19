/**
 * VST Platform — Update Staging ClerkIds
 *
 * Replaces stub clerkIds in the staging DB with real Clerk user subject IDs.
 * Run this once after creating users in the Clerk dashboard.
 *
 * USAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *   export DATABASE_URL="postgresql://vst_user:pass@localhost:5432/vst_staging"
 *   export CLERK_GUEST_ID="user_xxxxxxxxxxxxxxxxxxxx"
 *   export CLERK_PREMIUM_ID="user_xxxxxxxxxxxxxxxxxxxx"
 *   cd packages/db && npx ts-node update-clerk-ids.ts
 *
 * WHERE TO FIND CLERK USER IDs
 * ─────────────────────────────────────────────────────────────────────────────
 *   Clerk Dashboard → your staging application → Users
 *   Click the user → copy the "User ID" field (starts with user_)
 *   This is the sub claim that ClerkAuthGuard verifies in JWTs.
 *
 * SAFETY
 * ─────────────────────────────────────────────────────────────────────────────
 *   - Only updates rows matched by email. Will not update production rows.
 *   - Dry-run mode: set DRY_RUN=true to print what would change without writing.
 *   - Idempotent: safe to re-run after updating env vars.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DRY_RUN       = process.env.DRY_RUN === 'true';
const GUEST_ID      = process.env.CLERK_GUEST_ID;
const PREMIUM_ID    = process.env.CLERK_PREMIUM_ID;

async function main() {
  if (!GUEST_ID || !PREMIUM_ID) {
    console.error('ERROR: CLERK_GUEST_ID and CLERK_PREMIUM_ID must be set.');
    console.error('  export CLERK_GUEST_ID="user_xxxx"');
    console.error('  export CLERK_PREMIUM_ID="user_xxxx"');
    process.exit(1);
  }

  const updates = [
    { email: 'guest@vst-staging.test',   newClerkId: GUEST_ID,   label: 'Guest' },
    { email: 'premium@vst-staging.test', newClerkId: PREMIUM_ID, label: 'Premium' },
  ];

  console.log(`VST ClerkId Update${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  for (const { email, newClerkId, label } of updates) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.error(`  MISSING: ${email} not found in DB. Run seed.ts first.`);
      continue;
    }

    if (user.clerkId === newClerkId) {
      console.log(`  SKIP: ${label} (${email}) already set to ${newClerkId}`);
      continue;
    }

    console.log(`  ${label} (${email})`);
    console.log(`    old clerkId: ${user.clerkId}`);
    console.log(`    new clerkId: ${newClerkId}`);

    if (!DRY_RUN) {
      await prisma.user.update({
        where: { email },
        data:  { clerkId: newClerkId },
      });
      console.log(`    UPDATED ✓`);
    } else {
      console.log(`    [DRY RUN — no write]`);
    }
  }

  console.log('\nDone.');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
