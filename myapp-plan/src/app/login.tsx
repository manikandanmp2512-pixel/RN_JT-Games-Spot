import { showError, showSuccess } from "@/components/JayToast";
import { loginUser } from "@/services/authApi";
import "@/services/chessAds";
import { disconnectChessSocket } from "@/services/chessSocket";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
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

const PASSWORD_REGEX = /^.{6,}$/;

const AnimatedLinearGradient =
  Animated.createAnimatedComponent(LinearGradient);

export default function LoginScreen() {
  const [mobilenumber, setMobilenumber] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileFocused, setMobileFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  // Ambient background animations.
  const floatTop = useRef(new Animated.Value(0)).current;
  const floatBottom = useRef(new Animated.Value(0)).current;
  const accentShimmer = useRef(new Animated.Value(0)).current;

  // Entrance animations.
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(26)).current;
  const brandFade = useRef(new Animated.Value(0)).current;
  const brandSlide = useRef(new Animated.Value(12)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(15)).current;
  const mobileFade = useRef(new Animated.Value(0)).current;
  const mobileSlide = useRef(new Animated.Value(12)).current;
  const passwordFade = useRef(new Animated.Value(0)).current;
  const passwordSlide = useRef(new Animated.Value(12)).current;
  const actionsFade = useRef(new Animated.Value(0)).current;
  const actionsSlide = useRef(new Animated.Value(10)).current;

  // Text and button animations.
  const buttonGlow = useRef(new Animated.Value(0)).current;
  const titleColorProgress = useRef(new Animated.Value(0)).current;
  const brandColorProgress = useRef(new Animated.Value(0)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(7)).current;
  const gradientPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeFloatLoop = (
      value: Animated.Value,
      duration: number,
      delay: number
    ) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

    const topFloat = makeFloatLoop(floatTop, 7200, 0);
    const bottomFloat = makeFloatLoop(floatBottom, 8600, 350);

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(accentShimmer, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(accentShimmer, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const entrance = Animated.sequence([
      Animated.parallel([
        Animated.timing(cardFade, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardSlide, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(100, [
        Animated.parallel([
          Animated.timing(brandFade, {
            toValue: 1,
            duration: 480,
            useNativeDriver: true,
          }),
          Animated.timing(brandSlide, {
            toValue: 0,
            duration: 480,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(titleFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(titleSlide, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(mobileFade, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(mobileSlide, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(passwordFade, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(passwordSlide, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(actionsFade, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(actionsSlide, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    const buttonGlowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonGlow, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(buttonGlow, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const titleTextLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(titleColorProgress, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(titleColorProgress, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    );

    const brandTextLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(brandColorProgress, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(brandColorProgress, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );

    const subtitleEntrance = Animated.parallel([
      Animated.timing(subtitleFade, {
        toValue: 1,
        duration: 700,
        delay: 450,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleSlide, {
        toValue: 0,
        duration: 700,
        delay: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const gradientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(gradientPulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(gradientPulse, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    topFloat.start();
    bottomFloat.start();
    shimmerLoop.start();
    entrance.start();
    buttonGlowLoop.start();
    titleTextLoop.start();
    brandTextLoop.start();
    subtitleEntrance.start();
    gradientLoop.start();

    return () => {
      topFloat.stop();
      bottomFloat.stop();
      shimmerLoop.stop();
      entrance.stop();
      buttonGlowLoop.stop();
      titleTextLoop.stop();
      brandTextLoop.stop();
      subtitleEntrance.stop();
      gradientLoop.stop();
    };
  }, [
    floatTop,
    floatBottom,
    accentShimmer,
    cardFade,
    cardSlide,
    brandFade,
    brandSlide,
    titleFade,
    titleSlide,
    mobileFade,
    mobileSlide,
    passwordFade,
    passwordSlide,
    actionsFade,
    actionsSlide,
    buttonGlow,
    titleColorProgress,
    brandColorProgress,
    subtitleFade,
    subtitleSlide,
    gradientPulse,
  ]);

  const handleLogin = async () => {
    if (loading) return;

    const cleanMobile = mobilenumber.replace(/\D/g, "");

    if (cleanMobile.length < 6 || cleanMobile.length > 15) {
      showError("Invalid Mobile Number", "Please check your mobile number.");
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      showError(
        "Invalid Password",
        "Password must contain at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const result = await loginUser({
        mobilenumber: cleanMobile,
        password,
      });

      if (!result?.success) {
        showError(
          "Login Failed",
          result?.message || "Invalid mobile number or password."
        );
        return;
      }

      if (!result.token) {
        showError("Login Failed", "Authentication token was not received.");
        return;
      }

      await disconnectChessSocket();
      await AsyncStorage.setItem("token", result.token);

      if (result.user) {
        await AsyncStorage.setItem("user", JSON.stringify(result.user));
      }

      await AsyncStorage.setItem(
        "rememberMe",
        rememberMe ? "true" : "false"
      );

      showSuccess(
        "Login Successful 🎉",
        `Welcome back, ${result.user?.fname || "User"}!`
      );

      setTimeout(() => router.replace("/user"), 500);
    } catch (error: any) {
      console.error("LOGIN ERROR:", error?.response?.data || error);

      showError(
        "Login Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const titleAnimatedColor = titleColorProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["#F4A000", "#FFE7B5"],
  });

  const brandAnimatedColor = brandColorProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["#F5F8FA", "#F4C56B"],
  });

  const buttonShadowOpacity = buttonGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.16, 0.38],
  });

  const buttonShadowRadius = buttonGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 17],
  });

  const gradientOverlayOpacity = gradientPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.32],
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#07131D" />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        <View pointerEvents="none" style={styles.backgroundDecor}>
          <Animated.View
            style={[
              styles.orbTop,
              {
                transform: [
                  {
                    translateX: floatTop.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 32],
                    }),
                  },
                  {
                    translateY: floatTop.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 42],
                    }),
                  },
                  {
                    scale: floatTop.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.94, 1.1],
                    }),
                  },
                ],
                opacity: floatTop.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 0.82],
                }),
              },
            ]}
          />

          <Animated.View
            style={[
              styles.orbBottom,
              {
                transform: [
                  {
                    translateX: floatBottom.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -28],
                    }),
                  },
                  {
                    translateY: floatBottom.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -36],
                    }),
                  },
                  {
                    scale: floatBottom.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1.05, 0.9],
                    }),
                  },
                ],
                opacity: floatBottom.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.45, 0.75],
                }),
              },
            ]}
          />

          <Animated.View
            style={[
              styles.verticalAccent,
              {
                opacity: accentShimmer.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.45, 0.95],
                }),
              },
            ]}
          />

          <Animated.View
            style={[
              styles.gridLineOne,
              {
                opacity: accentShimmer.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.18, 0.48],
                }),
              },
            ]}
          />

          <Animated.View
            style={[
              styles.gridLineTwo,
              {
                opacity: accentShimmer.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.15, 0.4],
                }),
              },
            ]}
          />
        </View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: cardFade,
              transform: [{ translateY: cardSlide }],
            },
          ]}
        >
          <LinearGradient
            colors={["#F4A000", "#6BC6C8", "#244F65", "#F4A000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradientBorder}
          >
            {/* GRADIENT LOGIN PANEL */}
            <LinearGradient
              colors={["#173B4B", "#102A38", "#0B1D29", "#163747"]}
              locations={[0, 0.38, 0.72, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <Animated.View
                style={[
                  styles.topBar,
                  {
                    opacity: brandFade,
                    transform: [{ translateY: brandSlide }],
                  },
                ]}
              >
                <View style={styles.brandGroup}>
                  <AnimatedLinearGradient
                    colors={["#FFE0A0", "#F4A000", "#C77800"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.logoMark,
                      {
                        transform: [
                          {
                            scale: floatTop.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.045],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Text style={styles.logoLetter}>J</Text>
                  </AnimatedLinearGradient>

                  <View>
                    <Animated.Text
                      style={[styles.brandName, { color: brandAnimatedColor }]}
                    >
                      JAY TECH
                    </Animated.Text>
                    <Text style={styles.brandCaption}>
                      GAMES  /  TECHNOLOGY
                    </Text>
                  </View>
                </View>

                {/* <LinearGradient
                  colors={["#193B49", "#102733"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.accessPill}
                > */}
                  <Pressable
                    onPress={() => router.replace("/")}
                    disabled={loading}
                    style={styles.accessPill}
                  >
                    <Text style={{ color: "#F4A000", fontWeight: "900", fontSize: 11 }}>
                      ← BACK
                    </Text>
                  </Pressable>
                {/* </LinearGradient> */}

              </Animated.View>

              <Animated.View
                style={{
                  opacity: titleFade,
                  transform: [{ scaleX: titleFade }],
                }}
              >
                <LinearGradient
                  colors={["#F4A000", "#FFE0A0", "#315160"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.heroRule}
                />
              </Animated.View>

              <Animated.View
                style={[
                  styles.cardHeadingRow,
                  {
                    opacity: titleFade,
                    transform: [{ translateY: titleSlide }],
                  },
                ]}
              >
                <View style={styles.headingTextWrap}>
                  <Animated.Text
                    style={[styles.cardTitle, { color: titleAnimatedColor }]}
                  >
                    Welcome back
                  </Animated.Text>

                  <Animated.Text
                    style={[
                      styles.headingSubtitle,
                      {
                        opacity: subtitleFade,
                        transform: [{ translateY: subtitleSlide }],
                      },
                    ]}
                  >
                    Your next move starts here.
                  </Animated.Text>
                </View>

                <Animated.View
                  style={[
                    styles.cardIcon,
                    {
                      transform: [
                        {
                          rotate: floatBottom.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "5deg"],
                          }),
                        },
                        {
                          scale: floatBottom.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.06],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={["#244F65", "#142F3D"]}
                    style={styles.cardIconGradient}
                  >
                    <Text style={styles.cardIconText}>♞</Text>
                  </LinearGradient>
                </Animated.View>
              </Animated.View>

              {/* MOBILE NUMBER */}
              <Animated.View
                style={{
                  opacity: mobileFade,
                  transform: [{ translateY: mobileSlide }],
                }}
              >
                <LinearGradient
                  colors={
                    mobileFocused
                      ? ["#FFE0A0", "#F4A000", "#62DCE0"]
                      : ["#294653", "#294653"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.inputBorderOuter}
                >
                  <View
                    style={[
                      styles.inputShell,
                      mobileFocused && styles.inputFocusedShadow,
                    ]}
                  >
                    {/* <View style={styles.inputIconWrap}>
                      <Text style={styles.inputIcon}>☎</Text>
                    </View> */}

                    <TextInput
                      value={mobilenumber}
                      onChangeText={(value) =>
                        setMobilenumber(value.replace(/\D/g, "").slice(0, 15))
                      }
                      onFocus={() => setMobileFocused(true)}
                      onBlur={() => setMobileFocused(false)}
                      keyboardType="phone-pad"
                      placeholder="Enter mobile number"
                      placeholderTextColor="#78909D"
                      editable={!loading}
                      returnKeyType="next"
                      underlineColorAndroid="transparent"
                      selectionColor="#F4A000"
                      autoCorrect={false}
                      style={styles.input}
                    />
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* PASSWORD */}
              <Animated.View
                style={{
                  opacity: passwordFade,
                  transform: [{ translateY: passwordSlide }],
                }}
              >
                <View style={styles.passwordLabelRow}>
                  <Text style={styles.fieldHint}>MIN. 6 CHARACTERS</Text>
                </View>

                <LinearGradient
                  colors={
                    passwordFocused
                      ? ["#FFE0A0", "#F4A000", "#62DCE0"]
                      : ["#294653", "#294653"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.inputBorderOuter}
                >
                  <View
                    style={[
                      styles.passwordContainer,
                      passwordFocused && styles.inputFocusedShadow,
                    ]}
                  >
                    {/* <View style={styles.inputIconWrap}>
                      <Text style={styles.inputIcon}>▣</Text>
                    </View> */}

                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder="Enter your password"
                      placeholderTextColor="#78909D"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      editable={!loading}
                      underlineColorAndroid="transparent"
                      selectionColor="#F4A000"
                      style={styles.passwordInput}
                    />

                    {/* PASSWORD SHOW / HIDE ICON */}
                    <Pressable
                      onPress={() => setShowPassword((current) => !current)}
                      disabled={loading}
                      hitSlop={10}
                      style={styles.visibilityButton}
                    >
                      <Feather
                        name={showPassword ? "eye-off" : "eye"}
                        size={19}
                        color={showPassword ? "#62DCE0" : "#F4A000"}
                      />
                    </Pressable>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* LOGIN OPTIONS */}
              <Animated.View
                style={{
                  opacity: actionsFade,
                  transform: [{ translateY: actionsSlide }],
                }}
              >
                <View style={styles.optionsRow}>
                  <Pressable
                    style={styles.rememberRow}
                    onPress={() => setRememberMe((current) => !current)}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={
                        rememberMe
                          ? ["#FFE0A0", "#F4A000"]
                          : ["#102733", "#102733"]
                      }
                      style={[
                        styles.checkbox,
                        rememberMe && styles.checkboxActive,
                      ]}
                    >
                      {rememberMe ? (
                        <Text style={styles.checkmark}>✓</Text>
                      ) : null}
                    </LinearGradient>

                    <Text style={styles.rememberText}>Remember me</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push("/forgot-password")}
                    disabled={loading}
                    hitSlop={8}
                  >
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </Pressable>
                </View>

                <Animated.View
                  style={[
                    styles.loginButtonShadow,
                    {
                      shadowOpacity: buttonShadowOpacity,
                      shadowRadius: buttonShadowRadius,
                    },
                  ]}
                >
                  <Pressable
                    onPress={handleLogin}
                    disabled={loading}
                    style={({ pressed }) => [
                      styles.loginButtonPressable,
                      pressed && !loading && styles.loginButtonPressed,
                      loading && styles.loginButtonDisabled,
                    ]}
                  >
                    <LinearGradient
                      colors={["#FFE0A0", "#F4A000", "#D88900"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.loginButton}
                    >
                      <AnimatedLinearGradient
                        pointerEvents="none"
                        colors={["#FFFFFF", "#FFFFFF"]}
                        style={[
                          styles.buttonShimmerOverlay,
                          { opacity: gradientOverlayOpacity },
                        ]}
                      />

                      {loading ? (
                        <ActivityIndicator color="#101820" />
                      ) : (
                        <>
                          <Text style={styles.loginButtonText}>SIGN IN</Text>
                          <Text style={styles.loginButtonArrow}>↗</Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
                
                <View style={styles.registerRow}>
                  <Text style={styles.registerPrompt}>New to Jay Tech?</Text>

                  <Pressable
                    onPress={() => router.push("/register")}
                    disabled={loading}
                    hitSlop={8}
                  >
                    <Text style={styles.registerLink}>Create an account</Text>
                  </Pressable>

                </View>
              </Animated.View>
            </LinearGradient>
          </LinearGradient>

          {/* FOOTER */}
          <Animated.View
            style={[
              styles.footer,
              {
                opacity: actionsFade,
                transform: [{ translateY: actionsSlide }],
              },
            ]}
          >
            <LinearGradient
              colors={["#F4A000", "#62DCE0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.footerLine}
            />

            <Text style={styles.footerText}>
              © JAY TECH  •  PLAY SMARTER
            </Text>

            <Text style={styles.footerVersion}>
              YOUR GAME. YOUR NEXT MOVE.
            </Text>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07131D",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingTop: 34,
    paddingBottom: 28,
    overflow: "hidden",
  },

  backgroundDecor: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 29,
  },

  orbTop: {
    position: "absolute",
    width: 310,
    height: 310,
    borderRadius: 155,
    top: -170,
    right: -125,
    backgroundColor: "#173D4B",
    opacity: 0.72,
  },

  orbBottom: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    bottom: -130,
    left: -125,
    backgroundColor: "#183849",
    opacity: 0.7,
  },

  verticalAccent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 4,
    backgroundColor: "#F4A000",
    opacity: 0.85,
  },

  gridLineOne: {
    position: "absolute",
    width: 260,
    height: 1,
    top: "23%",
    right: -100,
    backgroundColor: "#355464",
    opacity: 0.4,
    transform: [{ rotate: "-35deg" }],
  },

  gridLineTwo: {
    position: "absolute",
    width: 230,
    height: 1,
    bottom: "18%",
    left: -100,
    backgroundColor: "#355464",
    opacity: 0.35,
    transform: [{ rotate: "-35deg" }],
  },

  content: {
    width: "100%",
    maxWidth: 470,
    alignSelf: "center",
  },

  cardGradientBorder: {
    borderRadius: 26,
    padding: 1.2,
    shadowColor: "#F4A000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 10,
  },

  // Gradient login panel.
  card: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#294653",
    borderRadius: 25,
    padding: 23,
    overflow: "hidden",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 38,
  },

  brandGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  logoMark: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F4A000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },

  logoLetter: {
    color: "#11038d",
    fontSize: 29,
    fontFamily: "IBM Plex Mono",
    fontWeight: "900",
    lineHeight: 34,
  },

  brandName: {
    color: "#F5F8FA",
    fontSize: 15,
    fontFamily: "IBM Plex Mono",
    fontWeight: "900",
    letterSpacing: 2.2,
  },

  brandCaption: {
    color: "#8299A5",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginTop: 4,
  },

  accessPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "#355665",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 30,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F4A000",
  },

  accessText: {
    color: "#B9C9D0",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },

  heroRule: {
    width: 86,
    height: 3,
    marginTop: -18,
    marginBottom: 22,
    borderRadius: 3,
    overflow: "hidden",
  },

  cardHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 26,
  },

  headingTextWrap: {
    flex: 1,
  },

  cardTitle: {
    color: "#F4A000",
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  headingSubtitle: {
    color: "#8FA5AF",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginTop: 6,
  },

  cardIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#355665",
    overflow: "hidden",
  },

  cardIconGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  cardIconText: {
    color: "#F4A000",
    fontSize: 25,
    fontWeight: "700",
  },

  fieldLabel: {
    color: "#C0CED4",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 9,
  },

  inputBorderOuter: {
    width: "100%",
    borderRadius: 14,
    padding: 1.3,
  },

  inputShell: {
    width: "100%",
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B1D27",
    borderRadius: 12.7,
    paddingHorizontal: 12,
  },

  passwordContainer: {
    width: "100%",
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B1D27",
    borderRadius: 12.7,
    paddingHorizontal: 12,
  },

  inputFocusedShadow: {
    shadowColor: "#62DCE0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 5,
  },

  inputIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#193542",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    flexShrink: 0,
  },

  inputIcon: {
    color: "#F4A000",
    fontSize: 15,
    fontWeight: "800",
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: 54,
    paddingHorizontal: 0,
    paddingVertical: 0,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    backgroundColor: "transparent",
    includeFontPadding: false,
    paddingLeft: 20,
    borderWidth: 0,
    borderRadius: 12.7,
    marginBottom: 0,
    marginLeft: -10,
    marginRight: -10,
  },

  passwordLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 21,
    marginBottom: 9,
  },

  fieldHint: {
    color: "#6F8793",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    alignSelf: "flex-end",
  },

  passwordInput: {
    flex: 1,
    minWidth: 0,
    height: 54,
    paddingHorizontal: 0,
    paddingVertical: 0,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    backgroundColor: "transparent",
    includeFontPadding: false,
    borderWidth: 0,
    paddingLeft: 20,
    borderRadius: 12.7,
    marginBottom: 0,
    marginLeft: -11,
  },

  // Password eye icon button.
  visibilityButton: {
    width: 36,
    height: 40,
    flexShrink: 0,
    marginLeft: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 19,
    marginBottom: 23,
  },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#627C88",
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxActive: {
    borderColor: "#F4A000",
  },

  checkmark: {
    color: "#07131D",
    fontSize: 12,
    fontWeight: "900",
  },

  rememberText: {
    color: "#A9BBC3",
    fontSize: 11,
  },

  forgotText: {
    color: "#F4A000",
    fontSize: 11,
    fontWeight: "800",
  },

  loginButtonShadow: {
    borderRadius: 14,
    shadowColor: "#F4A000",
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },

  loginButtonPressable: {
    borderRadius: 14,
    overflow: "hidden",
  },

  loginButton: {
    height: 56,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    overflow: "hidden",
  },

  buttonShimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 29,
  },

  loginButtonText: {
    color: "#101820",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  loginButtonArrow: {
    color: "#101820",
    fontSize: 20,
    fontWeight: "800",
    marginTop: -2,
  },

  loginButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  loginButtonDisabled: {
    opacity: 0.6,
  },

  registerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 23,
  },

  registerPrompt: {
    color: "#8198A3",
    fontSize: 14,
  },

  registerLink: {
    color: "#F4A000",
    fontSize: 15,
    fontWeight: "900",
  },

  footer: {
    alignItems: "center",
    marginTop: 26,
  },

  footerLine: {
    width: 34,
    height: 2,
    borderRadius: 2,
    marginBottom: 12,
    opacity: 0.9,
  },

  footerText: {
    color: "#8299A5",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  footerVersion: {
    color: "#536D79",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 6,
  },
  backButton: {
    alignItems: "center",
    marginTop: 24,
    padding: 8,
  },
});