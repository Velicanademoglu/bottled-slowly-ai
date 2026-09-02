import type { Message } from "../types";

interface Props {
  message: Message;
}

function statusLabel(status: Message["status"]) {
  switch (status) {
    case "PENDING":
      return "Gönderildi";
    case "IN_TRANSIT":
      return "Yolda";
    case "DELIVERED":
      return "Ulaştı";
    default:
      return status;
  }
}

function statusColor(status: Message["status"]) {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-800";
    case "IN_TRANSIT":
      return "bg-blue-100 text-blue-800 animate-pulse-soft";
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-800";
  }
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.senderType === "USER";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${
          isUser ? "bg-ocean-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <div className={`mt-2 flex items-center justify-end gap-2 text-[10px] ${isUser ? "text-ocean-100" : "text-gray-500"}`}>
          <span>{new Date(message.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
          <span className={`px-1.5 py-0.5 rounded-full ${statusColor(message.status)}`}>
            {statusLabel(message.status)}
          </span>
        </div>
      </div>
    </div>
  );
}
