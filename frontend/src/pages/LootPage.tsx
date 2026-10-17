import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Lock } from "lucide-react";
import { stardustApi } from "../lib/api";

interface LootItem {
  key: string;
  emoji: string;
  nameTr: string;
  nameEn: string;
  unlockAtClaims: number;
  perCycle: number;
}

const LOOT_CATALOG: LootItem[] = [
  { key: "pearl", emoji: "🦪", nameTr: "İnci", nameEn: "Pearl", unlockAtClaims: 1, perCycle: 1 },
  { key: "whistle", emoji: "📯", nameTr: "Düdük", nameEn: "Whistle", unlockAtClaims: 2, perCycle: 1 },
  { key: "beer", emoji: "🍺", nameTr: "Bira", nameEn: "Beer", unlockAtClaims: 3, perCycle: 1 },
  { key: "compass", emoji: "🧭", nameTr: "Pusula", nameEn: "Compass", unlockAtClaims: 5, perCycle: 2 },
  { key: "starfish", emoji: "⭐", nameTr: "Deniz Yıldızı", nameEn: "Starfish", unlockAtClaims: 6, perCycle: 1 },
  { key: "crown", emoji: "👑", nameTr: "Kral Tacı", nameEn: "Crown", unlockAtClaims: 8, perCycle: 1 },
  { key: "telescope", emoji: "🔭", nameTr: "Teleskop", nameEn: "Telescope", unlockAtClaims: 10, perCycle: 1 },
  { key: "diamond", emoji: "💎", nameTr: "Elmas", nameEn: "Diamond", unlockAtClaims: 12, perCycle: 1 },
  { key: "parrot", emoji: "🦜", nameTr: "Papağan", nameEn: "Parrot", unlockAtClaims: 15, perCycle: 1 },
  { key: "gold", emoji: "🪙", nameTr: "Külçe Altın", nameEn: "Gold Bar", unlockAtClaims: 17, perCycle: 2 },
  { key: "kraken", emoji: "🐙", nameTr: "Kraken", nameEn: "Kraken", unlockAtClaims: 20, perCycle: 1 },
  { key: "chest", emoji: "🗝️", nameTr: "Hazine Sandığı", nameEn: "Treasure Chest", unlockAtClaims: 25, perCycle: 1 },
];

function computeLoot(totalClaims: number) {
  const cycleLength = 20;
  const fullCycles = Math.floor(totalClaims / cycleLength);
  const inCycle = totalClaims % cycleLength;

  return LOOT_CATALOG.map((item) => {
    let count = 0;
    if (fullCycles > 0 && item.unlockAtClaims <= cycleLength) {
      count += fullCycles * item.perCycle;
    }
    if (inCycle >= item.unlockAtClaims) {
      count += item.perCycle;
    }
    return { ...item, count, unlocked: totalClaims >= item.unlockAtClaims };
  });
}

export default function LootPage() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<ReturnType<typeof computeLoot>>([]);
  const [totalClaims, setTotalClaims] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stardustApi
      .transactions()
      .then((res) => {
        const txs = res.data.transactions as { source: string }[];
        const claims = txs.filter((tx) => tx.source === "daily_reward").length;
        setTotalClaims(claims);
        setItems(computeLoot(claims));
      })
      .catch(() => setItems(computeLoot(0)))
      .finally(() => setLoading(false));
  }, []);

  const isTr = i18n.language.startsWith("tr");

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8 pb-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gradient mb-2 flex items-center gap-2">
          ⚓ {t("loot.title")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{t("loot.subtitle")}</p>

        <div className="card p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item) => (
              <div
                key={item.key}
                className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition ${
                  item.unlocked
                    ? "bg-ocean-50 dark:bg-white/5 border-ocean-200 dark:border-white/10"
                    : "bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/5 opacity-50"
                }`}
              >
                {item.count > 0 && (
                  <span className="absolute top-2 right-2 text-xs font-bold px-1.5 py-0.5 rounded-md bg-sea-500/15 text-sea-600 dark:text-sea-300">
                    × {item.count}
                  </span>
                )}
                <span className="text-4xl mb-2">{item.unlocked ? item.emoji : <Lock className="w-8 h-8 text-gray-400" />}</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-white text-center">
                  {isTr ? item.nameTr : item.nameEn}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.unlocked ? `${item.count} ${t("loot.owned")}` : `${t("streak.day")} ${item.unlockAtClaims} · ${t("loot.locked")}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {totalClaims === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-6 text-sm">{t("loot.empty")}</p>
        )}
      </div>
    </div>
  );
}
