export interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  emailVerified: boolean;
  status: string;
  createdAt: string;
  profile: Profile | null;
  preferences: UserPreference | null;
  languages: UserLanguage[];
  interests: string[];
  stardustBalance: number;
  completion?: number;
  level?: number;
}

export interface Profile {
  id?: number;
  birthDate: string | null;
  gender: string | null;
  country: string | null;
  bio: string | null;
  avatarUrl: string | null;
  avatarPreset: string | null;
  level: number;
  gravity: number;
  onboardingCompleted: boolean;
  completedSteps?: string;
}

export interface UserPreference {
  id?: number;
  preferredGender: string;
  minAge: number | null;
  maxAge: number | null;
  conversationGoals: string[];
}

export interface UserLanguage {
  id?: number;
  language: string;
  level: string;
}

export interface PublicUser {
  id: number;
  username: string;
  createdAt: string;
  profile: {
    birthDate: string | null;
    gender: string | null;
    country: string | null;
    bio: string | null;
    avatarUrl: string | null;
    avatarPreset: string | null;
  } | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AdminAuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    username: string;
    role: string;
  };
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalMessages: number;
  totalReports: number;
  openReports: number;
  totalTransactions: number;
}

export interface AdminUserList {
  users: {
    id: number;
    email: string;
    username: string;
    role: string;
    status: string;
    emailVerified: boolean;
    createdAt: string;
    country?: string | null;
    avatarUrl?: string | null;
  }[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
  };
}

export interface AppSetting {
  id: number;
  key: string;
  value: string;
  category: string;
  updatedAt: string;
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

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  type: "text" | "image" | "video" | "audio" | "file";
  mediaUrl: string | null;
  read: boolean;
  createdAt: string;
}

export interface Friendship {
  id: number;
  requesterId?: number;
  friend?: PublicUser;
  requester?: PublicUser;
  status?: string;
  createdAt?: string;
}
