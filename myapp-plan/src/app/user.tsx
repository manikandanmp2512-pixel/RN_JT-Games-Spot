import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Navbar from "@/components/Navbar";
import { useAppTheme } from "@/context/AppThemeContext";

export default function UserScreen() {
  const { isDark } = useAppTheme();

  const [userName, setUserName] = useState("User");

  // =========================================================
  // THEME COLORS
  // =========================================================

  const colors = {
    background: isDark
      ? "#071E2B"
      : "#F5F7FA",

    card: isDark
      ? "#17394B"
      : "#FFFFFF",

    border: isDark
      ? "#2C596B"
      : "#D7E1E6",

    title: isDark
      ? "#FFFFFF"
      : "#071E2B",

    subtitle: isDark
      ? "#9DB5C0"
      : "#607784",

    gameTitle: "#FFFFFF",

    gameSubtitle: isDark
      ? "#C6D5DC"
      : "#E6EEF2",

    iconBackground: isDark
      ? "rgba(244,160,0,0.18)"
      : "rgba(244,160,0,0.14)",

    iconBorder: isDark
      ? "rgba(244,160,0,0.35)"
      : "rgba(244,160,0,0.30)",

    footer: isDark
      ? "#7894A2"
      : "#708692",

    shadow: "#000000",
  };

  // =========================================================
  // LOAD LOGGED USER
  // =========================================================

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData =
          await AsyncStorage.getItem("user");

        if (userData) {
          const user = JSON.parse(userData);

          const fullName =
            `${user?.fname || ""} ${
              user?.lname || ""
            }`.trim();

          setUserName(fullName || "User");
        }
      } catch (error) {
        console.error(
          "User loading error:",
          error
        );
      }
    };

    loadUser();
  }, []);

  // =========================================================
  // PREVENT BACK TO MAIN INDEX WHILE LOGGED IN
  // =========================================================

  useEffect(() => {
    const onBackPress = () => {
      console.log(
        "🔒 User is logged in - staying on User Page"
      );

      return true;
    };

    const backHandler =
      BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

    return () => {
      backHandler.remove();
    };
  }, []);

  // =========================================================
  // GAME NAVIGATION
  // =========================================================

  const openChess = () => {
    router.push("/chess");
  };

  const openCarrom = () => {
    router.push("/carrom");
  };

  const openLudo = () => {
    router.push("/ludo");
  };

  // =========================================================
  // SCREEN
  // =========================================================

  return (
    <View
      style={[
        styles.containers,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <Navbar />

      {/* =====================================================
          USER PAGE CONTENT
      ===================================================== */}

      <View style={styles.content}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* =================================================
              TOP ACCENT
          ================================================= */}

          <View style={styles.topAccent} />

          {/* =================================================
              WELCOME
          ================================================= */}

          <Text
            style={[
              styles.title,
              {
                color: colors.title,
              },
            ]}
          >
            Welcome, {userName}! 🎉
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.subtitle,
              },
            ]}
          >
            Choose your game and start playing.
          </Text>

          {/* =================================================
              CHESS
          ================================================= */}

          <Pressable
            style={({ pressed }) => [
              styles.gameButton,
              styles.chessButton,
              {
                borderColor: colors.border,
              },
              pressed && styles.pressedButton,
            ]}
            onPress={openChess}
          >
            <View
              style={[
                styles.gameIcon,
                {
                  backgroundColor:
                    colors.iconBackground,
                  borderColor:
                    colors.iconBorder,
                },
              ]}
            >
              <Text style={styles.iconText}>
                ♟️
              </Text>
            </View>

            <View style={styles.gameContent}>
              <Text
                style={[
                  styles.gameTitle,
                  {
                    color: colors.gameTitle,
                  },
                ]}
              >
                Play Chess
              </Text>

              <Text
                style={[
                  styles.gameSubtitle,
                  {
                    color:
                      colors.gameSubtitle,
                  },
                ]}
              >
                Classic strategy game
              </Text>
            </View>

            <Text style={styles.arrow}>
              →
            </Text>
          </Pressable>

          {/* =================================================
              CARROM
          ================================================= */}

          <Pressable
            style={({ pressed }) => [
              styles.gameButton,
              styles.carromButton,
              {
                borderColor: colors.border,
              },
              pressed && styles.pressedButton,
            ]}
            onPress={openCarrom}
          >
            <View
              style={[
                styles.gameIcon,
                {
                  backgroundColor:
                    colors.iconBackground,
                  borderColor:
                    colors.iconBorder,
                },
              ]}
            >
              <Text style={styles.iconText}>
                🎯
              </Text>
            </View>

            <View style={styles.gameContent}>
              <Text
                style={[
                  styles.gameTitle,
                  {
                    color: colors.gameTitle,
                  },
                ]}
              >
                Play Carrom
              </Text>

              <Text
                style={[
                  styles.gameSubtitle,
                  {
                    color:
                      colors.gameSubtitle,
                  },
                ]}
              >
                Strike, score & win
              </Text>
            </View>

            <Text style={styles.arrow}>
              →
            </Text>
          </Pressable>

          {/* =================================================
              LUDO
          ================================================= */}

          <Pressable
            style={({ pressed }) => [
              styles.gameButton,
              styles.ludoButton,
              {
                borderColor: colors.border,
              },
              pressed && styles.pressedButton,
            ]}
            onPress={openLudo}
          >
            <View
              style={[
                styles.gameIcon,
                {
                  backgroundColor:
                    colors.iconBackground,
                  borderColor:
                    colors.iconBorder,
                },
              ]}
            >
              <Text style={styles.iconText}>
                🎲
              </Text>
            </View>

            <View style={styles.gameContent}>
              <Text
                style={[
                  styles.gameTitle,
                  {
                    color: colors.gameTitle,
                  },
                ]}
              >
                Play Ludo
              </Text>

              <Text
                style={[
                  styles.gameSubtitle,
                  {
                    color:
                      colors.gameSubtitle,
                  },
                ]}
              >
                Roll the dice & race
              </Text>
            </View>

            <Text style={styles.arrow}>
              →
            </Text>
          </Pressable>

          {/* =================================================
              FOOTER
          ================================================= */}

          <Text
            style={[
              styles.footerText,
              {
                color: colors.footer,
              },
            ]}
          >
            © Jay Tech
          </Text>
        </View>
      </View>
    </View>
  );
}

// =============================================================
// STYLES
// =============================================================

const styles = StyleSheet.create({
  // ===========================================================
  // CONTAINER
  // ===========================================================

  containers: {
    marginTop: 30,
    flex: 1,
  },

  // ===========================================================
  // CONTENT
  // ===========================================================

  content: {
    flex: 1,

    justifyContent: "center",

    alignItems: "center",

    padding: 20,
  },

  // ===========================================================
  // MAIN CARD
  // ===========================================================

  card: {
    width: "100%",

    maxWidth: 450,

    padding: 24,

    borderRadius: 22,

    borderWidth: 1,

    elevation: 8,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.20,

    shadowRadius: 8,

    alignItems: "center",
  },

  // ===========================================================
  // TOP ACCENT
  // ===========================================================

  topAccent: {
    width: 65,

    height: 5,

    borderRadius: 5,

    backgroundColor: "#F4A000",

    marginBottom: 18,
  },

  // ===========================================================
  // TITLE
  // ===========================================================

  title: {
    fontSize: 27,

    fontWeight: "900",

    textAlign: "center",

    marginBottom: 7,
  },

  // ===========================================================
  // SUBTITLE
  // ===========================================================

  subtitle: {
    fontSize: 14,

    textAlign: "center",

    marginBottom: 24,

    lineHeight: 20,
  },

  // ===========================================================
  // GAME BUTTON
  // ===========================================================

  gameButton: {
    width: "100%",

    height: 78,

    borderRadius: 16,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 14,

    marginBottom: 13,

    borderWidth: 1,

    elevation: 5,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.18,

    shadowRadius: 5,
  },

  // ===========================================================
  // CHESS
  // ===========================================================

  chessButton: {
    backgroundColor: "#24536A",
  },

  // ===========================================================
  // CARROM
  // ===========================================================

  carromButton: {
    backgroundColor: "#7A5318",
  },

  // ===========================================================
  // LUDO
  // ===========================================================

  ludoButton: {
    backgroundColor: "#4B3A73",
  },

  // ===========================================================
  // ICON
  // ===========================================================

  gameIcon: {
    width: 50,

    height: 50,

    borderRadius: 15,

    alignItems: "center",

    justifyContent: "center",

    borderWidth: 1,
  },

  iconText: {
    fontSize: 27,
  },

  // ===========================================================
  // GAME CONTENT
  // ===========================================================

  gameContent: {
    flex: 1,

    marginLeft: 13,
  },

  gameTitle: {
    fontSize: 18,

    fontWeight: "900",
  },

  gameSubtitle: {
    fontSize: 11,

    marginTop: 3,
  },

  // ===========================================================
  // ARROW
  // ===========================================================

  arrow: {
    color: "#F4A000",

    fontSize: 27,

    fontWeight: "800",

    marginRight: 5,
  },

  // ===========================================================
  // PRESS EFFECT
  // ===========================================================

  pressedButton: {
    opacity: 0.75,

    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  // ===========================================================
  // FOOTER
  // ===========================================================

  footerText: {
    fontSize: 12,

    marginTop: 6,

    fontWeight: "600",
  },
});