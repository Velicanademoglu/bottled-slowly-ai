import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { messagesApi } from "../lib/api";
import Alert from "../components/Alert";
import { Send, Loader2, ArrowLeft } from "lucide-react";

const VESSELS = [
  { id: "PARCHMENT", name: "Parchment", locked: false },
  { id: "HEART", name: "Heart", locked: false },
  { id: "CAPSULE", name: "Basic Capsule", locked: false },
  { id: "STAR", name: "Star Message", locked: false },
  { id: "CRYSTAL_HEART", name: "Crystal Heart", locked: true },
  { id: "GALAXY_CAPSULE", name: "Galaxy Capsule", locked: true },
  { id: "GOLDEN_LETTER", name: "Golden Letter", locked: true },
];

export default function CreateMessagePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [vessel, setVessel] = useState("PARCHMENT");
  const [casting, setCasting] = useState(false);
  const [cast, setCast] = useState(false);
  const [castJourneyId, setCastJourneyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const handleCast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setCasting(true);
    setError("");
    try {
      const { data: created } = await messagesApi.create(text, vessel);
      const { data: castResult } = await messagesApi.cast(created.id);
      setCastJourneyId(castResult.journey?.id || null);
      setCast(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    } finally {
      setCasting(false);
    }
  };

  if (cast) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-12 text-center pb-24">
        <div className="max-w-md animate-slide-up">
          <div className="text-6xl mb-6 animate-float">🚀</div>
          <h2 className="text-2xl font-bold text-white mb-3">Your message is now traveling through the universe.</h2>
          <p className="text-gray-400 mb-8">You will be notified when someone discovers it.</p>
          <button
            onClick={() => navigate(castJourneyId ? `/discoveries?tab=traveling` : `/discoveries?tab=traveling`)}
            className="btn-primary"
          >
            Track Journey
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-12">
      <div className="max-w-2xl mx-auto animate-slide-up">
        <button onClick={() => navigate(-1)} className="btn-ghost mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Create a message</h1>
          <p className="text-gray-400 mb-6">Write something meaningful and cast it into space.</p>

          {error && <Alert type="error" className="mb-5">{error}</Alert>}

          <form onSubmit={handleCast} className="space-y-6">
            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 1000))}
                placeholder="What do you want to send into the universe?"
                rows={5}
                className="input-field resize-none"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 text-right mt-1">{text.length}/1000</p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-3">Choose a vessel</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {VESSELS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    disabled={v.locked}
                    onClick={() => setVessel(v.id)}
                    className={`px-4 py-3 rounded-2xl border text-sm font-medium transition ${
                      vessel === v.id
                        ? "border-star-400 bg-star-400/10 text-white"
                        : v.locked
                        ? "border-white/5 text-gray-600 cursor-not-allowed"
                        : "border-white/10 text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    {v.name}
                    {v.locked && <span className="ml-1">🔒</span>}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={casting || !text.trim()} className="btn-primary w-full">
              {casting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Casting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t("space.castIntoSpace")}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
