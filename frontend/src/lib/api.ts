import axios from "axios";
import type {
  AuthResponse,
  Profile,
  User,
  UserPreference,
  PublicUser,
  UserLanguage,
  AdminAuthResponse,
  AdminStats,
  AdminUserList,
  AppSetting,
  ChatMessage,
} from "../types";

const api = axios.create({
  baseURL: import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL || "",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem("token");
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/api/auth/login", { email, password }),
  register: (email: string, username: string, password: string) =>
    api.post<AuthResponse>("/api/auth/register", { email, username, password }),
  forgotPassword: (email: string) => api.post<{ ok: boolean }>("/api/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.post<{ ok: boolean }>("/api/auth/reset-password", { token, password }),
  verifyEmail: (token: string) => api.post<{ ok: boolean }>("/api/auth/verify-email", { token }),
  resendVerification: (email: string) =>
    api.post<{ ok: boolean }>("/api/auth/resend-verification", { email }),
};

export const profileApi = {
  me: () => api.get<User>("/api/profile/me"),
  update: (profile: Partial<Profile>) => api.put<Profile>("/api/profile/me", profile),
  updatePreferences: (prefs: Partial<UserPreference>) =>
    api.put<UserPreference>("/api/profile/preferences", prefs),
  addLanguage: (lang: Partial<UserLanguage>) =>
    api.post<UserLanguage>("/api/profile/languages", lang),
  removeLanguage: (language: string) =>
    api.delete<{ ok: boolean }>(`/api/profile/languages/${encodeURIComponent(language)}`),
  addInterest: (interest: string) =>
    api.post<{ ok: boolean }>("/api/profile/interests", { interest }),
  removeInterest: (interest: string) =>
    api.delete<{ ok: boolean }>(`/api/profile/interests/${encodeURIComponent(interest)}`),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post<{ avatarUrl: string }>("/api/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const usersApi = {
  discover: () => api.get<PublicUser[]>("/api/users/discover"),
  get: (id: number) => api.get<PublicUser>(`/api/users/${id}`),
};

export const messagesApi = {
  create: (content: string, vesselKey: string = "PARCHMENT") =>
    api.post<{ id: number }>("/api/messages", { content, vesselKey }),
  cast: (id: number) =>
    api.post<{ message: { id: number; status: string }; journey: { id: number }; recipient: { id: number; username: string; country?: string | null } }>(`/api/messages/${id}/cast`),
  my: () =>
    api.get<{ messages: unknown[] }>("/api/messages/my"),
};

export const discoveriesApi = {
  incoming: () =>
    api.get<{ items: { recipientId: number; journeyId: number; messageId: number; content: string; vesselKey: string; sender: { id: number; username: string; age: number | null; country?: string | null; bio?: string | null; languages: string[]; interests: string[] }; createdAt: string }[] }>("/api/discoveries/incoming"),
  accept: (recipientId: number) =>
    api.post<{ conversation: { id: number } }>(`/api/discoveries/${recipientId}/accept`),
  pass: (recipientId: number) =>
    api.post<{ ok: boolean; nextMatch: { id: number; username: string } | null }>(`/api/discoveries/${recipientId}/pass`),
  history: () =>
    api.get<{ items: unknown[] }>("/api/discoveries/history"),
  traveling: () =>
    api.get<{
      items: {
        messageId: number;
        journeyId?: number;
        content: string;
        vesselKey: string;
        status: string;
        launchedAt: string | null;
        currentRecipient: { id: number; username: string; country?: string | null } | null;
        passes: number;
        accepts: number;
        events: { type: string; country: string | null; lat: number | null; lng: number | null; createdAt: string; metadata?: string | null }[];
      }[];
    }>("/api/discoveries/traveling"),
  found: () =>
    api.get<{ items: { messageId: number; journeyId?: number; content: string; vesselKey: string; acceptedAt: string; recipient: { id: number; username: string; country?: string | null } }[] }>("/api/discoveries/found"),
};

export const conversationsApi = {
  list: () =>
    api.get<{ conversations: unknown[] }>("/api/conversations"),
  get: (id: number) =>
    api.get<unknown>(`/api/conversations/${id}`),
  send: (id: number, content: string, file?: File) => {
    if (file) {
      const formData = new FormData();
      formData.append("media", file);
      if (content.trim()) formData.append("content", content.trim());
      return api.post<ChatMessage>(`/api/conversations/${id}/messages`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post<ChatMessage>(`/api/conversations/${id}/messages`, { content });
  },
};

export interface AiPersona {
  key: string;
  emoji: string;
  label: string;
  description: string;
}

export const aiApi = {
  personas: () => api.get<{ personas: AiPersona[] }>("/api/ai/personas"),
  starter: (context?: string, persona?: string) =>
    api.post<{ starter: string; persona: string }>("/api/ai/starter", { context, persona }),
  replies: (messages: { sender: "me" | "them"; content: string }[], persona?: string) =>
    api.post<{ suggestions: string[]; persona: string }>("/api/ai/replies", { messages, persona }),
};

export interface UserTemplate {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const templatesApi = {
  list: () => api.get<{ templates: UserTemplate[] }>("/api/templates"),
  create: (title: string, content: string) =>
    api.post<{ template: UserTemplate }>("/api/templates", { title, content }),
  update: (id: number, title: string, content: string) =>
    api.put<{ template: UserTemplate }>(`/api/templates/${id}`, { title, content }),
  delete: (id: number) => api.delete<{ ok: boolean }>(`/api/templates/${id}`),
};

export const reportsApi = {
  create: (targetId: number, category: string, description?: string) =>
    api.post<{ id: number; status: string }>("/api/reports", { targetId, category, description }),
};

export const stardustApi = {
  balance: () => api.get<{ balance: number }>("/api/stardust/balance"),
  transactions: () => api.get<{ transactions: unknown[] }>("/api/stardust/transactions"),
  claimDaily: () => api.post<{ ok: boolean; balance: number; amount: number; streak: number }>("/api/stardust/daily"),
  claimProfileCompletion: () => api.post<{ ok: boolean; balance?: number; amount?: number; message?: string }>("/api/stardust/profile-completion"),
  missions: () => api.get<{ missions: unknown[] }>("/api/stardust/missions"),
  completeMission: (key: string) =>
    api.post<{ ok: boolean; balance: number; reward: number }>(`/api/stardust/missions/${encodeURIComponent(key)}/complete`),
};

export const adminApi = {
  login: (email: string, password: string) =>
    api.post<AdminAuthResponse>("/api/admin/auth/login", { email, password }),
  stats: () => api.get<AdminStats>("/api/admin/dashboard/stats"),
  users: (params?: { search?: string; status?: string; role?: string; page?: number; pageSize?: number }) => api.get<AdminUserList>("/api/admin/users", { params }),
  updateUserStatus: (id: number, status: string) =>
    api.post<{ id: number; status: string }>(`/api/admin/users/${id}/status`, { status }),
  updateUserRole: (id: number, role: string) =>
    api.post<{ id: number; role: string }>(`/api/admin/users/${id}/role`, { role }),
  settings: () => api.get<AppSetting[]>("/api/admin/settings"),
  updateSetting: (key: string, value: string, category?: string) =>
    api.put<{ ok: boolean }>("/api/admin/settings", { key, value, category }),
  reports: () =>
    api.get<{ reports: { id: number; initiatorId: number; targetId: number; category: string; description: string | null; status: string; createdAt: string; initiator: { id: number; username: string; email: string }; target: { id: number; username: string; email: string } }[] }>(
      "/api/admin/reports"
    ),
  updateReportStatus: (id: number, status: string) =>
    api.post<{ id: number; status: string }>(`/api/admin/reports/${id}/status`, { status }),
  downloadReportDocx: (id: number) =>
    api.get<Blob>(`/api/admin/reports/${id}/docx`, { responseType: "blob" }),
  exportReportsDocx: (status?: string) =>
    api.get<Blob>("/api/admin/reports/export/docx", { params: status ? { status } : undefined, responseType: "blob" }),
  spaceMessages: (params?: { senderId?: number; status?: string; page?: number; pageSize?: number }) => api.get<{ messages: unknown[]; pagination: { page: number; pageSize: number; total: number; pages: number } }>("/api/admin/messages/space", { params }),
  chats: (params?: { userId?: number; page?: number; pageSize?: number }) =>
    api.get<{ conversations: unknown[]; pagination: { page: number; pageSize: number; total: number; pages: number } }>("/api/admin/messages/chats", { params }),
};

export default api;
