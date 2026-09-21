import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { profileApi } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import Avatar, { AVATAR_PRESETS } from "../components/Avatar";
import ProfileCosmos from "../components/ProfileCosmos";
import Alert from "../components/Alert";
import SearchableSelect from "../components/SearchableSelect";
import { COUNTRIES } from "../lib/countries";
import type { Profile, User } from "../types";
import { Link } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { Save, User as UserIcon, Calendar, Loader2, CheckCircle2, Camera, X, Sparkles, Crown, Gauge, FileText, Sun, Moon } from "lucide-react";

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.name, label: c.name, suffix: c.flag }));

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const { theme, toggle } = useTheme();
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [me, setMe] = useState<User | null>(user || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await profileApi.me();
        setMe(data);
        setProfile(data?.profile || {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await profileApi.update({
        bio: profile.bio,
        country: profile.country,
        avatarUrl: profile.avatarUrl,
        avatarPreset: profile.avatarPreset,
      });
      const { data: fresh } = await profileApi.me();
      setMe(fresh);
      setProfile(fresh.profile || {});
      setSaved(true);
      login(fresh, localStorage.getItem("token") || "");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setAvatarUploading(true);
    setError("");

    try {
      const { data } = await profileApi.uploadAvatar(file);
      setProfile((p) => ({ ...p, avatarUrl: data.avatarUrl, avatarPreset: null }));
      if (me) login({ ...me, profile: { ...me.profile, avatarUrl: data.avatarUrl, avatarPreset: null } as Profile }, localStorage.getItem("token") || "");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || "Failed to upload avatar");
      setPreviewUrl(null);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearAvatar = () => {
    setPreviewUrl(null);
    setProfile((p) => ({ ...p, avatarUrl: "", avatarPreset: "" }));
  };

  const completion = me?.completion ?? 0;
  const level = me?.level ?? profile.level ?? 1;
  const gravity = profile.gravity ?? 500;

  if (loading) return <div className="p-8 text-center text-gray-400">{t("common.loading")}</div>;

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-6 pb-24">
      <div className="max-w-2xl mx-auto animate-slide-up space-y-6">
        <div className="relative card overflow-hidden">
          <ProfileCosmos level={level} gravity={gravity} className="absolute inset-0 h-48" />
          <div className="relative z-10 pt-10 px-6 pb-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar url={previewUrl || profile.avatarUrl} preset={profile.avatarPreset} name={me?.username || ""} size="xl" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-1 right-1 p-2 rounded-full bg-cosmic-500 text-white shadow-lg hover:bg-cosmic-400 transition disabled:opacity-50"
                aria-label="Upload profile photo"
              >
                {avatarUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
              {(profile.avatarUrl || profile.avatarPreset) && (
                <button
                  onClick={clearAvatar}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                  aria-label="Remove profile photo"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-white">{me?.username}</h1>
              <p className="text-gray-300">{me?.email}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm text-white">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/30">
                  <Crown className="w-3.5 h-3.5 text-star-400" />
                  Level {level}
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/30">
                  <Gauge className="w-3.5 h-3.5 text-cosmic-400" />
                  Gravity {gravity}
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/30">
                  <UserIcon className="w-3.5 h-3.5 text-star-400" />
                  @{me?.username}
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/30">
                  <Calendar className="w-3.5 h-3.5 text-cosmic-400" />
                  {new Date(me?.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 px-6 pb-6">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-star-400" />
                  Profile completion
                </span>
                <span className="font-semibold text-white">{completion}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-star-400 to-cosmic-400 transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <Link
          to="/templates"
          className="card p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-nebula-500/10 text-nebula-600 dark:text-nebula-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{t("templates.title")}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("templates.subtitle")}</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </Link>

        <button
          onClick={toggle}
          className="card p-4 w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-star-500/10 text-star-600 dark:text-star-400">
              {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t("theme.title")}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{theme === "dark" ? t("theme.dark") : t("theme.light")}</p>
            </div>
          </div>
          <span className="text-gray-400">{theme === "dark" ? "🌙" : "☀️"}</span>
        </button>

        <div className="card p-6 sm:p-8">
          {error && <Alert type="error" className="mb-5">{error}</Alert>}

          <div className="space-y-5">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-1">Profile photo URL</label>
              <input
                type="url"
                value={profile.avatarUrl || ""}
                onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value, avatarPreset: null })}
                placeholder="https://..."
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Or choose an avatar</label>
              <div className="flex flex-wrap gap-3">
                {AVATAR_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setProfile({ ...profile, avatarPreset: p.key, avatarUrl: null })}
                    className={`text-2xl w-12 h-12 rounded-full border-2 transition flex items-center justify-center ${
                      profile.avatarPreset === p.key
                        ? "border-star-400 bg-star-400/10"
                        : "border-white/10 hover:border-white/30 bg-white/5"
                    }`}
                    title={p.key}
                  >
                    {p.icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Country</label>
              <SearchableSelect
                options={COUNTRY_OPTIONS}
                value={profile.country || ""}
                onChange={(value) => setProfile({ ...profile, country: value })}
                placeholder="Select your country"
                searchPlaceholder="Search countries..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
              <textarea
                value={profile.bio || ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell others a little about yourself..."
                rows={4}
                className="input-field resize-none"
                maxLength={300}
              />
              <p className="mt-1 text-xs text-gray-500 text-right">{(profile.bio || "").length}/300</p>
            </div>

            <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t("common.save")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
