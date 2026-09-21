import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db.js";
import type { AuthRequest } from "../../auth.js";
import { requireAdmin } from "../../auth.js";
import { addTransaction } from "../../services/stardust.js";
import { trackEvent } from "../../services/analytics.js";

const router = Router();

const grantSchema = z.object({
  amount: z.number().int().min(1),
  reason: z.string().trim().min(1).max(500),
});

// Get all messages sent by a specific user (for moderation/review)
router.get("/:id/messages", requireAdmin, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const messages = await prisma.spaceMessage.findMany({
    where: { senderId: id },
    orderBy: { createdAt: "desc" },
    include: {
      journeys: {
        include: {
          recipients: true,
          events: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      },
    },
  });

  const recipientIds = Array.from(
    new Set(messages.flatMap((m) => m.journeys.flatMap((j) => j.recipients.map((r) => r.userId))))
  );
  const users = await prisma.user.findMany({
    where: { id: { in: recipientIds } },
    select: { id: true, username: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const enriched = messages.map((m) => ({
    ...m,
    journeys: m.journeys.map((j) => ({
      ...j,
      recipients: j.recipients.map((r) => ({
        ...r,
        user: userMap.get(r.userId) || null,
      })),
    })),
  }));

  res.json({ messages: enriched });
});

// Get all conversations for a specific user (for moderation/review)
router.get("/:id/conversations", requireAdmin, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const memberships = await prisma.conversationMember.findMany({
    where: { userId: id },
    include: {
      conversation: {
        include: {
          members: true,
          messages: { orderBy: { createdAt: "desc" }, take: 50 },
        },
      },
    },
  });

  const memberUserIds = Array.from(
    new Set(memberships.flatMap((m) => m.conversation.members.map((member) => member.userId)))
  );
  const users = await prisma.user.findMany({
    where: { id: { in: memberUserIds } },
    select: { id: true, username: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const enriched = memberships.map((m) => ({
    ...m.conversation,
    members: m.conversation.members.map((member) => ({
      ...member,
      user: userMap.get(member.userId) || null,
    })),
  }));

  res.json({ conversations: enriched });
});

// Grant Stardust to a user (admin only)
router.post("/:id/grant-stardust", requireAdmin, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const parsed = grantSchema.safeParse(req.body);
  if (Number.isNaN(id) || !parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { amount, reason } = parsed.data;
  const result = await addTransaction(id, "credit", amount, "admin_grant", {
    reason,
    grantedBy: req.userId,
  });

  await trackEvent(req.userId || null, "admin_grant_stardust", {
    targetUserId: id,
    amount,
    reason,
  });

  res.json({
    ok: true,
    userId: id,
    balance: result.stardust.balance,
    amount,
    reason,
  });
});

export default router;
