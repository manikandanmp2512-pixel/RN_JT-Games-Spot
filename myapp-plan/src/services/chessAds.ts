// import { Platform } from "react-native";
// import "react-native-google-mobile-ads";
// import mobileAds, { AdEventType, InterstitialAd, TestIds } from "react-native-google-mobile-ads";

// let interstitial: InterstitialAd | null = null;
// let loaded = false;
// let initialized = false;

// export async function showGameCompletionAd(): Promise<void> {
//   try {
//     if (!initialized) {
//       await mobileAds().initialize();
//       initialized = true;
//     }
//     if (!interstitial) {
//       // Replace TestIds.INTERSTITIAL with your approved AdMob interstitial ad unit ID
//       // after creating an AdMob app/ad unit. Keep test ads during development.
//       interstitial = InterstitialAd.createForAdRequest(
//         __DEV__ ? TestIds.INTERSTITIAL : (Platform.OS === "ios"
//           ? process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_ID || TestIds.INTERSTITIAL
//           : process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_ID || TestIds.INTERSTITIAL),
//         { requestNonPersonalizedAdsOnly: true }
//       );
//       interstitial.addAdEventListener(AdEventType.LOADED, () => { loaded = true; });
//       interstitial.addAdEventListener(AdEventType.CLOSED, () => {
//         loaded = false;
//         interstitial = null;
//       });
//       interstitial.addAdEventListener(AdEventType.ERROR, () => {
//         loaded = false;
//         interstitial = null;
//       });
//       interstitial.load();
//       return;
//     }
//     if (loaded) {
//       await interstitial.show();
//       loaded = false;
//       interstitial = null;
//     } else {
//       interstitial.load();
//     }
//   } catch (error) {
//     // Ads must never prevent players from leaving the result screen or starting another game.
//     console.warn("Game-completion ad unavailable:", error);
//   }
// }
