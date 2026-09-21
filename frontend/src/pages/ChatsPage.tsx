import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { conversationsApi } from "../lib/api";
import EmptyState from "../components/EmptyState";
import Avatar from "../components/Avatar";
import { useAuth } from "../hooks/useAuth";
import { MessageCircle, Loader2 } from "lucide-react";

interface Conversation {
  id: number;
  title: string | null;
  members: { userId: number; user?: { id: number; username: string; email: string } }[];
  messages: { senderId: number; content: string; createdAt: string; read: boolean }[];
  updatedAt: string;
}

export default function ChatsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    conversationsApi
      .list()
      .then((res) => setConversations(res.data.conversations as Conversation[]))
      .finally(() => setLoading(false));
  }, []);

  const otherMember = (c: Conversation) => c.members.find((m) => m.userId !== user?.id)?.user;

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">{t("nav.chats")}</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            {t("common.loading")}
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            title="No conversations yet."
            description="When someone accepts your message, a new chat will appear here."
            icon={<MessageCircle className="w-8 h-8" />}
          />
        ) : (
          <div className="space-y-3">
            {conversations.map((c) => {
              const other = otherMember(c);
              const lastMessage = c.messages[0];
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/chats/${c.id}`)}
                  className="w-full card p-4 flex items-center gap-4 text-left hover:border-white/20 transition"
                >
                  <Avatar name={other?.username || "?"} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white">{other?.username || "Unknown"}</div>
                    <div className="text-sm text-gray-400 truncate">{lastMessage?.content || "No messages yet"}</div>
                  </div>
                  <div className="text-xs text-gray-500">{lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
