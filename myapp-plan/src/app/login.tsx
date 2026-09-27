import { loginUser } from "@/services/authApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRef, useState } from "react";

import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { router } from "expo-router";

import {
  showError,
  showSuccess,
} from "@/components/JayToast";

// =============================================================
// REGEX
// =============================================================

const EMAIL_REGEX =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Login only requires minimum 6 characters.
// This avoids blocking existing users whose old passwords
// may not satisfy the stronger registration rule.
const PASSWORD_REGEX =
  /^.{6,}$/;

export default function LoginScreen() {
  // ===========================================================
  // STATE
  // ===========================================================

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [rememberMe, setRememberMe] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  // ===========================================================
  // SCROLL
  // ===========================================================

  const scrollRef =
    useRef<ScrollView>(null);

  // ===========================================================
  // MOVE INPUT ABOVE KEYBOARD
  // ===========================================================

  const handleFocus = (y: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y,
        animated: true,
      });
    }, 100);
  };

  // ===========================================================
  // LOGIN
  // ===========================================================

  const handleLogin = async () => {
    try {
      const cleanEmail =
        email.trim().toLowerCase();

      // =====================================================
      // EMAIL REQUIRED
      // =====================================================

      if (!cleanEmail) {
        showError(
          "Email Required",
          "Please enter your email address."
        );

        return;
      }

      // =====================================================
      // EMAIL REGEX
      // =====================================================

      if (
        !EMAIL_REGEX.test(
          cleanEmail
        )
      ) {
        showError(
          "Invalid Email",
          "Please enter a valid email address."
        );

        return;
      }

      // =====================================================
      // PASSWORD REQUIRED
      // =====================================================

      if (!password) {
        showError(
          "Password Required",
          "Please enter your password."
        );

        return;
      }

      // =====================================================
      // PASSWORD REGEX
      // =====================================================

      if (
        !PASSWORD_REGEX.test(
          password
        )
      ) {
        showError(
          "Invalid Password",
          "Password must contain at least 6 characters."
        );

        return;
      }

      // =====================================================
      // LOGIN REQUEST
      // =====================================================

      console.log(
        "LOGIN REQUEST:",
        {
          email: cleanEmail,
          hasPassword: !!password,
        }
      );

      const result =
        await loginUser({
          email: cleanEmail,
          password,
        });

      console.log(
        "LOGIN RESPONSE:",
        result
      );

      // =====================================================
      // LOGIN FAILED
      // =====================================================

      if (!result?.success) {
        showError(
          "Login Failed",
          result?.message ||
            "Invalid email or password."
        );

        return;
      }

      // =====================================================
      // TOKEN
      // =====================================================

      if (!result.token) {
        console.error(
          "LOGIN SUCCESS BUT TOKEN IS MISSING"
        );

        showError(
          "Login Failed",
          "Login succeeded but authentication token was not received."
        );

        return;
      }

      // =====================================================
      // SAVE TOKEN
      // =====================================================

      await AsyncStorage.setItem(
        "token",
        result.token
      );

      // =====================================================
      // SAVE USER
      // =====================================================

      if (result.user) {
        await AsyncStorage.setItem(
          "user",
          JSON.stringify(
            result.user
          )
        );
      }

      // =====================================================
      // REMEMBER ME
      // =====================================================

      await AsyncStorage.setItem(
        "rememberMe",
        rememberMe
          ? "true"
          : "false"
      );

      console.log(
        "TOKEN SAVED"
      );

      // =====================================================
      // SUCCESS
      // =====================================================

      showSuccess(
        "Login Successful 🎉",
        `Welcome back, ${
          result.user?.fname ||
          "User"
        }!`
      );

      setTimeout(() => {
        router.replace("/user");
      }, 500);

    } catch (error: any) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      console.error(
        "STATUS:",
        error?.response?.status
      );

      console.error(
        "SERVER RESPONSE:",
        error?.response?.data
      );

      console.error(
        "REQUEST URL:",
        error?.config?.baseURL,
        error?.config?.url
      );

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.";

      showError(
        "Login Failed",
        message
      );
    }
  };

  // ===========================================================
  // FORGOT PASSWORD
  // ===========================================================

  const handleForgotPassword =
    () => {
      router.push(
        "/forgot-password"
      );
    };

  // ===========================================================
  // REGISTER
  // ===========================================================

  const handleRegister = () => {
    router.push("/register");
  };

  // ===========================================================
  // UI
  // ===========================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
      keyboardVerticalOffset={
        Platform.OS === "ios"
          ? 10
          : 0
      }
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
        automaticallyAdjustKeyboardInsets={
          true
        }
      >
        <View style={styles.card}>

          {/* =================================================
              BACK
          ================================================= */}

          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              {
                opacity: pressed
                  ? 0.6
                  : 1,
              },
            ]}
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.backText
              }
            >
              ← Back
            </Text>
          </Pressable>

          {/* =================================================
              TITLE
          ================================================= */}

          <Text style={styles.title}>
            Welcome Back
          </Text>

          <Text
            style={styles.subtitle}
          >
            Login to your Jay Tech account
          </Text>

          {/* =================================================
              EMAIL
          ================================================= */}

          <View
            style={
              styles.inputContainer
            }
          >
            <Text
              style={styles.label}
            />

            <TextInput
              value={email}
              onChangeText={(value) =>
                setEmail(
                  value
                    .replace(
                      /\s/g,
                      ""
                    )
                    .slice(0, 100)
                )
              }
              onFocus={() =>
                handleFocus(0)
              }
              placeholder="Enter your email"
              placeholderTextColor="#7894A2"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              style={styles.input}
            />
          </View>

          {/* =================================================
              PASSWORD
          ================================================= */}

          <View
            style={
              styles.inputContainer
            }
          >
            <Text
              style={styles.label}
            />

            <View>
              <TextInput
                value={password}
                onChangeText={
                  setPassword
                }
                onFocus={() =>
                  handleFocus(70)
                }
                placeholder="Enter your password"
                placeholderTextColor="#7894A2"
                secureTextEntry={
                  !showPassword
                }
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                style={[
                  styles.input,
                  styles.passwordInput,
                ]}
              />

              {/* SHOW / HIDE */}

              <Pressable
                style={({ pressed }) => [
                  styles.showButton,
                  {
                    opacity:
                      pressed
                        ? 0.6
                        : 1,
                  },
                ]}
                onPress={() =>
                  setShowPassword(
                    (previous) =>
                      !previous
                  )
                }
              >
                <Text
                  style={
                    styles.showText
                  }
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* =================================================
              OPTIONS
          ================================================= */}

          <View
            style={
              styles.optionsRow
            }
          >
            {/* REMEMBER ME */}

            <Pressable
              style={
                styles.rememberRow
              }
              onPress={() =>
                setRememberMe(
                  (previous) =>
                    !previous
                )
              }
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe &&
                    styles.checkboxChecked,
                ]}
              >
                {rememberMe && (
                  <Text
                    style={
                      styles.checkmark
                    }
                  >
                    ✓
                  </Text>
                )}
              </View>

              <Text
                style={
                  styles.rememberText
                }
              >
                Remember Me
              </Text>
            </Pressable>

            {/* FORGOT */}

            <Pressable
              onPress={
                handleForgotPassword
              }
              hitSlop={8}
            >
              <Text
                style={
                  styles.forgotText
                }
              >
                Forgot Password?
              </Text>
            </Pressable>
          </View>

          {/* =================================================
              LOGIN
          ================================================= */}

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              {
                opacity: pressed
                  ? 0.75
                  : 1,
              },
            ]}
            onPress={handleLogin}
          >
            <Text
              style={
                styles.loginButtonText
              }
            >
              Login
            </Text>
          </Pressable>

          {/* =================================================
              REGISTER
          ================================================= */}

          <View
            style={
              styles.registerRow
            }
          >
            <Text
              style={
                styles.registerText
              }
            >
              Don't have an account?
            </Text>

            <Pressable
              onPress={
                handleRegister
              }
              hitSlop={8}
            >
              <Text
                style={
                  styles.registerLink
                }
              >
                Register
              </Text>
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// =============================================================
// STYLES
// =============================================================

const styles = StyleSheet.create({
  // ===========================================================
  // MAIN
  // ===========================================================

  container: {
    marginTop: 30,
    flex: 1,
    backgroundColor: "#071E2B",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,

    justifyContent: "center",

    alignItems: "center",

    padding: 22,

    paddingBottom: 70,
  },

  // ===========================================================
  // CARD
  // ===========================================================

  card: {
    width: "100%",
    maxWidth: 450,

    padding: 25,

    borderRadius: 18,

    backgroundColor: "#102F40",

    borderWidth: 1,
    borderColor: "#2C596B",

    elevation: 8,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.25,

    shadowRadius: 10,
  },

  // ===========================================================
  // BACK
  // ===========================================================

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 18,
    marginLeft: 230,
  },

  backText: {
    color: "#9DB5C0",
    fontSize: 15,
    fontWeight: "700",
  },

  // ===========================================================
  // TITLE
  // ===========================================================

  title: {
    color: "#FFFFFF",

    fontSize: 30,

    fontWeight: "900",

    textAlign: "center",

    marginBottom: 7,
  },

  subtitle: {
    color: "#9DB5C0",

    fontSize: 15,

    textAlign: "center",

    marginBottom: 10,
  },

  // ===========================================================
  // INPUT
  // ===========================================================

  inputContainer: {
    marginBottom: 8,
  },

  label: {
    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "800",

    marginBottom: 8,
  },

  input: {
    height: 51,

    borderRadius: 13,

    backgroundColor: "#17394B",

    color: "#FFFFFF",

    paddingHorizontal: 14,

    fontSize: 15,

    borderWidth: 1,

    borderColor: "#2C596B",
  },

  passwordInput: {
    paddingRight: 70,
  },

  // ===========================================================
  // SHOW / HIDE
  // ===========================================================

  showButton: {
    position: "absolute",

    right: 15,

    top: 16,
  },

  showText: {
    color: "#F4A000",

    fontSize: 13,

    fontWeight: "800",
  },

  // ===========================================================
  // OPTIONS
  // ===========================================================

  optionsRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginTop: 2,

    marginBottom: 24,
  },

  rememberRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 8,
  },

  checkbox: {
    width: 20,

    height: 20,

    borderWidth: 1,

    borderRadius: 5,

    borderColor: "#527382",

    backgroundColor:
      "transparent",

    alignItems: "center",

    justifyContent: "center",
  },

  checkboxChecked: {
    backgroundColor: "#F4A000",

    borderColor: "#F4A000",
  },

  checkmark: {
    color: "#071E2B",

    fontSize: 14,

    fontWeight: "900",
  },

  rememberText: {
    color: "#FFFFFF",

    fontSize: 13,

    fontWeight: "700",
  },

  forgotText: {
    color: "#F4A000",

    fontSize: 13,

    fontWeight: "800",
  },

  // ===========================================================
  // LOGIN BUTTON
  // ===========================================================

  loginButton: {
    height: 52,

    borderRadius: 14,

    backgroundColor: "#F4A000",

    alignItems: "center",

    justifyContent: "center",

    elevation: 4,

    shadowColor: "#F4A000",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.25,

    shadowRadius: 5,
  },

  loginButtonText: {
    color: "#071E2B",

    fontSize: 16,

    fontWeight: "900",
  },

  // ===========================================================
  // REGISTER
  // ===========================================================

  registerRow: {
    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    marginTop: 22,

    gap: 5,
  },

  registerText: {
    color: "#9DB5C0",

    fontSize: 14,
  },

  registerLink: {
    color: "#F4A000",

    fontSize: 14,

    fontWeight: "900",
  },
});