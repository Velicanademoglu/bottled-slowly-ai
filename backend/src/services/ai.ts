import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const FALLBACK_PROMPTS = [
  "Bugün seni en çok güldüren şey neydi?",
  "Zaman makinen olsa geçmişe mi geleceğe mi giderdin ve neden?",
  "Son zamanlarda dinlediğin bir şarkıyı önerir misin?",
  "Hayatında değiştirmek istediğin küçük bir alışkanlık var mı?",
  "Sana huzur veren bir yer tarif eder misin?",
  "En sevdiğin çocukluk anısı nedir?",
  "Bir süper güç seçebilsen hangisi olurdu?",
  "Bu hafta kendin için yaptığın en iyi şey neydi?",
];

export async function generateConversationStarter(): Promise<string> {
  if (!openai) {
    return randomFallback();
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Sen samimi, kısa ve düşündürücı konuşma başlatıcıları üreten bir asistansın. Kullanıcıya yavaş mesajlaşma uygulamasında karşı tarafın cevap vermek isteyeceği, 1 cümlelik açık uçlu bir soru öner. Yalnızca soruyu döndür, tırnak kullanma.",
        },
        {
          role: "user",
          content: "Bana ilginç bir konuşma başlatıcısı öner.",
        },
      ],
      max_tokens: 80,
      temperature: 0.9,
    });

    const text = response.choices[0]?.message?.content?.trim();
    return text && text.length > 5 ? text : randomFallback();
  } catch (err) {
    console.error("OpenAI error:", err instanceof Error ? err.message : err);
    return randomFallback();
  }
}

function randomFallback(): string {
  return FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)];
}
