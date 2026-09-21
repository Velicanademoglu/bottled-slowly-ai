import "dotenv/config";
import { prisma } from "./db.js";
import { hashPassword } from "./auth.js";

const bots = [
  {
    email: "bot.luna@projectstar.app",
    username: "luna",
    profile: {
      birthDate: new Date("2000-03-15"),
      gender: "FEMALE",
      country: "Italy",
      bio: "Dreamer, music lover, night sky watcher.",
      onboardingCompleted: true,
    },
    preferences: { preferredGender: "EVERYONE", minAge: 20, maxAge: 35, conversationGoals: ["Deep conversations", "Music", "Friendship"] },
    languages: [{ language: "Italian", level: "Native" }, { language: "English", level: "Fluent" }],
    interests: ["Music", "Art", "Nature", "Travel"],
  },
  {
    email: "bot.orion@projectstar.app",
    username: "orion",
    profile: {
      birthDate: new Date("1998-07-22"),
      gender: "MALE",
      country: "Japan",
      bio: "Gamer and tech enthusiast looking for casual chats.",
      onboardingCompleted: true,
    },
    preferences: { preferredGender: "EVERYONE", minAge: 18, maxAge: 40, conversationGoals: ["Gaming friends", "Casual", "Technology"] },
    languages: [{ language: "Japanese", level: "Native" }, { language: "English", level: "Intermediate" }],
    interests: ["Gaming", "Technology", "Movies", "Science"],
  },
  {
    email: "bot.aura@projectstar.app",
    username: "aura",
    profile: {
      birthDate: new Date("2002-11-08"),
      gender: "NON_BINARY",
      country: "Brazil",
      bio: "Exploring the world one conversation at a time.",
      onboardingCompleted: true,
    },
    preferences: { preferredGender: "EVERYONE", minAge: 18, maxAge: 30, conversationGoals: ["Culture exchange", "Travel", "Random discoveries"] },
    languages: [{ language: "Portuguese", level: "Native" }, { language: "English", level: "Fluent" }, { language: "Spanish", level: "Learning" }],
    interests: ["Travel", "Culture", "Food", "Photography"],
  },
  {
    email: "bot.sol@projectstar.app",
    username: "sol",
    profile: {
      birthDate: new Date("1995-05-30"),
      gender: "FEMALE",
      country: "Spain",
      bio: "Bookworm and history nerd. Love deep talks about life.",
      onboardingCompleted: true,
    },
    preferences: { preferredGender: "EVERYONE", minAge: 25, maxAge: 45, conversationGoals: ["Deep conversations", "Books", "Life"] },
    languages: [{ language: "Spanish", level: "Native" }, { language: "English", level: "Fluent" }],
    interests: ["Books", "History", "Art", "Nature"],
  },
  {
    email: "bot.nova@projectstar.app",
    username: "nova",
    profile: {
      birthDate: new Date("2001-01-17"),
      gender: "MALE",
      country: "Turkey",
      bio: "Fitness freak and sports fan. Always up for a friendly chat.",
      onboardingCompleted: true,
    },
    preferences: { preferredGender: "EVERYONE", minAge: 18, maxAge: 35, conversationGoals: ["Friendship", "Sports", "Casual"] },
    languages: [{ language: "Turkish", level: "Native" }, { language: "English", level: "Intermediate" }],
    interests: ["Sports", "Fitness", "Music", "Movies"],
  },
];

async function seedBots() {
  const password = await hashPassword("BotPass123");

  for (const bot of bots) {
    const existing = await prisma.user.findFirst({ where: { OR: [{ email: bot.email }, { username: bot.username }] } });
    if (existing) {
      console.log(`Skipping existing user ${bot.username}`);
      continue;
    }

    await prisma.user.create({
      data: {
        email: bot.email,
        username: bot.username,
        passwordHash: password,
        emailVerified: true,
        status: "ACTIVE",
        profile: {
          create: {
            ...bot.profile,
            completedSteps: "[]",
          },
        },
        preferences: {
          create: {
            preferredGender: bot.preferences.preferredGender,
            minAge: bot.preferences.minAge,
            maxAge: bot.preferences.maxAge,
            conversationGoals: JSON.stringify(bot.preferences.conversationGoals),
          },
        },
        stardust: { create: { balance: 100 } },
        languages: { createMany: { data: bot.languages } },
        interests: { createMany: { data: bot.interests.map((i) => ({ interest: i })) } },
      },
    });
    console.log(`Created bot user ${bot.username}`);
  }

  console.log("Bot seed complete.");
}

seedBots()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
