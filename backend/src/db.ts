import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function checkPendingMessages() {
  const now = new Date();

  // IN_TRANSIT: yarı süre geçmiş ama henüz varış zamanına gelmemiş
  const pending = await prisma.message.findMany({
    where: { status: "PENDING", visibleAfter: { gt: now } },
  });

  for (const msg of pending) {
    const halfTime = new Date(
      msg.createdAt.getTime() + (msg.deliveryDelayMin * 60 * 1000) / 2
    );
    if (halfTime <= now) {
      await prisma.message.update({ where: { id: msg.id }, data: { status: "IN_TRANSIT" } });
    }
  }

  // DELIVERED: varış zamanı gelmiş
  await prisma.message.updateMany({
    where: {
      status: { in: ["PENDING", "IN_TRANSIT"] },
      visibleAfter: { lte: now },
    },
    data: { status: "DELIVERED", deliveredAt: now },
  });
}
