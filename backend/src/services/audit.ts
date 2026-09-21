import { prisma } from "../db.js";

export async function logAdminAction(
  adminId: number,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: string
) {
  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      metadata,
    },
  });
}
