import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../db.js";
import { appSocket } from "../socket.js";
import type { AuthRequest } from "../auth.js";

const router = Router();

const sendSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

const CHAT_MAX_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
];

const chatUploadDir = path.resolve(process.cwd(), "uploads", "chat");
fs.mkdirSync(chatUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, chatUploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: CHAT_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only images, videos and audio files are allowed"));
  },
});

function detectType(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

router.get("/", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const conversations = await prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    include: {
      members: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const userIds = new Set(conversations.flatMap((c) => c.members.map((m) => m.userId)));
  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, username: true, email: true, profile: { select: { avatarUrl: true, avatarPreset: true } } },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const enriched = conversations.map((c) => ({
    ...c,
    members: c.members.map((m) => ({ ...m, user: userMap.get(m.userId) })),
  }));

  res.json({ conversations: enriched });
});

router.get("/:id", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }

  const member = await prisma.conversationMember.findFirst({
    where: { conversationId: id, userId },
  });
  if (!member) {
    res.status(403).json({ error: "Not a member of this conversation" });
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

  const users = await prisma.user.findMany({
    where: { id: { in: conversation.members.map((m) => m.userId) } },
    select: { id: true, username: true, profile: { select: { avatarUrl: true, avatarPreset: true } } },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  res.json({ ...conversation, members: conversation.members.map((m) => ({ ...m, user: userMap.get(m.userId) })) });
});

router.post("/:id/messages", upload.single("media"), async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }

  const file = req.file;
  let content = "";
  let type = "text";
  let mediaUrl: string | null = null;

  if (file) {
    type = detectType(file.mimetype);
    mediaUrl = `/uploads/chat/${file.filename}`;
    content = req.body?.content ? String(req.body.content).trim() : "";
  } else {
    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    content = parsed.data.content;
  }

  if (!content && !file) {
    res.status(400).json({ error: "Message cannot be empty" });
    return;
  }

  const member = await prisma.conversationMember.findFirst({
    where: { conversationId: id, userId },
  });
  if (!member) {
    res.status(403).json({ error: "Not a member of this conversation" });
    return;
  }

  const message = await prisma.chatMessage.create({
    data: {
      conversationId: id,
      senderId: userId,
      content,
      type,
      mediaUrl,
    },
  });

  await prisma.conversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  if (appSocket) {
    appSocket.to(`conv:${id}`).emit("message", message);
  }

  res.status(201).json(message);
});

export default router;
