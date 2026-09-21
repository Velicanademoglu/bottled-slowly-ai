import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db.js";
import type { AuthRequest } from "../../auth.js";
import { requireAdmin } from "../../auth.js";
import { canManageAdmins } from "../../lib/roles.js";
import { trackEvent } from "../../services/analytics.js";

const router = Router();

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]),
});

const updateRoleSchema = z.object({
  role: z.enum(["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"]),
});

router.get("/", requireAdmin, async (req: AuthRequest, res) => {
  const search = String(req.query.search || "").trim();
  const status = String(req.query.status || "");
  const role = String(req.query.role || "");
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { profile: { select: { country: true, avatarUrl: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      status: u.status,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
      country: u.profile?.country,
      avatarUrl: u.profile?.avatarUrl,
    })),
    pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
  });
});

router.get("/:id", requireAdmin, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true, preferences: true, languages: true, interests: true },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

router.post("/:id/status", requireAdmin, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const parsed = updateStatusSchema.safeParse(req.body);
  if (Number.isNaN(id) || !parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  await trackEvent(req.userId || null, "admin_user_status_change", {
    targetUserId: id,
    newStatus: parsed.data.status,
  });

  res.json({ id: user.id, status: user.status });
});

router.post("/:id/role", requireAdmin, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const parsed = updateRoleSchema.safeParse(req.body);
  if (Number.isNaN(id) || !parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  if (parsed.data.role === "SUPER_ADMIN" && !canManageAdmins(req.userRole || "")) {
    res.status(403).json({ error: "Only super admins can assign super admin role" });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role },
  });

  await trackEvent(req.userId || null, "admin_user_role_change", {
    targetUserId: id,
    newRole: parsed.data.role,
  });

  res.json({ id: user.id, role: user.role });
});

export default router;
