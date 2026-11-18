import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import Navbar from "@/components/Navbar";
import { useAppTheme } from "@/context/AppThemeContext";

const AnimatedLinearGradient =
  Animated.createAnimatedComponent(LinearGradient);

export default function Index() {
  const { isDark } = useAppTheme();
  const { width } = useWindowDimensions();

  const [checkingLogin, setCheckingLogin] = useState(true);

  const isSmall = width < 380;
  const isMobile = width < 600;

  const background = "#071E2B";

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
  // ANIMATION VALUES
  // =========================================================

  const entrance = useRef(new Animated.Value(0)).current;

  const topFloat = useRef(new Animated.Value(0)).current;
  const bottomFloat = useRef(new Animated.Value(0)).current;

  const shimmer = useRef(new Animated.Value(0)).current;
  const titleColor = useRef(new Animated.Value(0)).current;
  const iconPulse = useRef(new Animated.Value(0)).current;
  const livePulse = useRef(new Animated.Value(0)).current;

  const playAnimation = useRef(new Animated.Value(0)).current;
  const connectAnimation = useRef(new Animated.Value(0)).current;
  const competeAnimation = useRef(new Animated.Value(0)).current;

  // =========================================================
  // START ANIMATIONS
  // =========================================================

  useEffect(() => {
    const entranceAnimation = Animated.sequence([
      Animated.delay(100),
      Animated.timing(entrance, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.back(1.15)),
        useNativeDriver: true,
      }),
    ]);

    const topAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(topFloat, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(topFloat, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const bottomAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bottomFloat, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bottomFloat, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );

    const titleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(titleColor, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: false,
        }),
        Animated.timing(titleColor, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: false,
        }),
      ])
    );

    const iconAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(iconPulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const liveAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(livePulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const featureAnimation = Animated.stagger(180, [
      Animated.spring(playAnimation, {
        toValue: 1,
        speed: 1.4,
        bounciness: 5,
        useNativeDriver: true,
      }),
      Animated.spring(connectAnimation, {
        toValue: 1,
        speed: 1.4,
        bounciness: 5,
        useNativeDriver: true,
      }),
      Animated.spring(competeAnimation, {
        toValue: 1,
        speed: 1.4,
        bounciness: 5,
        useNativeDriver: true,
      }),
    ]);

    entranceAnimation.start();
    topAnimation.start();
    bottomAnimation.start();
    shimmerAnimation.start();
    titleAnimation.start();
    iconAnimation.start();
    liveAnimation.start();
    featureAnimation.start();

    return () => {
      entranceAnimation.stop();
      topAnimation.stop();
      bottomAnimation.stop();
      shimmerAnimation.stop();
      titleAnimation.stop();
      iconAnimation.stop();
      liveAnimation.stop();
      featureAnimation.stop();
    };
  }, []);

  // =========================================================
  // ANIMATED INTERPOLATIONS
  // =========================================================

  const cardTranslateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [45, 0],
  });

  const cardOpacity = entrance;

  const topTranslateY = topFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 24],
  });

  const bottomTranslateY = bottomFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -28],
  });

  const iconScale = iconPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.09],
  });

  const animatedTitleColor = titleColor.interpolate({
    inputRange: [0, 1],
    outputRange: ["#F4A000", "#62DCE0"],
  });

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 950],
  });

  const liveScale = livePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const liveOpacity = livePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1],
  });

  const getFeatureStyle = (animation: Animated.Value) => ({
    opacity: animation,
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [35, 0],
        }),
      },
    ],
  });

  // =========================================================
  // LOGIN LOADING SCREEN
  // =========================================================

  if (checkingLogin) {
    return (
      <View style={styles.root}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={background}
        />

        <View pointerEvents="none" style={styles.backgroundEffects}>
          <Animated.View
            style={[
              styles.topOrb,
              {
                transform: [{ translateY: topTranslateY }],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.bottomOrb,
              {
                transform: [{ translateY: bottomTranslateY }],
              },
            ]}
          />
        </View>

        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={["#F4A000", "#62DCE0", "#244F65", "#F4A000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loadingBorder}
          >
            <LinearGradient
              colors={["#173B4B", "#011824", "#0B1D29"]}
              style={styles.loadingCard}
            >
              <Animated.View
                style={{
                  transform: [{ scale: iconScale }],
                }}
              >
                <LinearGradient
                  colors={["#FFD166", "#F4A000", "#E58A00"]}
                  style={styles.loadingIcon}
                >
                  <MaterialCommunityIcons
                    name="gamepad-variant"
                    size={42}
                    color="#071E2B"
                  />
                </LinearGradient>
              </Animated.View>

              <Animated.Text
                style={[
                  styles.loadingTitle,
                  { color: animatedTitleColor },
                ]}
              >
                JAY TECH
              </Animated.Text>

              <Text style={styles.loadingSubtitle}>
                G A M E S   S P O T
              </Text>

              <ActivityIndicator
                size="large"
                color="#62DCE0"
                style={styles.loadingSpinner}
              />

              <Text style={styles.loadingMessage}>
                Checking your login status...
              </Text>

              <View style={styles.loadingTrack}>
                <LinearGradient
                  colors={["#F4A000", "#62DCE0"]}
                  style={styles.loadingProgress}
                />
              </View>
            </LinearGradient>
          </LinearGradient>
        </View>
      </View>
    );
  }

  // =========================================================
  // HOME PAGE
  // =========================================================

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={isDark ? "light-content" : "light-content"}
        backgroundColor={background}
      />

      {/* =====================================================
          ANIMATED BACKGROUND
      ===================================================== */}

      <View pointerEvents="none" style={styles.backgroundEffects}>
        <Animated.View
          style={[
            styles.topOrb,
            {
              transform: [
                { translateY: topTranslateY },
                {
                  scale: topFloat.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.13],
                  }),
                },
              ],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.bottomOrb,
            {
              transform: [
                { translateY: bottomTranslateY },
                {
                  scale: bottomFloat.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1.08, 0.94],
                  }),
                },
              ],
            },
          ]}
        />

        <View style={styles.gridLineOne} />
        <View style={styles.gridLineTwo} />

        <View style={styles.backgroundGlowCenter} />
      </View>

      <View style={styles.page}>
        {/* EXISTING NAVBAR */}
        <Navbar />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* =================================================
              MAIN ANIMATED CARD
          ================================================= */}

          <Animated.View
            style={[
              styles.heroWrapper,
              {
                maxWidth: width >= 1000 ? 900 : 760,
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslateY }],
              },
            ]}
          >
            <LinearGradient
              colors={["#F4A000", "#e062be", "#244F65", "#F4A000"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroBorder}
            >
              <LinearGradient
                colors={["#173B4B", "#011824", "#0B1D29", "#163747"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
              >
                {/* MOVING SHIMMER */}
                <AnimatedLinearGradient
                  pointerEvents="none"
                  colors={[
                    "transparent",
                    "rgba(98,220,224,0.08)",
                    "transparent",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.shimmerOverlay,
                    {
                      transform: [
                        { translateX: shimmerTranslate },
                      ],
                    },
                  ]}
                />

                {/* =================================================
                    BRAND HEADER
                ================================================= */}

                <View style={styles.brandRow}>
                  <LinearGradient
                    colors={["#FFD166", "#F4A000", "#E58A00"]}
                    style={styles.logo}
                  >
                    <Text style={styles.logoText}>J</Text>
                  </LinearGradient>

                  <View style={styles.brandTextContainer}>
                    <Animated.Text
                      style={[
                        styles.brand,
                        { color: animatedTitleColor },
                      ]}
                    >
                      JAY TECH
                    </Animated.Text>

                    <Text style={styles.brandCaption}>
                      TECHNOLOGY & INNOVATION
                    </Text>
                  </View>

                  <View style={styles.brandStatus}>
                    <Animated.View
                      style={[
                        styles.liveDot,
                        {
                          opacity: liveOpacity,
                          transform: [{ scale: liveScale }],
                        },
                      ]}
                    />
                    <Text style={styles.onlineText}>ONLINE</Text>
                  </View>
                </View>

                {/* =================================================
                    WELCOME CONTENT
                ================================================= */}

                <View style={styles.heroContent}>
                  <View style={styles.eyebrowContainer}>
                    <View style={styles.eyebrowLine} />
                    <Text style={styles.eyebrow}>
                      CONNECT • PLAY • COMPLETE
                    </Text>
                    <View style={styles.eyebrowLine} />
                  </View>

                  <Animated.View
                    style={{
                      transform: [{ scale: iconScale }],
                    }}
                  >
                    <LinearGradient
                      colors={["#FFD166", "#F4A000", "#E58A00"]}
                      style={styles.mainGameIcon}
                    >
                      <MaterialCommunityIcons
                        name="gamepad-variant"
                        size={isSmall ? 37 : 46}
                        color="#071E2B"
                      />
                    </LinearGradient>
                  </Animated.View>

                  <Animated.Text
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    style={[
                      styles.jayTechTitle,
                      {
                        fontSize: isSmall
                          ? 43
                          : width >= 800
                            ? 76
                            : 62,
                        color: animatedTitleColor,
                      },
                    ]}
                  >
                    Welcome to JT
                  </Animated.Text>

                  <Text style={styles.gamesSpotTitle}>
                    GAMES SPOT
                  </Text>
                </View>

                {/* =================================================
                    FEATURE CARDS
                ================================================= */}

                <View
                  style={[
                    styles.features,
                    { gap: isSmall ? 7 : isMobile ? 10 : 16 },
                  ]}
                >
                  {/* PLAY */}
                  <Animated.View
                    style={[
                      styles.featureWrapper,
                      getFeatureStyle(playAnimation),
                    ]}
                  >
                    <LinearGradient
                      colors={["#62DCE0", "#087DFF", "#244F65"]}
                      style={styles.featureBorder}
                    >
                      <View style={[styles.featureCard, styles.playCard]}>
                        <LinearGradient
                          colors={[
                            "rgba(98,220,224,0.17)",
                            "rgba(7,30,43,0.05)",
                          ]}
                          style={styles.featureIcon}
                        >
                          <MaterialCommunityIcons
                            name="gamepad-variant"
                            size={isSmall ? 27 : 35}
                            color="#62DCE0"
                          />
                        </LinearGradient>

                        <Text style={styles.playHeading}>CONNECT</Text>

                        <Text style={styles.featureDescription}>
                          Enjoy your{"\n"}favorite games
                        </Text>

                        <LinearGradient
                          colors={["#62DCE0", "#087DFF"]}
                          style={styles.featureLine}
                        />
                      </View>
                    </LinearGradient>
                  </Animated.View>

                  {/* CONNECT */}
                  <Animated.View
                    style={[
                      styles.featureWrapper,
                      getFeatureStyle(connectAnimation),
                    ]}
                  >
                    <LinearGradient
                      colors={["#B88AFF", "#7946FF", "#244F65"]}
                      style={styles.featureBorder}
                    >
                      <View
                        style={[
                          styles.featureCard,
                          styles.connectCard,
                        ]}
                      >
                        <LinearGradient
                          colors={[
                            "rgba(184,138,255,0.18)",
                            "rgba(7,30,43,0.05)",
                          ]}
                          style={styles.featureIcon}
                        >
                          <Ionicons
                            name="people"
                            size={isSmall ? 27 : 34}
                            color="#B88AFF"
                          />
                        </LinearGradient>

                        <Text style={styles.connectHeading}>
                          PLAY
                        </Text>

                        <Text style={styles.featureDescription}>
                          Challenge and{"\n"}make friends
                        </Text>

                        <LinearGradient
                          colors={["#B88AFF", "#7946FF"]}
                          style={styles.featureLine}
                        />
                      </View>
                    </LinearGradient>
                  </Animated.View>

                  {/* COMPETE */}
                  <Animated.View
                    style={[
                      styles.featureWrapper,
                      getFeatureStyle(competeAnimation),
                    ]}
                  >
                    <LinearGradient
                      colors={["#FFD166", "#F4A000", "#A96A15"]}
                      style={styles.featureBorder}
                    >
                      <View
                        style={[
                          styles.featureCard,
                          styles.competeCard,
                        ]}
                      >
                        <LinearGradient
                          colors={[
                            "rgba(244,160,0,0.18)",
                            "rgba(7,30,43,0.05)",
                          ]}
                          style={styles.featureIcon}
                        >
                          <Ionicons
                            name="trophy"
                            size={isSmall ? 27 : 33}
                            color="#FFC653"
                          />
                        </LinearGradient>

                        <Text style={styles.competeHeading}>
                          COMPLETE
                        </Text>

                        <Text style={styles.featureDescription}>
                          Improve and{"\n"}celebrate wins
                        </Text>

                        <LinearGradient
                          colors={["#FFD166", "#F4A000"]}
                          style={styles.featureLine}
                        />
                      </View>
                    </LinearGradient>
                  </Animated.View>
                </View>

                {/* =================================================
                    COMMUNITY STRIP
                ================================================= */}

                <View style={styles.communityStrip}>
                  <LinearGradient
                    colors={["transparent", "#62DCE0"]}
                    style={styles.communityLine}
                  />

                  <Animated.View
                    style={[
                      styles.communityDot,
                      {
                        opacity: liveOpacity,
                        transform: [{ scale: liveScale }],
                      },
                    ]}
                  />

                  <Text style={styles.communityText}>
                    YOUR GAME.{" "}
                    <Text style={styles.communityHighlight}>
                      YOUR COMMUNITY.
                    </Text>
                  </Text>

                  <Animated.View
                    style={[
                      styles.communityDot,
                      {
                        opacity: liveOpacity,
                        transform: [{ scale: liveScale }],
                      },
                    ]}
                  />

                  <LinearGradient
                    colors={["#62DCE0", "transparent"]}
                    style={styles.communityLine}
                  />
                </View>

              </LinearGradient>
            </LinearGradient>
          </Animated.View>

          {/* =================================================
              FOOTER
          ================================================= */}

          <View style={styles.footer}>
            <View style={styles.footerDecoration}>
              <LinearGradient
                colors={["transparent", "#F4A000"]}
                style={styles.footerLine}
              />

              <MaterialCommunityIcons
                name="diamond-stone"
                size={22}
                color="#62DCE0"
              />

              <LinearGradient
                colors={["#F4A000", "transparent"]}
                style={styles.footerLine}
              />
            </View>

            <Text style={styles.copyright}>
              © 2026 {"  "}Developed by{" "}
              <Text style={styles.developer}>
                Manikandan M
              </Text>
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// =============================================================
// STYLES
// =============================================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#071E2B",
    overflow: "hidden",
    marginTop: 30,
  },

  // ===========================================================
  // BACKGROUND EFFECTS
  // ===========================================================

  backgroundEffects: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },

  topOrb: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -115,
    right: -90,
    backgroundColor: "#01466e",
  },

  bottomOrb: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    bottom: -130,
    left: -130,
    backgroundColor: "#01466e",
  },

  gridLineOne: {
    position: "absolute",
    width: 450,
    height: 2,
    top: "70%",
    left: -100,
    backgroundColor: "#df8106",
    transform: [{ rotate: "-28deg" }],
  },

  gridLineTwo: {
    position: "absolute",
    width: 450,
    height: 2,
    bottom: "73%",
    right: -100,
    backgroundColor: "#df8106",
    transform: [{ rotate: "-28deg" }],
  },

  backgroundGlowCenter: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 130,
    top: "38%",
    left: "30%",
    backgroundColor: "rgba(36,79,101,0.10)",
  },

  // ===========================================================
  // PAGE
  // ===========================================================

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
    paddingTop: 18,
    paddingBottom: 25,
  },

  // ===========================================================
  // HERO CARD
  // ===========================================================

  heroWrapper: {
    width: "100%",
    alignSelf: "center",
    borderRadius: 30,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 22,
    elevation: 14,
  },

  heroBorder: {
    padding: 1.7,
    borderRadius: 30,
  },

  hero: {
    position: "relative",
    alignItems: "center",
    backgroundColor: "#071E2B",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    overflow: "hidden",
  },

  shimmerOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 180,
    zIndex: 1,
  },

  // ===========================================================
  // BRAND
  // ===========================================================

  brandRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 28,
  },

  logo: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F4A000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  logoText: {
    color: "#01097e",
    fontFamily: "IBM Plex Mono",
    fontSize: 29,
    fontWeight: "900",
  },

  brandTextContainer: {
    flex: 1,
  },

  brand: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
    fontFamily: "IBM Plex Mono",
  },

  brandCaption: {
    color: "#9DB5C0",
    fontSize: 8,
    letterSpacing: 1.1,
    marginTop: 4,
    fontWeight: "700",
  },

  brandStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(0,229,160,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,229,160,0.25)",
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: "#00E5A0",
  },

  onlineText: {
    color: "#00E5A0",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // ===========================================================
  // HERO CONTENT
  // ===========================================================

  heroContent: {
    width: "100%",
    alignItems: "center",
  },

  eyebrowContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 22,
  },

  eyebrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(98,220,224,0.35)",
  },

  eyebrow: {
    color: "#62DCE0",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.6,
    textAlign: "center",
  },

  mainGameIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#F4A000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  jayTechTitle: {
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -1.5,
    marginTop: 5,
    textShadowColor: "rgba(98,220,224,0.25)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
    fontFamily: "IBM Plex Mono",
  },

  gamesSpotTitle: {
    color: "#F4A000",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 0,
    textShadowColor: "rgba(239, 170, 43, 0.22)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
    fontFamily: "IBM Plex Mono",
  },

  // ===========================================================
  // FEATURE CARDS
  // ===========================================================

  features: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "center",
  },

  featureWrapper: {
    flex: 1,
    minWidth: 0,
  },

  featureBorder: {
    flex: 1,
    padding: 1.2,
    borderRadius: 19,
  },

  featureCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 160,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 3,
    paddingTop: 15,
    paddingBottom: 13,
    borderRadius: 18,
    overflow: "hidden",
  },

  playCard: {
    backgroundColor: "#102F40",
  },

  connectCard: {
    backgroundColor: "#172A40",
  },

  competeCard: {
    backgroundColor: "#302B23",
  },

  featureIcon: {
    width: 55,
    height: 55,
    maxWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  playHeading: {
    color: "#62DCE0",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },

  connectHeading: {
    color: "#B88AFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  competeHeading: {
    color: "#FFD166",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  featureDescription: {
    color: "#C2D4DC",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 7,
  },

  featureLine: {
    width: 35,
    height: 3,
    borderRadius: 5,
    marginTop: 12,
  },

  // ===========================================================
  // COMMUNITY STRIP
  // ===========================================================

  communityStrip: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 27,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(98,220,224,0.17)",
  },

  communityLine: {
    flex: 1,
    height: 1,
  },

  communityDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: "#00E5A0",
  },

  communityText: {
    color: "#D0E4E9",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  communityHighlight: {
    color: "#62DCE0",
  },

  // ===========================================================
  // FOOTER
  // ===========================================================

  footer: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 650,
    alignItems: "center",
    paddingHorizontal: 8,
    marginTop: 23,
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
    color: "#C2D4DC",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },

  developer: {
    color: "#62DCE0",
    fontWeight: "900",
  },

  // ===========================================================
  // LOADING SCREEN
  // ===========================================================

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
  },

  loadingBorder: {
    width: "100%",
    maxWidth: 460,
    padding: 1.5,
    borderRadius: 29,
  },

  loadingCard: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderRadius: 27,
    overflow: "hidden",
  },

  loadingIcon: {
    width: 88,
    height: 88,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingTitle: {
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 20,
  },

  loadingSubtitle: {
    color: "#62DCE0",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 6,
  },

  loadingSpinner: {
    marginTop: 25,
  },

  loadingMessage: {
    color: "#BDD0D9",
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
  },

  loadingTrack: {
    width: "100%",
    height: 6,
    borderRadius: 6,
    backgroundColor: "#244F65",
    overflow: "hidden",
    marginTop: 22,
  },

  loadingProgress: {
    width: "82%",
    height: "100%",
    borderRadius: 6,
  },
});