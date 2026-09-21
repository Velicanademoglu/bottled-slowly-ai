import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PurchaseService } from "../native/purchase";
import { stardustApi } from "../lib/api";
import api from "../lib/api";
import { Sparkles, Crown, Zap, Star, Loader2 } from "lucide-react";
import Alert from "../components/Alert";

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  type: "consumable" | "subscription" | "non-consumable";
}

interface PurchaseReward {
  productId: string;
  stardust?: number;
  premiumDays?: number;
  boost?: string;
  extraCast?: boolean;
  createdAt?: number;
}

export default function StorePage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const [productsRes, balanceRes] = await Promise.all([
        PurchaseService.getProducts(),
        stardustApi.balance(),
      ]);
      setProducts(productsRes);
      setBalance(balanceRes.data.balance);
    } catch (err) {
      console.error(err);
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    PurchaseService.init().then(() => load());

    const handler = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.productId) return;
      try {
        const reward = (await PurchaseService.consumePendingReward()) as PurchaseReward | null;
        if (!reward) return;
        const { data } = await api.post("/api/iap/verify", {
          productId: reward.productId,
          platform: "ios", // TODO: detect platform
          transactionId: `sim_${Date.now()}`,
        });
        if (data.balance !== undefined) setBalance(data.balance);
        setMessage(`Purchased ${detail.productId}`);
        await load();
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || t("common.error"));
      }
    };

    window.addEventListener("purchase:verified", handler);
    return () => window.removeEventListener("purchase:verified", handler);
  }, []);

  const buy = async (productId: string) => {
    setBuying(productId);
    setError("");
    setMessage("");
    try {
      await PurchaseService.order(productId);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || t("common.error"));
    } finally {
      setBuying(null);
    }
  };

  const iconFor = (id: string) => {
    if (id.includes("stardust")) return <Sparkles className="w-5 h-5" />;
    if (id.includes("premium")) return <Crown className="w-5 h-5" />;
    return <Zap className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card p-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-star-300 text-sm font-medium mb-4">
            <Star className="w-4 h-4" />
            {balance.toLocaleString()} {t("space.stardust")}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Store</h1>
          <p className="text-gray-400">Upgrade your journey through the universe.</p>
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {message && <Alert type="success">{message}</Alert>}

        <div className="grid gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="card p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-star-500/10 text-star-400">
                  {iconFor(product.id)}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{product.title}</h3>
                  <p className="text-sm text-gray-400">{product.description}</p>
                </div>
              </div>
              <button
                onClick={() => buy(product.id)}
                disabled={buying === product.id}
                className="btn-primary whitespace-nowrap disabled:opacity-50"
              >
                {buying === product.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {product.price}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
