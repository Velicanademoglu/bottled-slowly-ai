import { Router } from "express";
import { z } from "zod";
import { prisma, checkPendingMessages } from "../db.js";
import type { AuthRequest } from "../auth.js";

const router = Router({ mergeParams: true });

const sendSchema = z.object({
  content: z.string().min(1).max(2000),
  deliveryDelayMin: z.number().int().min(1).max(1440).default(60),
});

function computeVisibleAfter(delayMinutes: number): Date {
  return new Date(Date.now() + delayMinutes * 60 * 1000);
}

router.get("/", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const conversationId = Number(req.params.conversationId);
  if (Number.isNaN(conversationId)) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  await checkPendingMessages();

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  res.json(messages);
});

router.post("/", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const conversationId = Number(req.params.conversationId);
  if (Number.isNaN(conversationId)) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }

  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { content, deliveryDelayMin } = parsed.data;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const visibleAfter = computeVisibleAfter(deliveryDelayMin);
  const message = await prisma.message.create({
    data: {
      content,
      senderType: "USER",
      status: "PENDING",
      deliveryDelayMin,
      visibleAfter,
      conversationId,
      userId,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  res.status(201).json(message);
});

export default router;
