import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi, setAuthToken } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useBrandConfig } from "../hooks/useBrandConfig";
import Alert from "../components/Alert";
import { Mail, Lock, User, Loader2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const { t } = useTranslation();
  const { name } = useBrandConfig();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.register(email, username, password);
      setAuthToken(data.token);
      login(data.user, data.token);
      navigate("/onboarding");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string | { formErrors?: string[]; fieldErrors?: Record<string, string[]> } } } };
      const raw = axiosErr.response?.data?.error;
      let msg = t("common.error");
      if (typeof raw === "string") msg = raw;
      else if (raw?.formErrors?.length) msg = raw.formErrors.join(", ");
      else if (raw?.fieldErrors) {
        msg = Object.values(raw.fieldErrors)
          .flat()
          .join(", ");
      }
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
            <h2 className="text-3xl font-bold text-white mb-2">{t("auth.register")}</h2>
            <p className="text-gray-400">{t("slogan")}</p>
          </div>

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
              <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("auth.username")}
                className="input-field pl-12"
                required
                minLength={2}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.password")}
                className="input-field pl-12"
                required
                minLength={8}
              />
            </div>

            <div className="flex items-start gap-2 text-xs text-gray-500">
              <ShieldCheck className="w-4 h-4 mt-0.5 text-cosmic-500" />
              <span>{t("auth.passwordHint")}</span>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  {t("auth.register")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            {t("auth.hasAccount")}{" "}
            <Link to="/login" className="font-semibold text-star-400 hover:text-star-300">
              {t("auth.login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
