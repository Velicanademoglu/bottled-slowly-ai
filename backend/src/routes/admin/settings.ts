import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db.js";
import type { AuthRequest } from "../../auth.js";
import { requireAdmin } from "../../auth.js";
import { getSettingsByCategory, setSetting } from "../../services/settings.js";
import { trackEvent } from "../../services/analytics.js";

const router = Router();

const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  category: z.string().optional(),
});

router.get("/", requireAdmin, async (_req: AuthRequest, res) => {
  const settings = await prisma.appSetting.findMany({ orderBy: { category: "asc", key: "asc" } });
  res.json(settings);
});

router.get("/category/:category", requireAdmin, async (req: AuthRequest, res) => {
  const settings = await getSettingsByCategory(req.params.category);
  res.json(settings);
});

router.put("/", requireAdmin, async (req: AuthRequest, res) => {
  const parsed = settingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { key, value, category } = parsed.data;
  await setSetting(key, value, category || "general");

  await trackEvent(req.userId || null, "admin_setting_update", { key });
  res.json({ ok: true });
});

export default router;
