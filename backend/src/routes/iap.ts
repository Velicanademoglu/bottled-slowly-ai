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

// Tiered call subscriptions: voice ($5/mo), video ($15/mo), all-in-one premium.
// Purchasable with Stardust on web; via store IAP products on native.
const TIER_DAYS = 30;
const SUB_PRICES: Record<string, number | undefined> = {
  voice_call_monthly: 300, // ≈ $5/ay
  video_call_monthly: 900, // ≈ $15/ay
  premium_all_monthly: 1200,
};

// Status endpoint: which call tiers are active for this user.
router.get("/status", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const premium = await prisma.userPremium.findUnique({ where: { userId } });
  const now = new Date();
  const full = premium ? premium.active && premium.expiresAt > now : false;
  const voice = full || (premium ? premium.voiceUntil ? premium.voiceUntil > now : false : false);
  const video = full || (premium ? premium.videoUntil ? premium.videoUntil > now : false : false);
  res.json({
    premium: full,
    voice,
    video,
    premiumExpiresAt: full ? premium!.expiresAt : null,
    voiceExpiresAt: voice && premium?.voiceUntil ? premium.voiceUntil : null,
    videoExpiresAt: video && premium?.videoUntil ? premium.videoUntil : null,
    prices: SUB_PRICES,
  });
});

// Web-friendly subscribe: pay with Stardust (no store billing required).
router.post("/subscribe-stardust", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const schema = z.object({ tier: z.enum(["voice", "video", "all"]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const tier = parsed.data.tier;
  const product = tier === "voice" ? "voice_call_monthly" : tier === "video" ? "video_call_monthly" : "premium_all_monthly";
  const amount = SUB_PRICES[product]!;

  const { getBalance } = await import("../services/stardust.js");
  const balance = await getBalance(userId);
  if (balance < amount) {
    res.status(402).json({ error: "INSUFFICIENT_BALANCE", balance, required: amount });
    return;
  }

  try {
    await addTransaction(userId, "debit", amount, "premium_feature", { product, tier });

    const now = new Date();
    const current = await prisma.userPremium.findUnique({ where: { userId } });
    const extendFrom = (d: Date | null | undefined) => (d && d > now ? d : now);
    const data: { voiceUntil?: Date; videoUntil?: Date; expiresAt?: Date; active?: boolean; productId?: string } = {};
    if (tier === "voice") data.voiceUntil = new Date(extendFrom(current?.voiceUntil).getTime() + TIER_DAYS * 86400000);
    if (tier === "video") data.videoUntil = new Date(extendFrom(current?.videoUntil).getTime() + TIER_DAYS * 86400000);
    if (tier === "all") {
      data.expiresAt = new Date(extendFrom(current?.expiresAt).getTime() + TIER_DAYS * 86400000);
      data.active = true;
    }
    data.productId = product;

    await prisma.userPremium.upsert({
      where: { userId },
      create: { userId, expiresAt: data.expiresAt ?? now, active: true, ...data },
      update: data,
    });

    res.json({ ok: true, tier, expiresAt: data.voiceUntil ?? data.videoUntil ?? data.expiresAt });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Subscription failed";
    res.status(500).json({ error: message });
  }
});

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
  const subTier = productId === "voice_call_monthly" ? "voice" : productId === "video_call_monthly" ? "video" : null;

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

    if (subTier) {
      const now = new Date();
      const current = await prisma.userPremium.findUnique({ where: { userId } });
      const extendFrom = (d: Date | null | undefined) => (d && d > now ? d : now);
      const data: { voiceUntil?: Date; videoUntil?: Date; expiresAt?: Date; active?: boolean; productId?: string } = {};
      if (subTier === "voice") data.voiceUntil = new Date(extendFrom(current?.voiceUntil).getTime() + TIER_DAYS * 86400000);
      if (subTier === "video") data.videoUntil = new Date(extendFrom(current?.videoUntil).getTime() + TIER_DAYS * 86400000);
      data.productId = productId;

      await prisma.userPremium.upsert({
        where: { userId },
        create: { userId, expiresAt: now, active: true, ...data },
        update: data,
      });

      await addTransaction(userId, "credit", 0, "iap", {
        productId,
        platform,
        tier: subTier,
        transactionId,
      });

      res.json({ ok: true, tier: subTier, expiresAt: data.voiceUntil ?? data.videoUntil });
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
