import { prisma } from "../db.js";

export type StardustSource =
  | "daily_reward"
  | "streak_bonus"
  | "profile_completion"
  | "mission"
  | "referral"
  | "ad_reward"
  | "iap"
  | "boost_purchase"
  | "admin_grant"
  | "other";

export async function getOrCreateUserStardust(userId: number) {
  let record = await prisma.userStardust.findUnique({ where: { userId } });
  if (!record) {
    record = await prisma.userStardust.create({ data: { userId, balance: 0 } });
  }
  return record;
}

export async function getBalance(userId: number) {
  const record = await getOrCreateUserStardust(userId);
  return record.balance;
}

export async function addTransaction(
  userId: number,
  type: "credit" | "debit",
  amount: number,
  source: StardustSource,
  metadata?: Record<string, unknown>
) {
  if (amount <= 0) throw new Error("Amount must be positive");
  return prisma.$transaction(async (tx) => {
    const stardust = await tx.userStardust.upsert({
      where: { userId },
      create: { userId, balance: type === "credit" ? amount : 0 },
      update: { balance: { increment: type === "credit" ? amount : -amount } },
    });

    const balanceBefore = type === "credit" ? stardust.balance - amount : stardust.balance + amount;
    const transaction = await tx.stardustTransaction.create({
      data: {
        userId,
        type,
        amount,
        balanceBefore,
        balanceAfter: stardust.balance,
        source,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
    return { stardust, transaction };
  });
}

export async function getTransactions(userId: number, limit = 50) {
  return prisma.stardustTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getStreak(userId: number) {
  let streak = await prisma.userStreak.findUnique({ where: { userId } });
  if (!streak) {
    streak = await prisma.userStreak.create({ data: { userId } });
  }
  return streak;
}

function getDayStart(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a: Date, b: Date) {
  const ms = getDayStart(a).getTime() - getDayStart(b).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export async function claimDailyReward(userId: number) {
  const [dailyAmount, streakRewardsRaw] = await Promise.all([
    getDailyRewardAmount(),
    getStreakRewardsConfig(),
  ]);

  const streakRewards: Record<string, number> = streakRewardsRaw;

  return prisma.$transaction(async (tx) => {
    let streak = await tx.userStreak.findUnique({ where: { userId } });
    if (!streak) {
      streak = await tx.userStreak.create({ data: { userId } });
    }

    const now = new Date();
    const today = getDayStart(now);

    if (streak.lastClaimedAt) {
      const lastClaimDay = getDayStart(streak.lastClaimedAt);
      const diffDays = daysBetween(today, lastClaimDay);
      if (diffDays === 0) {
        throw new Error("Already claimed today");
      }
      if (diffDays === 1) {
        streak.currentStreak += 1;
      } else {
        streak.currentStreak = 1;
      }
    } else {
      streak.currentStreak = 1;
    }

    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    const streakBonus = streakRewards[String(streak.currentStreak)] || streakRewards["default"] || 0;
    const totalAmount = dailyAmount + streakBonus;

    const stardust = await tx.userStardust.upsert({
      where: { userId },
      create: { userId, balance: totalAmount },
      update: { balance: { increment: totalAmount } },
    });

    const balanceBefore = stardust.balance - totalAmount;
    const transaction = await tx.stardustTransaction.create({
      data: {
        userId,
        type: "credit",
        amount: totalAmount,
        balanceBefore,
        balanceAfter: stardust.balance,
        source: "daily_reward",
        metadata: JSON.stringify({ streak: streak.currentStreak, dailyAmount, streakBonus }),
      },
    });

    await tx.userStreak.update({
      where: { userId },
      data: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastClaimedAt: now,
      },
    });

    return { stardust, transaction, streak: streak.currentStreak, amount: totalAmount };
  });
}

export async function getDailyRewardAmount(): Promise<number> {
  const setting = await prisma.appSetting.findUnique({ where: { key: "economy.daily_reward" } });
  return Number(setting?.value) || 10;
}

export async function setDailyRewardAmount(amount: number) {
  await prisma.appSetting.upsert({
    where: { key: "economy.daily_reward" },
    create: { key: "economy.daily_reward", value: String(amount), category: "economy" },
    update: { value: String(amount), category: "economy" },
  });
}

export async function getStreakRewardsConfig(): Promise<Record<string, number>> {
  const setting = await prisma.appSetting.findUnique({ where: { key: "economy.streak_rewards" } });
  if (setting?.value) {
    try {
      return JSON.parse(setting.value);
    } catch {
      // fall through
    }
  }
  return {
    "1": 5,
    "2": 5,
    "3": 10,
    "4": 10,
    "5": 15,
    "6": 20,
    "7": 40,
    default: 10,
  };
}

export async function setStreakRewardsConfig(config: Record<string, number>) {
  await prisma.appSetting.upsert({
    where: { key: "economy.streak_rewards" },
    create: { key: "economy.streak_rewards", value: JSON.stringify(config), category: "economy" },
    update: { value: JSON.stringify(config), category: "economy" },
  });
}

export async function ensureDefaultMissions() {
  const defaults = [
    { key: "send_message", title: "Send a message", reward: 10 },
    { key: "discover_message", title: "Discover a message", reward: 10 },
    { key: "reply_chat", title: "Reply to a chat", reward: 5 },
    { key: "complete_profile", title: "Complete a profile section", reward: 15 },
  ];

  for (const m of defaults) {
    await prisma.dailyMission.upsert({
      where: { key: m.key },
      create: { key: m.key, title: m.title, reward: m.reward, active: true },
      update: {},
    });
  }
}

export async function getMissionsWithProgress(userId: number) {
  await ensureDefaultMissions();
  const missions = await prisma.dailyMission.findMany({ where: { active: true } });
  const userMissions = await prisma.userMission.findMany({ where: { userId } });
  const byMissionId = new Map(userMissions.map((um) => [um.missionId, um]));

  return missions.map((m) => {
    const um = byMissionId.get(m.id);
    return {
      id: m.id,
      key: m.key,
      title: m.title,
      description: m.description,
      reward: m.reward,
      progress: um?.progress || 0,
      completed: um?.completed || false,
    };
  });
}

export async function completeMission(userId: number, missionKey: string) {
  const mission = await prisma.dailyMission.findUnique({ where: { key: missionKey } });
  if (!mission || !mission.active) throw new Error("Mission not found or inactive");

  return prisma.$transaction(async (tx) => {
    let userMission = await tx.userMission.findFirst({
      where: { userId, missionId: mission.id },
    });
    if (!userMission) {
      userMission = await tx.userMission.create({
        data: { userId, missionId: mission.id, progress: 1, completed: true },
      });
    } else if (userMission.completed) {
      throw new Error("Mission already completed");
    } else {
      userMission = await tx.userMission.update({
        where: { id: userMission.id },
        data: { progress: 1, completed: true },
      });
    }

    const result = await tx.userStardust.upsert({
      where: { userId },
      create: { userId, balance: mission.reward },
      update: { balance: { increment: mission.reward } },
    });

    await tx.stardustTransaction.create({
      data: {
        userId,
        type: "credit",
        amount: mission.reward,
        balanceBefore: result.balance - mission.reward,
        balanceAfter: result.balance,
        source: "mission",
        metadata: JSON.stringify({ missionId: mission.id, missionKey }),
      },
    });

    return { mission, userMission, balance: result.balance };
  });
}

export async function rewardProfileCompletion(userId: number) {
  // One-time reward for completing profile
  const existing = await prisma.stardustTransaction.findFirst({
    where: { userId, source: "profile_completion" },
  });
  if (existing) return null;

  return addTransaction(userId, "credit", 50, "profile_completion", { reason: "Profile completed" });
}
