import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBrandConfig } from "../hooks/useBrandConfig";
import { Sparkles, Send, Compass, User, X } from "lucide-react";

const STORAGE_KEY = "projectstar_tour_seen";

export default function WelcomeTour() {
  const { t } = useTranslation();
  const { name } = useBrandConfig();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setOpen(true);
    }
  }, []);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const steps = [
    {
      icon: <Sparkles className="w-8 h-8 text-star-400" />,
      title: t("tour.welcomeTitle").replace("{appName}", name),
      text: t("tour.welcomeText"),
    },
    {
      icon: <Send className="w-8 h-8 text-star-400" />,
      title: t("space.castIntoSpace"),
      text: t("tour.stepSpace"),
    },
    {
      icon: <Compass className="w-8 h-8 text-star-400" />,
      title: t("nav.discoveries"),
      text: t("tour.stepDiscoveries"),
    },
    {
      icon: <User className="w-8 h-8 text-star-400" />,
      title: t("nav.profile"),
      text: t("tour.stepProfile"),
    },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
      <div className="card w-full max-w-sm p-6 text-center animate-slide-up relative">
        <button
          onClick={close}
          className="absolute top-3 right-3 text-gray-500 hover:text-white"
          aria-label={t("common.cancel")}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-4">{steps[step].icon}</div>
        <h3 className="text-xl font-bold text-white mb-2">{steps[step].title}</h3>
        <p className="text-gray-400 mb-6">{steps[step].text}</p>

        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i === step ? "bg-star-400" : "bg-white/20"}`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="btn-ghost flex-1"
            >
              {t("common.cancel")}
            </button>
          )}
          <button
            onClick={() => {
              if (step < steps.length - 1) setStep((s) => s + 1);
              else close();
            }}
            className="btn-primary flex-1"
          >
            {step < steps.length - 1 ? t("common.continue") : t("tour.gotIt")}
          </button>
        </div>
      </div>
    </div>
  );
}
