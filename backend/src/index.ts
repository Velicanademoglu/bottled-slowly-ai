import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authMiddleware, authWithRoleMiddleware, requireAdmin } from "./auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import messagesRoutes from "./routes/messages.js";
import discoveriesRoutes from "./routes/discoveries.js";
import conversationsRoutes from "./routes/conversations.js";
import adminAuthRoutes from "./routes/admin/auth.js";
import adminDashboardRoutes from "./routes/admin/dashboard.js";
import adminUsersRoutes from "./routes/admin/users.js";
import adminSettingsRoutes from "./routes/admin/settings.js";
import adminReportsRoutes from "./routes/admin/reports.js";
import adminMessagesRoutes from "./routes/admin/messages.js";
import adminUsersExtraRoutes from "./routes/admin/users-extra.js";
import reportRoutes from "./routes/reports.js";
import stardustRoutes from "./routes/stardust.js";
import iapRoutes from "./routes/iap.js";
import aiRoutes from "./routes/ai.js";
import templatesRoutes from "./routes/templates.js";
import { createSocketServer } from "./socket.js";
import { getSetting } from "./services/settings.js";
import { APP_NAME, DEFAULT_LANGUAGE } from "./config.js";

const app = express();
const server = createServer(app);
const PORT = Number(process.env.PORT) || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const isDev = process.env.NODE_ENV !== "production";

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use("/uploads", express.static(uploadsDir));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", isDev ? "*" : FRONTEND_URL],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: isDev ? [true, /.*/] : FRONTEND_URL,
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many auth attempts, please try again later." },
});
app.use("/api/auth/", authLimiter);
app.use("/api/admin/auth/", authLimiter);

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: "Too many actions, please slow down." },
});
app.use("/api/profile/", strictLimiter);
app.use("/api/messages/", strictLimiter);
app.use("/api/discoveries/", strictLimiter);
app.use("/api/conversations/", strictLimiter);
app.use("/api/admin/", strictLimiter);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/app/config", async (_req, res) => {
  const slogan = await getSetting("app.slogan", "Someone out there is waiting.");
  const brandName = await getSetting("app.name", APP_NAME);
  res.json({
    name: brandName,
    slogan,
    defaultLanguage: DEFAULT_LANGUAGE,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", authMiddleware, profileRoutes);
app.use("/api/messages", authWithRoleMiddleware, messagesRoutes);
app.use("/api/discoveries", authMiddleware, discoveriesRoutes);
app.use("/api/conversations", authMiddleware, conversationsRoutes);
app.use("/api/reports", authMiddleware, reportRoutes);
app.use("/api/stardust", authWithRoleMiddleware, stardustRoutes);
app.use("/api/iap", authMiddleware, iapRoutes);
app.use("/api/ai", authMiddleware, aiRoutes);
app.use("/api/templates", authMiddleware, templatesRoutes);

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/dashboard", authMiddleware, requireAdmin, adminDashboardRoutes);
app.use("/api/admin/users", authMiddleware, requireAdmin, adminUsersRoutes);
app.use("/api/admin/settings", authMiddleware, requireAdmin, adminSettingsRoutes);
app.use("/api/admin/reports", authMiddleware, requireAdmin, adminReportsRoutes);
app.use("/api/admin/messages", authMiddleware, requireAdmin, adminMessagesRoutes);
app.use("/api/admin/users-extra", authMiddleware, requireAdmin, adminUsersExtraRoutes);

app.use(errorHandler);

createSocketServer(server);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
