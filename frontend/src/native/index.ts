import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Keyboard } from "@capacitor/keyboard";
import { App } from "@capacitor/app";

const isNative = Capacitor.isNativePlatform();

export async function initNative() {
  if (!isNative) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0B0E17" });
  } catch (err) {
    console.warn("StatusBar init failed", err);
  }

  try {
    await Keyboard.setResizeMode({ mode: "body" as any });
  } catch (err) {
    console.warn("Keyboard init failed", err);
  }

  try {
    await SplashScreen.hide({ fadeOutDuration: 500 });
  } catch (err) {
    console.warn("SplashScreen hide failed", err);
  }

  App.addListener("appUrlOpen", (data) => {
    console.log("Deep link opened", data.url);
  });
}

export { isNative };
