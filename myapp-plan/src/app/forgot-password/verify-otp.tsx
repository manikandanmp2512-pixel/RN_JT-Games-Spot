import { router, useLocalSearchParams } from "expo-router";
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

import { showError, showSuccess } from "@/components/JayToast";
import { useAppTheme } from "@/context/AppThemeContext";
import { verifyForgotOtp } from "@/services/authApi";
import { LinearGradient } from "expo-linear-gradient";

const AnimatedLinearGradient =
  Animated.createAnimatedComponent(LinearGradient);

export default function ForgotPasswordVerifyOtpScreen() {
  const { isDark } = useAppTheme();
  const params = useLocalSearchParams<{ email?: string | string[] }>();

  const email = String(
    Array.isArray(params.email) ? params.email[0] || "" : params.email || ""
  )
    .trim()
    .toLowerCase();

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);

  // Theme
  const background = isDark ? "#071E2B" : "#071E2B";
  const card = isDark ? "#102F40" : "#071E2B";
  const textColor = isDark ? "#071E2B" : "#152A38";
  const muted = isDark ? "#071E2B" : "#667085";
  const inputBackground = isDark ? "#17394B" : "#071E2B";

  // Animation references
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;
  const buttonGlow = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const orbOneAnim = useRef(new Animated.Value(0)).current;
  const orbTwoAnim = useRef(new Animated.Value(0)).current;
  const cardGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(entranceAnim, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoAnim, {
        toValue: 1,
        friction: 5,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.spring(iconAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        delay: 250,
        useNativeDriver: true,
      }),
    ]);

    entrance.start();

    const orbOne = Animated.loop(
      Animated.sequence([
        Animated.timing(orbOneAnim, {
          toValue: 1,
          duration: 4500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbOneAnim, {
          toValue: 0,
          duration: 4500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const orbTwo = Animated.loop(
      Animated.sequence([
        Animated.timing(orbTwoAnim, {
          toValue: 1,
          duration: 5500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbTwoAnim, {
          toValue: 0,
          duration: 5500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonGlow, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(buttonGlow, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(500),
        Animated.timing(shimmerAnim, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    const borderGlow = Animated.loop(
      Animated.sequence([
        Animated.timing(cardGlow, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(cardGlow, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );

    orbOne.start();
    orbTwo.start();
    glow.start();
    shimmer.start();
    borderGlow.start();

    return () => {
      entrance.stop();
      orbOne.stop();
      orbTwo.stop();
      glow.stop();
      shimmer.stop();
      borderGlow.stop();
    };
  }, []);

  const handleVerifyOtp = async () => {
    if (loading) return;

    setOtpError("");

    if (!email) {
      showError(
        "Gmail Missing",
        "Please start the forgot password process again."
      );
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const result = await verifyForgotOtp({
        email,
        emailOtp: otp.trim(),
      });

      if (!result?.success) {
        const message = result?.message || "Invalid or expired OTP.";
        setOtpError(message);
        showError("OTP Verification Failed", message);
        return;
      }

      showSuccess(
        "OTP Verified",
        result?.message || "Gmail OTP verified successfully."
      );

      router.replace({
        pathname: "/forgot-password/reset-password",
        params: { email },
      });
    } catch (error: any) {
      console.error(
        "FORGOT GMAIL OTP VERIFY ERROR:",
        error?.response?.data || error
      );

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "OTP verification failed.";

      setOtpError(message);
      showError("OTP Verification Failed", message);
    } finally {
      setLoading(false);
    }
  };

  // Animated styles
  const entranceStyle = {
    opacity: entranceAnim,
    transform: [
      {
        translateY: entranceAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [45, 0],
        }),
      },
      {
        scale: entranceAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  };

  const logoStyle = {
    opacity: logoAnim,
    transform: [
      {
        scale: logoAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      },
      {
        rotate: logoAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ["-25deg", "0deg"],
        }),
      },
    ],
  };

  const iconStyle = {
    opacity: iconAnim,
    transform: [
      {
        scale: iconAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.4, 1],
        }),
      },
    ],
  };

  const orbOneStyle = {
    transform: [
      {
        translateX: orbOneAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 45],
        }),
      },
      {
        translateY: orbOneAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -55],
        }),
      },
      {
        scale: orbOneAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.3],
        }),
      },
    ],
  };

  const orbTwoStyle = {
    transform: [
      {
        translateX: orbTwoAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -50],
        }),
      },
      {
        translateY: orbTwoAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 45],
        }),
      },
      {
        scale: orbTwoAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.25],
        }),
      },
    ],
  };

  const glowStyle = {
    opacity: buttonGlow.interpolate({
      inputRange: [0, 1],
      outputRange: [0.15, 0.55],
    }),
  };

  const shimmerStyle = {
    transform: [
      {
        translateX: shimmerAnim.interpolate({
          inputRange: [-1, 1],
          outputRange: [-180, 380],
        }),
      },
    ],
  };

  const borderStyle = {
    opacity: cardGlow.interpolate({
      inputRange: [0, 1],
      outputRange: [0.65, 1],
    }),
  };

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={background}
      />

      {/* Animated background */}
      <View pointerEvents="none" style={styles.backgroundEffects}>
        <Animated.View style={[styles.orbOne, orbOneStyle]}>
          <LinearGradient
            colors={["#F4A00055", "#F4A00000"]}
            style={styles.orbGradient}
          />
        </Animated.View>

        <Animated.View style={[styles.orbTwo, orbTwoStyle]}>
          <LinearGradient
            colors={["#244F6570", "#244F6500"]}
            style={styles.orbGradient}
          />
        </Animated.View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.cardWrapper, entranceStyle]}>
            {/* Animated gradient border */}
            <AnimatedLinearGradient
              colors={["#F4A000", "#244F65", "#F4A000"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.gradientBorder, borderStyle]}
            />

            <View
              style={[
                styles.card,
                {
                  backgroundColor: card,
                  borderColor: isDark ? "#31566A" : "#31566A",
                },
              ]}
            >
              {/* Brand */}
              {/* <View style={styles.brandRow}>
                <Animated.View style={[styles.logo, logoStyle]}>
                  <LinearGradient
                    colors={["#FFD166", "#F4A000", "#E68A00"]}
                    style={styles.logoGradient}
                  >
                    <Text style={styles.logoText}>J</Text>
                  </LinearGradient>
                </Animated.View>

                <View>
                  <Text style={styles.brand}>JAY TECH</Text>
                  <Text style={styles.brandSub}>
                    SECURE YOUR ACCOUNT
                  </Text>
                </View>
              </View> */}

              {/* Animated mail icon */}
              <Animated.View style={[styles.iconCircle, iconStyle]}>
                <LinearGradient
                  colors={["#FFD166", "#905e02"]}
                  style={styles.iconGradient}
                >
                  <Text style={styles.iconText}>✉</Text>
                </LinearGradient>
              </Animated.View>

               <Text style={styles.title}>OTP send in below mail</Text>
                <Text style={styles.emailText}>{email}</Text>


              {/* OTP input */}
              <Text style={[styles.subtitle, { color: muted }]}>
                Enter the six-digit code from your registered Gmail.
              </Text>
              <TextInput
                value={otp}
                onChangeText={(value) => {
                  setOtp(value.replace(/\D/g, "").slice(0, 6));
                  setOtpError("");
                }}
                onSubmitEditing={handleVerifyOtp}
                placeholder="000000"
                placeholderTextColor="#7894A2"
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                editable={!loading}
                style={[
                  styles.input,
                  {
                    color: "#f7f0f0",
                    backgroundColor: inputBackground,
                  },
                  otpError ? styles.inputError : null,
                ]}
              />

              {otpError ? (
                <Text style={styles.errorText}>{otpError}</Text>
              ) : null}

              {/* Animated verify button */}
              <View style={styles.buttonContainer}>
                <Animated.View
                  pointerEvents="none"
                  style={[styles.buttonGlow, glowStyle]}
                />

                <Pressable
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.pressed,
                    loading && styles.disabled,
                  ]}
                >
                  <LinearGradient
                    colors={["#FFD166", "#F4A000", "#E99500"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#071E2B" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>VERIFY CODE</Text>
                        <Text style={styles.buttonArrow}>→</Text>

                        <Animated.View
                          pointerEvents="none"
                          style={[styles.shimmer, shimmerStyle]}
                        >
                          <LinearGradient
                            colors={[
                              "transparent",
                              "#FFFFFF90",
                              "transparent",
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.shimmerGradient}
                          />
                        </Animated.View>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>

              {/* Change Gmail */}
              <Pressable
                disabled={loading}
                onPress={() => router.replace("/forgot-password")}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.backText}>
                  ← Change Gmail address
                </Text>
              </Pressable>

              <View style={styles.footerLine} />

              <Text style={[styles.footer, { color: muted }]}>
                NEVER SHARE YOUR OTP WITH ANYONE
              </Text>
            </View>
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

  orbOne: {
    position: "absolute",
    width: 280,
    height: 280,
    top: -90,
    right: -110,
    borderRadius: 140,
    overflow: "hidden",
  },

  orbTwo: {
    position: "absolute",
    width: 320,
    height: 320,
    bottom: -120,
    left: -130,
    borderRadius: 160,
    overflow: "hidden",
  },

  orbGradient: {
    flex: 1,
    borderRadius: 200,
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 22,
    paddingVertical: 35,
  },

  cardWrapper: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    borderRadius: 29,
    padding: 2,
    overflow: "hidden",
  },

  gradientBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 29,
  },

  card: {
    borderRadius: 27,
    borderWidth: 1,
    padding: 25,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 30,
  },

  logo: {
    width: 48,
    height: 48,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 7,
    shadowColor: "#F4A000",
    shadowOpacity: 0.4,
    shadowRadius: 9,
  },

  logoGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  logoText: {
    color: "#071E2B",
    fontSize: 30,
    fontWeight: "900",
  },

  brand: {
    color: "#F4A000",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2.5,
  },

  brandSub: {
    color: "#9DB5C0",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.7,
    marginTop: 4,
  },

  iconCircle: {
    width: 72,
    height: 72,
    marginLeft: 150,
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 24,
    elevation: 8,
    shadowColor: "#F4A000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },

  iconGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  iconText: {
    color: "#071E2B",
    fontSize: 36,
    fontWeight: "900",
  },

  eyebrow: {
    color: "#F4A000",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.5,
  },

  title: {
    fontSize: 23,
    color: "#FFFF",
    fontWeight: "500",
    fontFamily: "arial",
    lineHeight: 40,
    marginTop: 9,
    marginLeft: 60,
    letterSpacing: 1,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
    marginBottom: 20,
  },

  emailBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 23,
  },

  emailText: {
    color: "#F4A000",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 7,
    marginLeft: 80,
    letterSpacing: 1,
    textAlign: "center",
  },

  label: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 9,
  },

  input: {
    height: 65,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#e8edf1",
    textAlign: "center",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 12,
  },

  inputError: {
    borderColor: "#EF4444",
  },

  errorText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
  },

  buttonContainer: {
    marginTop: 22,
    position: "relative",
    borderRadius: 16,
  },

  buttonGlow: {
    position: "absolute",
    top: -5,
    bottom: -5,
    left: -5,
    right: -5,
    borderRadius: 21,
    backgroundColor: "#F4A000",
  },

  button: {
    height: 57,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 5,
  },

  buttonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    overflow: "hidden",
  },

  buttonText: {
    color: "#071E2B",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },

  buttonArrow: {
    color: "#071E2B",
    fontSize: 20,
    fontWeight: "900",
  },

  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 100,
  },

  shimmerGradient: {
    flex: 1,
    width: 100,
  },

  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  disabled: {
    opacity: 0.6,
  },

  backButton: {
    alignItems: "center",
    marginTop: 23,
    padding: 10,
  },

  backText: {
    color: "#F4A000",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  footerLine: {
    height: 1,
    backgroundColor: "#45647755",
    marginTop: 15,
    marginBottom: 13,
  },

  footer: {
    textAlign: "center",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
});