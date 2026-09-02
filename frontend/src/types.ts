export interface User {
  id: number;
  email: string;
  username: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type MessageStatus = "PENDING" | "IN_TRANSIT" | "DELIVERED";
export type SenderType = "USER" | "AI" | "SYSTEM";

export interface Message {
  id: number;
  content: string;
  senderType: SenderType;
  status: MessageStatus;
  deliveryDelayMin: number;
  visibleAfter: string | null;
  createdAt: string;
  deliveredAt: string | null;
  conversationId: number;
  userId: number | null;
}

export interface Conversation {
  id: number;
  title: string;
  updatedAt: string;
  createdAt?: string;
  messageCount?: number;
  lastMessage?: {
    content: string;
    status: MessageStatus;
    createdAt: string;
  } | null;
}
