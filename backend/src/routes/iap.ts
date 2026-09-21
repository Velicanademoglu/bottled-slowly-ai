import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import type { AuthRequest } from "../auth.js";
import { addTransaction } from "../services/stardust.js";

const router = Router();

const iapSchema = z.object({
  productId: z.string(),
  platform: z.enum(["ios", "android"]),
  receipt: z.string().optional(),
  transactionId: z.string().optional(),
  packageName: z.string().optional(),
});

const STARDUST_REWARDS: Record<string, number | undefined> = {
  stardust_100: 100,
  stardust_500: 500,
  stardust_1200: 1200,
  stardust_3000: 3000,
};

const PREMIUM_DAYS: Record<string, number | undefined> = {
  premium_weekly: 7,
  premium_monthly: 30,
  premium_yearly: 365,
};

router.post("/verify", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const parsed = iapSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { productId, platform, receipt, transactionId, packageName } = parsed.data;

  // TODO: Add real receipt validation with Apple/Google servers before production.
  // For MVP demo, we trust the client after one-time deduplication check.
  if (transactionId) {
    const existing = await prisma.stardustTransaction.findFirst({
      where: {
        userId,
        source: "iap",
        metadata: { contains: transactionId },
      },
    });
    if (existing) {
      res.status(409).json({ error: "Transaction already processed" });
      return;
    }
  }

  const stardustAmount = STARDUST_REWARDS[productId];
  const premiumDays = PREMIUM_DAYS[productId];

  try {
    if (stardustAmount) {
      const result = await addTransaction(userId, "credit", stardustAmount, "iap", {
        productId,
        platform,
        receipt,
        transactionId,
        packageName,
      });
      res.json({ ok: true, balance: result.stardust.balance, amount: stardustAmount });
      return;
    }

    if (premiumDays) {
      const now = new Date();
      const currentPremium = await prisma.userPremium.findUnique({ where: { userId } });
      const expiresAt = currentPremium && currentPremium.expiresAt > now
        ? new Date(currentPremium.expiresAt.getTime() + premiumDays * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() + premiumDays * 24 * 60 * 60 * 1000);

      await prisma.userPremium.upsert({
        where: { userId },
        create: { userId, active: true, expiresAt, productId },
        update: { active: true, expiresAt, productId },
      });

      await addTransaction(userId, "credit", 0, "iap", {
        productId,
        platform,
        premiumDays,
        transactionId,
      });

      res.json({ ok: true, premium: true, expiresAt });
      return;
    }

    res.status(400).json({ error: "Unknown product" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification failed";
    res.status(500).json({ error: message });
  }
});

router.get("/premium", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const premium = await prisma.userPremium.findUnique({ where: { userId } });
  const active = premium ? premium.active && premium.expiresAt > new Date() : false;
  res.json({ active, expiresAt: premium?.expiresAt || null });
});

export default router;
