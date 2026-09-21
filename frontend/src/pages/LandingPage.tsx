import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBrandConfig } from "../hooks/useBrandConfig";
import { Sparkles, Send, Globe, Shield, ArrowRight, Star } from "lucide-react";

export default function LandingPage() {
  const { t } = useTranslation();
  const { name, slogan } = useBrandConfig();

  const features = [
    { icon: <Send className="w-6 h-6 text-cosmic-400" />, title: "Cast into space", desc: "Write a message and release it into the universe." },
    { icon: <Globe className="w-6 h-6 text-nebula-400" />, title: "Smart discovery", desc: "Our engine matches your message with compatible souls around the world." },
    { icon: <Shield className="w-6 h-6 text-emerald-400" />, title: "Safe by design", desc: "Block, report, and connect with confidence using verified profiles." },
    { icon: <Star className="w-6 h-6 text-star-400" />, title: "Stardust economy", desc: "Earn rewards, complete missions, and unlock premium vessels." },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-star-300 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            {t("tagline")}
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6">
            <span className="text-gradient">{name}</span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-300 mb-4 font-light">{slogan}</p>
          <p className="text-gray-400 max-w-xl mx-auto mb-10">
            A new kind of social discovery. No endless swiping. No public feeds. Just meaningful messages traveling through space until the right person finds them.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-lg px-8 py-4">
              {t("auth.createAccount")}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="btn-secondary text-lg px-8 py-4">
              {t("auth.login")}
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="card p-6 hover:border-white/20 transition animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="mb-4 p-3 rounded-2xl bg-white/5 w-fit">{f.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
