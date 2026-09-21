import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { stardustApi } from "../lib/api";
import { Sparkles, Star, Gift, CheckCircle2, Loader2, Clock, AlertCircle } from "lucide-react";
import Alert from "../components/Alert";

interface Mission {
  id: number;
  key: string;
  title: string;
  description: string | null;
  reward: number;
  progress: number;
  completed: boolean;
}

interface Transaction {
  id: number;
  type: "credit" | "debit";
  amount: number;
  source: string;
  createdAt: string;
}

export default function RewardsPage() {
  const { t } = useTranslation();
  const [balance, setBalance] = useState(0);
  const [streak, setStreak] = useState(0);
  const [claimedToday, setClaimedToday] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const [balanceRes, missionsRes, txRes] = await Promise.all([
        stardustApi.balance(),
        stardustApi.missions(),
        stardustApi.transactions(),
      ]);
      const txs = (txRes.data.transactions || []) as Transaction[];
      setBalance(balanceRes.data.balance);
      setMissions((missionsRes.data.missions as Mission[]) || []);
      setTransactions(txs);

      // Infer streak from latest daily transaction
      const latestDaily = txs.find((tx) => tx.source === "daily_reward");
      if (latestDaily) {
        const lastClaim = new Date(latestDaily.createdAt);
        const now = new Date();
        const isSameDay =
          lastClaim.getFullYear() === now.getFullYear() &&
          lastClaim.getMonth() === now.getMonth() &&
          lastClaim.getDate() === now.getDate();
        setClaimedToday(isSameDay);
        try {
          const meta = JSON.parse((latestDaily as unknown as { metadata?: string }).metadata || "{}");
          setStreak(meta.streak || 0);
        } catch {
          setStreak(0);
        }
      }
    } catch (err) {
      console.error(err);
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleClaim = async () => {
    setClaiming(true);
    setError("");
    setMessage("");
    try {
      const { data } = await stardustApi.claimDaily();
      setBalance(data.balance);
      setStreak(data.streak);
      setClaimedToday(true);
      setMessage(`+${data.amount} Stardust! Streak: ${data.streak} days`);
      const txRes = await stardustApi.transactions();
      setTransactions(txRes.data.transactions as Transaction[]);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    } finally {
      setClaiming(false);
    }
  };

  const completeMission = async (key: string) => {
    try {
      const { data } = await stardustApi.completeMission(key);
      setBalance(data.balance);
      setMessage(`+${data.reward} Stardust!`);
      await load();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card p-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-star-300 text-sm font-medium mb-4">
            <Star className="w-4 h-4" />
            {balance.toLocaleString()} {t("space.stardust")}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Rewards</h1>
          <p className="text-gray-400">Collect Stardust daily and complete missions.</p>
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {message && <Alert type="success">{message}</Alert>}

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-star-500/10 text-star-400">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Daily Reward</h2>
                <p className="text-sm text-gray-400">Come back every day to build your streak.</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-star-300">{streak}</div>
              <div className="text-xs text-gray-500">day streak</div>
            </div>
          </div>

          <button
            onClick={handleClaim}
            disabled={claimedToday || claiming}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {claiming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Claiming...
              </>
            ) : claimedToday ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Claimed today
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Claim Daily Reward
              </>
            )}
          </button>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">Daily Missions</h2>
          <div className="space-y-3">
            {missions.length === 0 && (
              <p className="text-gray-500 text-sm">No active missions today.</p>
            )}
            {missions.map((mission) => (
              <div
                key={mission.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
              >
                <div>
                  <p className="text-sm font-medium text-white">{mission.title}</p>
                  <p className="text-xs text-gray-500">+{mission.reward} Stardust</p>
                </div>
                {mission.completed ? (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Done
                  </span>
                ) : (
                  <button
                    onClick={() => completeMission(mission.key)}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Complete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">Recent Transactions</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {transactions.length === 0 && (
              <p className="text-gray-500 text-sm">No transactions yet.</p>
            )}
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-lg ${
                      tx.type === "credit" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {tx.type === "credit" ? <Sparkles className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white capitalize">{tx.source.replace(/_/g, " ")}</p>
                    <p className="text-xs text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${tx.type === "credit" ? "text-green-400" : "text-red-400"}`}>
                  {tx.type === "credit" ? "+" : "-"}
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
