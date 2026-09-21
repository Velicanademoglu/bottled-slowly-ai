import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { io, Socket } from "socket.io-client";
import { conversationsApi, reportsApi, aiApi } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import Alert from "../components/Alert";
import Avatar from "../components/Avatar";
import type { ChatMessage as ChatMessageType } from "../types";
import {
  ArrowLeft,
  Send,
  Loader2,
  ShieldAlert,
  Ban,
  Sparkles,
  Paperclip,
  X,
  Play,
  Pause,
  Image as ImageIcon,
} from "lucide-react";

function getSocketUrl(): string {
  if (import.meta.env.DEV) return "http://localhost:3001";
  return import.meta.env.VITE_API_URL || window.location.origin;
}

interface Member {
  userId: number;
  user?: { id: number; username: string; profile?: { avatarUrl: string | null; avatarPreset: string | null } };
}

interface Conversation {
  id: number;
  members: Member[];
  messages: ChatMessageType[];
}

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const conversationId = Number(id);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [generatingStarter, setGeneratingStarter] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const other = conversation?.members.find((m) => m.userId !== user?.id)?.user;

  useEffect(() => {
    if (!id) return;
    conversationsApi
      .get(Number(id))
      .then((res) => {
        const data = res.data as Conversation;
        setConversation(data);
        setMessages(data.messages);
      })
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || t("common.error"));
      })
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !conversationId) return;

    const socket = io(getSocketUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", conversationId);
    });

    socket.on("message", (msg: ChatMessageType) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on("typing", ({ isTyping }: { isTyping: boolean }) => {
      setTyping(isTyping);
    });

    return () => {
      socket.emit("leave", conversationId);
      socket.disconnect();
    };
  }, [conversationId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Max 25MB.");
      return;
    }
    setPendingFile(file);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
    setError("");
  };

  const clearFile = () => {
    setPendingFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !pendingFile) || sending) return;
    setSending(true);
    setError("");
    const content = input.trim();
    setInput("");
    try {
      const { data } = await conversationsApi.send(conversationId, content, pendingFile || undefined);
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
      clearFile();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (v: string) => {
    setInput(v);
    socketRef.current?.emit("typing", { conversationId, isTyping: v.length > 0 });
  };

  const suggestStarter = async () => {
    setGeneratingStarter(true);
    setError("");
    try {
      const context = other ? `Kullanıcı: ${other.username}` : undefined;
      const { data } = await aiApi.starter(context);
      setInput(data.starter);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    } finally {
      setGeneratingStarter(false);
    }
  };

  const report = async () => {
    if (!other) return;
    try {
      await reportsApi.create(other.id, "Other", "Reported from chat");
      alert("Report submitted.");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center text-gray-400 pb-24">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col pb-24">
      <div className="card mx-4 mt-4 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/chats")} className="p-2 hover:bg-white/5 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <Avatar
            url={other?.profile?.avatarUrl}
            preset={other?.profile?.avatarPreset}
            name={other?.username || "?"}
            size="sm"
          />
          <div>
            <div className="font-semibold text-white">{other?.username || "Unknown"}</div>
            {typing && <div className="text-xs text-star-400">typing...</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={suggestStarter} disabled={generatingStarter} className="p-2 hover:bg-white/5 rounded-full text-star-400" title="AI starter">
            {generatingStarter ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </button>
          <button onClick={report} className="p-2 hover:bg-white/5 rounded-full text-gray-400" title="Report">
            <ShieldAlert className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-full text-gray-400" title="Block">
            <Ban className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 ${
                  isMe ? "bg-nebula-600 text-white" : "bg-white/10 text-gray-100"
                }`}
              >
                <MessageContent msg={msg} />
                <div className={`text-[10px] mt-1 ${isMe ? "text-nebula-200" : "text-gray-500"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="p-4">
        <div className="card p-2 space-y-2">
          {pendingFile && (
            <div className="flex items-center gap-3 px-2 py-1.5 bg-white/5 rounded-lg">
              {previewUrl ? (
                <img src={previewUrl} alt="preview" className="w-12 h-12 rounded object-cover" />
              ) : (
                <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                  <MediaIcon mime={pendingFile.type} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{pendingFile.name}</p>
                <p className="text-xs text-gray-400">{(pendingFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button type="button" onClick={clearFile} className="p-1 hover:bg-white/10 rounded">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:bg-white/5 rounded-full"
              title="Attach photo, video or voice"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              type="text"
              value={input}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder={pendingFile ? "Add a caption..." : "Type a message..."}
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none px-3"
            />
            <button
              type="submit"
              disabled={sending || (!input.trim() && !pendingFile)}
              className="btn-primary p-2.5"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function MessageContent({ msg }: { msg: ChatMessageType }) {
  if (msg.type === "image" && msg.mediaUrl) {
    return (
      <a href={msg.mediaUrl} target="_blank" rel="noreferrer">
        <img src={msg.mediaUrl} alt="shared" className="max-w-full max-h-64 rounded-lg object-cover mb-1" />
      </a>
    );
  }
  if (msg.type === "video" && msg.mediaUrl) {
    return (
      <video controls className="max-w-full max-h-64 rounded-lg mb-1">
        <source src={msg.mediaUrl} />
      </video>
    );
  }
  if ((msg.type === "audio" || msg.type === "file") && msg.mediaUrl) {
    return (
      <div className="flex items-center gap-2 mb-1">
        <audio controls src={msg.mediaUrl} className="max-w-full" />
      </div>
    );
  }
  return <p className="whitespace-pre-wrap">{msg.content}</p>;
}

function MediaIcon({ mime }: { mime: string }) {
  if (mime.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-gray-300" />;
  if (mime.startsWith("video/")) return <Play className="w-5 h-5 text-gray-300" />;
  if (mime.startsWith("audio/")) return <Pause className="w-5 h-5 text-gray-300" />;
  return <Paperclip className="w-5 h-5 text-gray-300" />;
}
