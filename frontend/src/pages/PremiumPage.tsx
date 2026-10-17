import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Phone, Video, Crown, Loader2, Check, ArrowLeft } from "lucide-react";
import { iapApi, stardustApi } from "../lib/api";
import Alert from "../components/Alert";

interface TierStatus {
  premium: boolean;
  voice: boolean;
  video: boolean;
  voiceExpiresAt: string | null;
  videoExpiresAt: string | null;
  premiumExpiresAt: string | null;
}

export default function PremiumPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<TierStatus | null>(null);
  const [balance, setBalance] = useState(0);
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const [st, bal] = await Promise.all([iapApi.status(), stardustApi.balance()]);
      setStatus(st.data);
      setBalance(bal.data.balance);
    } catch {
      setError(t("common.error"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const subscribe = async (tier: "voice" | "video" | "all") => {
    setError("");
    setMessage("");
    setBuying(tier);
    try {
      await iapApi.subscribeStardust(tier);
      setMessage(t("premium.subscribed"));
      await load();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string } } };
      if (axiosErr.response?.status === 402) {
        setError(t("premium.needStardust"));
      } else {
        setError(t("common.error"));
      }
    } finally {
      setBuying(null);
    }
  };

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(i18n.language?.startsWith("tr") ? "tr-TR" : "en-US") : "";

  const tiers = [
    {
      key: "voice" as const,
      icon: Phone,
      price: "$5",
      stardust: 300,
      title: t("premium.voiceTierTitle"),
      features: [t("premium.featVoiceUnlimited"), t("premium.featCancelAnytime")],
      active: status?.voice,
      accent: "from-emerald-500/20 to-emerald-900/10 border-emerald-500/40",
    },
    {
      key: "video" as const,
      icon: Video,
      price: "$15",
      stardust: 900,
      title: t("premium.videoTierTitle"),
      features: [t("premium.featVideoUnlimited"), t("premium.featVoiceIncluded"), t("premium.featCancelAnytime")],
      active: status?.video,
      accent: "from-fuchsia-500/20 to-fuchsia-900/10 border-fuchsia-500/40",
      popular: true,
    },
    {
      key: "all" as const,
      icon: Crown,
      price: "$25",
      stardust: 1200,
      title: t("premium.allTierTitle"),
      features: [t("premium.featAllCalls"), t("premium.featBadge"), t("premium.featPriority"), t("premium.featCancelAnytime")],
      active: status?.premium,
      accent: "from-amber-500/20 to-amber-900/10 border-amber-500/40",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-space-950 via-space-900 to-space-950 text-white pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4">
          <ArrowLeft className="w-5 h-5" /> {t("common.back")}
        </button>

        <div className="text-center mb-8">
          <Crown className="w-12 h-12 mx-auto text-amber-400 mb-3" />
          <h1 className="text-2xl font-bold">{t("premium.pageTitle")}</h1>
          <p className="text-gray-400 text-sm mt-2">{t("premium.pageSubtitle")}</p>
          <p className="text-sm text-star-400 mt-1">
            {t("common.balance")}: {balance} {t("space.stardust")}
          </p>
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {message && <Alert type="success">{message}</Alert>}

        <div className="space-y-4">
          {tiers.map((tier) => (
            <div
              key={tier.key}
              className={`relative rounded-3xl border bg-gradient-to-br p-5 ${tier.accent}`}
            >
              {tier.popular && (
                <span className="absolute -top-3 right-5 bg-fuchsia-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {t("premium.popular")}
                </span>
              )}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <tier.icon className="w-8 h-8 text-white" />
                  <div>
                    <h2 className="font-bold text-lg">{tier.title}</h2>
                    <p className="text-sm text-gray-300">
                      {tier.price}/ {t("common.month")}
                    </p>
                  </div>
                </div>
                {tier.active && (
                  <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                    <Check className="w-3.5 h-3.5" /> {t("premium.active")}
                  </span>
                )}
              </div>
              <ul className="mt-4 space-y-1.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {tier.active ? (
                <p className="mt-4 text-xs text-emerald-300">
                  {t("premium.renewsUntil")} {fmt(status?.[tier.key === "voice" ? "voiceExpiresAt" : tier.key === "video" ? "videoExpiresAt" : "premiumExpiresAt"] ?? null)}
                </p>
              ) : (
                <button
                  onClick={() => subscribe(tier.key)}
                  disabled={buying !== null}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                >
                  {buying === tier.key ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>{tier.stardust} {t("space.stardust")} · {t("premium.subscribe")}</>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">{t("premium.stardustNote")}</p>
      </div>
    </div>
  );
}
