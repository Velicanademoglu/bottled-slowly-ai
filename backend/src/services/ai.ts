import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export type PersonaKey = "romantic" | "funny" | "deep" | "friendly" | "poetic" | "mysterious";

export interface Persona {
  key: PersonaKey;
  label: string;
  emoji: string;
  description: string;
}

export const PERSONAS: Persona[] = [
  { key: "friendly", emoji: "☕", label: "Samimi", description: "Sıcak ve günlük sohbet havasında" },
  { key: "romantic", emoji: "🌙", label: "Romantik", description: "Yumuşak, duygusal ve düşündürücü" },
  { key: "funny", emoji: "🎭", label: "Eğlenceli", description: "Esprili, hafif ve gülümseten" },
  { key: "deep", emoji: "🌌", label: "Derin", description: "Felsefi ve anlamlı sorular" },
  { key: "poetic", emoji: "✒️", label: "Şiirsel", description: "Metaforlarla bezeli" },
  { key: "mysterious", emoji: "🔮", label: "Gizemli", description: "Merak uyandıran ve gizemli" },
];

const FALLBACK_PROMPTS: Record<PersonaKey, string[]> = {
  friendly: [
    "Bugün seni en çok güldüren şey neydi?",
    "Son zamanlarda dinlediğin bir şarkıyı önerir misin?",
    "Bu hafta kendin için yaptığın en iyi şey neydi?",
  ],
  romantic: [
    "Ay ışığında yürüyüş yaparken aklına ilk gelen şey ne olur?",
    "Sana huzur veren bir yer tarif eder misin?",
    "En güzel rüyanı anlatmak ister misin?",
  ],
  funny: [
    "Bir süper güç seçebilsen hangisi olurdu ve ilk ne yapardın?",
    "Zaman makinen olsa geçmişe mi geleceğe mi giderdin?",
    "Kendini bir film karakteriyle kıyaslasan hangisi olurdun?",
  ],
  deep: [
    "Hayatında değiştirmek istediğin küçük bir alışkanlık var mı?",
    "Mutluluğu bir cümleyle nasıl tanımlardın?",
    "En sevdiğin çocukluk anısı seni bugün nasıl etkiliyor?",
  ],
  poetic: [
    "Rüzgar sana bir mesaj getirse ne söylerdi?",
    "Gün batımını bir renkle anlatsan hangi renk olurdu?",
    "Denizin senin için taşıdığı bir hikâye var mı?",
  ],
  mysterious: [
    "Keşfedilmeyi bekleyen bir yeteneğin olduğunu düşünüyor musun?",
    "Eğer bir gizem çözseydin, hangisini çözmek isterdin?",
    "Gelecekten gelen bir mesaj alsan, ne sormak isterdin?",
  ],
};

function personaPrompt(persona: PersonaKey): string {
  const base =
    "Sen yavaş mesajlaşma uygulamasında kullanıcıya konuşma başlatıcıları öneren bir asistansın. Kısa, samimi ve açık uçlu 1 cümlelik soru üret. Yalnızca soruyu döndür, tırnak kullanma.";
  const tone: Record<PersonaKey, string> = {
    friendly: "Sıcak ve günlük sohbet havasında yaz.",
    romantic: "Yumuşak, duygusal ve düşündürücı bir dil kullan.",
    funny: "Esprili, hafif ve gülümseten bir ton kullan.",
    deep: "Felsefi ve anlamlı sorular sor.",
    poetic: "Metaforlar ve imgelerle bezeli bir dil kullan.",
    mysterious: "Merak uyandıran, gizemli bir ton kullan.",
  };
  return `${base} ${tone[persona]}`;
}

export async function generateConversationStarter(
  context?: string,
  persona: PersonaKey = "friendly"
): Promise<{ starter: string; persona: PersonaKey }> {
  const selected = PERSONAS.find((p) => p.key === persona)?.key || "friendly";

  if (!openai) {
    return { starter: randomFallback(selected), persona: selected };
  }

  try {
    const userContent = context
      ? `Karşı tarafın profili veya mesaj bağlamı şöyle: "${context}". Bu bağlama uygun bir konuşma başlatıcısı öner.`
      : "Bana ilginç bir konuşma başlatıcısı öner.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: personaPrompt(selected) },
        { role: "user", content: userContent },
      ],
      max_tokens: 80,
      temperature: 0.9,
    });

    const text = response.choices[0]?.message?.content?.trim();
    return { starter: text && text.length > 5 ? text : randomFallback(selected), persona: selected };
  } catch (err) {
    console.error("OpenAI error:", err instanceof Error ? err.message : err);
    return { starter: randomFallback(selected), persona: selected };
  }
}

export async function generateReplySuggestions(
  messages: { sender: "me" | "them"; content: string }[],
  persona: PersonaKey = "friendly"
): Promise<{ suggestions: string[]; persona: PersonaKey }> {
  const selected = PERSONAS.find((p) => p.key === persona)?.key || "friendly";

  const fallback = randomFallback(selected);
  if (!openai) {
    return { suggestions: [fallback, randomFallback(selected)], persona: selected };
  }

  try {
    const formatted = messages
      .map((m) => `${m.sender === "me" ? "Ben" : "Karşı taraf"}: ${m.content}`)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `${personaPrompt(selected)} Verilen sohbet geçmişine uygun 3 kısa yanıt önerisi ver. Her biri 1 cümle olsun. Sadece önerileri numaralandırarak döndür.`,
        },
        {
          role: "user",
          content: `Son mesajlara uygun 3 yanıt öner:\n${formatted || "Konuşma henüz başlamadı."}`,
        },
      ],
      max_tokens: 150,
      temperature: 0.85,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";
    const suggestions = text
      .split("\n")
      .map((line) => line.replace(/^\d+[.\-)\s]*/, "").trim())
      .filter((line) => line.length > 3)
      .slice(0, 3);

    return {
      suggestions: suggestions.length >= 2 ? suggestions : [fallback, randomFallback(selected)],
      persona: selected,
    };
  } catch (err) {
    console.error("OpenAI reply error:", err instanceof Error ? err.message : err);
    return { suggestions: [fallback, randomFallback(selected)], persona: selected };
  }
}

function randomFallback(persona: PersonaKey): string {
  const list = FALLBACK_PROMPTS[persona] || FALLBACK_PROMPTS.friendly;
  return list[Math.floor(Math.random() * list.length)];
}
