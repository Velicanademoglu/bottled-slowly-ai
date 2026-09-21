import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useBrandConfig } from "../hooks/useBrandConfig";
import { useAuth } from "../hooks/useAuth";
import { stardustApi } from "../lib/api";
import WelcomeTour from "../components/WelcomeTour";
import { Sparkles, Send, Star, Shield } from "lucide-react";

export default function SpacePage() {
  const { t } = useTranslation();
  const { name } = useBrandConfig();
  const { user } = useAuth();
  const [stardust, setStardust] = useState(user?.stardustBalance ?? 0);
  const privileged = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MODERATOR";

  useEffect(() => {
    if (!user) return;
    stardustApi
      .balance()
      .then((res) => setStardust(res.data.balance))
      .catch(() => setStardust(user.stardustBalance ?? 0));
  }, [user]);

  return (
    <>
      <WelcomeTour />
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="max-w-xl w-full animate-slide-up">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-star-400" />
            <span className="text-2xl font-bold text-gradient">{name}</span>
          </div>

          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-star-300 text-sm font-medium">
              <Star className="w-4 h-4" />
              {stardust.toLocaleString()}
            </div>
            {privileged && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5" />
                Admin
              </div>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t("space.homeTitle")}
          </h1>
          <p className="text-gray-400 mb-10">{t("space.createMessage")}</p>

          <Link
            to="/create"
            className="btn-primary text-lg px-8 py-4 inline-flex"
          >
            <Send className="w-5 h-5" />
            {t("space.castIntoSpace")}
          </Link>
        </div>
      </div>
    </>
  );
}
