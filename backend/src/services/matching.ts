import { prisma } from "../db.js";

export interface MatchWeights {
  interests: number;
  age: number;
  language: number;
  goals: number;
  activity: number;
  quality: number;
  randomness: number;
}

const DEFAULT_WEIGHTS: MatchWeights = {
  interests: 0.30,
  age: 0.20,
  language: 0.15,
  goals: 0.15,
  activity: 0.10,
  quality: 0.10,
  randomness: 0.30,
};

function calculateAge(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

export async function findBestMatch(senderId: number, weights: Partial<MatchWeights> = {}) {
  const w = { ...DEFAULT_WEIGHTS, ...weights };

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    include: { profile: true, preferences: true, languages: true, interests: true, stardust: true },
  });

  if (!sender || !sender.profile || !sender.preferences) {
    throw new Error("Sender profile not complete");
  }

  const senderAge = calculateAge(sender.profile.birthDate);
  const senderInterests = sender.interests.map((i) => i.interest);
  const senderLanguages = sender.languages.map((l) => l.language);
  const senderGoals = JSON.parse(sender.preferences.conversationGoals || "[]") as string[];

  // Find blocked relationships and previous recipients
  const [blockedIds, previouslySentIds] = await Promise.all([
    prisma.block
      .findMany({
        where: { OR: [{ initiatorId: senderId }, { targetId: senderId }] },
        select: { initiatorId: true, targetId: true },
      })
      .then((blocks) => new Set(blocks.flatMap((b) => [b.initiatorId, b.targetId]))),
    prisma.messageRecipient
      .findMany({
        where: {
          journey: { message: { senderId } },
          status: { in: ["pending", "passed", "seen"] },
        },
        select: { userId: true },
      })
      .then((recipients) => new Set(recipients.map((r) => r.userId))),
  ]);

  const excludeIds = new Set([senderId, ...blockedIds, ...previouslySentIds]);

  const candidates = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      emailVerified: true,
      id: { notIn: Array.from(excludeIds) },
      profile: { onboardingCompleted: true },
    },
    include: {
      profile: true,
      preferences: true,
      languages: true,
      interests: true,
      stardust: true,
    },
  });

  if (candidates.length === 0) return null;

  const scored = candidates.map((candidate) => {
    const age = calculateAge(candidate.profile?.birthDate || null);
    const candidateInterests = candidate.interests.map((i) => i.interest);
    const candidateLanguages = candidate.languages.map((l) => l.language);
    const candidateGoals = JSON.parse(candidate.preferences?.conversationGoals || "[]") as string[];

    // Interest overlap
    const commonInterests = senderInterests.filter((i) => candidateInterests.includes(i));
    const interestScore = senderInterests.length
      ? commonInterests.length / Math.max(senderInterests.length, candidateInterests.length || 1)
      : 0;

    // Age compatibility (sender's preference vs candidate age, and candidate's preference vs sender age)
    let ageScore = 0;
    if (age !== null && senderAge !== null) {
      const minAge = sender.preferences?.minAge || 18;
      const maxAge = sender.preferences?.maxAge || 99;
      const candidateMin = candidate.preferences?.minAge || 18;
      const candidateMax = candidate.preferences?.maxAge || 99;
      const senderLikesCandidate = age >= minAge && age <= maxAge ? 1 : 0;
      const candidateLikesSender = senderAge >= candidateMin && senderAge <= candidateMax ? 1 : 0;
      ageScore = (senderLikesCandidate + candidateLikesSender) / 2;
    }

    // Language overlap
    const commonLanguages = senderLanguages.filter((l) => candidateLanguages.includes(l));
    const languageScore = senderLanguages.length
      ? commonLanguages.length / Math.max(senderLanguages.length, candidateLanguages.length || 1)
      : candidateLanguages.length ? 0.5 : 0;

    // Conversation goals overlap
    const commonGoals = senderGoals.filter((g) => candidateGoals.includes(g));
    const goalsScore = senderGoals.length
      ? commonGoals.length / Math.max(senderGoals.length, candidateGoals.length || 1)
      : 0;

    // Activity score (newer = more active)
    const daysSinceActive = Math.max(
      0,
      Math.floor((Date.now() - candidate.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
    );
    const activityScore = Math.max(0, 1 - daysSinceActive / 30);

    // Quality/Gravity score (placeholder using stardust balance as proxy)
    const qualityScore = Math.min(1, (candidate.stardust?.balance || 0) / 1000);

    const compatibility =
      interestScore * w.interests +
      ageScore * w.age +
      languageScore * w.language +
      goalsScore * w.goals +
      activityScore * w.activity +
      qualityScore * w.quality;

    const randomComponent = Math.random() * w.randomness;

    return {
      user: candidate,
      score: compatibility + randomComponent,
      compatibility,
      details: {
        interestScore,
        ageScore,
        languageScore,
        goalsScore,
        activityScore,
        qualityScore,
      },
    };
  });

  scored.sort((a, b) => b.score - a.score);

  // Pick from top 30% with some randomness for diversity
  const poolSize = Math.max(1, Math.ceil(scored.length * 0.3));
  const pool = scored.slice(0, poolSize);
  const selected = pool[Math.floor(Math.random() * pool.length)];

  return selected;
}
