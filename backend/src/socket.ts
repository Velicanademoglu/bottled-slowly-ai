import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { prisma } from "./db.js";
import { verifyToken } from "./auth.js";

export let appSocket: SocketServer | null = null;

export function createSocketServer(server: HttpServer) {
  const io = new SocketServer(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  appSocket = io;

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      next(new Error("Authentication error"));
      return;
    }
    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as number;

    socket.on("join", (conversationId: number) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on("leave", (conversationId: number) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on("typing", ({ conversationId, isTyping }: { conversationId: number; isTyping: boolean }) => {
      socket.to(`conv:${conversationId}`).emit("typing", { conversationId, userId, isTyping });
    });

    socket.on("message", async ({ conversationId, content }: { conversationId: number; content: string }) => {
      const trimmed = content.trim();
      if (!trimmed || trimmed.length > 2000) return;

      const member = await prisma.conversationMember.findFirst({
        where: { conversationId, userId },
      });
      if (!member) return;

      const message = await prisma.chatMessage.create({
        data: { conversationId, senderId: userId, content: trimmed },
      });

      await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

      io.to(`conv:${conversationId}`).emit("message", message);
    });

    socket.on("disconnect", () => {});
  });

  return io;
}
