import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import type { AuthRequest } from "../auth.js";
import { sendReportNotificationEmail } from "../services/mail.js";

const router = Router();

const reportSchema = z.object({
  targetId: z.number().int().positive(),
  category: z.string().trim().min(1).max(50),
  description: z.string().trim().max(2000).optional(),
});

const CATEGORIES = [
  "Spam",
  "Harassment",
  "Sexual content",
  "Hate",
  "Scam/Fraud",
  "Fake profile",
  "Underage concern",
  "Violence/threat",
  "Other",
];

router.post("/", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { targetId, category, description } = parsed.data;

  if (!CATEGORIES.includes(category)) {
    res.status(400).json({ error: "Invalid report category" });
    return;
  }

  if (targetId === userId) {
    res.status(400).json({ error: "You cannot report yourself" });
    return;
  }

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, username: true } });
  if (!target) {
    res.status(404).json({ error: "Target user not found" });
    return;
  }

  const initiator = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });

  const report = await prisma.report.create({
    data: {
      initiatorId: userId,
      targetId,
      category,
      description,
    },
  });

  // Notify admins
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: { email: true },
  });

  for (const admin of admins) {
    await sendReportNotificationEmail(admin.email, {
      id: report.id,
      category,
      description: description || null,
      targetUsername: target.username,
      initiatorUsername: initiator?.username || "unknown",
    });
  }

  res.status(201).json({ id: report.id, status: report.status });
});

export default router;
