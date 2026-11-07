import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { showError, showSuccess } from "@/components/JayToast";
import { useAppTheme } from "@/context/AppThemeContext";
import { sendForgotPasswordOtp } from "@/services/authApi";

const AnimatedLinearGradient =
  Animated.createAnimatedComponent(LinearGradient);

const GMAIL_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9.]{0,62}[a-zA-Z0-9])?@gmail\.com$/i;

export default function ForgotPasswordScreen() {
  const { isDark } = useAppTheme();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  const background = isDark ? "#071E2B" : "#071E2B";
  const card = isDark ? "#102F40" : "#071E2B";
  const textColor = isDark ? "#071E2B" : "#152A38";
  const muted = isDark ? "#9DB5C0" : "#667085";
  const inputBackground = isDark ? "#17394B" : "#17394B";

  // Animation values
  const entrance = useRef(new Animated.Value(0)).current;
  const topFloat = useRef(new Animated.Value(0)).current;
  const bottomFloat = useRef(new Animated.Value(0)).current;
  const buttonPulse = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const titleColor = useRef(new Animated.Value(0)).current;
  const iconPulse = useRef(new Animated.Value(0)).current;

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

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
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

    entranceAnimation.start();
    topAnimation.start();
    bottomAnimation.start();
    pulseAnimation.start();
    shimmerAnimation.start();
    titleAnimation.start();
    iconAnimation.start();

    return () => {
      entranceAnimation.stop();
      topAnimation.stop();
      bottomAnimation.stop();
      pulseAnimation.stop();
      shimmerAnimation.stop();
      titleAnimation.stop();
      iconAnimation.stop();
    };
  }, []);

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

  const buttonScale = buttonPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.025],
  });

  const buttonShadow = buttonPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [5, 17],
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
    outputRange: [-180, 480],
  });

  const handleSendOtp = async () => {
    if (loading) return;

    if (
      !GMAIL_REGEX.test(normalizedEmail) ||
      normalizedEmail.includes("..")
    ) {
      showError(
        "Invalid Gmail",
        "Please enter your registered Gmail address."
      );
      return;
    }

    try {
      setLoading(true);

      const result = await sendForgotPasswordOtp({
        email: normalizedEmail,
      });

      if (!result?.success) {
        showError(
          "OTP Failed",
          result?.message || "Unable to send Gmail OTP."
        );
        return;
      }

      showSuccess(
        "Gmail OTP Sent",
        result?.message || "Check your Gmail inbox."
      );

      router.push({
        pathname: "/forgot-password/verify-otp",
        params: { email: normalizedEmail },
      });
    } catch (error: any) {
      console.error(
        "SEND FORGOT GMAIL OTP ERROR:",
        error?.response?.data || error
      );

      showError(
        "OTP Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to send Gmail OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={background}
      />

      {/* Animated background decoration */}
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

        <View style={styles.verticalAccent} />
        <View style={styles.gridLineOne} />
        <View style={styles.gridLineTwo} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Animated gradient card border */}
          <Animated.View
            style={[
              styles.cardOuter,
              {
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslateY }],
              },
            ]}
          >
            <LinearGradient
              colors={
                isDark
                  ? ["#F4A000", "#62DCE0", "#244F65", "#F4A000"]
                  : ["#F4A000", "#62BFC4", "#D9A23D", "#F4A000"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBorder}
            >
              <LinearGradient
                colors={
                  isDark
                    ? ["#173B4B", "#011824", "#0B1D29", "#163747"]
                    : ["#173B4B", "#011824", "#0B1D29", "#163747"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, { backgroundColor: card }]}
              >
                {/* Moving shimmer overlay */}
                <AnimatedLinearGradient
                  pointerEvents="none"
                  colors={[
                    "transparent",
                    isDark
                      ? "rgba(98,220,224,0.08)"
                      : "rgba(244,160,0,0.06)",
                    "transparent",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.shimmerOverlay,
                    {
                      transform: [{ translateX: shimmerTranslate }],
                    },
                  ]}
                />

                {/* Brand */}
                {/* <View style={styles.brandRow}>
                  <View style={styles.logo}>
                    <Text style={styles.logoText}>J</Text>
                  </View>

                  <View>
                    <Animated.Text
                      style={[
                        styles.brand,
                        { color: animatedTitleColor },
                      ]}
                    >
                      JAY TECH
                    </Animated.Text>

                    <Text
                      style={[
                        styles.brandCaption,
                        { color: muted },
                      ]}
                    >
                      TECHNOLOGY & INNOVATION
                    </Text>
                  </View>
                </View> */}

                {/* Recovery icon */}
                <Animated.View
                  style={[
                    styles.iconCircle,
                    {
                      transform: [{ scale: iconScale }],
                    },
                  ]}
                >
                  <Text style={styles.iconText}>✉</Text>
                </Animated.View>

                <Animated.Text
                  style={[
                    styles.title,
                    {
                      color: animatedTitleColor,
                    },
                  ]}
                >
                  Account Recovery
                </Animated.Text>

                <Text style={[styles.label]}>
                  Registered G-Mail
                </Text>

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter Your Mail"
                  placeholderTextColor="#7894A2"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="send"
                  onSubmitEditing={handleSendOtp}
                  style={[
                    styles.input,
                    {
                      color: textColor,
                      backgroundColor: inputBackground,
                      borderColor: isDark ? "#31566A" : "#D8E1E9",
                    }, styles.passwordInput,
                  ]}
                />

                {/* Animated button */}
                <Animated.View
                  style={{
                    transform: [{ scale: buttonScale }],
                    shadowColor: "#F4A000",
                    shadowOffset: { width: 0, height: 5 },
                    shadowOpacity: 0.35,
                    shadowRadius: buttonShadow,
                    elevation: 9,
                  }}
                >
                  <Pressable
                    onPress={handleSendOtp}
                    disabled={loading}
                    style={({ pressed }) => [
                      styles.button,
                      pressed && styles.pressed,
                      loading && styles.disabled,
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#071E2B" />
                    ) : (
                      <LinearGradient
                        colors={["#FFD166", "#F4A000", "#E58A00"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.buttonText}>
                          SEND VERIFICATION CODE  →
                        </Text>
                      </LinearGradient>
                    )}
                  </Pressable>
                </Animated.View>

                <Pressable
                  onPress={() => router.replace("/login")}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.backButton,
                    pressed && { opacity: 0.65 },
                  ]}
                >
                  <Text style={styles.backText}>
                    ← BACK
                  </Text>
                </Pressable>

                <Text style={[styles.footer, { color: muted }]}>
                  YOUR ACCOUNT SECURITY MATTERS
                </Text>
              </LinearGradient>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },

  backgroundEffects: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 29,
  },

  topOrb: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -115,
    right: -90,
    backgroundColor: "rgba(244,160,0,0.10)",
  },

  bottomOrb: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    bottom: -130,
    left: -130,
    backgroundColor: "rgba(98,220,224,0.09)",
  },

  verticalAccent: {
    position: "absolute",
    width: 2,
    height: "55%",
    top: "22%",
    right: 18,
    backgroundColor: "rgba(244,160,0,0.13)",
  },

  gridLineOne: {
    position: "absolute",
    width: 450,
    height: 1,
    top: "23%",
    left: -100,
    backgroundColor: "rgba(98,220,224,0.12)",
    transform: [{ rotate: "-28deg" }],
  },

  gridLineTwo: {
    position: "absolute",
    width: 450,
    height: 1,
    bottom: "22%",
    right: -100,
    backgroundColor: "rgba(244,160,0,0.12)",
    transform: [{ rotate: "-28deg" }],
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 22,
    paddingVertical: 35,
  },

  cardOuter: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    borderRadius: 29,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },

  gradientBorder: {
    borderRadius: 29,
    padding: 1.5,
  },

  card: {
    width: "100%",
    borderRadius: 27,
    padding: 25,
    overflow: "hidden",
  },

  shimmerOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 160,
    zIndex: 1,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 32,
  },

  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F4A000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F4A000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },

  logoText: {
    color: "#11038d",
    fontFamily: "IBM Plex Mono",
    fontSize: 28,
    fontWeight: "900",
  },

  brand: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },

  brandCaption: {
    fontSize: 8,
    letterSpacing: 1.1,
    marginTop: 3,
    fontWeight: "700",
  },

  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 23,
    backgroundColor: "#F4A000",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 160,
    marginBottom: 10,
    shadowColor: "#F4A000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 7,
  },

  iconText: {
    color: "#070390",
    fontSize: 32,
    fontWeight: "900",
  },

  eyebrow: {
    color: "#F4A000",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },

  title: {
    fontSize: 34,
    marginLeft: 60,
    marginBottom: 15,
    fontWeight: "900",
    lineHeight: 41,
    marginTop: 9,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 21,
    marginTop: 13,
    marginBottom: 28,
  },

  label: {
    fontSize: 10,
    color: "#ebecf1",
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 9,
  },

  input: {
    height: 57,
    borderRadius: 15,
    color: "#FFFFFF",
    paddingHorizontal: 15,
    fontSize: 14,
    borderWidth: 1,
  },

  button: {
    height: 56,
    borderRadius: 15,
    overflow: "hidden",
    marginTop: 20,
  },

  buttonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },

  buttonText: {
    color: "#071E2B",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },

  disabled: {
    opacity: 0.6,
  },

  backButton: {
    alignItems: "center",
    marginTop: 24,
    padding: 8,
  },

  backText: {
    color: "#F4A000",
    fontWeight: "900",
    fontSize: 13,
  },

  footer: {
    textAlign: "center",
    fontSize: 9,
    letterSpacing: 1.2,
    marginTop: 24,
  },
  passwordInput: {
    color: "#FFFFFF",
    paddingLeft: 13,
    paddingRight: 5,
    fontSize: 18,
    borderRadius: 14,
  },
});