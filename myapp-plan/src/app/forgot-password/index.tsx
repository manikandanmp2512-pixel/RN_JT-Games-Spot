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

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export default function ForgotPasswordScreen() {
  const { isDark } = useAppTheme();

  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedMobile = mobile.trim().replace(/[\s()-]/g, "");

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
      !E164_REGEX.test(normalizedMobile)
    ) {
      showError(
        "Invalid Mobile Number",
        "Enter your registered mobile number in international format, including +country code."
      );
      return;
    }

    try {
      setLoading(true);

      const result = await sendForgotPasswordOtp({
        mobile: normalizedMobile,
      });

      if (!result?.success) {
        showError(
          "OTP Failed",
          result?.message || "Unable to send SMS OTP."
        );
        return;
      }

      showSuccess(
        "SMS OTP Sent",
        result?.message || "Check your mobile messages."
      );

      router.push({
        pathname: "/forgot-password/verify-otp",
        params: { mobile: normalizedMobile },
      });
    } catch (error: any) {
      console.error(
        "SEND FORGOT SMS OTP ERROR:",
        error?.response?.data || error
      );

      showError(
        "OTP Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to send SMS OTP."
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
                  Registered Mobile Number
                </Text>

                <TextInput
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="Enter mobile with +country code"
                  placeholderTextColor="#7894A2"
                  keyboardType="phone-pad"
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
                          SEND VERIFICATION CODE
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
                    ← Back
                  </Text>
                </Pressable>

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
    marginTop: 30,
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
    backgroundColor: "#183849",
  },

  bottomOrb: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    bottom: -130,
    left: -130,
    backgroundColor: "#183849",
  },

  gridLineOne: {
    position: "absolute",
    width: 450,
    height: 2,
    top: "23%",
    left: -100,
    backgroundColor: "#F4A000",
    transform: [{ rotate: "-28deg" }],
  },

  gridLineTwo: {
    position: "absolute",
    width: 450,
    height: 2,
    bottom: "22%",
    right: -100,
    backgroundColor: "#F4A000",
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
    marginLeft: 115,
    marginBottom: 10,
    shadowColor: "#F4A000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 7,
  },

  iconText: {
    color: "#070390",
    fontSize: 40,
    fontWeight: "900",
    marginBottom: 7,
  },

  eyebrow: {
    color: "#F4A000",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },

  title: {
    fontSize: 28,
    marginLeft: 30,
    marginBottom: 15,
    fontWeight: "900",
    lineHeight: 41,
    marginTop: 9,
    fontFamily: "Red Hat Display",
  },

  label: {
    fontSize: 10,
    color: "#ebecf1",
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 9,
    fontFamily: "Red Hat Display",
  },

  input: {
    height: 57,
    borderRadius: 15,
    color: "#FFFFFF",
    paddingHorizontal: 15,
    fontSize: 12,
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

  passwordInput: {
    color: "#FFFFFF",
    paddingLeft: 13,
    paddingRight: 5,
    fontSize: 15,
    borderRadius: 14,
  },
});