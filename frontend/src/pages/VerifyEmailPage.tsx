import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "../lib/api";
import Alert from "../components/Alert";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Missing verification token.");
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || t("common.error"));
        setStatus("error");
      });
  }, [token, t]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="card p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t("auth.verifyEmail")}</h2>

          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-star-400" />
              <span>Verifying your email...</span>
            </div>
          )}

          {status === "success" && (
            <Alert type="success" className="text-left">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Email verified. You can now log in.
              </div>
            </Alert>
          )}

          {status === "error" && (
            <Alert type="error" className="text-left">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                {error}
              </div>
            </Alert>
          )}

          <div className="mt-6">
            <Link to="/login" className="btn-primary inline-flex">
              {t("auth.login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
