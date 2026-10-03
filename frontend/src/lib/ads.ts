import { AdMob, RewardAdPluginEvents } from "@capacitor-community/admob";
import type { PluginListenerHandle } from "@capacitor/core";
import { Capacitor } from "@capacitor/core";

// Test IDs (Google official test units). Replace with your real ad unit IDs for production:
// https://admob.google.com → your app → Ad units
const REWARDED_AD_UNIT_ID = "ca-app-pub-3940256099942544/5224354917"; // Android rewarded test

let initialized = false;

export async function initializeAds(): Promise<void> {
  if (!Capacitor.isNativePlatform() || initialized) return;
  try {
    await AdMob.initialize();
    initialized = true;
  } catch (err) {
    console.warn("AdMob init failed:", err);
  }
}

// Shows a rewarded ad. Resolves true if the user earned the reward, false otherwise.
export async function showRewardedAd(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    // Web fallback: no real ad SDK; simulate a short wait for demo purposes only.
    await new Promise((r) => setTimeout(r, 1500));
    return true;
  }

  await initializeAds();

  return new Promise((resolve) => {
    let resolved = false;
    const handles: Promise<PluginListenerHandle>[] = [];
    const done = async (earned: boolean) => {
      if (resolved) return;
      resolved = true;
      const hs = await Promise.all(handles).catch(() => []);
      for (const h of hs) {
        try {
          await (h as PluginListenerHandle).remove();
        } catch {
          /* ignore */
        }
      }
      resolve(earned);
    };

    handles.push(AdMob.addListener(RewardAdPluginEvents.Rewarded, () => done(true)));
    handles.push(AdMob.addListener(RewardAdPluginEvents.Dismissed, () => done(false)));
    handles.push(AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => done(false)));
    handles.push(AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => done(false)));

    AdMob.prepareRewardVideoAd({ adId: REWARDED_AD_UNIT_ID })
      .then(() => AdMob.showRewardVideoAd())
      .catch(() => done(false));

    // Safety timeout
    setTimeout(() => done(false), 60_000);
  });
}
