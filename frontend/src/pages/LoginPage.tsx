import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi, setAuthToken } from "../lib/api";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useBrandConfig } from "../hooks/useBrandConfig";
import Alert from "../components/Alert";
import { Mail, Lock, Loader2, ArrowRight, Sparkles, Eye, EyeOff, Wifi, WifiOff } from "lucide-react";

export default function LoginPage() {
  const { t } = useTranslation();
  const { name } = useBrandConfig();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [conn, setConn] = useState<{ ok: boolean; msg: string } | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    api
      .get("/health")
      .then(() => setConn({ ok: true, msg: `Backend reachable (${apiUrl})` }))
      .catch((err: { message?: string }) => setConn({ ok: false, msg: err.message || "Cannot reach backend" }));
  }, [apiUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      setAuthToken(data.token);
      login(data.user, data.token);
      navigate(data.user.profile?.onboardingCompleted ? "/space" : "/onboarding");
    } catch (err: unknown) {
      const axiosErr = err as { message?: string; response?: { data?: { error?: string | { formErrors?: string[]; fieldErrors?: Record<string, string[]> } } } };
      const raw = axiosErr.response?.data?.error;
      let msg = t("common.error");
      if (typeof raw === "string") msg = raw;
      else if (raw?.formErrors?.length) msg = raw.formErrors.join(", ");
      else if (axiosErr.message) msg = axiosErr.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-star-400" />
              <span className="text-xl font-bold text-gradient">{name}</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{t("auth.login")}</h2>
            <p className="text-gray-400">{t("slogan")}</p>
          </div>

          {conn && (
            <div className={`flex items-center gap-2 text-xs mb-4 ${conn.ok ? "text-green-400" : "text-red-400"}`}>
              {conn.ok ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{conn.msg}</span>
            </div>
          )}

          {error && <Alert type="error" className="mb-5">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.email")}
                className="input-field pl-12"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.password")}
                className="input-field pl-12 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-3.5 text-gray-500 hover:text-gray-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-cosmic-400 hover:text-cosmic-300">
                {t("auth.forgotPassword")}
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  {t("auth.login")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            {t("auth.noAccount")}{" "}
            <Link to="/register" className="font-semibold text-star-400 hover:text-star-300">
              {t("auth.register")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
