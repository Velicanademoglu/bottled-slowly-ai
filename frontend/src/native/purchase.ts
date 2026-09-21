import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

// Product IDs must be registered in App Store Connect and Google Play Console
export const PRODUCT_IDS = {
  stardust: {
    small: "stardust_100",
    medium: "stardust_500",
    large: "stardust_1200",
    mega: "stardust_3000",
  },
  premium: {
    weekly: "premium_weekly",
    monthly: "premium_monthly",
    yearly: "premium_yearly",
  },
  boosts: {
    messageBoost: "boost_message_1",
    profileBoost: "boost_profile_1",
    extraCast: "extra_cast_1",
  },
} as const;

type Product = {
  id: string;
  title: string;
  description: string;
  price: string;
  type: "consumable" | "subscription" | "non-consumable";
};

const isNative = Capacitor.isNativePlatform();

export class PurchaseService {
  private static initialized = false;

  static async init(): Promise<void> {
    if (!isNative) return;
    if (this.initialized) return;

    // The cordova-plugin-purchase store is globally available on native builds
    const store = (window as unknown as { store?: StoreType }).store;
    if (!store) {
      console.warn("In-app purchase store not available");
      return;
    }

    // Register products
    const products = [
      { id: PRODUCT_IDS.stardust.small, type: store.CONSUMABLE },
      { id: PRODUCT_IDS.stardust.medium, type: store.CONSUMABLE },
      { id: PRODUCT_IDS.stardust.large, type: store.CONSUMABLE },
      { id: PRODUCT_IDS.stardust.mega, type: store.CONSUMABLE },
      { id: PRODUCT_IDS.premium.weekly, type: store.PAID_SUBSCRIPTION },
      { id: PRODUCT_IDS.premium.monthly, type: store.PAID_SUBSCRIPTION },
      { id: PRODUCT_IDS.premium.yearly, type: store.PAID_SUBSCRIPTION },
      { id: PRODUCT_IDS.boosts.messageBoost, type: store.CONSUMABLE },
      { id: PRODUCT_IDS.boosts.profileBoost, type: store.CONSUMABLE },
      { id: PRODUCT_IDS.boosts.extraCast, type: store.CONSUMABLE },
    ];

    products.forEach((p) => {
      store.register({
        id: p.id,
        type: p.type,
      });
    });

    store.when("product").updated((p: StoreProduct) => {
      console.log("Product updated", p.id, p.title, p.price);
    });

    store.when("product").approved((order: StoreOrder) => {
      order.verify();
    });

    store.when("product").verified((receipt: StoreReceipt) => {
      receipt.finish();
      this.grantProduct(receipt.products[0]?.id);
    });

    store.error((err: Error) => {
      console.error("Store error", err);
    });

    await store.initialize([]);
    this.initialized = true;
  }

  static async getProducts(): Promise<Product[]> {
    if (!isNative) {
      // Web fallback / demo prices
      return [
        { id: PRODUCT_IDS.stardust.small, title: "100 Stardust", description: "Small stardust pack", price: "$0.99", type: "consumable" },
        { id: PRODUCT_IDS.stardust.medium, title: "500 Stardust", description: "Medium stardust pack", price: "$4.99", type: "consumable" },
        { id: PRODUCT_IDS.stardust.large, title: "1200 Stardust", description: "Large stardust pack", price: "$9.99", type: "consumable" },
        { id: PRODUCT_IDS.stardust.mega, title: "3000 Stardust", description: "Mega stardust pack", price: "$19.99", type: "consumable" },
        { id: PRODUCT_IDS.premium.monthly, title: "Premium Monthly", description: "Unlock special vessels and boosts", price: "$4.99", type: "subscription" },
        { id: PRODUCT_IDS.boosts.messageBoost, title: "Message Boost", description: "Boost your message visibility", price: "$1.99", type: "consumable" },
        { id: PRODUCT_IDS.boosts.extraCast, title: "Extra Cast", description: "Cast one extra message today", price: "$0.99", type: "consumable" },
      ];
    }

    const store = (window as unknown as { store?: StoreType }).store;
    if (!store) return [];

    return store.products.map((p: StoreProduct) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      type: p.type === store?.CONSUMABLE ? "consumable" : p.type === store?.PAID_SUBSCRIPTION ? "subscription" : "non-consumable",
    }));
  }

  static async order(productId: string): Promise<void> {
    if (!isNative) {
      // Web simulation: call backend directly for testing
      console.log("Simulated purchase on web", productId);
      return;
    }
    const store = (window as unknown as { store?: StoreType }).store;
    if (!store) throw new Error("Store not available");
    await store.order(productId);
  }

  private static async grantProduct(productId?: string) {
    if (!productId) return;
    const mapping: Record<string, { stardust?: number; premiumDays?: number; boost?: string; extraCast?: boolean }> = {
      [PRODUCT_IDS.stardust.small]: { stardust: 100 },
      [PRODUCT_IDS.stardust.medium]: { stardust: 500 },
      [PRODUCT_IDS.stardust.large]: { stardust: 1200 },
      [PRODUCT_IDS.stardust.mega]: { stardust: 3000 },
      [PRODUCT_IDS.premium.weekly]: { premiumDays: 7 },
      [PRODUCT_IDS.premium.monthly]: { premiumDays: 30 },
      [PRODUCT_IDS.premium.yearly]: { premiumDays: 365 },
      [PRODUCT_IDS.boosts.messageBoost]: { boost: "message" },
      [PRODUCT_IDS.boosts.profileBoost]: { boost: "profile" },
      [PRODUCT_IDS.boosts.extraCast]: { extraCast: true },
    };
    const reward = mapping[productId];
    if (!reward) return;

    // Persist pending reward until backend sync
    await Preferences.set({
      key: "pending_purchase_reward",
      value: JSON.stringify({ productId, ...reward, createdAt: Date.now() }),
    });

    // The app should POST this to backend on next app start or immediately if online
    window.dispatchEvent(new CustomEvent("purchase:verified", { detail: { productId, reward } }));
  }

  static async consumePendingReward(): Promise<unknown | null> {
    const { value } = await Preferences.get({ key: "pending_purchase_reward" });
    if (!value) return null;
    const reward = JSON.parse(value);
    await Preferences.remove({ key: "pending_purchase_reward" });
    return reward;
  }
}

// Minimal type stubs for cordova-plugin-purchase globals
type StoreType = {
  CONSUMABLE: string;
  PAID_SUBSCRIPTION: string;
  NON_CONSUMABLE: string;
  register: (product: { id: string; type: string }) => void;
  when: (event: string) => {
    updated: (cb: (p: StoreProduct) => void) => void;
    approved: (cb: (order: StoreOrder) => void) => void;
    verified: (cb: (receipt: StoreReceipt) => void) => void;
  };
  error: (cb: (err: Error) => void) => void;
  order: (productId: string) => Promise<void>;
  initialize: (platforms: string[]) => Promise<void>;
  products: StoreProduct[];
};

type StoreProduct = {
  id: string;
  title: string;
  description: string;
  price: string;
  type: string;
};

type StoreOrder = {
  verify: () => void;
};

type StoreReceipt = {
  finish: () => void;
  products: StoreProduct[];
};
