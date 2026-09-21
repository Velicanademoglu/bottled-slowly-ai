import { Router } from "express";
import { prisma } from "../../db.js";
import type { AuthRequest } from "../../auth.js";
import { requireAdmin } from "../../auth.js";

const router = Router();

router.get("/stats", requireAdmin, async (req: AuthRequest, res) => {
  const [
    totalUsers,
    activeUsers,
    newUsersToday,
    totalMessages,
    totalReports,
    openReports,
    totalTransactions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    prisma.spaceMessage.count(),
    prisma.report.count(),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.stardustTransaction.count(),
  ]);

  res.json({
    totalUsers,
    activeUsers,
    newUsersToday,
    totalMessages,
    totalReports,
    openReports,
    totalTransactions,
  });
});

export default router;
