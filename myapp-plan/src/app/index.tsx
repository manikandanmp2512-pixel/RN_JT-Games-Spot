import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import Navbar from "@/components/Navbar";
import { useAppTheme } from "@/context/AppThemeContext";

export default function Index() {
  const { isDark } = useAppTheme();
  const { width } = useWindowDimensions();

  const [checkingLogin, setCheckingLogin] = useState(true);

  const isMobile = width < 600;
  const isSmall = width < 380;

  // =========================================================
  // LOGIN VERIFICATION — ORIGINAL LOGIC PRESERVED
  // =========================================================

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        if (!token) return;

        const payloadPart = token.split(".")[1];

        if (!payloadPart) {
          await AsyncStorage.multiRemove(["token", "user"]);
          return;
        }

        const base64 = payloadPart
          .replace(/-/g, "+")
          .replace(/_/g, "/");

        const paddedBase64 = base64.padEnd(
          Math.ceil(base64.length / 4) * 4,
          "="
        );

        const payload = JSON.parse(atob(paddedBase64));

        const expired =
          typeof payload.exp !== "number" ||
          payload.exp <= Math.floor(Date.now() / 1000);

        if (expired) {
          await AsyncStorage.multiRemove(["token", "user"]);
          return;
        }

        router.replace("/user");
      } catch (error) {
        console.error("Login check error:", error);

        await AsyncStorage.multiRemove(["token", "user"]).catch(
          (storageError) => {
            console.error(
              "Could not clear invalid session:",
              storageError
            );
          }
        );
      } finally {
        setCheckingLogin(false);
      }
    };

    checkLogin();
  }, []);

  // =========================================================
  // LOGIN LOADING SCREEN
  // =========================================================

  if (checkingLogin) {
    return (
      <ImageBackground
        source={require("@/assets/images/background.png")}
        resizeMode="cover"
        style={styles.background}
      >
        <View style={styles.loadingOverlay}>
          <LinearGradient
            colors={["#00CFFF", "#4B5BFF", "#8B42FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loadingBorder}
          >
            <View style={styles.loadingCard}>
              <LinearGradient
                colors={["#00D9FF", "#087BFF", "#783BFF"]}
                style={styles.loadingIconBorder}
              >
                <View style={styles.loadingIconInner}>
                  <MaterialCommunityIcons
                    name="gamepad-variant"
                    size={42}
                    color="#FFFFFF"
                  />
                </View>
              </LinearGradient>

              <Text style={styles.loadingTitle}>
                JAY <Text style={styles.cyan}>TECH</Text>
              </Text>

              <Text style={styles.loadingBrandSubtitle}>
                G A M E S   S P O T
              </Text>

              <ActivityIndicator
                size="large"
                color="#13D4FF"
                style={styles.loadingSpinner}
              />

              <Text style={styles.loadingMessage}>
                Checking your login status...
              </Text>

              <View style={styles.loadingTrack}>
                <LinearGradient
                  colors={["#00D9FF", "#367BFF", "#8B46FF"]}
                  style={styles.loadingProgress}
                />
              </View>
            </View>
          </LinearGradient>
        </View>
      </ImageBackground>
    );
  }

  // =========================================================
  // HOME PAGE
  // =========================================================

  return (
    <ImageBackground
      source={require("@/assets/images/background.png")}
      resizeMode="cover"
      style={styles.background}
    >
      {/* Background tint without StyleSheet.absoluteFillObject */}
      <View
        pointerEvents="none"
        style={[
          styles.backgroundOverlay,
          {
            backgroundColor: isDark
              ? "rgba(1, 5, 20, 0.48)"
              : "rgba(2, 10, 28, 0.35)",
          },
        ]}
      />

      <View style={styles.page}>
        {/* Existing navbar — login, logout and theme logic preserved */}
        <Navbar />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* MAIN NEON CARD */}
          <View
            style={[
              styles.heroWrapper,
              {
                maxWidth: width >= 1000 ? 900 : 760,
              },
            ]}
          >
            <LinearGradient
              colors={["#00D9FF", "#087DFF", "#7844FF", "#FFC04C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroBorder}
            >
              <View style={styles.hero}>
                {/* Decorative lighting */}
                <View
                  pointerEvents="none"
                  style={styles.topGlow}
                />
                <View
                  pointerEvents="none"
                  style={styles.bottomGlow}
                />

                <LinearGradient
                  colors={[
                    "rgba(0, 166, 255, 0.10)",
                    "rgba(4, 12, 31, 0.02)",
                    "rgba(116, 54, 255, 0.10)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroTint}
                />

                {/* PLAY / CONNECT / COMPETE badge */}
                <View style={styles.badge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.badgeText}>PLAY</Text>
                  <Text style={styles.badgeSeparator}>•</Text>
                  <Text style={styles.badgeText}>CONNECT</Text>
                  <Text style={styles.badgeSeparator}>•</Text>
                  <Text style={[styles.badgeText, styles.cyan]}>
                    COMPLETE
                  </Text>
                </View>

                {/* Heading */}
                <Text
                  style={[
                    styles.welcomeText,
                    { fontSize: isSmall ? 23 : 29 },
                  ]}
                >
                  Welcome to
                </Text>

                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={[
                    styles.jayTechTitle,
                    {
                      fontSize: isSmall ? 47 : width >= 800 ? 78 : 65,
                    },
                  ]}
                >
                  Jay Tech
                </Text>

                <Text
                  style={[
                    styles.gamesSpotTitle,
                    { fontSize: isSmall ? 28 : 36 },
                  ]}
                >
                  Games Spot
                </Text>

                <Text style={styles.subtitle}>
                  Connect with Your Friends
                </Text>

                <Text style={styles.description}>
                  Play your favorite games, connect with friends,
                  {"\n"}and bring your competitive spirit to life.
                </Text>

                {/* FEATURE CARDS */}
                <View
                  style={[
                    styles.features,
                    { gap: isSmall ? 7 : 12 },
                  ]}
                >
                  {/* PLAY */}
                  <View style={[styles.featureCard, styles.playCard]}>
                    <LinearGradient
                      colors={[
                        "rgba(0, 190, 255, 0.22)",
                        "rgba(0, 70, 150, 0.12)",
                      ]}
                      style={[styles.featureIcon, styles.playIcon]}
                    >
                      <MaterialCommunityIcons
                        name="gamepad-variant"
                        size={isSmall ? 31 : 40}
                        color="#20D5FF"
                      />
                    </LinearGradient>

                    <Text style={styles.playHeading}>PLAY</Text>

                    <Text style={styles.featureDescription}>
                      Enjoy your{"\n"}favorite games
                    </Text>

                    <LinearGradient
                      colors={["#00D9FF", "#087DFF"]}
                      style={styles.featureLine}
                    />
                  </View>

                  {/* CONNECT */}
                  <View style={[styles.featureCard, styles.connectCard]}>
                    <LinearGradient
                      colors={[
                        "rgba(132, 71, 255, 0.25)",
                        "rgba(67, 29, 145, 0.12)",
                      ]}
                      style={[styles.featureIcon, styles.connectIcon]}
                    >
                      <Ionicons
                        name="people"
                        size={isSmall ? 30 : 38}
                        color="#B88AFF"
                      />
                    </LinearGradient>

                    <Text style={styles.connectHeading}>CONNECT</Text>

                    <Text style={styles.featureDescription}>
                      Challenge and{"\n"}make friends
                    </Text>

                    <LinearGradient
                      colors={["#B16BFF", "#6C39FF"]}
                      style={styles.featureLine}
                    />
                  </View>

                  {/* COMPETE */}
                  <View style={[styles.featureCard, styles.competeCard]}>
                    <LinearGradient
                      colors={[
                        "rgba(255, 185, 56, 0.22)",
                        "rgba(133, 77, 13, 0.12)",
                      ]}
                      style={[styles.featureIcon, styles.competeIcon]}
                    >
                      <Ionicons
                        name="trophy"
                        size={isSmall ? 29 : 36}
                        color="#FFC44D"
                      />
                    </LinearGradient>

                    <Text style={styles.competeHeading}>COMPETE</Text>

                    <Text style={styles.featureDescription}>
                      Improve and{"\n"}celebrate wins
                    </Text>

                    <LinearGradient
                      colors={["#FFD56A", "#FF9E23"]}
                      style={styles.featureLine}
                    />
                  </View>
                </View>

                {/* COMMUNITY STRIP */}
                <View style={styles.communityStrip}>
                  <View style={styles.communityLine} />
                  <View style={styles.liveDot} />

                  <Text style={styles.communityText}>
                    YOUR GAME.{" "}
                    <Text style={styles.cyan}>YOUR COMMUNITY.</Text>
                  </Text>

                  <View style={styles.liveDot} />
                  <View style={styles.communityLine} />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <View style={styles.footerDecoration}>
              <LinearGradient
                colors={["transparent", "#168EFF"]}
                style={styles.footerLine}
              />

              <MaterialCommunityIcons
                name="diamond-stone"
                size={22}
                color="#16CFFF"
              />

              <LinearGradient
                colors={["#168EFF", "transparent"]}
                style={styles.footerLine}
              />
            </View>

            <Text style={styles.copyright}>
              © 2026 {"  "}Developed by{" "}
              <Text style={styles.developer}>
                Manikandan M
              </Text>
            </Text>

            <Text style={styles.footerCaption}>
              BUILT WITH PASSION {"  "}•{"  "} MADE FOR GAMERS
            </Text>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

// =============================================================
// STYLES
// =============================================================

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#020817",
  },

  backgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  page: {
    flex: 1,
    paddingHorizontal: 12,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingTop: 16,
    paddingBottom: 25,
  },

  heroWrapper: {
    width: "100%",
    alignSelf: "center",
    borderRadius: 34,
    shadowColor: "#087BFF",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 13,
  },

  heroBorder: {
    padding: 2,
    borderRadius: 34,
  },

  hero: {
    position: "relative",
    alignItems: "center",
    backgroundColor: "rgba(2, 10, 28, 0.97)",
    borderRadius: 32,
    paddingHorizontal: 17,
    paddingTop: 29,
    paddingBottom: 23,
    overflow: "hidden",
  },

  heroTint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  topGlow: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 110,
    top: -140,
    right: -100,
    backgroundColor: "rgba(117, 56, 255, 0.14)",
  },

  bottomGlow: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 100,
    bottom: -125,
    left: -95,
    backgroundColor: "rgba(0, 190, 255, 0.12)",
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 7,
    borderWidth: 1.3,
    borderColor: "#087FFF",
    backgroundColor: "rgba(1, 20, 45, 0.92)",
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 25,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: "#00E5A0",
  },

  badgeText: {
    color: "#E0ECFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  badgeSeparator: {
    color: "#6F9ED1",
    fontSize: 12,
    fontWeight: "900",
  },

  cyan: {
    color: "#16D4FF",
  },

  welcomeText: {
    color: "#F7F9FF",
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.2,
  },

  jayTechTitle: {
    color: "#20C8FF",
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -1.6,
    textShadowColor: "rgba(0, 161, 255, 0.30)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 13,
  },

  gamesSpotTitle: {
    color: "#FFC653",
    fontWeight: "900",
    textAlign: "center",
    marginTop: -1,
    textShadowColor: "rgba(255, 160, 25, 0.24)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 9,
  },

  subtitle: {
    color: "#B7D0F8",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 13,
  },

  description: {
    color: "#B7CDEB",
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 11,
    marginBottom: 25,
  },

  features: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "center",
  },

  featureCard: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 3,
    paddingTop: 15,
    paddingBottom: 14,
    borderWidth: 1.3,
    borderRadius: 20,
    overflow: "hidden",
  },

  playCard: {
    backgroundColor: "rgba(0, 111, 220, 0.12)",
    borderColor: "#087FFF",
  },

  connectCard: {
    backgroundColor: "rgba(101, 48, 215, 0.13)",
    borderColor: "#7946FF",
  },

  competeCard: {
    backgroundColor: "rgba(171, 103, 15, 0.12)",
    borderColor: "#C68A2B",
  },

  featureIcon: {
    width: 62,
    height: 62,
    maxWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1.2,
  },

  playIcon: {
    borderColor: "#008FFF",
  },

  connectIcon: {
    borderColor: "#8049FF",
  },

  competeIcon: {
    borderColor: "#D39A36",
  },

  playHeading: {
    color: "#23D2FF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  connectHeading: {
    color: "#C7A4FF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.1,
  },

  competeHeading: {
    color: "#FFD06D",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.1,
  },

  featureDescription: {
    color: "#C4D6F4",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 7,
  },

  featureLine: {
    width: 36,
    height: 3,
    borderRadius: 5,
    marginTop: 13,
  },

  communityStrip: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 25,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(48, 112, 198, 0.40)",
  },

  communityLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#1175B8",
  },

  communityText: {
    color: "#D6E6FF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  footer: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 650,
    alignItems: "center",
    paddingHorizontal: 8,
    marginTop: 20,
  },

  footerDecoration: {
    width: "68%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 11,
  },

  footerLine: {
    flex: 1,
    height: 1.5,
  },

  copyright: {
    color: "#E1EAFF",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },

  developer: {
    color: "#16D4FF",
    fontWeight: "900",
  },

  footerCaption: {
    color: "#8FAED8",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 7,
  },

  // Loading screen
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
    backgroundColor: "rgba(0, 5, 20, 0.35)",
  },

  loadingBorder: {
    width: "100%",
    maxWidth: 460,
    padding: 1.5,
    borderRadius: 30,
  },

  loadingCard: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 30,
    backgroundColor: "rgba(2, 10, 29, 0.97)",
    borderRadius: 29,
    overflow: "hidden",
  },

  loadingIconBorder: {
    width: 94,
    height: 94,
    padding: 5,
    borderRadius: 50,
  },

  loadingIconInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#06152D",
    borderRadius: 45,
  },

  loadingTitle: {
    color: "#F8FAFF",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 18,
  },

  loadingBrandSubtitle: {
    color: "#16D4FF",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 5,
  },

  loadingSpinner: {
    marginTop: 24,
  },

  loadingMessage: {
    color: "#BDD5F5",
    fontSize: 13,
    textAlign: "center",
    marginTop: 15,
  },

  loadingTrack: {
    width: "100%",
    height: 7,
    borderRadius: 6,
    backgroundColor: "#123050",
    overflow: "hidden",
    marginTop: 20,
  },

  loadingProgress: {
    width: "82%",
    height: "100%",
    borderRadius: 6,
  },
});
