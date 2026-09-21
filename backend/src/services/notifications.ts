import { prisma } from "../db.js";

export async function createNotification(
  userId: number,
  type: string,
  title: string,
  body: string,
  metadata?: Record<string, unknown>
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    },
  });
}
