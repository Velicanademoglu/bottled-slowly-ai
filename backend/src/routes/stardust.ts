import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import type { AuthRequest } from "../auth.js";
import {
  getBalance,
  getTransactions,
  claimDailyReward,
  getMissionsWithProgress,
  completeMission,
  rewardProfileCompletion,
  addTransaction,
  type StardustSource,
} from "../services/stardust.js";

const AD_REWARD_TYPES = ["stardust", "boost", "extra_cast", "journey", "mystery"] as const;
const AD_REWARD_AMOUNTS: Record<string, number> = {
  stardust: 25,
  mystery: 40,
};
const AD_DAILY_LIMIT = 10;
const AD_COOLDOWN_MS = 60_000;

const adRewardClaims = new Map<number, number[]>();

const router = Router();

router.get("/balance", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const balance = await getBalance(userId);
  res.json({ balance });
});

router.get("/transactions", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const transactions = await getTransactions(userId, limit);
  res.json({ transactions });
});

router.post("/daily", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  try {
    const result = await claimDailyReward(userId);
    res.json({
      ok: true,
      balance: result.stardust.balance,
      amount: result.amount,
      streak: result.streak,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to claim reward";
    res.status(400).json({ error: message });
  }
});

router.post("/profile-completion", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  try {
    const result = await rewardProfileCompletion(userId);
    if (!result) {
      res.json({ ok: false, message: "Reward already claimed" });
      return;
    }
    res.json({ ok: true, balance: result.stardust.balance, amount: result.transaction.amount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to reward profile completion";
    res.status(400).json({ error: message });
  }
});

router.get("/missions", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const missions = await getMissionsWithProgress(userId);
  res.json({ missions });
});

router.post("/missions/:key/complete", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const key = String(req.params.key || "").trim();
  try {
    const result = await completeMission(userId, key);
    res.json({ ok: true, balance: result.balance, reward: result.mission.reward });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to complete mission";
    res.status(400).json({ error: message });
  }
});

const adRewardSchema = z.object({
  rewardType: z.enum(AD_REWARD_TYPES),
  adNetwork: z.string().max(50).optional(),
  adUnitId: z.string().max(100).optional(),
});

// Rewarded ad claim — client calls this only after the ad SDK confirms completion.
// Rate-limited per user: cooldown + daily cap. Reward amounts are server-side config.
router.post("/ad-reward", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const parsed = adRewardSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const now = Date.now();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  // In-memory sliding window: cooldown + daily cap (per process; DB ledger enforces audit)
  const claims = (adRewardClaims.get(userId) || []).filter((ts) => ts > dayStart.getTime());
  if (claims.length > 0 && now - claims[claims.length - 1] < AD_COOLDOWN_MS) {
    res.status(429).json({ error: "Please wait before watching another ad" });
    return;
  }
  if (claims.length >= AD_DAILY_LIMIT) {
    res.status(429).json({ error: "Daily ad reward limit reached" });
    return;
  }

  // DB-level daily cap check (survives restarts, counts ledger)
  const todayClaims = await prisma.stardustTransaction.count({
    where: { userId, source: "ad_reward", createdAt: { gte: dayStart } },
  });
  if (todayClaims >= AD_DAILY_LIMIT) {
    res.status(429).json({ error: "Daily ad reward limit reached" });
    return;
  }

  const { rewardType } = parsed.data;
  const amount = AD_REWARD_AMOUNTS[rewardType] ?? 25;

  const result = await addTransaction(userId, "credit", amount, "ad_reward", {
    rewardType,
    adNetwork: parsed.data.adNetwork || null,
    adUnitId: parsed.data.adUnitId || null,
  });

  claims.push(now);
  adRewardClaims.set(userId, claims);

  res.json({ ok: true, balance: result.stardust.balance, amount, rewardType });
});

// Premium feature spending — server-side price table, balance-checked debit.
const SPEND_FEATURES = ["photo_message", "video_message", "voice_message", "gift_message", "video_call", "voice_call"] as const;
const SPEND_PRICES: Record<(typeof SPEND_FEATURES)[number], number> = {
  photo_message: 5,
  voice_message: 8,
  video_message: 10,
  gift_message: 15,
  voice_call: 30,
  video_call: 50,
};

const spendSchema = z.object({
  feature: z.enum(SPEND_FEATURES),
  targetUserId: z.number().int().positive().optional(),
});

router.get("/prices", (_req: AuthRequest, res) => {
  res.json({ prices: SPEND_PRICES });
});

router.post("/spend", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const parsed = spendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { feature, targetUserId } = parsed.data;
  const amount = SPEND_PRICES[feature];

  const balance = await getBalance(userId);
  if (balance < amount) {
    res.status(402).json({ error: "INSUFFICIENT_BALANCE", balance, required: amount });
    return;
  }

  const source: StardustSource =
    feature === "gift_message" ? "gift_message" : feature.startsWith("photo") || feature.includes("message") ? "media_message" : "premium_feature";

  const result = await addTransaction(userId, "debit", amount, source, { feature, targetUserId: targetUserId || null });
  res.json({ ok: true, balance: result.stardust.balance, spent: amount, feature });
});

export default router;
