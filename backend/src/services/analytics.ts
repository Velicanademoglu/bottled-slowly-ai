import { prisma } from "../db.js";

export async function trackEvent(userId: number | null, event: string, payload?: Record<string, unknown>) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        userId,
        event,
        payload: payload ? JSON.stringify(payload) : null,
      },
    });
  } catch (err) {
    console.error("Analytics event failed:", err);
  }
}
