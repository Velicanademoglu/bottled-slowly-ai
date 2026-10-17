import { useTranslation } from "react-i18next";
import { Flame, Check, Loader2 } from "lucide-react";

interface DayReward {
  day: number;
  emoji: string;
  count: number;
}

const REWARDS: DayReward[] = [
  { day: 1, emoji: "✨", count: 1 },
  { day: 2, emoji: "🌟", count: 1 },
  { day: 3, emoji: "💫", count: 1 },
  { day: 4, emoji: "⭐", count: 2 },
  { day: 5, emoji: "🌠", count: 1 },
  { day: 6, emoji: "✨", count: 1 },
  { day: 7, emoji: "🌟", count: 1 },
  { day: 8, emoji: "💎", count: 1 },
  { day: 9, emoji: "⭐", count: 4 },
  { day: 10, emoji: "🌠", count: 1 },
  { day: 11, emoji: "✨", count: 1 },
  { day: 12, emoji: "🌟", count: 1 },
  { day: 13, emoji: "🔭", count: 1 },
  { day: 14, emoji: "⭐", count: 6 },
  { day: 15, emoji: "🌠", count: 1 },
  { day: 16, emoji: "✨", count: 5 },
  { day: 17, emoji: "🌟", count: 1 },
  { day: 18, emoji: "💫", count: 1 },
  { day: 19, emoji: "🌌", count: 10 },
  { day: 20, emoji: "🌠", count: 1 },
];

interface Props {
  streak: number;
  claimedToday: boolean;
  claiming: boolean;
  onClaim: () => void;
}

export default function StreakCalendar({ streak, claimedToday, claiming, onClaim }: Props) {
  const { t } = useTranslation();

  const cyclePosition = streak % 20 === 0 && streak > 0 ? 20 : streak % 20;
  const todayIndex = claimedToday ? cyclePosition : Math.min(cyclePosition + 1, 20);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-nebula-500/20 to-nebula-700/30 border-b border-white/5 px-4 py-5 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="relative">
            <Flame className="w-12 h-12 text-star-400 drop-shadow-lg" fill="currentColor" />
            <span className="absolute inset-0 flex items-center justify-center pt-2 text-xl font-black text-white drop-shadow">
              {streak}
            </span>
          </div>
        </div>
        <p className="text-gray-900 dark:text-white font-bold text-lg">{t("streak.title")}</p>
      </div>

      {/* Reward grid */}
      <div className="bg-gray-50 dark:bg-white/5 p-3">
        <div className="grid grid-cols-5 gap-1.5">
          {REWARDS.map((reward) => {
            const isPast = reward.day < todayIndex;
            const isToday = reward.day === todayIndex;
            const isFuture = reward.day > todayIndex;
            return (
              <div
                key={reward.day}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition ${
                  isToday
                    ? "bg-white dark:bg-white/10 border-star-500 shadow-md"
                    : isPast
                    ? "bg-gray-100/60 dark:bg-white/5 border-transparent"
                    : "bg-gray-100/30 dark:bg-white/[0.03] border-transparent"
                }`}
              >
                <span className={`absolute top-1 left-1.5 text-xs font-bold ${isFuture ? "text-gray-400 dark:text-gray-500" : "text-nebula-600 dark:text-nebula-400"}`}>
                  {reward.day}
                </span>
                <span className={`text-2xl ${isFuture ? "grayscale opacity-40" : ""}`}>{reward.emoji}</span>
                <span className={`text-[10px] font-semibold ${isFuture ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-300"}`}>
                  × {reward.count}
                </span>
                {isPast && (
                  <span className="absolute bottom-1 right-1 text-green-600 dark:text-green-400">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onClaim}
          disabled={claimedToday || claiming}
          className="mt-3 w-full py-3 rounded-2xl bg-gradient-to-r from-star-500 to-star-600 hover:from-star-400 hover:to-star-500 text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {claiming ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : claimedToday ? (
            <>
              <Check className="w-5 h-5" />
              {t("streak.claimed")}
            </>
          ) : (
            t("streak.claim")
          )}
        </button>
      </div>
    </div>
  );
}
