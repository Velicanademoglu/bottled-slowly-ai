import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db.js";
import { comparePassword, signToken } from "../../auth.js";
import { trackEvent } from "../../services/analytics.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.status !== "ACTIVE") {
    res.status(403).json({ error: "Account is not active" });
    return;
  }

  const role = user.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "MODERATOR") {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const token = signToken(user.id);
  await trackEvent(user.id, "admin_login");
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
  });
});

export default router;
