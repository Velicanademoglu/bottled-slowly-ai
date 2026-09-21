import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db.js";
import type { AuthRequest } from "../../auth.js";
import { logAdminAction } from "../../services/audit.js";

const router = Router();

router.get("/space", async (req: AuthRequest, res) => {
  const { senderId, status, page = "1", pageSize = "20" } = req.query as Record<string, string>;
  const where: Record<string, unknown> = {};
  if (senderId) where.senderId = Number(senderId);
  if (status) where.status = status;

  const messages = await prisma.spaceMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (Number(page) - 1) * Number(pageSize),
    take: Number(pageSize),
    include: {
      sender: { select: { id: true, username: true, email: true } },
      journeys: {
        include: {
          recipients: true,
          events: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      },
    },
  });

  const total = await prisma.spaceMessage.count({ where });

  res.json({
    messages,
    pagination: {
      page: Number(page),
      pageSize: Number(pageSize),
      total,
      pages: Math.ceil(total / Number(pageSize)),
    },
  });
});

router.get("/space/:id", async (req: AuthRequest, res) => {
  const adminId = req.userId!;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid message id" });
    return;
  }

  const message = await prisma.spaceMessage.findUnique({
    where: { id },
    include: {
      sender: { select: { id: true, username: true, email: true } },
      journeys: {
        include: {
          events: { orderBy: { createdAt: "desc" } },
          recipients: true,
        },
      },
    },
  });

  if (!message) {
    res.status(404).json({ error: "Message not found" });
    return;
  }

  await logAdminAction(adminId, "view_space_message", "space_message", String(id));

  res.json(message);
});

router.get("/chats", async (req: AuthRequest, res) => {
  const { userId, page = "1", pageSize = "20" } = req.query as Record<string, string>;

  const conversations = await prisma.conversation.findMany({
    where: userId
      ? { members: { some: { userId: Number(userId) } } }
      : undefined,
    orderBy: { updatedAt: "desc" },
    skip: (Number(page) - 1) * Number(pageSize),
    take: Number(pageSize),
    include: {
      members: true,
      messages: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  const total = await prisma.conversation.count({
    where: userId
      ? { members: { some: { userId: Number(userId) } } }
      : undefined,
  });

  res.json({
    conversations,
    pagination: {
      page: Number(page),
      pageSize: Number(pageSize),
      total,
      pages: Math.ceil(total / Number(pageSize)),
    },
  });
});

router.get("/chats/:id", async (req: AuthRequest, res) => {
  const adminId = req.userId!;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      members: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  await logAdminAction(adminId, "view_conversation", "conversation", String(id));

  res.json(conversation);
});

export default router;
