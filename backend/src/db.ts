import { PrismaClient } from "@prisma/client";

// Resolve DB URL from whichever secret the host injects
const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRESQL_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.PG_URL;

if (dbUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = dbUrl;
}

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export async function checkPendingMessages() {
  // Placeholder for future delivery/matching engine
  return;
}
