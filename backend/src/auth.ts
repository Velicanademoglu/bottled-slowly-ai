import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { canAccessAdmin } from "./lib/roles.js";

// Never fall back to a well-known default in production: a forgeable secret
// would allow complete auth bypass. Random per-boot secret invalidates old
// tokens on restart instead.
const JWT_SECRET =
  process.env.APP_JWT_SECRET ||
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === "production"
    ? (console.warn("[auth] WARNING: no JWT secret configured - using ephemeral random secret"),
      crypto.randomBytes(32).toString("hex"))
    : "default-secret-change-me");

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
  userStatus?: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number } {
  return jwt.verify(token, JWT_SECRET) as { userId: number };
}

export function isPrivileged(role?: string): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "MODERATOR";
}

export async function loadUserFromToken(token: string) {
  const payload = verifyToken(token);
  const { prisma } = await import("./db.js");
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, status: true },
  });
  return user;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await loadUserFromToken(header.slice(7));
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    if (user.status !== "ACTIVE") {
      res.status(403).json({ error: "ACCOUNT_" + user.status });
      return;
    }
    req.userId = user.id;
    req.userRole = user.role;
    req.userStatus = user.status;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export async function authWithRoleMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await loadUserFromToken(header.slice(7));
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    if (user.status !== "ACTIVE") {
      res.status(403).json({ error: "ACCOUNT_" + user.status });
      return;
    }
    req.userId = user.id;
    req.userRole = user.role;
    req.userStatus = user.status;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { prisma } = await import("./db.js");
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { role: true, status: true },
  });
  if (!user || user.status !== "ACTIVE" || !canAccessAdmin(user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  req.userRole = user.role;
  next();
}
