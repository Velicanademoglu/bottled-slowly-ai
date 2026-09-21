import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "../lib/api";
import Alert from "../components/Alert";
import { Mail, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">{t("auth.forgotPassword")}</h2>
            <p className="text-gray-400">{sent ? t("auth.checkEmail") : t("auth.sendResetLink")}</p>
          </div>

          {sent ? (
            <Alert type="success" className="mb-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {t("auth.checkEmail")}
              </div>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert type="error" className="mb-5">{error}</Alert>}
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
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  <>
                    {t("auth.sendResetLink")}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-400">
            <Link to="/login" className="font-semibold text-star-400 hover:text-star-300">
              {t("auth.hasAccount")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
