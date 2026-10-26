import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  BackHandler,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Navbar from "@/components/Navbar";
import { useAppTheme } from "@/context/AppThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const GAMES = [
  {
    id: "chess",
    title: "CHESS",
    category: "STRATEGY GAME",
    route: "/chess" as const,
    icon: "extension-puzzle" as const,
    colors: ["#031D3D", "#06112C"] as const,
    neon: "#00C8FF",
    glow: "#087BFF",
  },
  {
    id: "carrom",
    title: "CARROM",
    category: "PRECISION GAME",
    route: "/carrom" as const,
    icon: "disc" as const,
    colors: ["#20104A", "#100C2A"] as const,
    neon: "#A65CFF",
    glow: "#6527FF",
  },
  {
    id: "ludo",
    title: "LUDO",
    category: "CLASSIC GAME",
    route: "/ludo" as const,
    icon: "dice" as const,
    colors: ["#33200B", "#171126"] as const,
    neon: "#FFB52E",
    glow: "#FF7B16",
  },
];

export default function UserScreen() {
  const { isDark } = useAppTheme();

  const [username, setUsername] = useState("Player");
  const [initial, setInitial] = useState("P");

  useEffect(() => {
    let mounted = true;

    const loadUsername = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");

        if (!storedUser) return;

        const user = JSON.parse(storedUser);
        const fname = String(user?.fname ?? "").trim();
        const lname = String(user?.lname ?? "").trim();
        const fullName = `${fname} ${lname}`.trim();

        if (mounted && fullName) {
          setUsername(fullName);
          setInitial(fname.charAt(0).toUpperCase() || "P");
        }
      } catch (error) {
        console.log("Unable to load user details:", error);
      }
    };

    loadUsername();

    return () => {
      mounted = false;
    };
  }, []);

  // Preserve the existing Android back-button behavior.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    return () => subscription.remove();
  }, []);

  const openGame = useCallback((route: "/chess" | "/carrom" | "/ludo") => {
    router.push(route);
  }, []);

  const pageBg = isDark ? "#020817" : "#07152A";
  const textColor = "#F5F8FF";
  const mutedColor = "#A7C4EA";

  return (
    <View style={[styles.screen, { backgroundColor: pageBg }]}>
      <StatusBar barStyle="light-content" backgroundColor={pageBg} />

      <View style={styles.navContainer}>
        <Navbar />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerInner}>
          {/* <View style={styles.profileOuter}>
            <View style={styles.profileInner}>
              <Text style={styles.profileInitial}>{initial}</Text>
            </View>
          </View> */}
        </View>

        {/* NEON BRAND HEADER */}
        {/* <LinearGradient
          colors={["#007DFF", "#273A92", "#11182F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerOuter}
        >
          <View style={styles.headerInner}>
            

            <View style={styles.brandCopy}>
              <Text style={styles.brandTitle}>
                Jay <Text style={styles.brandBlue}>Tech</Text>
              </Text>
              <Text style={styles.brandSubtitle}>GAMES SPOT</Text>
            </View>


          </View>
        </LinearGradient> */}

        {/* HERO GAMING PANEL */}
        <LinearGradient
          colors={["#008DFF", "#333BFF", "#8B42FF", "#FFAA35"]}
          locations={[0, 0.36, 0.72, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBorder}
        >
          <View style={styles.heroPanel}>
            <View style={styles.heroDecorOne} />
            <View style={styles.heroDecorTwo} />

            <View style={styles.heroPill}>
              <View style={styles.heroPillDot} />
              <Text style={styles.heroPillText}>
                PLAY {"\u2022"} CONNECT {"\u2022"} COMPLETE
              </Text>
            </View>

            <Text style={styles.welcomeHeading}>
              <Text style={styles.heroJay}>Jay Tech</Text>
            </Text>
            <Text style={styles.heroSubheading}>Games Spot  <LinearGradient
              colors={["#021553", "#059ab8", "#210165"]}
              style={styles.brandIcon}
            >
              <Ionicons name="game-controller" size={32} color="#FFFFFF" />
            </LinearGradient>
            </Text>
            <View style={styles.heroAccentLine}>
              <View style={styles.accentLine} />
              <Ionicons name="sparkles" size={17} color="#00D9FF" />
              <View style={styles.accentLine} />
            </View>

            {/* GAME CARDS */}
            <View style={styles.gameList}>
              {GAMES.map((game, index) => (
                <Pressable
                  key={game.id}
                  onPress={() => openGame(game.route)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${game.title}`}
                  style={({ pressed }) => [
                    styles.gameCardWrapper,
                    pressed && styles.pressed,
                  ]}
                >
                  <LinearGradient
                    colors={[game.neon, game.glow, game.neon]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gameBorder}
                  >
                    <LinearGradient
                      colors={[game.colors[0], game.colors[1]]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gameCard}
                    >
                      {/* <View style={styles.gameCardTop}>
                        <Text style={styles.gameNumber}>0{index + 1}</Text>
                        <Ionicons
                          name="arrow-up-outline"
                          size={18}
                          color={game.neon}
                          style={styles.diagonalArrow}
                        />
                      </View> */}

                      <View
                        style={[
                          styles.gameIconCircle,
                          {
                            borderColor: game.neon,
                            shadowColor: game.neon,
                          },
                        ]}
                      >
                        {game.id === "chess" ? (
                          <MaterialCommunityIcons
                            name="chess-knight"
                            size={36}
                            color="#00C8FF"
                          />
                        ) : game.id === "carrom" ? (
                          <MaterialCommunityIcons
                            name="bullseye"
                            size={36}
                            color="#A65CFF"
                          />
                        ) : (
                          <MaterialCommunityIcons
                            name="dice-multiple"
                            size={36}
                            color="#FFB52E"
                          />
                        )}
                        {/* <Ionicons
                          name={game.icon}
                          size={35}
                          color={game.neon}
                        /> */}
                      </View>

                      <Text style={[styles.gameTitle, { color: game.neon }]}>
                        {game.title}
                      </Text>

                      <Text style={[styles.gameCategory, { color: game.neon }]}>
                        {game.category}
                      </Text>

                      <View
                        style={[
                          styles.gameUnderline,
                          { backgroundColor: game.neon },
                        ]}
                      />
                    </LinearGradient>
                  </LinearGradient>
                </Pressable>
              ))}
            </View>

            {/* COMMUNITY MESSAGE */}
            <View style={styles.communityDivider} />

            <View style={styles.communityRow}>
              <View style={styles.communityDot} />

              <Text style={styles.communityText}>
                YOUR GAME.{" "}
                <Text style={styles.communityHighlight}>YOUR COMMUNITY.</Text>
              </Text>

              <View style={styles.communityDot} />
            </View>
          </View>
        </LinearGradient>

        {/* FOOTER */}
        <View style={styles.footer}>
          <LinearGradient
            colors={["#06152C", "#00AFFF", "#704BFF", "#06152C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.footerLine}
          />

          <View style={styles.footerDiamond} />

          <Text style={styles.footerCopyright}>© 2026 Jay Technologies</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  navContainer: {
    zIndex: 2,
  },

  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 35,
  },

  // Header
  headerOuter: {
    padding: 1.5,
    borderRadius: 29,
    marginBottom: 25,
    shadowColor: "#008DFF",
    shadowOpacity: 0.35,
    shadowRadius: 17,
    elevation: 8,
  },

  headerInner: {
    // minHeight: 29,
    // borderRadius: 28,
    // backgroundColor: "#061126",
    paddingHorizontal: 14,
    // paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  brandCopy: {
    flex: 1,
  },

  brandTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.7,
  },

  brandBlue: {
    color: "#00D5FF",
  },

  brandSubtitle: {
    color: "#A9C8FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 3,
  },

  profileOuter: {
    width: 43,
    height: 43,
    borderRadius: 22,
    padding: 1.5,
    backgroundColor: "#2E91FF",
  },

  profileInner: {
    flex: 1,
    borderRadius: 21,
    backgroundColor: "#172745",
    alignItems: "center",
    justifyContent: "center",
  },

  profileInitial: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },

  // Main hero
  heroBorder: {
    marginTop: 15,
    padding: 1,
    // borderTopRightRadius: 200,
    // borderTopLeftRadius: 200,
    borderRadius: 37,
    shadowColor: "#087BFF",
    shadowOpacity: 0.42,
    shadowRadius: 24,
    elevation: 12,
  },

  heroPanel: {
    // backgroundColor: "#030D22",
    borderRadius: 34,
    paddingHorizontal: 16,
    paddingTop: 27,
    paddingBottom: 23,
    overflow: "hidden",
    alignItems: "center",
  },

  heroDecorOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#071E46",
    top: -150,
    left: -115,
    opacity: 0.6,
  },

  heroDecorTwo: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#241044",
    right: -125,
    top: 170,
    opacity: 0.5,
  },

  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#126BFF",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 11,
    backgroundColor: "#071631",
    marginBottom: 27,
    maxWidth: "100%",
  },

  heroPillDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: "#00E5A8",
  },

  heroPillText: {
    color: "#D6E5FF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  welcomeHeading: {
    color: "#F2F6FF",
    fontSize: 35,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },

  heroBrand: {
    textAlign: "center",
    marginTop: 0,
    fontSize: 47,
    fontWeight: "900",
    letterSpacing: -2,
  },

  heroJay: {
    color: "#00D8FF",
  },

  heroTech: {
    color: "#7C69FF",
  },

  heroSubheading: {
    color: "#FFC65E",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.5,
    marginTop: -1,
  },

  greeting: {
    color: "#A8C8FF",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 17,
    textAlign: "center",
  },

  heroDescription: {
    color: "#C0D6F7",
    fontSize: 12,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },

  heroAccentLine: {
    width: "75%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 13,
    marginTop: 20,
    marginBottom: 24,
  },

  accentLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#123B78",
  },

  // Game cards
  gameList: {
    width: "105%",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  gameCardWrapper: {
    flex: 1,
    minWidth: 0,
    borderRadius: 19,
  },

  gameBorder: {
    flex: 1,
    padding: 1.5,
    borderRadius: 19,
    // maxWidth: 200,
    gap: 2,
  },

  gameCard: {
    flex: 1,
    minHeight: 205,
    borderRadius: 18,
    alignItems: "center",
    paddingHorizontal: 5,
    paddingTop: 11,
    paddingBottom: 12,
  },

  gameCardTop: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  gameNumber: {
    color: "#9DB9E3",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  diagonalArrow: {
    transform: [{ rotate: "45deg" }],
  },

  gameIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 35,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#08152E",
    marginTop: 15,
    marginBottom: 12,
    shadowOpacity: 0.55,
    shadowRadius: 11,
    elevation: 6,
  },

  gameTitle: {
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.2,
  },

  gameDescription: {
    color: "#D0DDF4",
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
    marginTop: 7,
    minHeight: 28,
  },

  gameCategory: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
    marginTop: 10,
  },

  gameUnderline: {
    height: 3,
    width: 31,
    borderRadius: 4,
    marginTop: 12,
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },

  // Community
  communityDivider: {
    height: 1,
    backgroundColor: "#15335B",
    width: "100%",
    marginTop: 25,
    marginBottom: 18,
  },

  communityRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  communityDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: "#00C8FF",
  },

  communityText: {
    color: "#B8D0F5",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    textAlign: "center",
  },

  communityHighlight: {
    color: "#00D8FF",
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 6,
  },

  footerLine: {
    width: "76%",
    height: 2,
    borderRadius: 2,
    marginBottom: 19,
  },

  footerDiamond: {
    width: 15,
    height: 15,
    borderWidth: 2,
    borderColor: "#00C8FF",
    transform: [{ rotate: "45deg" }],
    marginBottom: 20,
    shadowColor: "#00C8FF",
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },

  footerCopyright: {
    color: "#D6E5FF",
    fontSize: 12,
    textAlign: "center",
  },

  footerCaption: {
    color: "#6F9CD8",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
    textAlign: "center",
    marginTop: 12,
  },
});
