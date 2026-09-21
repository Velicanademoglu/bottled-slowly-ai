import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import type { AuthRequest } from "../auth.js";
import { createNotification } from "../services/notifications.js";
import { trackEvent } from "../services/analytics.js";
import { getCountryCoordinates } from "../lib/countries.js";

const router = Router();

router.get("/incoming", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const recipients = await prisma.messageRecipient.findMany({
    where: { userId, status: "pending" },
    orderBy: { createdAt: "desc" },
    include: {
      journey: {
        include: {
          message: {
            include: {
              sender: {
                include: { profile: true, languages: true, interests: true },
              },
            },
          },
        },
      },
    },
  });

  const items = recipients.map((r) => {
    const sender = r.journey.message.sender;
    const age = sender.profile?.birthDate
      ? new Date().getFullYear() - new Date(sender.profile.birthDate).getFullYear()
      : null;
    return {
      recipientId: r.id,
      journeyId: r.journeyId,
      messageId: r.journey.message.id,
      content: r.journey.message.content,
      vesselKey: r.journey.message.vesselKey,
      sender: {
        id: sender.id,
        username: sender.username,
        age,
        country: sender.profile?.country,
        bio: sender.profile?.bio,
        languages: sender.languages.map((l) => l.language),
        interests: sender.interests.map((i) => i.interest),
      },
      createdAt: r.createdAt,
    };
  });

  res.json({ items });
});

router.post("/:recipientId/accept", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const recipientId = Number(req.params.recipientId);
  if (Number.isNaN(recipientId)) {
    res.status(400).json({ error: "Invalid recipient id" });
    return;
  }

  const recipient = await prisma.messageRecipient.findFirst({
    where: { id: recipientId, userId, status: "pending" },
    include: {
      journey: {
        include: { message: true },
      },
    },
  });

  if (!recipient) {
    res.status(404).json({ error: "Message not found or already handled" });
    return;
  }

  const senderId = recipient.journey.message.senderId;
  const messageId = recipient.journey.message.id;
  const accepter = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
  const acceptCoords = getCountryCoordinates(accepter?.profile?.country);

  const [updatedRecipient, updatedJourney, connection, conversation, currentUser] = await prisma.$transaction(async (tx) => {
    const r = await tx.messageRecipient.update({
      where: { id: recipientId },
      data: { status: "accepted", updatedAt: new Date() },
    });

    const j = await tx.messageJourney.update({
      where: { id: recipient.journeyId },
      data: {
        status: "accepted",
        accepts: { increment: 1 },
        currentRecipientId: userId,
      },
    });

    const c = await tx.connection.create({
      data: {
        userAId: senderId,
        userBId: userId,
        messageId,
      },
    });

    const conv = await tx.conversation.create({
      data: {
        title: "New connection",
        members: {
          create: [{ userId: senderId }, { userId }],
        },
      },
    });

    await tx.spaceMessage.update({
      where: { id: messageId },
      data: { status: "accepted" },
    });

    await tx.journeyEvent.create({
      data: {
        journeyId: recipient.journeyId,
        type: "accepted",
        country: accepter?.profile?.country || undefined,
        lat: acceptCoords?.lat,
        lng: acceptCoords?.lng,
        metadata: JSON.stringify({ recipientId: userId, country: accepter?.profile?.country }),
      },
    });

    const u = await tx.user.findUnique({ where: { id: userId }, select: { username: true } });

    return [r, j, c, conv, u];
  });

  await createNotification(senderId, "message_accepted", "Your message was found", `${currentUser?.username || "Someone"} accepted your message.`, {
    conversationId: conversation.id,
  });

  await trackEvent(userId, "message_accepted", { messageId, senderId, conversationId: conversation.id });

  res.json({
    recipient: updatedRecipient,
    journey: updatedJourney,
    connection,
    conversation,
  });
});

router.post("/:recipientId/pass", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const recipientId = Number(req.params.recipientId);
  if (Number.isNaN(recipientId)) {
    res.status(400).json({ error: "Invalid recipient id" });
    return;
  }

  const recipient = await prisma.messageRecipient.findFirst({
    where: { id: recipientId, userId, status: "pending" },
    include: {
      journey: {
        include: { message: { include: { sender: true } } },
      },
    },
  });

  if (!recipient) {
    res.status(404).json({ error: "Message not found or already handled" });
    return;
  }

  const { findBestMatch } = await import("../services/matching.js");
  const nextMatch = await findBestMatch(recipient.journey.message.senderId);

  const [passer, nextUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { profile: true } }),
    nextMatch ? prisma.user.findUnique({ where: { id: nextMatch.user.id }, include: { profile: true } }) : Promise.resolve(null),
  ]);
  const passCoords = getCountryCoordinates(passer?.profile?.country);
  const nextCoords = nextUser?.profile?.country ? getCountryCoordinates(nextUser.profile.country) : null;

  await prisma.$transaction(async (tx) => {
    await tx.messageRecipient.update({
      where: { id: recipientId },
      data: { status: "passed", updatedAt: new Date() },
    });

    await tx.messageJourney.update({
      where: { id: recipient.journeyId },
      data: { passes: { increment: 1 } },
    });

    await tx.journeyEvent.create({
      data: {
        journeyId: recipient.journeyId,
        type: "passed",
        country: passer?.profile?.country || undefined,
        lat: passCoords?.lat,
        lng: passCoords?.lng,
        metadata: JSON.stringify({ previousRecipientId: userId, country: passer?.profile?.country }),
      },
    });

    if (nextMatch) {
      await tx.messageRecipient.create({
        data: {
          journeyId: recipient.journeyId,
          userId: nextMatch.user.id,
          status: "pending",
        },
      });

      await tx.messageJourney.update({
        where: { id: recipient.journeyId },
        data: { currentRecipientId: nextMatch.user.id },
      });

      await tx.journeyEvent.create({
        data: {
          journeyId: recipient.journeyId,
          type: "requeued",
          country: nextUser?.profile?.country || undefined,
          lat: nextCoords?.lat,
          lng: nextCoords?.lng,
          metadata: JSON.stringify({
            recipientId: nextMatch.user.id,
            score: Math.round(nextMatch.score * 100) / 100,
            country: nextUser?.profile?.country,
          }),
        },
      });
    }
  });

  await trackEvent(userId, "message_passed", { messageId: recipient.journey.message.id });

  res.json({ ok: true, nextMatch: nextMatch ? { id: nextMatch.user.id, username: nextMatch.user.username } : null });
});

router.get("/history", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const recipients = await prisma.messageRecipient.findMany({
    where: { userId, status: { in: ["accepted", "passed"] } },
    orderBy: { updatedAt: "desc" },
    include: {
      journey: {
        include: {
          message: {
            include: { sender: { select: { id: true, username: true } } },
          },
        },
      },
    },
  });
  res.json({ items: recipients });
});

router.get("/traveling", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const messages = await prisma.spaceMessage.findMany({
    where: { senderId: userId, status: { in: ["launched", "traveling"] } },
    orderBy: { launchedAt: "desc" },
    include: {
      journeys: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          recipients: {
            where: { status: "pending" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          events: { orderBy: { createdAt: "desc" }, take: 20, select: { type: true, country: true, lat: true, lng: true, createdAt: true, metadata: true } },
        },
      },
    },
  });

  const pendingUserIds = messages
    .map((m) => m.journeys[0]?.recipients[0]?.userId)
    .filter((id): id is number => typeof id === "number");

  const users = await prisma.user.findMany({
    where: { id: { in: pendingUserIds } },
    select: { id: true, username: true, profile: { select: { country: true } } },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const items = messages.map((m) => {
    const journey = m.journeys[0];
    const pendingRecipientId = journey?.recipients[0]?.userId;
    const recipientUser = pendingRecipientId ? userMap.get(pendingRecipientId) : undefined;
    return {
      messageId: m.id,
      journeyId: journey?.id,
      content: m.content,
      vesselKey: m.vesselKey,
      status: journey?.status || m.status,
      launchedAt: m.launchedAt,
      currentRecipient: recipientUser
        ? {
            id: recipientUser.id,
            username: recipientUser.username,
            country: recipientUser.profile?.country,
          }
        : null,
      passes: journey?.passes || 0,
      accepts: journey?.accepts || 0,
      events: journey?.events || [],
    };
  });

  res.json({ items });
});

router.get("/found", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const messages = await prisma.spaceMessage.findMany({
    where: { senderId: userId, status: "accepted" },
    orderBy: { updatedAt: "desc" },
    include: {
      journeys: {
        include: {
          recipients: {
            where: { status: "accepted" },
          },
        },
      },
    },
  });

  const acceptedUserIds = Array.from(
    new Set(
      messages.flatMap((m) => m.journeys.flatMap((j) => j.recipients.map((r) => r.userId)))
    )
  );

  const users = await prisma.user.findMany({
    where: { id: { in: acceptedUserIds } },
    select: { id: true, username: true, profile: { select: { country: true } } },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const items = messages.flatMap((m) =>
    m.journeys.flatMap((j) =>
      j.recipients.map((r) => {
        const u = userMap.get(r.userId);
        return {
          messageId: m.id,
          journeyId: j.id,
          content: m.content,
          vesselKey: m.vesselKey,
          acceptedAt: r.updatedAt,
          recipient: {
            id: u?.id || r.userId,
            username: u?.username || "Unknown",
            country: u?.profile?.country,
          },
        };
      })
    )
  );

  res.json({ items });
});

export default router;
