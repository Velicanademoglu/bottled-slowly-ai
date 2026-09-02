import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { conversationApi, messageApi } from "../api";
import MessageBubble from "../components/MessageBubble";
import type { Conversation, Message } from "../types";

const DELAY_OPTIONS = [1, 5, 15, 30, 60, 120, 240, 480, 1440];

export default function ConversationPage() {
  const { id } = useParams();
  const conversationId = Number(id);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [delay, setDelay] = useState(60);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const [convRes, msgRes] = await Promise.all([
        conversationApi.get(conversationId),
        messageApi.list(conversationId),
      ]);
      setConversation(convRes.data);
      setMessages(msgRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (Number.isNaN(conversationId)) return;
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      await messageApi.send(conversationId, content.trim(), delay);
      setContent("");
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (Number.isNaN(conversationId)) {
    return <div className="p-6">Geçersiz konuşma</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 h-[calc(100vh-64px)] flex flex-col">
      <div className="py-4 border-b">
        <h1 className="text-xl font-semibold text-ocean-900">{conversation?.title || "Konuşma"}</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="py-4 border-t space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <label htmlFor="delay">Teslim süresi:</label>
          <select
            id="delay"
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded"
          >
            {DELAY_OPTIONS.map((min) => (
              <option key={min} value={min}>
                {min < 60 ? `${min} dk` : `${Math.floor(min / 60)} sa${min > 60 ? "at" : "at"}`}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Mesajını yaz..."
            rows={2}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 outline-none resize-none"
          />
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="px-5 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-500 disabled:opacity-60 transition self-end"
          >
            {sending ? "..." : "Gönder"}
          </button>
        </div>
      </form>
    </div>
  );
}
