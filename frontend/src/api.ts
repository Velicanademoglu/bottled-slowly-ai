import axios from "axios";
import type { AuthResponse, Conversation, Message } from "./types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
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
};

export const conversationApi = {
  list: () => api.get<Conversation[]>("/api/conversations"),
  get: (id: number) => api.get<Conversation>(`/api/conversations/${id}`),
  create: (title?: string) =>
    api.post<Conversation>("/api/conversations", { title }),
};

export const messageApi = {
  list: (conversationId: number) =>
    api.get<Message[]>(`/api/conversations/${conversationId}/messages`),
  send: (conversationId: number, content: string, deliveryDelayMin = 60) =>
    api.post<Message>(`/api/conversations/${conversationId}/messages`, {
      content,
      deliveryDelayMin,
    }),
};

export const aiApi = {
  starter: () => api.get<{ starter: string }>("/api/ai/starter"),
  createFromStarter: (starter: string) =>
    api.post<Conversation>("/api/ai/conversations/from-starter", { starter }),
};

export default api;
