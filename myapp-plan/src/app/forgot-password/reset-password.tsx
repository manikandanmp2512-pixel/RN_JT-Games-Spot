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

import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { showError, showSuccess } from "@/components/JayToast";
import { useAppTheme } from "@/context/AppThemeContext";
import { resetPassword } from "@/services/authApi";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

const AnimatedLinearGradient =
  Animated.createAnimatedComponent(LinearGradient);

export default function ResetPasswordScreen() {
  const { isDark } = useAppTheme();
  const params = useLocalSearchParams<{ email?: string | string[] }>();

  const email = String(
    Array.isArray(params.email) ? params.email[0] || "" : params.email || ""
  )
    .trim()
    .toLowerCase();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Theme
  const background = "#071E2B";
  const card = "#071E2B";
  const textColor = isDark ? "#FFFFFF" : "#FFFFFF";
  const muted = isDark ? "#9DB5C0" : "#9DB5C0";
  const inputBackground = "#17394B";

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

  const handleResetPassword = async () => {
    if (loading) return;

    setPasswordError("");
    setConfirmPasswordError("");

    if (!email) {
      showError(
        "Gmail Missing",
        "Please start the forgot password process again."
      );
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setPasswordError(
        "Use at least 6 characters with uppercase, lowercase and a number."
      );
      return;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const result = await resetPassword({ email, password });

      if (!result?.success) {
        const message = result?.message || "Password reset failed.";
        setPasswordError(message);
        showError("Password Reset Failed", message);
        return;
      }

      showSuccess(
        "Password Reset",
        result?.message || "Your password has been reset successfully."
      );

      router.replace("/login");
    } catch (error: any) {
      console.error("RESET PASSWORD ERROR:", error?.response?.data || error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Password reset failed.";

      setPasswordError(message);
      showError("Password Reset Failed", message);
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
        barStyle="light-content"
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
                  borderColor: "#31566A",
                },
              ]}
            >
              {/* Animated success icon */}
              <Animated.View style={[styles.iconCircle, iconStyle]}>
                <LinearGradient
                  colors={["#FFD166", "#F4A000"]}
                  style={styles.iconGradient}
                >
                  <Text style={styles.iconText}>✓</Text>
                </LinearGradient>
              </Animated.View>

              <Text style={[styles.title, { color: textColor }]}>
                Create a New Password
              </Text>
              <Text
                  style={styles.emailText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {email}
                </Text>

              {/* New password */}
              <Text style={[styles.subtitle, { color: muted }]}>
                Choose a strong password to secure your Jay Tech account.
              </Text>

              <View
                style={[
                  styles.passwordBox, styles.passwordBx,
                  {
                    backgroundColor: inputBackground,
                    borderColor: passwordError ? "#EF4444" : "#456477",
                  },
                ]}
              >
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setPasswordError("");
                  }}
                  placeholder="Enter new password"
                  placeholderTextColor="#7894A2"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  editable={!loading}
                  style={styles.passwordInput}
                />

                <Pressable
                  disabled={loading}
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={12}
                  style={styles.eyeButton}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={21}
                    color="#F4A000"
                  />
                </Pressable>
              </View>

              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}

              {/* Confirm password */}
              <View
                style={[
                  styles.passwordBox,
                  {
                    backgroundColor: inputBackground,
                    borderColor: confirmPasswordError
                      ? "#EF4444"
                      : "#456477",
                  },
                ]}
              >
                <TextInput
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    setConfirmPasswordError("");
                  }}
                  onSubmitEditing={handleResetPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="#7894A2"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  returnKeyType="done"
                  editable={!loading}
                  style={styles.passwordInput}
                />

                <Pressable
                  disabled={loading}
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  hitSlop={12}
                  style={styles.eyeButton}
                >
                  <Feather
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={21}
                    color="#F4A000"
                  />
                </Pressable>
              </View>

              {confirmPasswordError ? (
                <Text style={styles.errorText}>
                  {confirmPasswordError}
                </Text>
              ) : null}

              <Text style={[styles.hint, { color: muted }]}>
                Use at least 6 characters, with uppercase, lowercase and a
                number.
              </Text>

              {/* Animated update button */}
              <View style={styles.buttonContainer}>
                <Animated.View
                  pointerEvents="none"
                  style={[styles.buttonGlow, glowStyle]}
                />

                <Pressable
                  onPress={handleResetPassword}
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
                        <Text style={styles.buttonText}>
                          UPDATE PASSWORD
                        </Text>
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

              {/* Back to login */}
              <Pressable
                disabled={loading}
                onPress={() => router.replace("/login")}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.backText}>← Back to Login</Text>
              </Pressable>

              <View style={styles.footerLine} />

              <Text style={[styles.footerText, { color: muted }]}>
                JAY TECHNOLOGIES • ACCOUNT SECURITY
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
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 24,
    alignSelf: "center",
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
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 40,
    marginTop: 9,
    letterSpacing: -0.7,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
    marginBottom: 20,
  },

  emailBox: {
    backgroundColor: "#17394B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#31566A",
    padding: 14,
    marginBottom: 23,
    alignItems: "center",
    justifyContent: "center",
  },

  emailLabel: {
    color: "#9DB5C0",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: "center",
  },

  emailText: {
    color: "#F4A000",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 9,
    textAlign: "center",
    alignSelf: "stretch",
    includeFontPadding: false,
  },

  label: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 9,
  },

  passwordBox: {
    height: 57,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  passwordBx: {
    marginBottom: 30,
  },

  passwordInput: {
    flex: 1,
    minWidth: 0,
    height: 52,
    color: "#FFFFFF",
    paddingLeft: 13,
    paddingRight: 5,
    fontSize: 14,
    borderRadius: 14,
    marginLeft: -12,
  },

  eyeButton: {
    width: 38,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
  },

  errorText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
  },

  secondLabel: {
    marginTop: 20,
  },

  hint: {
    fontSize: 10,
    lineHeight: 17,
    marginTop: 12,
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

  footerText: {
    textAlign: "center",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
});