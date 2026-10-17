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
  { key: "star_shard", emoji: "✨", nameTr: "Yıldız Parçası", nameEn: "Star Shard", unlockAtClaims: 1, perCycle: 1 },
  { key: "moon_dust", emoji: "🌙", nameTr: "Ay Tozu", nameEn: "Moon Dust", unlockAtClaims: 2, perCycle: 1 },
  { key: "nebula_crystal", emoji: "🔮", nameTr: "Bulutsu Kristali", nameEn: "Nebula Crystal", unlockAtClaims: 3, perCycle: 1 },
  { key: "comet_tail", emoji: "☄️", nameTr: "Kuyruklu Yıldız", nameEn: "Comet", unlockAtClaims: 5, perCycle: 2 },
  { key: "galaxy", emoji: "🌌", nameTr: "Galaksi", nameEn: "Galaxy", unlockAtClaims: 6, perCycle: 1 },
  { key: "black_hole", emoji: "🕳️", nameTr: "Kara Delik", nameEn: "Black Hole", unlockAtClaims: 8, perCycle: 1 },
  { key: "telescope", emoji: "🔭", nameTr: "Teleskop", nameEn: "Telescope", unlockAtClaims: 10, perCycle: 1 },
  { key: "alien", emoji: "👽", nameTr: "Uzaylı", nameEn: "Alien", unlockAtClaims: 12, perCycle: 1 },
  { key: "rocket", emoji: "🚀", nameTr: "Roket", nameEn: "Rocket", unlockAtClaims: 15, perCycle: 1 },
  { key: "planet", emoji: "🪐", nameTr: "Gezegen", nameEn: "Planet", unlockAtClaims: 17, perCycle: 2 },
  { key: "supernova", emoji: "💥", nameTr: "Süpernova", nameEn: "Supernova", unlockAtClaims: 20, perCycle: 1 },
  { key: "infinite", emoji: "♾️", nameTr: "Sonsuzluk", nameEn: "Infinity", unlockAtClaims: 25, perCycle: 1 },
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
          ✨ {t("loot.title")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{t("loot.subtitle")}</p>

        <div className="card p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item) => (
              <div
                key={item.key}
                className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition ${
                  item.unlocked
                    ? "bg-nebula-500/10 dark:bg-white/5 border-nebula-500/20 dark:border-white/10"
                    : "bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/5 opacity-50"
                }`}
              >
                {item.count > 0 && (
                  <span className="absolute top-2 right-2 text-xs font-bold px-1.5 py-0.5 rounded-md bg-green-500/15 text-green-600 dark:text-green-400">
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
