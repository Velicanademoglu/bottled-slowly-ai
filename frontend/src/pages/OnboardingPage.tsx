import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { profileApi, stardustApi } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import Alert from "../components/Alert";
import SearchableSelect from "../components/SearchableSelect";
import { LANGUAGES } from "../lib/languages";
import { COUNTRIES } from "../lib/countries";
import { Loader2, ArrowRight, CheckCircle2, X } from "lucide-react";

const GENDERS = ["MALE", "FEMALE", "NON_BINARY", "OTHER", "PREFER_NOT_TO_SAY"];
const PREFERRED_GENDERS = ["EVERYONE", "MEN", "WOMEN", "OTHER"];
const INTERESTS = [
  "Music", "Movies", "Gaming", "Travel", "Books", "Technology", "Art", "Sports",
  "Food", "Photography", "Nature", "Business", "Science", "History", "Culture", "Fashion", "Fitness"
];
const GOALS = [
  "Casual", "Deep conversations", "Friendship", "Culture exchange", "Gaming friends",
  "Music", "Travel", "Life", "Random discoveries"
];
const LEVELS = ["Native", "Fluent", "Intermediate", "Learning"];

const LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({
  value: l.name,
  label: l.nativeName ? `${l.name} — ${l.nativeName}` : l.name,
}));

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({
  value: c.name,
  label: c.name,
  suffix: c.flag,
}));

export default function OnboardingPage() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState({
    birthDate: "",
    gender: "",
    country: "",
    bio: "",
  });
  const [preferences, setPreferences] = useState({
    preferredGender: "EVERYONE",
    minAge: 18,
    maxAge: 99,
  });
  const [languages, setLanguages] = useState<{ language: string; level: string }[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);

  const totalSteps = 8;

  const toggle = (value: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const next = () => {
    setError("");
    if (step < totalSteps - 1) setStep(step + 1);
    else finish();
  };

  const finish = async () => {
    setSaving(true);
    setError("");
    try {
      const p = await profileApi.update({
        ...profile,
        onboardingCompleted: true,
      });
      await profileApi.updatePreferences({
        preferredGender: preferences.preferredGender,
        minAge: preferences.minAge,
        maxAge: preferences.maxAge,
        conversationGoals: goals,
      });
      for (const l of languages) {
        await profileApi.addLanguage(l);
      }
      for (const i of interests) {
        await profileApi.addInterest(i);
      }
      try {
        await stardustApi.claimProfileCompletion();
      } catch {
        // ignore if already claimed
      }
      if (user) login({ ...user, profile: p.data }, localStorage.getItem("token") || "");
      navigate("/space");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const addLanguage = (lang: string) => {
    if (!languages.find((l) => l.language === lang)) {
      setLanguages([...languages, { language: lang, level: "Intermediate" }]);
    }
  };

  const removeLanguage = (lang: string) => {
    setLanguages(languages.filter((l) => l.language !== lang));
  };

  const updateLanguageLevel = (lang: string, level: string) => {
    setLanguages(languages.map((l) => (l.language === lang ? { ...l, level } : l)));
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <label className="block text-sm text-gray-400">{t("onboarding.birthDate")}</label>
            <input
              type="date"
              className="input-field"
              value={profile.birthDate}
              onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
              required
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 mb-2">{t("onboarding.gender")}</p>
            {GENDERS.map((g) => (
              <button
                key={g}
                onClick={() => setProfile({ ...profile, gender: g })}
                className={`w-full text-left px-4 py-3 rounded-2xl border transition ${
                  profile.gender === g ? "border-star-400 bg-star-400/10 text-white" : "border-white/10 text-gray-300 hover:bg-white/5"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        );
      case 2:
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 mb-2">{t("onboarding.preferredGender")}</p>
            {PREFERRED_GENDERS.map((g) => (
              <button
                key={g}
                onClick={() => setPreferences({ ...preferences, preferredGender: g })}
                className={`w-full text-left px-4 py-3 rounded-2xl border transition ${
                  preferences.preferredGender === g ? "border-star-400 bg-star-400/10 text-white" : "border-white/10 text-gray-300 hover:bg-white/5"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t("onboarding.country")}</label>
              <SearchableSelect
                options={COUNTRY_OPTIONS}
                value={profile.country}
                onChange={(value) => setProfile({ ...profile, country: value })}
                placeholder="Select your country"
                searchPlaceholder="Search countries..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t("onboarding.ageRange")}</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min={18}
                  max={120}
                  className="input-field"
                  value={preferences.minAge}
                  onChange={(e) => setPreferences({ ...preferences, minAge: Math.min(Number(e.target.value), preferences.maxAge) })}
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  min={18}
                  max={120}
                  className="input-field"
                  value={preferences.maxAge}
                  onChange={(e) => setPreferences({ ...preferences, maxAge: Math.max(Number(e.target.value), preferences.minAge) })}
                />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-2">{t("onboarding.languages")}</p>
            <SearchableSelect
              options={LANGUAGE_OPTIONS}
              value=""
              onChange={addLanguage}
              placeholder="Add a language"
              searchPlaceholder="Search languages..."
            />
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {languages.map((lang) => (
                <div key={lang.language} className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
                  <span className="text-gray-200">{lang.language}</span>
                  <div className="flex items-center gap-2">
                    <select
                      className="bg-space-800 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white"
                      value={lang.level}
                      onChange={(e) => updateLanguageLevel(lang.language, e.target.value)}
                    >
                      {LEVELS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeLanguage(lang.language)}
                      className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {languages.length === 0 && <div className="text-sm text-gray-500 px-1">No languages selected yet.</div>}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-2">{t("onboarding.interests")}</p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <button
                  key={i}
                  onClick={() => toggle(i, interests, setInterests)}
                  className={`px-4 py-2 rounded-full text-sm border transition ${
                    interests.includes(i)
                      ? "border-star-400 bg-star-400/10 text-white"
                      : "border-white/10 text-gray-400 hover:bg-white/5"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-2">{t("onboarding.conversationGoals")}</p>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  onClick={() => toggle(g, goals, setGoals)}
                  className={`px-4 py-2 rounded-full text-sm border transition ${
                    goals.includes(g)
                      ? "border-star-400 bg-star-400/10 text-white"
                      : "border-white/10 text-gray-400 hover:bg-white/5"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <label className="block text-sm text-gray-400">{t("onboarding.bio")}</label>
            <textarea
              className="input-field resize-none"
              rows={4}
              maxLength={300}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder={t("onboarding.bioHint")}
            />
            <p className="text-xs text-gray-500 text-right">{(profile.bio || "").length}/300</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg animate-slide-up">
        <div className="card p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
              <span>Step {step + 1} of {totalSteps}</span>
              <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-star-400 to-nebula-500 transition-all"
                style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {error && <Alert type="error" className="mb-5">{error}</Alert>}

          {renderStep()}

          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="btn-ghost disabled:opacity-30"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={next}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : step === totalSteps - 1 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {t("common.submit")}
                </>
              ) : (
                <>
                  {t("onboarding.continue")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
