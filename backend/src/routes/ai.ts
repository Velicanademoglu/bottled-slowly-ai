import { Router } from "express";
import { z } from "zod";
import { generateConversationStarter, generateReplySuggestions, PERSONAS, type PersonaKey } from "../services/ai.js";
import type { AuthRequest } from "../auth.js";

const router = Router();

const starterSchema = z.object({
  context: z.string().max(1000).optional(),
  persona: z.enum(["romantic", "funny", "deep", "friendly", "poetic", "mysterious"]).optional(),
});

const replySchema = z.object({
  messages: z
    .array(
      z.object({
        sender: z.enum(["me", "them"]),
        content: z.string().min(1).max(2000),
      })
    )
    .max(50),
  persona: z.enum(["romantic", "funny", "deep", "friendly", "poetic", "mysterious"]).optional(),
});

router.get("/personas", (_req: AuthRequest, res) => {
  res.json({ personas: PERSONAS });
});

router.post("/starter", async (req: AuthRequest, res) => {
  try {
    const parsed = starterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const result = await generateConversationStarter(parsed.data.context, parsed.data.persona as PersonaKey | undefined);
    res.json(result);
  } catch (err) {
    console.error("AI starter error:", err instanceof Error ? err.message : err);
    res.status(500).json({ error: "Could not generate a starter right now." });
  }
});

router.post("/replies", async (req: AuthRequest, res) => {
  try {
    const parsed = replySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const result = await generateReplySuggestions(parsed.data.messages, parsed.data.persona as PersonaKey | undefined);
    res.json(result);
  } catch (err) {
    console.error("AI replies error:", err instanceof Error ? err.message : err);
    res.status(500).json({ error: "Could not generate reply suggestions right now." });
  }
});

export default router;
