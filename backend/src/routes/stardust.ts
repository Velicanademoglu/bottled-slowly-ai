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
} from "../services/stardust.js";

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

export default router;
