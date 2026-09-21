import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { prisma } from "../db.js";
import type { AuthRequest } from "../auth.js";

const router = Router();

const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const uploadDir = path.resolve(process.cwd(), "uploads", "avatars");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: AVATAR_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP, GIF images are allowed"));
  },
});

const profileSchema = z.object({
  birthDate: z.string().datetime().optional().or(z.literal("")),
  gender: z.string().trim().min(1).max(30).optional(),
  country: z.string().trim().min(1).max(100).optional(),
  bio: z.string().trim().max(500).optional(),
  avatarUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  avatarPreset: z.string().trim().max(50).optional().or(z.literal("")),
  onboardingCompleted: z.boolean().optional(),
});

const preferencesSchema = z.object({
  preferredGender: z.string().trim().min(1).max(30).optional(),
  minAge: z.number().int().min(13).max(120).optional(),
  maxAge: z.number().int().min(13).max(120).optional(),
  conversationGoals: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
});

const languageSchema = z.object({
  language: z.string().trim().min(1).max(50),
  level: z.string().trim().min(1).max(30).optional(),
});

function serializeProfile(user: {
  id: number;
  email: string;
  username: string;
  role: string;
  emailVerified: boolean;
  status: string;
  createdAt: Date;
  profile: {
    birthDate: Date | null;
    gender: string | null;
    country: string | null;
    bio: string | null;
    avatarUrl: string | null;
    avatarPreset: string | null;
    level: number;
    gravity: number;
    onboardingCompleted: boolean;
    completedSteps: string | null;
  } | null;
  preferences: {
    preferredGender: string;
    minAge: number | null;
    maxAge: number | null;
    conversationGoals: string | null;
  } | null;
  languages: { language: string; level: string }[];
  interests: { interest: string }[];
  stardust: { balance: number } | null;
}) {
  const completion = computeCompletion(user.profile, user.languages.length, user.interests.length, user.preferences);
  const level = 1 + Math.min(4, Math.floor(completion / 20));
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    emailVerified: user.emailVerified,
    status: user.status,
    createdAt: user.createdAt,
    profile: user.profile || {
      birthDate: null,
      gender: null,
      country: null,
      bio: null,
      avatarUrl: null,
      avatarPreset: null,
      level: 1,
      gravity: 500,
      onboardingCompleted: false,
      completedSteps: "[]",
    },
    preferences: user.preferences || {
      preferredGender: "EVERYONE",
      minAge: null,
      maxAge: null,
      conversationGoals: "[]",
    },
    languages: user.languages,
    interests: user.interests.map((i) => i.interest),
    stardustBalance: user.stardust?.balance ?? 0,
    completion,
    level,
  };
}

function computeCompletion(
  profile: {
    birthDate: Date | null;
    gender: string | null;
    country: string | null;
    bio: string | null;
    avatarUrl: string | null;
    avatarPreset: string | null;
    onboardingCompleted: boolean;
  } | null,
  languageCount: number,
  interestCount: number,
  preferences: { minAge: number | null; maxAge: number | null; conversationGoals: string | null } | null
): number {
  let score = 0;
  if (profile?.avatarUrl || profile?.avatarPreset) score += 20;
  if (profile?.bio && profile.bio.length >= 20) score += 10;
  if (languageCount > 0) score += 15;
  if (interestCount > 0) score += 20;
  const goals = preferences?.conversationGoals ? JSON.parse(preferences.conversationGoals) as string[] : [];
  if (goals.length > 0) score += 15;
  if (preferences?.minAge != null && preferences?.maxAge != null) score += 10;
  if (profile?.country) score += 10;
  return Math.min(100, score);
}

router.get("/me", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, preferences: true, languages: true, interests: true, stardust: true },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(serializeProfile(user));
});

router.put("/me", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const data = parsed.data;
  const clean: Record<string, unknown> = {};
  if (data.birthDate !== undefined) clean.birthDate = data.birthDate ? new Date(data.birthDate) : null;
  if (data.gender !== undefined) clean.gender = data.gender || null;
  if (data.country !== undefined) clean.country = data.country || null;
  if (data.bio !== undefined) clean.bio = data.bio || null;
  if (data.avatarUrl !== undefined) clean.avatarUrl = data.avatarUrl || null;
  if (data.avatarPreset !== undefined) clean.avatarPreset = data.avatarPreset || null;
  if (data.onboardingCompleted !== undefined) clean.onboardingCompleted = data.onboardingCompleted;

  const profile = await prisma.profile.upsert({
    where: { userId },
    create: { ...clean, userId } as never,
    update: clean,
  });

  res.json(profile);
});

router.post("/avatar", upload.single("avatar"), async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No image uploaded" });
    return;
  }

  try {
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await prisma.profile.upsert({
      where: { userId },
      create: { userId, avatarUrl },
      update: { avatarUrl },
    });
    res.json({ avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save avatar" });
  }
});

router.put("/preferences", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const parsed = preferencesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const data = parsed.data;
  const clean: Record<string, unknown> = {};
  if (data.preferredGender !== undefined) clean.preferredGender = data.preferredGender;
  if (data.minAge !== undefined) clean.minAge = data.minAge;
  if (data.maxAge !== undefined) clean.maxAge = data.maxAge;
  if (data.conversationGoals !== undefined) clean.conversationGoals = JSON.stringify(data.conversationGoals);

  const preferences = await prisma.userPreference.upsert({
    where: { userId },
    create: { ...clean, userId } as never,
    update: clean,
  });

  res.json(preferences);
});

router.post("/languages", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const parsed = languageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { language, level } = parsed.data;
  const record = await prisma.userLanguage.upsert({
    where: { userId_language: { userId, language } },
    create: { userId, language, level: level || "INTERMEDIATE" },
    update: { level: level || "INTERMEDIATE" },
  });

  res.json(record);
});

router.delete("/languages/:language", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const language = decodeURIComponent(req.params.language);
  await prisma.userLanguage.deleteMany({ where: { userId, language } });
  res.json({ ok: true });
});

router.post("/interests", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const interest = String(req.body.interest || "").trim();
  if (!interest || interest.length > 50) {
    res.status(400).json({ error: "Invalid interest" });
    return;
  }

  const normalized = interest.slice(0, 50);
  const existing = await prisma.userInterest.findFirst({ where: { userId, interest: normalized } });
  if (!existing) {
    await prisma.userInterest.create({ data: { userId, interest: normalized } });
  }

  res.json({ ok: true });
});

router.delete("/interests/:interest", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const interest = decodeURIComponent(req.params.interest);
  await prisma.userInterest.deleteMany({ where: { userId, interest } });
  res.json({ ok: true });
});

export default router;
