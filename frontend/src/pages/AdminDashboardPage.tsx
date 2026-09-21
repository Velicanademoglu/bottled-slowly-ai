import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { adminApi } from "../lib/api";
import type { AdminStats } from "../types";
import { Users, Activity, MessageSquare, AlertTriangle, CreditCard, MessageCircle, Settings, Shield } from "lucide-react";

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .stats()
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: t("admin.totalUsers"), value: stats.totalUsers, icon: Users, to: "/admin/users" },
        { label: t("admin.activeUsers"), value: stats.activeUsers, icon: Activity },
        { label: t("admin.newToday"), value: stats.newUsersToday, icon: Users },
        { label: t("admin.totalMessages"), value: stats.totalMessages, icon: MessageSquare, to: "/admin/messages" },
        { label: t("admin.reports"), value: stats.totalReports, icon: AlertTriangle, to: "/admin/reports" },
        { label: t("admin.openReports"), value: stats.openReports, icon: AlertTriangle, to: "/admin/reports" },
        { label: t("admin.transactions"), value: stats.totalTransactions, icon: CreditCard },
      ]
    : [];

  const navCards = [
    { label: "User Management", icon: Shield, to: "/admin/users", desc: "Search, suspend, ban users" },
    { label: "Reports", icon: AlertTriangle, to: "/admin/reports", desc: "Review user reports" },
    { label: "Messages", icon: MessageCircle, to: "/admin/messages", desc: "Review space messages and chats" },
    { label: "Settings", icon: Settings, to: "/admin/settings", desc: "App configuration" },
  ];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">{t("admin.dashboard")}</h1>

        {loading ? (
          <div className="text-gray-400">{t("common.loading")}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {cards.map((card) => {
              const content = (
                <div className="card p-5 flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-white/5">
                    <card.icon className="w-6 h-6 text-star-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{card.label}</p>
                    <p className="text-2xl font-bold text-white">{card.value.toLocaleString()}</p>
                  </div>
                </div>
              );
              return card.to ? <Link key={card.label} to={card.to}>{content}</Link> : <div key={card.label}>{content}</div>;
            })}
          </div>
        )}

        <h2 className="text-xl font-bold text-white mb-4">Admin Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {navCards.map((card) => (
            <Link key={card.label} to={card.to} className="card p-5 hover:border-white/20 transition">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-white/5">
                  <card.icon className="w-6 h-6 text-cosmic-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{card.label}</p>
                  <p className="text-sm text-gray-400">{card.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
