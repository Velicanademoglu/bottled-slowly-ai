import { useState } from "react";
import { aiApi } from "../api";

interface Props {
  onSelect: (starter: string) => void;
}

export default function AIStarterButton({ onSelect }: Props) {
  const [starter, setStarter] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchStarter = async () => {
    setLoading(true);
    try {
      const { data } = await aiApi.starter();
      setStarter(data.starter);
    } catch {
      setStarter("Yeni bir konuşma başlatmak için hazırım.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-ocean-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-ocean-800">AI Konuşma Başlatıcı</h3>
        <button
          onClick={fetchStarter}
          disabled={loading}
          className="text-sm px-3 py-1.5 bg-ocean-600 text-white rounded hover:bg-ocean-500 disabled:opacity-60 transition"
        >
          {loading ? "Düşünüyor..." : "Yeni öneri al"}
        </button>
      </div>
      {starter && (
        <button
          onClick={() => onSelect(starter)}
          className="w-full text-left p-3 bg-ocean-50 hover:bg-ocean-100 rounded-lg text-ocean-900 transition"
        >
          <span className="text-xs text-ocean-600 block mb-1">Başlatmak için tıkla</span>
          {starter}
        </button>
      )}
    </div>
  );
}
