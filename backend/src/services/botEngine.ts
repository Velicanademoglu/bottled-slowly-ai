import OpenAI from "openai";
import { prisma } from "../db.js";
import { appSocket } from "../socket.js";
import { createNotification } from "./notifications.js";
import { trackEvent } from "./analytics.js";
import { getCountryCoordinates } from "../lib/countries.js";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const BOT_EMAIL_DOMAIN = "@bots.projectstar.app";

// Human-feeling delays (ms). Short enough for live testing, long enough to feel real.
const ACCEPT_DELAY_MS = () => 30_000 + Math.random() * 90_000; // 30-120s
const FIRST_MSG_DELAY_MS = () => 10_000 + Math.random() * 25_000; // 10-35s
const REPLY_DELAY_MS = () => 12_000 + Math.random() * 33_000; // 12-45s

const UNANSWERED_EXPIRY_DAYS = 5;

const pendingAccepts = new Set<number>();
const pendingReplies = new Set<number>();

export function isBotEmail(email: string | null | undefined): boolean {
  return !!email && email.endsWith(BOT_EMAIL_DOMAIN);
}

type BotUser = Awaited<ReturnType<typeof loadBots>>[number];

async function loadBots() {
  return prisma.user.findMany({
    where: { email: { endsWith: BOT_EMAIL_DOMAIN }, status: "ACTIVE" },
    include: { profile: true, preferences: true, interests: true },
  });
}

// Kadın kullanıcıya erkek bot, erkek kullanıcıya kadın bot eşleşir (eşleşme
// tercih filtreleri üzerinden; burada bot havuzu profil cinsiyetine göre kullanılır).
async function pickBotFor(userGender: string | null | undefined) {
  const bots = await loadBots();
  if (!bots.length) return null;
  const pool =
    userGender === "MALE"
      ? bots.filter((b) => b.profile?.gender === "FEMALE")
      : userGender === "FEMALE"
        ? bots.filter((b) => b.profile?.gender === "MALE")
        : bots;
  const finalPool = pool.length ? pool : bots;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

function looksTurkish(text: string): boolean {
  return /[çğıöşüÇĞİÖŞÜ]/.test(text) || /\b(nasıl|naber|selam|merhaba|ben|sen|bir|çok|için|ne|mi|mı)\b/i.test(text);
}

const FALLBACK_TR = [
  "Gerçekten düşündüm yazdıklarını, ben de benzer şeyleri düşünürüm çoğu zaman. Sen zor günlerde nasıl geçinirsin?",
  "Bunu okuyunca gülümsedim, samimi gelmişsin. Anlat biraz daha, merak ettim.",
  "Ben de aynı fikirdeyim aslında. Peki hafta içi en çok ne keyif veriyor sana?",
  "Çok güzel yazmışsın. Ben genelde sakin biriyim, müzik ve kitap beni toparlar. Senin sığınağın ne?",
  "İlginç, benzer düşüncelere ben de kapılıyorum bazen. Hiç ani bir kararla bir yere gittin mi?",
  "Anlattıkların tanıdık geldi. Ben de bazen aynı şeyi hissediyorum. Böyle günlerde ne yaparsın?",
];

const FALLBACK_EN = [
  "That really made me think, I feel the same way sometimes. How do you usually get through tough days?",
  "I smiled reading this, you seem genuine. Tell me more, I'm curious.",
  "I agree actually. What's the thing you enjoy most during the week?",
  "Nicely said. I'm pretty calm myself, music and books keep me balanced. What's yours?",
];

function botSystemPrompt(bot: { username: string; profile: { gender: string | null; country: string | null; bio: string | null } | null; interests: { interest: string }[] }): string {
  const interests = bot.interests.map((i) => i.interest).join(", ") || "müzik, seyahat";
  return [
    `Sen "${bot.username}" adında gerçek bir insansın ve bu yavaş mesajlaşma uygulamasında yabancılarla sohbet ediyorsun.`,
    `Hakkında: ${bot.profile?.bio || "hayatı ve insanları merak eden biri"}, ${bot.profile?.country || "dünyadan"}, ilgi alanların: ${interests}.`,
    `KURALLAR:`,
    `- Gerçek bir insan gibi yaz: kısa (1-3 cümle), samimi, doğal. Asla bot veya asistan olduğunu söyleme; liste, madde işareti veya format kullanma.`,
    `- Kullanıcının son mesajının dilinde yaz (Türkçe mesaja Türkçe cevap ver).`,
    `- Kullanıcının sorularını doğal şekilde cevapla, çoğu zaman kendi kısa sorunu sor.`,
    `- Kendi hayatından uydurma ama inandırıcı küçük detaylar paylaşabilirsin.`,
    `- Abartılı pozitiflik yok, emojiyi nadiren kullan.`,
  ].join("\n");
}

async function generateBotReply(
  bot: { username: string; profile: { gender: string | null; country: string | null; bio: string | null } | null; interests: { interest: string }[] },
  history: { senderId: number; content: string }[],
  botId: number
): Promise<string> {
  const last = history[history.length - 1]?.content || "";
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: botSystemPrompt(bot) },
  ];
  for (const m of history.slice(-12)) {
    messages.push({ role: m.senderId === botId ? "assistant" : "user", content: m.content });
  }

  const fallback = () => {
    const list = looksTurkish(last) ? FALLBACK_TR : FALLBACK_EN;
    return list[Math.floor(Math.random() * list.length)];
  };

  if (!openai) return fallback();

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 120,
      temperature: 0.9,
    });
    const text = response.choices[0]?.message?.content?.trim();
    if (text && text.length > 2) return text;
  } catch (err) {
    console.error("Bot OpenAI error:", err instanceof Error ? err.message : err);
  }
  return fallback();
}

async function sendBotMessage(conversationId: number, botId: number, content: string) {
  const message = await prisma.chatMessage.create({
    data: { conversationId, senderId: botId, content, type: "text" },
  });
  await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  if (appSocket) {
    appSocket.to(`conv:${conversationId}`).emit("message", message);
  }

  const others = await prisma.conversationMember.findMany({
    where: { conversationId, userId: { not: botId } },
    select: { userId: true },
  });
  for (const o of others) {
    await createNotification(o.userId, "chat_message", "New message", content.slice(0, 80), { conversationId });
  }
  return message;
}

// Bot accepts a bottle addressed to it and starts the conversation.
async function botAcceptRecipient(recipientId: number) {
  const recipient = await prisma.messageRecipient.findFirst({
    where: { id: recipientId, status: "pending" },
    include: { journey: { include: { message: { include: { sender: { include: { profile: true } } } } } } },
  });
  if (!recipient) return;

  const bot = await prisma.user.findUnique({
    where: { id: recipient.userId },
    include: { profile: true, interests: true },
  });
  if (!bot) return;

  const senderId = recipient.journey.message.senderId;

  await prisma.connection.create({
    data: { userAId: senderId, userBId: bot.id, messageId: recipient.journey.messageId },
  });

  const conv = await prisma.conversation.create({
    data: { title: "New connection", members: { create: [{ userId: senderId }, { userId: bot.id }] } },
  });

  await prisma.messageRecipient.update({ where: { id: recipientId }, data: { status: "accepted", updatedAt: new Date() } });
  await prisma.messageJourney.update({
    where: { id: recipient.journeyId },
    data: { status: "accepted", accepts: { increment: 1 }, currentRecipientId: bot.id },
  });
  await prisma.spaceMessage.update({ where: { id: recipient.journey.messageId }, data: { status: "accepted" } });

  const coords = getCountryCoordinates(bot.profile?.country || undefined);
  await prisma.journeyEvent.create({
    data: {
      journeyId: recipient.journeyId,
      type: "accepted",
      country: bot.profile?.country || undefined,
      lat: coords?.lat,
      lng: coords?.lng,
      metadata: JSON.stringify({ recipientId: bot.id, country: bot.profile?.country }),
    },
  });

  await createNotification(senderId, "message_accepted", "Your message was found", `${bot.username} accepted your message.`, {
    conversationId: conv.id,
  });
  await trackEvent(bot.id, "message_accepted", { messageId: recipient.journey.messageId, senderId, conversationId: conv.id });

  // Bot sends the first message, responding to the bottle content.
  const intro = await generateBotReply(bot, [{ senderId, content: recipient.journey.message.content }], bot.id);
  await sendBotMessage(conv.id, bot.id, intro);
}

export function scheduleBotAccept(recipientId: number, delayMs?: number) {
  if (pendingAccepts.has(recipientId)) return;
  pendingAccepts.add(recipientId);
  const delay = delayMs ?? ACCEPT_DELAY_MS();
  setTimeout(async () => {
    try {
      const still = await prisma.messageRecipient.findFirst({ where: { id: recipientId, status: "pending" } });
      if (!still) return;
      await botAcceptRecipient(recipientId);
    } catch (err) {
      console.error("Bot accept error:", err instanceof Error ? err.message : err);
    } finally {
      pendingAccepts.delete(recipientId);
    }
  }, delay);
}

export async function findBotMemberInConversation(conversationId: number): Promise<BotUser | null> {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { members: true },
  });
  if (!conv) return null;
  const memberIds = conv.members.map((m) => m.userId);
  const bots = await loadBots();
  return bots.find((b) => memberIds.includes(b.id)) || null;
}

export function scheduleBotReply(conversationId: number, delayMs?: number) {
  if (pendingReplies.has(conversationId)) return;
  pendingReplies.add(conversationId);
  const delay = delayMs ?? REPLY_DELAY_MS();
  setTimeout(async () => {
    try {
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { members: true, messages: { orderBy: { createdAt: "desc" }, take: 15 } },
      });
      if (!conv) return;
      const memberIds = conv.members.map((m) => m.userId);
      const bots = await loadBots();
      const bot = bots.find((b) => memberIds.includes(b.id));
      if (!bot) return;
      const last = conv.messages[0];
      if (!last || last.senderId === bot.id) return; // nothing to reply to / already replied
      const ordered = [...conv.messages].reverse();
      const reply = await generateBotReply(bot, ordered, bot.id);
      await sendBotMessage(conversationId, bot.id, reply);
    } catch (err) {
      console.error("Bot reply error:", err instanceof Error ? err.message : err);
    } finally {
      pendingReplies.delete(conversationId);
    }
  }, delay);
}

// Boot/backlog scan: pending bottles addressed to bots + unanswered bot chats.
async function runBotBacklog() {
  try {
    const botUsers = await loadBots();
    const botIds = botUsers.map((b) => b.id);
    if (!botIds.length) return;

    const pending = await prisma.messageRecipient.findMany({
      where: { userId: { in: botIds }, status: "pending" },
      select: { id: true },
    });
    for (const r of pending) scheduleBotAccept(r.id, FIRST_MSG_DELAY_MS() + 10_000);
    if (pending.length) console.log(`[bots] ${pending.length} pending bottles scheduled for acceptance`);

    const convs = await prisma.conversation.findMany({
      where: { members: { some: { userId: { in: botIds } } } },
      include: { members: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    let scheduled = 0;
    for (const c of convs) {
      const last = c.messages[0];
      if (!last) continue;
      if (botIds.includes(last.senderId)) continue;
      scheduleBotReply(c.id, 10_000 + Math.random() * 30_000);
      scheduled++;
    }
    if (scheduled) console.log(`[bots] ${scheduled} conversations awaiting bot reply`);
  } catch (err) {
    console.error("Bot backlog error:", err instanceof Error ? err.message : err);
  }
}

// Letters with no reply within 5 days are deleted (cascade removes journeys/events/recipients).
async function cleanupExpiredMessages() {
  try {
    const cutoff = new Date(Date.now() - UNANSWERED_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const candidates = await prisma.spaceMessage.findMany({
      where: { status: "launched", launchedAt: { lt: cutoff } },
      include: { journeys: { include: { recipients: { where: { status: "accepted" } } } } },
    });
    const expired = candidates.filter((m) => m.journeys.every((j) => j.recipients.length === 0));
    for (const m of expired) {
      await prisma.spaceMessage.delete({ where: { id: m.id } });
    }
    if (expired.length) console.log(`[cleanup] deleted ${expired.length} unanswered messages older than ${UNANSWERED_EXPIRY_DAYS} days`);
  } catch (err) {
    console.error("Cleanup error:", err instanceof Error ? err.message : err);
  }
}

export function startBotJobs() {
  setTimeout(() => {
    runBotBacklog();
    cleanupExpiredMessages();
  }, 15_000);
  setInterval(() => {
    runBotBacklog();
    cleanupExpiredMessages();
  }, 30 * 60 * 1000);
}
