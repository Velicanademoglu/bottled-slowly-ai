import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import type { AuthRequest } from "../auth.js";

const router = Router();

const templateSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(2000),
});

router.get("/", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const templates = await prisma.userTemplate.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ templates });
});

router.post("/", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const parsed = templateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const template = await prisma.userTemplate.create({
    data: { userId, ...parsed.data },
  });
  res.status(201).json({ template });
});

router.put("/:id", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = templateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.userTemplate.findFirst({ where: { id, userId } });
  if (!existing) {
    res.status(404).json({ error: "Template not found" });
    return;
  }
  const template = await prisma.userTemplate.update({
    where: { id },
    data: { ...parsed.data, updatedAt: new Date() },
  });
  res.json({ template });
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const existing = await prisma.userTemplate.findFirst({ where: { id, userId } });
  if (!existing) {
    res.status(404).json({ error: "Template not found" });
    return;
  }
  await prisma.userTemplate.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
