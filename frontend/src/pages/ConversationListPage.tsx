import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { aiApi, conversationApi } from "../api";
import AIStarterButton from "../components/AIStarterButton";
import type { Conversation } from "../types";

export default function ConversationListPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    try {
      const { data } = await conversationApi.list();
      setConversations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await conversationApi.create(newTitle || undefined);
    setNewTitle("");
    navigate(`/conversation/${data.id}`);
  };

  const createFromStarter = async (starter: string) => {
    const { data } = await aiApi.createFromStarter(starter);
    navigate(`/conversation/${data.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <AIStarterButton onSelect={createFromStarter} />

      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-lg font-semibold text-ocean-900 mb-3">Yeni Konuşma</h2>
        <form onSubmit={createConversation} className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Konuşma başlığı (opsiyonel)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-500 transition"
          >
            Oluştur
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <h2 className="text-lg font-semibold text-ocean-900 p-4 border-b">Konuşmaların</h2>
        {loading ? (
          <p className="p-6 text-gray-500">Yükleniyor...</p>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Henüz bir konuşman yok. Yukarıdan AI önerisiyle başlayabilirsin.
          </div>
        ) : (
          <ul className="divide-y">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/conversation/${c.id}`}
                  className="block p-4 hover:bg-ocean-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{c.title}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(c.updatedAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                  {c.lastMessage ? (
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {c.lastMessage.content}
                      <span className="ml-2 text-xs text-ocean-600">({c.messageCount} mesaj)</span>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 mt-1">Henüz mesaj yok</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
