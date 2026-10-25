
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

export default function AdBanner() {
  // The web version intentionally renders no native AdMob component.
  if (Platform.OS === "web") return null;

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minHeight: 0,
  },
});
