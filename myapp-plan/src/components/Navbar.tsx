import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useAppTheme } from "@/context/AppThemeContext";

export default function Navbar() {
  const { isDark, toggleTheme } = useAppTheme();
  const { width } = useWindowDimensions();

  const isMobile = width < 600;
  const isVerySmall = width < 360;

  // =========================================================
  // LOGGED USER — EXISTING LOGIC PRESERVED
  // =========================================================

  const [userName, setUserName] = useState("");

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");

      if (userData) {
        const user = JSON.parse(userData);

        const fullName = `${user?.fname || ""} ${user?.lname || ""}`.trim();

        setUserName(fullName || "User");
      } else {
        setUserName("");
      }
    } catch (error) {
      console.error("Navbar user error:", error);
    }
  };

  useEffect(() => {
    loadUser();

    const interval = setInterval(() => {
      loadUser();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const isLoggedIn = !!userName;

  // =========================================================
  // LOGO / HOME NAVIGATION — EXISTING LOGIC PRESERVED
  // =========================================================

  const handleLogoPress = () => {
    if (isLoggedIn) {
      router.replace("/user");
      return;
    }

    router.replace("/");
  };

  // =========================================================
  // LOGOUT — EXISTING LOGIC PRESERVED
  // =========================================================

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("rememberMe");

      setUserName("");

      console.log("USER LOGGED OUT");

      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // =========================================================
  // LOGIN — EXISTING LOGIC PRESERVED
  // =========================================================

  const handleLogin = () => {
    router.push("/login");
  };

  // =========================================================
  // COLORS
  // =========================================================

  const colors = {
    text: isDark ? "#F8FAFF" : "#FFFFFF",
    subtitle: isDark ? "#BFD4F8" : "#D7E7FF",
    iconBackground: isDark
      ? "rgba(255,255,255,0.10)"
      : "rgba(255,255,255,0.12)",
    iconBorder: isDark ? "rgba(173,205,255,0.12)" : "rgba(255,255,255,0.22)",
  };

  // =========================================================
  // NAVBAR UI
  // =========================================================

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingHorizontal: isMobile ? 5 : 18,
        },
      ]}
    >
      {/* Gradient outline around the complete navbar */}
      <LinearGradient
        colors={["#00CFFF", "#176BFF", "#7548FF", "#24375F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.borderGradient}
      >
        {/* Dark glass-style navbar background */}
        <View
          style={[
            styles.navbar,
            {
              backgroundColor: isDark ? "#050D20" : "#101A35",
            },
          ]}
        >
          {/* Subtle background lighting */}
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(0,184,255,0.10)",
              "rgba(6,15,37,0.01)",
              "rgba(109,64,255,0.10)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            // style={StyleSheet.absoluteFillObject}
          />

          {/* =================================================
              LEFT SIDE — LOGO AND BRAND
          ================================================= */}

          <Pressable
            onPress={handleLogoPress}
            accessibilityRole="button"
            accessibilityLabel="Go to home"
            style={({ pressed }) => [
              styles.logoSection,
              {
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            {/* Existing logo asset */}
            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/images/Untitled-1.gif")}
                resizeMode="contain"
                style={[
                  styles.logo,
                  {
                    width: isVerySmall ? 38 : isMobile ? 44 : 56,
                    height: isVerySmall ? 38 : isMobile ? 44 : 56,
                  },
                ]}
              />
            </View>

            {/* Brand text */}
            <View style={styles.brandContainer}>
              {isLoggedIn ? (
                <View style={styles.headerStatus}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[
                      styles.brandText,
                      {
                        fontSize: isMobile ? 15 : 21,
                        color: colors.text,
                        maxWidth: isMobile ? 115 : 220,
                      },
                    ]}
                  >
                    {userName}
                  </Text>
                  <View style={styles.headerStatusdot}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>ONLINE</Text>
                  </View>
                </View>
              ) : (
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[
                    styles.brandText,
                    {
                      fontSize: isMobile ? 18 : 25,
                      color: colors.text,
                    },
                  ]}
                >
                  {/* <Text style={styles.jayText}>Jay </Text> */}
                  <Text style={styles.techText}>Jay Technology</Text>
                  {/* <Text numberOfLines={1}
                    style={[
                      styles.brandSubtitle,
                      {
                        fontSize: isMobile ? 11 : 15,
                        color: colors.subtitle,
                        letterSpacing: isMobile ? 1.2 : 1.8,
                      },
                    ]}
                  >
                    Games Spot
                  </Text> */}
                </Text>
              )}
            </View>
          </Pressable>

          {/* =================================================
              RIGHT SIDE — THEME AND LOGIN / LOGOUT
          ================================================= */}

          <View style={styles.rightSection}>
            {/* Theme toggle */}
            <Pressable
              onPress={toggleTheme}
              accessibilityRole="button"
              accessibilityLabel={
                isDark ? "Switch to light theme" : "Switch to dark theme"
              }
              hitSlop={5}
              style={({ pressed }) => [
                styles.roundButton,
                {
                  width: isMobile ? 42 : 56,
                  height: isMobile ? 42 : 56,
                  borderRadius: isMobile ? 21 : 28,
                  backgroundColor: colors.iconBackground,
                  borderColor: colors.iconBorder,
                  transform: [{ scale: pressed ? 0.92 : 1 }],
                },
              ]}
            >
              <Ionicons
                name={isDark ? "sunny" : "moon"}
                size={isMobile ? 20 : 25}
                color={isDark ? "#FFD166" : "#BBD5FF"}
              />
            </Pressable>

            {/* Login / Logout */}
            <Pressable
              onPress={isLoggedIn ? handleLogout : handleLogin}
              accessibilityRole="button"
              accessibilityLabel={isLoggedIn ? "Logout" : "Login"}
              hitSlop={5}
              style={({ pressed }) => [
                styles.roundButton,
                {
                  width: isMobile ? 42 : 56,
                  height: isMobile ? 42 : 56,
                  borderRadius: isMobile ? 21 : 28,
                  backgroundColor: colors.iconBackground,
                  borderColor: colors.iconBorder,
                  transform: [{ scale: pressed ? 0.92 : 1 }],
                },
              ]}
            >
              {isLoggedIn ? (
                <MaterialCommunityIcons
                  name="logout"
                  size={isMobile ? 21 : 25}
                  color="#FFB8B8"
                />
              ) : (
                <Ionicons
                  name="person-outline"
                  size={isMobile ? 23 : 28}
                  color="#F5F7FF"
                />
              )}
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// =============================================================
// STYLES — GAMING GLASS / NEON DESIGN
// =============================================================

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingTop: 10,
    paddingBottom: 9,
  },

  borderGradient: {
    width: "100%",
    padding: 1.5,
    borderRadius: 36,
    shadowColor: "#087BFF",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.24,
    shadowRadius: 15,
    elevation: 8,
  },

  navbar: {
    minHeight: 76,
    width: "100%",
    borderRadius: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: "hidden",
  },

  logoSection: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 5,
  },

  logoContainer: {
    width: 54,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  logo: {
    borderRadius: 14,
  },

  brandContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingLeft: 7,
  },

  brandText: {
    fontWeight: "900",
    letterSpacing: -0.4,
    includeFontPadding: false,
    flexShrink: 1,
  },

  jayText: {
    color: "#F8FAFF",
    fontWeight: "900",
  },

  techText: {
    color: "#17CFFF",
    fontWeight: "900",
  },

  brandSubtitle: {
    flexDirection: "row",
    fontWeight: "600",
    marginTop: 3,
    includeFontPadding: false,
  },

  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    flexShrink: 0,
    paddingLeft: 4,
  },

  roundButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },

  headerStatus: {
    alignItems: "baseline",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  headerStatusdot: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 8,
  },

  headerStatustitle: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#00E6A2",
  },

  statusText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#B8D7FF",
    letterSpacing: 0.5,
  },
});
