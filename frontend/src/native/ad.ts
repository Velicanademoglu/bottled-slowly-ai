// Ad service abstraction.
// Replace the stub implementations with real AdMob (or other provider) calls
// after installing the native plugin, e.g. admob-plus-cordova.

export type AdType = "rewarded" | "interstitial" | "banner";

export interface RewardedAdResult {
  rewarded: boolean;
  reward?: { type: string; amount: number };
}

function isNative(): boolean {
  return typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.() === true;
}

/**
 * Preload a rewarded ad so it is ready when the user wants to watch.
 */
export async function loadRewardedAd(adUnitId: string): Promise<void> {
  if (!isNative()) {
    console.log("[Ad Stub] loadRewardedAd", adUnitId);
    return;
  }
  // Real implementation:
  // const { AdMob } = await import("@capacitor-community/admob");
  // await AdMob.prepareRewardVideoAd({ adId: adUnitId });
}

/**
 * Show a rewarded ad. Resolves when the user finishes watching or dismisses.
 * IMPORTANT: Only grant the reward after the SDK reports success.
 */
export async function showRewardedAd(adUnitId: string): Promise<RewardedAdResult> {
  if (!isNative()) {
    console.log("[Ad Stub] showRewardedAd", adUnitId);
    // Simulate a successful reward in browser/development.
    return { rewarded: true, reward: { type: "stardust", amount: 20 } };
  }

  // Real implementation skeleton:
  // const { AdMob, RewardAdPluginEvents } = await import("@capacitor-community/admob");
  // return new Promise((resolve) => {
  //   const onReward = (info: any) => {
  //     AdMob.removeRewardListener();
  //     resolve({ rewarded: true, reward: info });
  //   };
  //   AdMob.addListener(RewardAdPluginEvents.Rewarded, onReward);
  //   AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
  //     AdMob.removeRewardListener();
  //     resolve({ rewarded: false });
  //   });
  //   AdMob.showRewardVideoAd();
  // });

  return { rewarded: false };
}

/**
 * Show an interstitial ad. Should be called at natural transition points.
 */
export async function showInterstitialAd(adUnitId: string): Promise<void> {
  if (!isNative()) {
    console.log("[Ad Stub] showInterstitialAd", adUnitId);
    return;
  }
  // Real implementation:
  // const { AdMob } = await import("@capacitor-community/admob");
  // await AdMob.prepareInterstitial({ adId: adUnitId });
  // await AdMob.showInterstitial();
}

/**
 * Show or hide a banner ad.
 */
export async function showBannerAd(adUnitId: string): Promise<void> {
  if (!isNative()) {
    console.log("[Ad Stub] showBannerAd", adUnitId);
    return;
  }
  // Real implementation:
  // const { AdMob, BannerAdPosition } = await import("@capacitor-community/admob");
  // await AdMob.showBanner({ adId: adUnitId, position: BannerAdPosition.BOTTOM_CENTER });
}

export async function hideBannerAd(): Promise<void> {
  if (!isNative()) {
    console.log("[Ad Stub] hideBannerAd");
    return;
  }
  // Real implementation:
  // const { AdMob } = await import("@capacitor-community/admob");
  // await AdMob.hideBanner();
}
