import { Router } from "express";
import { z } from "zod";
import { generateConversationStarter } from "../services/ai.js";
import { prisma } from "../db.js";
import type { AuthRequest } from "../auth.js";

const router = Router();

router.get("/starter", async (_req: AuthRequest, res) => {
  const starter = await generateConversationStarter();
  res.json({ starter });
});

const createFromStarterSchema = z.object({
  starter: z.string().min(1).max(500),
});

router.post("/conversations/from-starter", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const parsed = createFromStarterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { starter } = parsed.data;
  const conversation = await prisma.conversation.create({
    data: {
      userId,
      title: starter.slice(0, 60),
      messages: {
        create: {
          content: starter,
          senderType: "USER",
          status: "PENDING",
          deliveryDelayMin: 60,
          visibleAfter: new Date(Date.now() + 60 * 60 * 1000),
        },
      },
    },
  });

  res.status(201).json(conversation);
});

export default router;
