import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { canAccessAdmin } from "./lib/roles.js";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-me";

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

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
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
