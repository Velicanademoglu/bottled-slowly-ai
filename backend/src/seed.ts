import "dotenv/config";
import { prisma } from "./db.js";
import { hashPassword } from "./auth.js";
import { APP_NAME } from "./config.js";

const DEFAULT_PASSWORD = "DemoPass1";

const interestsPool = [
  "Music", "Movies", "Gaming", "Travel", "Books", "Technology", "Art", "Sports",
  "Food", "Photography", "Nature", "Business", "Science", "History", "Culture",
  "Fashion", "Fitness",
];

const countries = [
  "Turkey", "United States", "Germany", "France", "Italy", "Spain", "Brazil",
  "Japan", "South Korea", "India", "United Kingdom", "Canada", "Australia",
  "Netherlands", "Sweden", "Norway", "Mexico", "Argentina", "Poland", "Portugal",
];

const languagesPool = ["English", "Turkish", "Spanish", "German", "French", "Italian", "Portuguese", "Japanese", "Korean"];

const conversationGoalsPool = [
  "Casual", "Deep conversations", "Friendship", "Culture exchange", "Gaming friends",
  "Music", "Travel", "Life", "Random discoveries",
];

const botPersonas = [
  { username: "luna", email: "luna@bots.projectstar.app", gender: "FEMALE", country: "Italy", interests: ["Music", "Travel", "Art"], languages: ["Italian", "English"], goals: ["Culture exchange", "Music"], bio: "Dreamer who loves indie music and old cities." },
  { username: "orion", email: "orion@bots.projectstar.app", gender: "MALE", country: "Germany", interests: ["Gaming", "Technology", "Science"], languages: ["German", "English"], goals: ["Gaming friends", "Deep conversations"], bio: "Night owl, gamer, and stargazer." },
  { username: "nova", email: "nova@bots.projectstar.app", gender: "NON_BINARY", country: "Japan", interests: ["Photography", "Nature", "Travel"], languages: ["Japanese", "English"], goals: ["Travel", "Friendship"], bio: "Always chasing sunsets and good conversations." },
  { username: "cosmo", email: "cosmo@bots.projectstar.app", gender: "MALE", country: "Brazil", interests: ["Sports", "Music", "Food"], languages: ["Portuguese", "Spanish"], goals: ["Casual", "Music"], bio: "Football fan with a playlist for every mood." },
  { username: "aurora", email: "aurora@bots.projectstar.app", gender: "FEMALE", country: "Norway", interests: ["Nature", "Books", "History"], languages: ["Norwegian", "English"], goals: ["Deep conversations", "Culture exchange"], bio: "Quiet reader, loud thinker." },
  { username: "nebula", email: "nebula@bots.projectstar.app", gender: "FEMALE", country: "France", interests: ["Fashion", "Art", "Movies"], languages: ["French", "English"], goals: ["Random discoveries", "Friendship"], bio: "Loves cinema, coffee, and late-night talks." },
  { username: "quasar", email: "quasar@bots.projectstar.app", gender: "MALE", country: "United States", interests: ["Technology", "Business", "Fitness"], languages: ["English"], goals: ["Life", "Deep conversations"], bio: "Entrepreneur learning to slow down." },
  { username: "stella", email: "stella@bots.projectstar.app", gender: "FEMALE", country: "South Korea", interests: ["Gaming", "Music", "Technology"], languages: ["Korean", "English"], goals: ["Gaming friends", "Casual"], bio: "K-pop and RPG enthusiast." },
  { username: "comet", email: "comet@bots.projectstar.app", gender: "MALE", country: "Canada", interests: ["Travel", "Photography", "Sports"], languages: ["English", "French"], goals: ["Travel", "Friendship"], bio: "Road trip lover with a camera." },
  { username: "eclipse", email: "eclipse@bots.projectstar.app", gender: "NON_BINARY", country: "United Kingdom", interests: ["Science", "Technology", "Books"], languages: ["English"], goals: ["Deep conversations", "Random discoveries"], bio: "Curious about almost everything." },
  { username: "sol", email: "sol@bots.projectstar.app", gender: "MALE", country: "Spain", interests: ["Food", "Music", "History"], languages: ["Spanish", "English"], goals: ["Culture exchange", "Food"], bio: "Chef in training, music lover." },
  { username: "astra", email: "astra@bots.projectstar.app", gender: "FEMALE", country: "India", interests: ["Movies", "Art", "Travel"], languages: ["Hindi", "English"], goals: ["Friendship", "Culture exchange"], bio: "Bollywood fan and sketch artist." },
];

const sampleMessageTexts = [
  "Hello from the other side of the galaxy! I hope someone finds this message.",
  "Looking for a friend to talk about music and dreams. Anyone out there?",
  "I just watched an amazing movie. Wish I could discuss it with a stranger.",
  "Gaming is my escape. What’s your favorite game?",
  "Sending positive energy into the universe. Reply if you feel it too.",
  "Tell me something beautiful about your country.",
  "I love late-night conversations about life. Want to join?",
  "What’s a song that changed your life?",
  "Traveler seeking stories from around the world.",
  "If you found this, maybe we were meant to connect.",
];

function randomPick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function birthDateForAge(age: number): Date {
  const now = new Date();
  const year = now.getFullYear() - age - Math.floor(Math.random() * 1);
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month, day);
}

async function createBotUser(persona: (typeof botPersonas)[number]) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: persona.email }, { username: persona.username }] },
  });
  if (existing) {
    console.log("Bot user already exists:", persona.username);
    return existing;
  }

  const age = 20 + Math.floor(Math.random() * 15);

  const user = await prisma.user.create({
    data: {
      email: persona.email,
      username: persona.username,
      passwordHash: await hashPassword(DEFAULT_PASSWORD),
      role: "USER",
      emailVerified: true,
      status: "ACTIVE",
      profile: {
        create: {
          bio: persona.bio,
          country: persona.country,
          gender: persona.gender,
          birthDate: birthDateForAge(age),
          onboardingCompleted: true,
        },
      },
      preferences: {
        create: {
          preferredGender: "EVERYONE",
          minAge: 18,
          maxAge: 40,
          conversationGoals: JSON.stringify(persona.goals),
        },
      },
      stardust: { create: { balance: 200 + Math.floor(Math.random() * 500) } },
      languages: {
        create: persona.languages.map((language, index) => ({
          language,
          level: index === 0 ? "NATIVE" : "FLUENT",
        })),
      },
      interests: { create: persona.interests.map((interest) => ({ interest })) },
    },
  });

  console.log("Created bot user:", persona.username);
  return user;
}

async function seedCore() {
  const adminEmail = "admin@projectstar.app";
  const userEmail = "demo@projectstar.app";

  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        username: "admin",
        passwordHash: await hashPassword("AdminPass1"),
        role: "SUPER_ADMIN",
        emailVerified: true,
        status: "ACTIVE",
        profile: { create: { bio: "System administrator" } },
        preferences: { create: {} },
        stardust: { create: { balance: 9999 } },
      },
    });
    console.log("Created admin user:", adminEmail);
  }

  const demoExists = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!demoExists) {
    await prisma.user.create({
      data: {
        email: userEmail,
        username: "stargazer",
        passwordHash: await hashPassword("DemoPass1"),
        role: "USER",
        emailVerified: true,
        status: "ACTIVE",
        profile: {
          create: {
            bio: "Hello from the stars!",
            country: "Turkey",
            gender: "PREFER_NOT_TO_SAY",
            birthDate: birthDateForAge(25),
            onboardingCompleted: true,
          },
        },
        preferences: { create: { preferredGender: "EVERYONE", minAge: 18, maxAge: 35, conversationGoals: JSON.stringify(["Friendship", "Casual"]) } },
        stardust: { create: { balance: 500 } },
        languages: {
          create: [
            { language: "Turkish", level: "NATIVE" },
            { language: "English", level: "FLUENT" },
          ],
        },
        interests: {
          create: [
            { interest: "Music" },
            { interest: "Travel" },
            { interest: "Gaming" },
          ],
        },
      },
    });
    console.log("Created demo user:", userEmail);
  }
}

async function seedSettings() {
  const settings = [
    { key: "app.name", value: APP_NAME, category: "brand" },
    { key: "app.slogan", value: "Someone out there is waiting.", category: "brand" },
    { key: "matching.weights", value: JSON.stringify({ interests: 0.30, age: 0.20, language: 0.15, goals: 0.15, activity: 0.10, quality: 0.10, randomness: 0.30 }), category: "matching" },
    { key: "matching.diversity_ratio", value: "0.30", category: "matching" },
    { key: "economy.daily_free_casts", value: "3", category: "economy" },
    { key: "economy.message_cost", value: "0", category: "economy" },
    { key: "economy.boost_message_price", value: "100", category: "economy" },
    { key: "economy.boost_profile_price", value: "150", category: "economy" },
    { key: "economy.extra_cast_price", value: "50", category: "economy" },
    { key: "safety.min_age", value: "18", category: "safety" },
    { key: "safety.message_expiry_days", value: "30", category: "safety" },
    { key: "safety.inactive_threshold_days", value: "14", category: "safety" },
  ];

  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      create: s,
      update: { value: s.value, category: s.category },
    });
  }
  console.log("Seeded app settings");
}

async function seedVessels() {
  const vessels = [
    { key: "parchment", name: "Parchment", tier: "free", price: 0, description: "A timeless classic." },
    { key: "heart", name: "Heart", tier: "free", price: 0, description: "Send love across the stars." },
    { key: "basic_capsule", name: "Basic Capsule", tier: "free", price: 0, description: "A sturdy metal capsule." },
    { key: "star_message", name: "Star Message", tier: "free", price: 0, description: "A glowing star-shaped note." },
    { key: "crystal_heart", name: "Crystal Heart", tier: "premium", price: 150, description: "Beautiful and rare." },
    { key: "galaxy_capsule", name: "Galaxy Capsule", tier: "premium", price: 200, description: "Swirling cosmic colors." },
    { key: "golden_letter", name: "Golden Letter", tier: "premium", price: 250, description: "For messages that matter." },
    { key: "moon_message", name: "Moon Message", tier: "premium", price: 180, description: "Soft lunar glow." },
    { key: "saturn_capsule", name: "Saturn Capsule", tier: "premium", price: 220, description: "A message with rings." },
    { key: "rose_message", name: "Rose Message", tier: "premium", price: 160, description: "Romantic and elegant." },
  ];

  for (const v of vessels) {
    await prisma.messageVessel.upsert({
      where: { key: v.key },
      create: { ...v, active: true },
      update: { name: v.name, tier: v.tier, price: v.price, description: v.description, active: true },
    });
  }
  console.log("Seeded message vessels");
}

async function seedMissions() {
  const missions = [
    { key: "send_message", title: "Send a Message", description: "Cast one message into space.", reward: 10 },
    { key: "discover_messages", title: "Discover Messages", description: "View 2 incoming messages.", reward: 15 },
    { key: "reply_chat", title: "Start a Conversation", description: "Send one chat message.", reward: 10 },
    { key: "complete_profile", title: "Complete Your Profile", description: "Fill all profile sections.", reward: 50 },
    { key: "return_tomorrow", title: "Return Tomorrow", description: "Come back tomorrow for a streak reward.", reward: 5 },
  ];

  for (const m of missions) {
    await prisma.dailyMission.upsert({
      where: { key: m.key },
      create: { ...m, active: true },
      update: { title: m.title, description: m.description, reward: m.reward, active: true },
    });
  }
  console.log("Seeded daily missions");
}

async function seedBoosts() {
  const boosts = [
    { key: "message_boost", name: "Message Boost", description: "Your message travels faster and reaches more users.", price: 100, durationMin: 1440 },
    { key: "profile_boost", name: "Profile Visibility Boost", description: "Increase your chance of receiving messages.", price: 150, durationMin: 1440 },
  ];

  for (const b of boosts) {
    await prisma.boost.upsert({
      where: { key: b.key },
      create: { ...b, active: true },
      update: { name: b.name, description: b.description, price: b.price, durationMin: b.durationMin, active: true },
    });
  }
  console.log("Seeded boosts");
}

async function seedBotContent() {
  const bots: Awaited<ReturnType<typeof createBotUser>>[] = [];
  for (const persona of botPersonas) {
    bots.push(await createBotUser(persona));
  }

  // Create sample journeys between bots
  for (let i = 0; i < bots.length; i++) {
    const sender = bots[i];
    const senderPersona = botPersonas[i];
    const recipientIndex = (i + 1) % bots.length;
    const recipient = bots[recipientIndex];
    const recipientPersona = botPersonas[recipientIndex];

    const content = sampleMessageTexts[i % sampleMessageTexts.length];
    const vesselKeys = ["parchment", "heart", "basic_capsule", "star_message"];
    const vesselKey = vesselKeys[i % vesselKeys.length];
    const distanceKm = 1000 + Math.floor(Math.random() * 8000);

    const existingMessage = await prisma.spaceMessage.findFirst({
      where: { senderId: sender.id, content },
    });
    if (existingMessage) continue;

    const message = await prisma.spaceMessage.create({
      data: {
        senderId: sender.id,
        content,
        vesselKey,
        status: "launched",
        launchedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
      },
    });

    await prisma.messageJourney.create({
      data: {
        messageId: message.id,
        currentRecipientId: recipient.id,
        status: "traveling",
        distanceKm,
        recipients: {
          create: { userId: recipient.id, status: "pending" },
        },
        events: {
          create: [
            { type: "launched", metadata: JSON.stringify({ country: senderPersona.country }) },
            { type: "traveling", metadata: JSON.stringify({ country: recipientPersona.country, distanceKm }) },
          ],
        },
      },
    });
  }

  // Create a sample accepted conversation between demo user and first bot
  const demo = await prisma.user.findUnique({ where: { email: "demo@projectstar.app" }, include: { profile: true } });
  const firstBot = bots[0];
  if (demo && firstBot) {
    const existingConnection = await prisma.connection.findUnique({
      where: { userAId_userBId: { userAId: Math.min(demo.id, firstBot.id), userBId: Math.max(demo.id, firstBot.id) } },
    });

    if (!existingConnection) {
      const connection = await prisma.connection.create({
        data: {
          userAId: demo.id,
          userBId: firstBot.id,
        },
      });

      const conversation = await prisma.conversation.create({
        data: {
          members: {
            create: [
              { userId: demo.id },
              { userId: firstBot.id },
            ],
          },
          messages: {
            create: [
              { senderId: firstBot.id, content: "Hey! I found your message floating in space. How are you?" },
              { senderId: demo.id, content: "Hi! I’m doing great. Your profile looked interesting." },
              { senderId: firstBot.id, content: "Thanks! I love talking about music and travel. What about you?" },
            ],
          },
        },
      });

      await prisma.connection.update({
        where: { id: connection.id },
        data: { messageId: conversation.id },
      });

      console.log("Created sample conversation");
    }
  }

  console.log("Seeded bot content");
}

async function seed() {
  await seedCore();
  await seedSettings();
  await seedVessels();
  await seedMissions();
  await seedBoosts();
  await seedBotContent();
  console.log("Seed completed.");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
