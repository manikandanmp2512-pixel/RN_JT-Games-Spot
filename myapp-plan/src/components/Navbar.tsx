import AsyncStorage from "@react-native-async-storage/async-storage";
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

import { LinearGradient } from "expo-linear-gradient";

import { useAppTheme } from "@/context/AppThemeContext";

export default function Navbar() {
  const { isDark, toggleTheme } = useAppTheme();

  const { width } = useWindowDimensions();

  const isMobile = width < 600;

  // =========================================================
  // LOGGED USER
  // =========================================================

  const [userName, setUserName] = useState("");

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");

      if (userData) {
        const user = JSON.parse(userData);

        const fullName =
          `${user?.fname || ""} ${user?.lname || ""}`.trim();

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

  // =========================================================
  // LOGGED-IN CHECK
  // =========================================================

  const isLoggedIn = !!userName;

  // =========================================================
  // LOGO / HOME NAVIGATION
  // =========================================================

  const handleLogoPress = () => {
    // =======================================================
    // IF USER IS LOGGED IN
    // DON'T GO TO MAIN INDEX
    // STAY ON USER PAGE
    // =======================================================

    if (isLoggedIn) {
      router.replace("/user");
      return;
    }

    // =======================================================
    // IF USER IS NOT LOGGED IN
    // GO TO MAIN HOME
    // =======================================================

    router.replace("/");
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    try {
      // =======================================================
      // REMOVE LOGIN DATA
      // =======================================================

      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("rememberMe");

      // =======================================================
      // CLEAR USERNAME
      // =======================================================

      setUserName("");

      console.log("✅ USER LOGGED OUT");

      // =======================================================
      // GO TO MAIN INDEX
      // =======================================================

      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin = () => {
    router.push("/login");
  };

  // =========================================================
  // COLORS
  // =========================================================

  const colors = {
    text: isDark ? "#FFFFFF" : "#111827",

    logo: isDark ? "#FFFFFF" : "#111827",

    tech: isDark ? "#C4B5FD" : "#6D28D9",

    themeBackground: isDark
      ? "rgba(255,255,255,0.14)"
      : "rgba(255,255,255,0.45)",
  };

  // =========================================================
  // SCREEN
  // =========================================================

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingHorizontal: isMobile ? 10 : 20,
        },
      ]}
    >
      {/* =====================================================
          NAVBAR BACKGROUND
      ===================================================== */}

      <LinearGradient
        colors={
          isDark
            ? [
                "#0F172A",
                "#1E3A8A",
                "#4C1D95",
                "#7C3AED",
              ]
            : [
                "#6c8bf4",
                "#DBEAFE",
                "#C4B5FD",
                "#9279f7",
              ]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.navbar}
      >
        {/* ===================================================
            LOGO + USER NAME / JAY TECH
        =================================================== */}

        <Pressable
          onPress={handleLogoPress}
          style={({ pressed }) => [
            styles.logoSection,
            {
              opacity: pressed ? 0.65 : 1,
            },
          ]}
        >
          {/* LOGO */}

          <Image
            source={require("@/assets/images/Untitled-1.gif")}
            resizeMode="contain"
            style={[
              styles.logo,
              {
                width: isMobile ? 42 : 50,
                height: isMobile ? 42 : 50,
              },
            ]}
          />

          {/* DIVIDER */}

          <View
            style={[
              styles.divider,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.35)"
                  : "rgba(79,70,229,0.25)",
              },
            ]}
          />

          {/* =================================================
              LOGGED USER NAME / JAY TECH
          ================================================= */}

          {userName ? (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.brandText,
                {
                  fontSize: isMobile ? 17 : 22,
                  color: colors.text,
                  maxWidth: isMobile ? 125 : 250,
                },
              ]}
            >
              {userName}
            </Text>
          ) : (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.brandText,
                {
                  fontSize: isMobile ? 18 : 23,
                  color: colors.text,
                },
              ]}
            >
              <Text style={styles.jayText}>
                JAY
              </Text>

              <Text
                style={[
                  styles.techText,
                  {
                    color: colors.tech,
                  },
                ]}
              >
                {" "}
                TECH
              </Text>
            </Text>
          )}
        </Pressable>

        {/* ===================================================
            RIGHT SIDE
        =================================================== */}

        <View style={styles.rightSection}>
          {/* =================================================
              THEME BUTTON
          ================================================= */}

          <Pressable
            onPress={toggleTheme}
            style={({ pressed }) => [
              styles.themeButton]}
          >
            <Text style={styles.themeIcon}>
              {isDark ? "☀️" : "🌙"}
            </Text>
          </Pressable>

          {/* =================================================
              LOGIN / LOGOUT BUTTON
          ================================================= */}

          <Pressable
            onPress={
              isLoggedIn
                ? handleLogout
                : handleLogin
            }
            style={({ pressed }) => [
              styles.loginButton,
              {
                transform: [
                  {
                    scale: pressed ? 0.96 : 1,
                  },
                ],
              },
            ]}
          >
            <Text style={styles.loginIcon}>
              {isLoggedIn ? "🚪" : "👤"}
            </Text>

            <Text
              style={[
                styles.loginText,
                {
                  fontSize: isMobile ? 12 : 14,
                },
              ]}
            >
              {isLoggedIn ? "Logout" : "Login"}
            </Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

// =============================================================
// STYLES
// =============================================================

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 25,

    width: "100%",

    height: 92,

    justifyContent: "center",
  },

  navbar: {
    width: "100%",

    height: 68,

    borderRadius: 22,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    paddingHorizontal: 10,

    overflow: "hidden",

    shadowColor: "#6366F1",

    shadowOffset: {
      width: 0,

      height: 8,
    },

    shadowRadius: 18,

    shadowOpacity: 0.35,

    elevation: 10,
  },

  logoSection: {
    flexDirection: "row",

    alignItems: "center",

    flexShrink: 1,

    minWidth: 0,
  },

  logo: {
    borderRadius: 12,
  },

  divider: {
    width: 1,

    height: 34,

    marginHorizontal: 8,

    opacity: 0.8,
  },

  brandText: {
    fontWeight: "900",

    letterSpacing: 1.2,

    includeFontPadding: false,

    flexShrink: 1,
  },

  jayText: {
    fontWeight: "900",

    letterSpacing: 1.5,
  },

  techText: {
    fontWeight: "900",

    letterSpacing: 2,
  },

  rightSection: {
    flexDirection: "row",

    alignItems: "center",

    gap: 8,

    flexShrink: 0,
  },

  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },

  themeIcon: {
    fontSize: 20,
  },

  loginButton: {
    minWidth: 60,

    height: 42,

    paddingHorizontal: 12,

    borderRadius: 14,

    backgroundColor: "#020789",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 5,

    shadowColor: "#8B5CF6",

    shadowOffset: {
      width: 0,

      height: 4,
    },

    shadowRadius: 10,

    shadowOpacity: 0.5,

    elevation: 7,
  },

  loginIcon: {
    color: "#ede6e6",

    fontSize: 15,
  },

  loginText: {
    color: "#FFFFFF",

    fontWeight: "800",

    letterSpacing: 0.5,
  },
});