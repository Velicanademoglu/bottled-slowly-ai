import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import type { AuthRequest } from "../auth.js";
import { isPrivileged } from "../auth.js";
import { findBestMatch } from "../services/matching.js";
import { trackEvent } from "../services/analytics.js";
import { createNotification } from "../services/notifications.js";
import { addTransaction, getOrCreateUserStardust } from "../services/stardust.js";
import { getCountryCoordinates } from "../lib/countries.js";

const router = Router();

const createSchema = z.object({
  content: z.string().trim().min(1).max(1000),
  vesselKey: z.string().trim().min(1).max(50).default("PARCHMENT"),
});

async function getSettingNumber(key: string, fallback: number): Promise<number> {
  const setting = await prisma.appSetting.findUnique({ where: { key } });
  const value = Number(setting?.value);
  return Number.isNaN(value) ? fallback : value;
}

async function countTodaysCasts(userId: number): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return prisma.spaceMessage.count({
    where: { senderId: userId, status: { not: "draft" }, launchedAt: { gte: startOfDay } },
  });
}

router.post("/", async (req: AuthRequest, res) => {
  const senderId = req.userId!;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const message = await prisma.spaceMessage.create({
    data: {
      senderId,
      content: parsed.data.content,
      vesselKey: parsed.data.vesselKey,
      status: "draft",
    },
  });

  await trackEvent(senderId, "message_created", { messageId: message.id });

  res.status(201).json(message);
});

router.post("/:id/cast", async (req: AuthRequest, res) => {
  const senderId = req.userId!;
  const userRole = req.userRole;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid message id" });
    return;
  }

  const message = await prisma.spaceMessage.findFirst({
    where: { id, senderId },
    include: { journeys: true },
  });

  if (!message) {
    res.status(404).json({ error: "Message not found" });
    return;
  }

  if (message.status !== "draft") {
    res.status(400).json({ error: "Message already launched" });
    return;
  }

  // Daily free cast limit (admins/moderators bypass)
  const privileged = isPrivileged(userRole);
  if (!privileged) {
    const [dailyFreeCasts, todaysCasts] = await Promise.all([
      getSettingNumber("economy.daily_free_casts", 3),
      countTodaysCasts(senderId),
    ]);
    if (todaysCasts >= dailyFreeCasts) {
      res.status(429).json({ error: "Daily cast limit reached. Watch an ad or buy extra casts." });
      return;
    }
  }

  // Vessel cost (admins/moderators bypass)
  const vessel = await prisma.messageVessel.findUnique({ where: { key: message.vesselKey } });
  if (vessel?.price && vessel.price > 0 && !privileged) {
    const stardust = await getOrCreateUserStardust(senderId);
    if (stardust.balance < vessel.price) {
      res.status(402).json({ error: `Not enough Stardust. This vessel costs ${vessel.price}.` });
      return;
    }
    await addTransaction(senderId, "debit", vessel.price, "boost_purchase", {
      vesselKey: vessel.key,
      messageId: message.id,
    });
  }

  const match = await findBestMatch(senderId);

  if (!match) {
    res.status(409).json({ error: "No suitable recipient found at this time. Your message will wait in space." });
    return;
  }

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    include: { profile: true },
  });

  const senderCountry = sender?.profile?.country;
  const recipientCountry = match.user.profile?.country;
  const senderCoords = getCountryCoordinates(senderCountry);
  const recipientCoords = getCountryCoordinates(recipientCountry);

  const eventsData: { type: string; country?: string; lat?: number; lng?: number; metadata?: string }[] = [];
  if (senderCoords) {
    eventsData.push({
      type: "launched",
      country: senderCountry || undefined,
      lat: senderCoords.lat,
      lng: senderCoords.lng,
      metadata: JSON.stringify({ country: senderCountry }),
    });
  }
  if (recipientCoords) {
    eventsData.push({
      type: "matched",
      country: recipientCountry || undefined,
      lat: recipientCoords.lat,
      lng: recipientCoords.lng,
      metadata: JSON.stringify({
        recipientId: match.user.id,
        score: Math.round(match.score * 100) / 100,
        compatibility: Math.round(match.compatibility * 100) / 100,
        country: recipientCountry,
      }),
    });
  }

  const [updatedMessage, journey] = await prisma.$transaction([
    prisma.spaceMessage.update({
      where: { id: message.id },
      data: { status: "launched", launchedAt: new Date() },
    }),
    prisma.messageJourney.create({
      data: {
        messageId: message.id,
        currentRecipientId: match.user.id,
        status: "traveling",
        recipients: {
          create: {
            userId: match.user.id,
            status: "pending",
          },
        },
        events: {
          create: eventsData,
        },
      },
    }),
  ]);

  await createNotification(match.user.id, "message_received", "Something entered your orbit", "A new message is waiting for you.");

  await trackEvent(senderId, "message_cast", {
    messageId: message.id,
    recipientId: match.user.id,
  });

  res.json({
    message: updatedMessage,
    journey,
    recipient: {
      id: match.user.id,
      username: match.user.username,
      country: match.user.profile?.country,
    },
    bypassedLimits: privileged || undefined,
  });
});

router.get("/my", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const messages = await prisma.spaceMessage.findMany({
    where: { senderId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      journeys: {
        include: {
          recipients: true,
          events: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      },
    },
  });

  const userIds = new Set(messages.flatMap((m) => m.journeys.flatMap((j) => j.recipients.map((r) => r.userId))));
  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, username: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const enriched = messages.map((m) => ({
    ...m,
    journeys: m.journeys.map((j) => ({
      ...j,
      recipients: j.recipients.map((r) => ({ ...r, user: userMap.get(r.userId) })),
    })),
  }));

  res.json({ messages: enriched });
});

export default router;
