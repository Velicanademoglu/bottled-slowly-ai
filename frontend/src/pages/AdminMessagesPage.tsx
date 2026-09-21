import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "../lib/api";
import Alert from "../components/Alert";
import { Loader2, MessageSquare, Rocket, ChevronDown, ChevronUp } from "lucide-react";

interface SpaceMessage {
  id: number;
  senderId: number;
  content: string;
  vesselKey: string;
  status: string;
  createdAt: string;
  sender: { username: string };
}

interface ChatConversation {
  id: number;
  title: string | null;
  members: { userId: number }[];
  messages: { senderId: number; content: string; createdAt: string }[];
}

export default function AdminMessagesPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"space" | "chats">("space");
  const [spaceMessages, setSpaceMessages] = useState<SpaceMessage[]>([]);
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedChat, setExpandedChat] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [spaceRes, chatsRes] = await Promise.all([adminApi.spaceMessages(), adminApi.chats()]);
        setSpaceMessages(spaceRes.data.messages as SpaceMessage[]);
        setChats(chatsRes.data.conversations as ChatConversation[]);
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || t("common.error"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Message Review</h1>
          <div className="flex bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("space")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "space" ? "bg-star-400/10 text-star-300" : "text-gray-400 hover:text-white"
              }`}
            >
              Space
            </button>
            <button
              onClick={() => setActiveTab("chats")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "chats" ? "bg-star-400/10 text-star-300" : "text-gray-400 hover:text-white"
              }`}
            >
              Chats
            </button>
          </div>
        </div>

        {error && <Alert type="error" className="mb-5">{error}</Alert>}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            {t("common.loading")}
          </div>
        ) : activeTab === "space" ? (
          <div className="space-y-4">
            {spaceMessages.length === 0 ? (
              <div className="card p-8 text-center text-gray-400">No space messages yet.</div>
            ) : (
              spaceMessages.map((msg) => (
                <div key={msg.id} className="card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Rocket className="w-5 h-5 text-star-400" />
                    <span className="font-semibold text-white">{msg.sender.username}</span>
                    <span className="text-xs text-gray-500">{msg.vesselKey} • {msg.status}</span>
                  </div>
                  <p className="text-gray-300 bg-white/5 rounded-xl p-4">{msg.content}</p>
                  <div className="text-xs text-gray-500 mt-3">{new Date(msg.createdAt).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {chats.length === 0 ? (
              <div className="card p-8 text-center text-gray-400">No chat conversations yet.</div>
            ) : (
              chats.map((chat) => (
                <div key={chat.id} className="card p-5">
                  <button
                    onClick={() => setExpandedChat(expandedChat === chat.id ? null : chat.id)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-cosmic-400" />
                      <span className="font-semibold text-white">{chat.title || `Conversation #${chat.id}`}</span>
                      <span className="text-xs text-gray-500">{chat.members.length} members • {chat.messages.length} messages</span>
                    </div>
                    {expandedChat === chat.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedChat === chat.id && (
                    <div className="mt-4 space-y-3">
                      {[...chat.messages].reverse().map((m, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-star-300">User {m.senderId}</span>
                            <span className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-gray-300">{m.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
