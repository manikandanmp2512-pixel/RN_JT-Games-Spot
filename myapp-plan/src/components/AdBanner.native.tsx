
import React from "react";
import { StyleSheet, View } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";

const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : "ca-app-pub-6072789118330129/5464362397";

export default function AdBanner() {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
          console.warn("AdMob banner failed to load:", error.message);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    backgroundColor: "#080D1B",
  },
});
