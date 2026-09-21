import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Compass, PlusCircle, MessageCircle, User, ShoppingBag } from "lucide-react";

export default function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  const items = [
    { to: "/space", icon: Home, label: t("nav.space") },
    { to: "/discoveries", icon: Compass, label: t("nav.discoveries") },
    { to: "/create", icon: PlusCircle, label: t("nav.create"), highlight: true },
    { to: "/chats", icon: MessageCircle, label: t("nav.chats") },
    { to: "/profile", icon: User, label: t("nav.profile") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-space-900/90 backdrop-blur-lg border-t border-white/5 safe-area-pb">
      <Link
        to="/store"
        className="absolute -top-5 right-4 p-2.5 rounded-full bg-cosmic-500 text-white shadow-lg hover:bg-cosmic-400 transition"
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
              <item.icon className={`w-6 h-6 ${item.highlight ? "text-star-400" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
