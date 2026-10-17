// One-time database initializer: applies schema + seed on first boot.
// Runs before the API server starts. Safe to run on every container start:
// schema is only applied when the User table is missing, seed only when empty.
import { readFileSync } from "node:fs";
import pg from "pg";

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.APP_DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!dbUrl) {
  console.error("[db-init] No DATABASE_URL configured - skipping init");
  process.exit(0);
}

const isLocal = /@(localhost|127\.0\.0\.1)/.test(dbUrl);
const client = new pg.Client({
  connectionString: dbUrl,
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});

async function tableExists(name) {
  const res = await client.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1",
    [name],
  );
  return res.rowCount > 0;
}

// Idempotent schema upgrades applied on every boot (safe re-runs).
// Keep in sync with prisma/migrations.
const SCHEMA_UPGRADES = [
  // 20261017220000_call_tiers: tiered call subscriptions ($5 voice / $15 video monthly)
  `ALTER TABLE "UserPremium" ADD COLUMN IF NOT EXISTS "voiceUntil" TIMESTAMP(3)`,
  `ALTER TABLE "UserPremium" ADD COLUMN IF NOT EXISTS "videoUntil" TIMESTAMP(3)`,
];

async function main() {
  await client.connect();
  console.log("[db-init] connected");

  if (!(await tableExists("User"))) {
    console.log("[db-init] applying schema...");
    const schema = readFileSync("/app/db/schema.sql", "utf8");
    await client.query(schema);
    console.log("[db-init] schema applied");
  } else {
    console.log("[db-init] schema already present");
  }

  for (const sql of SCHEMA_UPGRADES) {
    await client.query(sql);
  }
  console.log(`[db-init] schema upgrades applied (${SCHEMA_UPGRADES.length})`);

  const count = await client.query("SELECT COUNT(*)::int AS n FROM \"User\"");
  if (count.rows[0].n === 0) {
    console.log("[db-init] applying seed data...");
    const seed = readFileSync("/app/db/seed.sql", "utf8");
    await client.query(seed);
    console.log("[db-init] seed applied");
  } else {
    console.log(`[db-init] database already seeded (${count.rows[0].n} users)`);
  }
}

main()
  .then(() => {
    console.log("[db-init] done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[db-init] FAILED:", err.message);
    process.exit(1);
  });
