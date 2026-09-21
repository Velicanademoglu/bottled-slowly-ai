import "dotenv/config";
import { prisma } from "./db.js";
import { hashPassword } from "./auth.js";

async function createAdminForUser() {
  const password = "StarAdmin2024!";
  const email = "you@projectstar.app";
  const username = "starcaptain";

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN", status: "ACTIVE", emailVerified: true },
    });
    console.log(`Existing user ${username} updated to ADMIN.`);
  } else {
    await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: await hashPassword(password),
        role: "ADMIN",
        emailVerified: true,
        status: "ACTIVE",
        profile: {
          create: {
            birthDate: new Date("1995-08-20"),
            gender: "PREFER_NOT_TO_SAY",
            country: "Turkey",
            bio: "Exploring the universe one message at a time.",
            onboardingCompleted: true,
            completedSteps: "[]",
          },
        },
        preferences: {
          create: {
            preferredGender: "EVERYONE",
            minAge: 20,
            maxAge: 45,
            conversationGoals: JSON.stringify(["Deep conversations", "Friendship", "Random discoveries"]),
          },
        },
        stardust: { create: { balance: 500 } },
        languages: {
          create: [
            { language: "Turkish", level: "Native" },
            { language: "English", level: "Fluent" },
          ],
        },
        interests: {
          create: [
            { interest: "Music" },
            { interest: "Travel" },
            { interest: "Technology" },
            { interest: "Space" },
          ],
        },
      },
    });
    console.log(`Admin user created: ${email} / ${username}`);
  }

  console.log("Login credentials:");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role: ADMIN`);
}

createAdminForUser()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
