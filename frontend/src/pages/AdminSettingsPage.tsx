import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "../lib/api";
import Alert from "../components/Alert";
import { Loader2, Save, Type } from "lucide-react";

interface AppSetting {
  id: number;
  key: string;
  value: string;
  category: string | null;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    adminApi
      .settings()
      .then((res) => setSettings(res.data))
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || t("common.error"));
      })
      .finally(() => setLoading(false));
  }, []);

  const update = async (setting: AppSetting, value: string) => {
    setSaving(setting.key);
    setError("");
    setSuccess("");
    try {
      await adminApi.updateSetting(setting.key, value, setting.category || undefined);
      setSettings((prev) => prev.map((s) => (s.id === setting.id ? { ...s, value } : s)));
      setSuccess(`${setting.key} updated`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">App Settings</h1>

        {error && <Alert type="error" className="mb-5">{error}</Alert>}
        {success && <Alert type="success" className="mb-5">{success}</Alert>}

        <div className="space-y-4">
          {settings.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">No settings found.</div>
          ) : (
            settings.map((setting) => (
              <SettingRow
                key={setting.id}
                setting={setting}
                saving={saving === setting.key}
                onSave={update}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  setting,
  saving,
  onSave,
}: {
  setting: AppSetting;
  saving: boolean;
  onSave: (s: AppSetting, v: string) => Promise<void>;
}) {
  const [value, setValue] = useState(setting.value);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-2">
        <Type className="w-4 h-4 text-cosmic-400" />
        <span className="font-semibold text-white">{setting.key}</span>
        {setting.category && <span className="text-xs text-gray-500">({setting.category})</span>}
      </div>
      <div className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input-field flex-1"
        />
        <button
          onClick={() => onSave(setting, value)}
          disabled={saving || value === setting.value}
          className="btn-primary"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" /> Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}
