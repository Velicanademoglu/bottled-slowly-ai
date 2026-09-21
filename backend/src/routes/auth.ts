import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { comparePassword, hashPassword, signToken } from "../auth.js";
import { generateToken, getTokenExpiry } from "../lib/tokens.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/mail.js";
import { trackEvent } from "../services/analytics.js";

const router = Router();

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  username: z.string().min(2, "Username too short").max(30, "Username too long"),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

const verifySchema = z.object({
  token: z.string().min(1),
});

function sanitizeUser(user: {
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
    onboardingCompleted: boolean;
  } | null;
  stardust: { balance: number } | null;
}) {
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
      onboardingCompleted: false,
    },
    stardustBalance: user.stardust?.balance ?? 0,
  };
}

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { email, username, password } = parsed.data;
  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) {
    res.status(409).json({ error: "Email or username already taken" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      profile: { create: {} },
      preferences: { create: {} },
      stardust: { create: { balance: 100 } },
    },
    include: { profile: true, stardust: true },
  });

  const token = generateToken();
  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      token,
      expiresAt: getTokenExpiry(24),
    },
  });

  await sendVerificationEmail(email, token);
  await trackEvent(user.id, "signup_completed");

  const authToken = signToken(user.id);
  res.status(201).json({ user: sanitizeUser(user), token: authToken });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true, stardust: true },
  });

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.status === "BANNED" || user.status === "SUSPENDED") {
    res.status(403).json({ error: "Account is not active" });
    return;
  }

  const token = signToken(user.id);
  await trackEvent(user.id, "login");
  res.json({ user: sanitizeUser(user), token });
});

router.post("/forgot-password", async (req, res) => {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    res.json({ ok: true });
    return;
  }

  await prisma.passwordReset.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const token = generateToken();
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt: getTokenExpiry(1),
    },
  });

  await sendPasswordResetEmail(user.email, token);
  res.json({ ok: true });
});

router.post("/reset-password", async (req, res) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const reset = await prisma.passwordReset.findUnique({
    where: { token: parsed.data.token },
  });

  if (!reset || reset.used || reset.expiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired token" });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } }),
  ]);

  res.json({ ok: true });
});

router.post("/verify-email", async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const record = await prisma.emailVerification.findUnique({
    where: { token: parsed.data.token },
  });

  if (!record || record.used || record.expiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired token" });
    return;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    prisma.emailVerification.update({ where: { id: record.id }, data: { used: true } }),
  ]);

  res.json({ ok: true });
});

router.post("/resend-verification", async (req, res) => {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || user.emailVerified) {
    res.json({ ok: true });
    return;
  }

  await prisma.emailVerification.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const token = generateToken();
  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      token,
      expiresAt: getTokenExpiry(24),
    },
  });

  await sendVerificationEmail(user.email, token);
  res.json({ ok: true });
});

export default router;
