import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, Globe, MessageSquarePlus, Mail, User, ShoppingBag } from "lucide-react";

export default function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  const items = [
    { to: "/space", icon: Sparkles, label: t("nav.space") },
    { to: "/discoveries", icon: Globe, label: t("nav.discoveries") },
    { to: "/create", icon: MessageSquarePlus, label: t("nav.create"), highlight: true },
    { to: "/chats", icon: Mail, label: t("nav.chats") },
    { to: "/profile", icon: User, label: t("nav.profile") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-space-950/90 backdrop-blur-lg border-t border-black/5 dark:border-white/5 safe-area-pb">
      <Link
        to="/store"
        className="absolute -top-5 right-4 p-2.5 rounded-full bg-star-500 text-space-950 shadow-lg hover:bg-star-400 transition"
        aria-label="Store"
      >
        <ShoppingBag className="w-5 h-5" />
      </Link>
      <div className="max-w-md mx-auto flex items-center justify-around h-16">
        {items.map((item) => {
          const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-link ${active ? "nav-link-active" : ""}`}
            >
              <item.icon className={`w-6 h-6 ${item.highlight ? "text-star-500 dark:text-star-400" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
