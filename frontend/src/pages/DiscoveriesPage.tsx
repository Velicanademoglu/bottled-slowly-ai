import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { discoveriesApi } from "../lib/api";
import Alert from "../components/Alert";
import EmptyState from "../components/EmptyState";
import JourneyMap from "../components/JourneyMap";
import { Compass, CheckCircle2, XCircle, Loader2, History, Rocket, Sparkles } from "lucide-react";

type Tab = "incoming" | "traveling" | "found" | "history";

interface IncomingItem {
  recipientId: number;
  messageId: number;
  content: string;
  vesselKey: string;
  sender: {
    id: number;
    username: string;
    age: number | null;
    country?: string | null;
    bio?: string | null;
    languages: string[];
    interests: string[];
  };
  createdAt: string;
}

interface TravelingItem {
  messageId: number;
  journeyId?: number;
  content: string;
  vesselKey: string;
  status: string;
  launchedAt: string | null;
  currentRecipient: { id: number; username: string; country?: string | null } | null;
  passes: number;
  accepts: number;
  events: { type: string; country: string | null; lat: number | null; lng: number | null; createdAt: string; metadata?: string | null }[];
}

interface FoundItem {
  messageId: number;
  journeyId?: number;
  content: string;
  vesselKey: string;
  acceptedAt: string;
  recipient: { id: number; username: string; country?: string | null };
}

type DiscoveryItem = IncomingItem | TravelingItem | FoundItem | unknown;

export default function DiscoveriesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) || "incoming");
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "incoming") {
        const { data } = await discoveriesApi.incoming();
        setItems(data.items);
      } else if (tab === "traveling") {
        const { data } = await discoveriesApi.traveling();
        setItems(data.items);
      } else if (tab === "found") {
        const { data } = await discoveriesApi.found();
        setItems(data.items);
      } else {
        const { data } = await discoveriesApi.history();
        setItems(data.items as DiscoveryItem[]);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const changeTab = (next: Tab) => {
    setTab(next);
    setSearchParams({ tab: next });
  };

  const accept = async (recipientId: number) => {
    setActing(recipientId);
    try {
      const { data } = await discoveriesApi.accept(recipientId);
      navigate(`/chats/${data.conversation.id}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    } finally {
      setActing(null);
    }
  };

  const pass = async (recipientId: number) => {
    setActing(recipientId);
    try {
      await discoveriesApi.pass(recipientId);
      setItems((prev) => (prev as IncomingItem[]).filter((i) => i.recipientId !== recipientId));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("common.error"));
    } finally {
      setActing(null);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "incoming", label: "Incoming", icon: <Compass className="w-4 h-4" /> },
    { key: "traveling", label: "Traveling", icon: <Rocket className="w-4 h-4" /> },
    { key: "found", label: "Found", icon: <Sparkles className="w-4 h-4" /> },
    { key: "history", label: "History", icon: <History className="w-4 h-4" /> },
  ];

  const isIncoming = (item: DiscoveryItem): item is IncomingItem =>
    tab === "incoming" && typeof (item as IncomingItem).recipientId === "number";

  const isTraveling = (item: DiscoveryItem): item is TravelingItem =>
    tab === "traveling" && typeof (item as TravelingItem).messageId === "number";

  const isFound = (item: DiscoveryItem): item is FoundItem =>
    tab === "found" && typeof (item as FoundItem).messageId === "number" && "recipient" in (item as FoundItem);

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-12 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">{t("nav.discoveries")}</h1>

        <div className="flex bg-white/5 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => changeTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                tab === t.key ? "bg-star-400/10 text-star-300" : "text-gray-400 hover:text-white"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {error && <Alert type="error" className="mb-5">{error}</Alert>}

        {!loading && tab === "traveling" && items.length > 0 && isTraveling(items[0]) && (
          <JourneyMap events={items[0].events} className="h-72 mb-6" />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            {t("common.loading")}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={
              tab === "traveling"
                ? t("discoveries.travelingTitle")
                : tab === "found"
                ? t("discoveries.foundTitle")
                : tab === "history"
                ? t("discoveries.historyTitle")
                : t("discoveries.emptyTitle")
            }
            description={
              tab === "traveling"
                ? t("discoveries.travelingDescription")
                : tab === "found"
                ? t("discoveries.foundDescription")
                : tab === "history"
                ? t("discoveries.historyDescription")
                : t("discoveries.emptyDescription")
            }
            icon={<Compass className="w-8 h-8" />}
          />
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="card p-5">
                {isIncoming(item) && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs uppercase tracking-wider text-star-400">{item.vesselKey}</span>
                      <span className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="mb-4">
                      <div className="text-sm text-gray-400 mb-1">
                        {t("discoveries.from")} {item.sender.username} • {item.sender.age} • {item.sender.country || t("discoveries.unknownCountry")}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.sender.interests.slice(0, 5).map((i) => (
                          <span key={i} className="px-2 py-1 rounded-full bg-white/5 text-xs text-gray-300">{i}</span>
                        ))}
                      </div>
                      <p className="text-gray-200 bg-white/5 rounded-xl p-4">{item.content}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => accept(item.recipientId)}
                        disabled={acting === item.recipientId}
                        className="btn-primary flex-1"
                      >
                        <CheckCircle2 className="w-4 h-4" /> {t("discoveries.accept")}
                      </button>
                      <button
                        onClick={() => pass(item.recipientId)}
                        disabled={acting === item.recipientId}
                        className="btn-ghost flex-1"
                      >
                        <XCircle className="w-4 h-4" /> {t("discoveries.sendItOn")}
                      </button>
                    </div>
                  </>
                )}

                {isTraveling(item) && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs uppercase tracking-wider text-star-400">{item.vesselKey}</span>
                      <span className="text-xs text-gray-500">
                        {item.launchedAt ? new Date(item.launchedAt).toLocaleString() : "—"}
                      </span>
                    </div>
                    <p className="text-gray-200 bg-white/5 rounded-xl p-4 mb-4">{item.content}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1"><Rocket className="w-4 h-4" /> {item.status}</span>
                      <span>Passes: {item.passes}</span>
                      <span>Accepts: {item.accepts}</span>
                      {item.currentRecipient && (
                        <span>Near: {item.currentRecipient.username} {item.currentRecipient.country ? `(${item.currentRecipient.country})` : ""}</span>
                      )}
                    </div>
                  </>
                )}

                {isFound(item) && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs uppercase tracking-wider text-star-400">{item.vesselKey}</span>
                      <span className="text-xs text-gray-500">{new Date(item.acceptedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-200 bg-white/5 rounded-xl p-4 mb-4">{item.content}</p>
                    <div className="text-sm text-gray-400">
                      Found by{" "}
                      <span className="text-white font-medium">{item.recipient.username}</span>
                      {item.recipient.country ? ` • ${item.recipient.country}` : ""}
                    </div>
                  </>
                )}

                {!isIncoming(item) && !isTraveling(item) && !isFound(item) && (
                  <pre className="text-xs text-gray-400 overflow-auto">{JSON.stringify(item, null, 2)}</pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
