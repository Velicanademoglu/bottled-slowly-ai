import "dotenv/config";
import { prisma } from "./db.js";

async function seedMessages() {
  const sender = await prisma.user.findFirst({ where: { username: "luna" } });
  const recipient = await prisma.user.findFirst({ where: { username: "orion" } });
  if (!sender || !recipient) {
    console.log("Sender or recipient not found");
    return;
  }

  // Space message
  const spaceMessage = await prisma.spaceMessage.create({
    data: {
      senderId: sender.id,
      content: "Hello from the other side of the galaxy! I hope someone finds this message.",
      vesselKey: "PARCHMENT",
      status: "launched",
      launchedAt: new Date(),
    },
  });

  await prisma.messageJourney.create({
    data: {
      messageId: spaceMessage.id,
      status: "traveling",
      distanceKm: 4820,
      recipients: {
        create: {
          userId: recipient.id,
          status: "pending",
        },
      },
      events: {
        create: {
          type: "launched",
          metadata: JSON.stringify({ country: "Italy" }),
        },
      },
    },
  });

  console.log(`Space message ${spaceMessage.id} created`);

  // Chat conversation
  const conversation = await prisma.conversation.create({
    data: {
      title: "Stargazers",
      members: {
        create: [
          { userId: sender.id },
          { userId: recipient.id },
        ],
      },
      messages: {
        create: [
          { senderId: sender.id, content: "Hey Orion! Loved your gaming playlist." },
          { senderId: recipient.id, content: "Thanks Luna! We should team up sometime." },
        ],
      },
    },
  });

  console.log(`Conversation ${conversation.id} created`);
}

seedMessages()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
