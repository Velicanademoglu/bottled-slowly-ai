import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export async function checkPendingMessages() {
  // Placeholder for future delivery/matching engine
  return;
}
