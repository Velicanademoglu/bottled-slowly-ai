import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "../lib/api";
import Alert from "../components/Alert";
import Avatar from "../components/Avatar";
import { Loader2, Search, Ban, CheckCircle2, AlertTriangle } from "lucide-react";

interface AdminUser {
  id: number;
  email: string;
  username: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  country?: string | null;
  avatarUrl?: string | null;
}

const ROLES = ["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"];
const STATUSES = ["ACTIVE", "SUSPENDED", "BANNED"];

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await adminApi.users({
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setUsers(data.users);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [roleFilter, statusFilter]);

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id);
    try {
      await adminApi.updateUserStatus(id, status);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    } finally {
      setUpdating(null);
    }
  };

  const updateRole = async (id: number, role: string) => {
    setUpdating(id);
    try {
      await adminApi.updateUserRole(id, role);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    } finally {
      setUpdating(null);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "SUSPENDED":
        return <AlertTriangle className="w-4 h-4 text-star-400" />;
      case "BANNED":
        return <Ban className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <span className="text-sm text-gray-400">{users.length} users</span>
        </div>

        {error && <Alert type="error" className="mb-5">{error}</Alert>}

        <div className="card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by username or email"
                className="input-field pl-10"
                onKeyDown={(e) => e.key === "Enter" && load()}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button onClick={load} className="btn-primary">Search</button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            {t("common.loading")}
          </div>
        ) : users.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">No users found.</div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar url={user.avatarUrl} name={user.username} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{user.username}</span>
                        {statusIcon(user.status)}
                      </div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                      <div className="text-xs text-gray-500">{user.country} • {new Date(user.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={user.role}
                      disabled={updating === user.id}
                      onChange={(e) => updateRole(user.id, e.target.value)}
                      className="bg-space-800 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>

                    <select
                      value={user.status}
                      disabled={updating === user.id}
                      onChange={(e) => updateStatus(user.id, e.target.value)}
                      className="bg-space-800 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
