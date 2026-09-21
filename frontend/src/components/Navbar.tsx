import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, isAdmin } from "../hooks/useAuth";
import { useBrandConfig } from "../hooks/useBrandConfig";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Sparkles, LogOut, Shield, Star } from "lucide-react";
import { stardustApi } from "../lib/api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { name } = useBrandConfig();
  const [stardust, setStardust] = useState(user?.stardustBalance ?? 0);

  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (!user) return;
    stardustApi
      .balance()
      .then((res) => setStardust(res.data.balance))
      .catch(() => setStardust(user.stardustBalance ?? 0));
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-glass border-b border-white/5">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={user ? "/space" : "/"} className="flex items-center gap-2 font-bold text-lg">
          <Sparkles className="w-5 h-5 text-star-400" />
          <span className="text-gradient">{name}</span>
        </Link>

        <div className="flex items-center gap-3">
          {user && !isAdminRoute && (
            <Link
              to="/rewards"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-star-300 text-sm font-medium hover:bg-white/10 transition"
            >
              <Star className="w-4 h-4" />
              {stardust.toLocaleString()}
            </Link>
          )}

          {user && isAdmin(user.role) && !isAdminRoute && (
            <Link to="/admin" className="btn-ghost text-sm">
              <Shield className="w-4 h-4" />
              {t("admin.panel")}
            </Link>
          )}

          {user ? (
            <button onClick={handleLogout} className="btn-ghost text-sm">
              <LogOut className="w-4 h-4" />
              {t("auth.logout")}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost text-sm">{t("auth.login")}</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">{t("auth.register")}</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
