import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

// Reference the host's injected Supabase secrets so the platform wires the DB
// and injects SUPABASE_DATABASE_URL into the runtime. The client is used for
// platform integration detection; Prisma is the primary DB driver.
// realtime-js needs a WebSocket constructor on Node <22 — supply `ws`.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
        realtime: {
          transport: WebSocket as never,
          heartbeatIntervalMs: 30000,
        },
      })
    : null;

// Resolve DB URL from whichever secret the host injects
const dbUrl =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRESQL_URL ||
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
