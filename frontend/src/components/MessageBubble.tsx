import type { Message } from "../types";
import { Send, Truck, CheckCircle2 } from "lucide-react";

interface Props {
  message: Message;
}

function statusMeta(status: Message["status"]) {
  switch (status) {
    case "PENDING":
      return { label: "Şişede", color: "bg-amber-100 text-amber-700", icon: <Send className="w-3 h-3" /> };
    case "IN_TRANSIT":
      return { label: "Yolda", color: "bg-sky-100 text-sky-700 animate-pulse-soft", icon: <Truck className="w-3 h-3" /> };
    case "DELIVERED":
      return { label: "Ulaştı", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-3 h-3" /> };
  }
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.senderType === "USER";
  const meta = statusMeta(message.status);
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-soft ${
          isUser
            ? "bg-gradient-to-br from-ocean-500 to-lavender-500 text-white rounded-br-none"
            : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <div className={`mt-2 flex items-center justify-end gap-2 text-[11px] ${isUser ? "text-white/80" : "text-gray-500"}`}>
          <span>{new Date(message.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${meta.color}`}>
            {meta.icon}
            {meta.label}
          </span>
        </div>
      </div>
    </div>
  );
}
