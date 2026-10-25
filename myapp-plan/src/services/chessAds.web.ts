/**
 * Web implementation.
 * Google Mobile Ads native modules are not supported on web.
 */

export async function initializeChessAds(): Promise<void> {
  // Ads disabled on web.
}

export async function showGameCompletionAd(): Promise<void> {
  // Ads disabled on web.
}

export async function showChessInterstitialAd(): Promise<void> {
  // Ads disabled on web.
}

export async function showChessRewardedAd(): Promise<boolean> {
  return false;
}

export default {
  initializeChessAds,
  showGameCompletionAd,
  showChessInterstitialAd,
  showChessRewardedAd,
};