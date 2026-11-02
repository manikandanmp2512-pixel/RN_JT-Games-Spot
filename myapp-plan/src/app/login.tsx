import { loginUser } from "@/services/authApi";
import "@/services/chessAds";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { disconnectChessSocket } from "@/services/chessSocket";
import { router } from "expo-router";
import { useRef, useState } from "react";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  showError,
  showSuccess,
} from "@/components/JayToast";

const PASSWORD_REGEX = /^.{6,}$/;

export default function LoginScreen() {
  const [countryCode, setCountryCode] = useState("+91");
  const [mobilenumber, setMobilenumber] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const handleFocus = (y: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y,
        animated: true,
      });
    }, 100);
  };

  const handleLogin = async () => {
    if (loading) return;

    const cleanCode = countryCode.trim();
    const cleanMobile = mobilenumber.replace(/\D/g, "");

    if (!/^\+[1-9]\d{0,3}$/.test(cleanCode)) {
      showError("Invalid Country Code", "Enter a valid country calling code, such as +91.");
      return;
    }

    if (!cleanMobile) {
      showError("Mobile Required", "Please enter your registered mobile number.");
      return;
    }

    if (cleanMobile.length < 6 || cleanMobile.length > 15) {
      showError("Invalid Mobile Number", "Please check your mobile number.");
      return;
    }

    if (!password) {
      showError("Password Required", "Please enter your password.");
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      showError("Invalid Password", "Password must contain at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const result = await loginUser({
        countryCode: cleanCode,
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
        showError(
          "Login Failed",
          "Authentication token was not received from the server."
        );
        return;
      }

      await disconnectChessSocket();

      await AsyncStorage.setItem("token", result.token);

      if (result.user) {
        await AsyncStorage.setItem(
          "user",
          JSON.stringify(result.user)
        );
      }

      await AsyncStorage.setItem(
        "rememberMe",
        rememberMe ? "true" : "false"
      );

      showSuccess(
        "Login Successful 🎉",
        `Welcome back, ${result.user?.fname || "User"}!`
      );

      setTimeout(() => {
        router.replace("/user");
      }, 500);
    } catch (error: any) {
      console.error("LOGIN ERROR:", error);
      console.error("LOGIN STATUS:", error?.response?.status);
      console.error("LOGIN RESPONSE:", error?.response?.data);

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.card}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoLetter}>J</Text>
            </View>
            <Text style={styles.logoText}>JAY TECH</Text>
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Login to your Jay Tech account
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile Number</Text>

            <View style={styles.phoneRow}>
              <TextInput
                value={countryCode}
                onChangeText={(value) => {
                  const cleaned = value.replace(/[^\d+]/g, "");
                  setCountryCode(
                    cleaned.startsWith("+") ? cleaned : `+${cleaned}`
                  );
                }}
                keyboardType="phone-pad"
                placeholder="+91"
                placeholderTextColor="#7894A2"
                editable={!loading}
                style={[styles.input, styles.countryCodeInput]}
              />

              <TextInput
                value={mobilenumber}
                onChangeText={(value) =>
                  setMobilenumber(value.replace(/\D/g, "").slice(0, 15))
                }
                onFocus={() => handleFocus(0)}
                keyboardType="phone-pad"
                placeholder="Enter mobile number"
                placeholderTextColor="#7894A2"
                autoCorrect={false}
                returnKeyType="next"
                editable={!loading}
                style={[styles.input, styles.mobileInput]}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>

            <View>
              <TextInput
                value={password}
                onChangeText={setPassword}
                onFocus={() => handleFocus(80)}
                placeholder="Enter your password"
                placeholderTextColor="#7894A2"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!loading}
                style={[styles.input, styles.passwordInput]}
              />

              <Pressable
                style={styles.showButton}
                onPress={() => setShowPassword((previous) => !previous)}
              >
                <Text style={styles.showText}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.optionsRow}>
            <Pressable
              style={styles.rememberRow}
              onPress={() => setRememberMe((previous) => !previous)}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxChecked,
                ]}
              >
                {rememberMe && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.rememberText}>Remember Me</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/forgot-password")}
              hitSlop={8}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.loginButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#071E2B" />
                <Text style={styles.loginButtonText}>Logging in...</Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </Pressable>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>
              Don't have an account?
            </Text>
            <Pressable
              onPress={() => router.push("/register")}
              hitSlop={8}
            >
              <Text style={styles.registerLink}>Register</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 18,
  },
  backText: {
    color: "#9DB5C0",
    fontSize: 15,
    fontWeight: "700",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 18,
  },
  logoCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#F4A000",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoLetter: {
    color: "#071E2B",
    fontSize: 35,
    fontWeight: "900",
  },
  logoText: {
    color: "#F4A000",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },
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
    marginBottom: 22,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  phoneRow: {
    flexDirection: "row",
    gap: 9,
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
  countryCodeInput: {
    width: 88,
  },
  mobileInput: {
    flex: 1,
  },
  passwordInput: {
    paddingRight: 70,
  },
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
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
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
    backgroundColor: "transparent",
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
  loginButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F4A000",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  loginButtonText: {
    color: "#071E2B",
    fontSize: 16,
    fontWeight: "900",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
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