import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { sendForgotPasswordOtp } from "@/services/authApi";

export default function ForgotPasswordScreen() {
  const { isDark } = useAppTheme();

  const scrollRef = useRef<ScrollView>(null);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailRegex =
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  // =========================================================
  // KEYBOARD SCROLL
  // =========================================================

  const handleFocus = (y: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y,
        animated: true,
      });
    }, 100);
  };

  // =========================================================
  // EMAIL CHANGE
  // =========================================================

  const handleEmailChange = (value: string) => {
    setEmail(value);

    if (emailError) {
      setEmailError("");
    }
  };

  // =========================================================
  // SEND OTP
  // =========================================================

  const handleSendOtp = async () => {
    if (loading) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    setEmailError("");

    // EMPTY
    if (!normalizedEmail) {
      setEmailError("Please enter your email address.");
      return;
    }

    // FORMAT
    if (!emailRegex.test(normalizedEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      console.log(
        "FORGOT PASSWORD OTP REQUEST:",
        normalizedEmail
      );

      const result = await sendForgotPasswordOtp(
        normalizedEmail
      );

      console.log(
        "FORGOT PASSWORD OTP RESPONSE:",
        result
      );

      if (!result?.success) {
        const message =
          result?.message ||
          "Unable to send OTP. Please try again.";

        setEmailError(message);

        showError(
          "OTP Failed",
          message
        );

        return;
      }

      showSuccess(
        "OTP Sent",
        result?.message ||
          "Password reset OTP sent to your email."
      );

      // =====================================================
      // GO TO FORGOT OTP SCREEN
      // =====================================================

      router.push({
        pathname: "/forgot-password/verify-otp",
        params: {
          email: normalizedEmail,
        },
      });
    } catch (error: any) {
      console.error(
        "FORGOT PASSWORD OTP ERROR:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to send OTP. Please try again.";

      setEmailError(message);

      showError(
        "OTP Failed",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.root]}
    >
      <StatusBar
        barStyle={
          isDark
            ? "light-content"
            : "dark-content"
        }
        backgroundColor={
          isDark
            ? "#071E2B"
            : "#F5F7FA"
        }
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
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
          style={styles.scrollView}
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios"
              ? "interactive"
              : "on-drag"
          }
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark
                  ? "#102F40"
                  : "#FFFFFF",
              },
            ]}
          >
            {/* =================================================
                JAY TECH LOGO
            ================================================= */}

            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoLetter}>
                  J
                </Text>
              </View>

              <Text style={styles.logoText}>
                JAY TECH
              </Text>
            </View>

            {/* =================================================
                TITLE
            ================================================= */}

            <Text
              style={[
                styles.title,
                {
                  color: isDark
                    ? "#FFFFFF"
                    : "#111827",
                },
              ]}
            >
              Forgot Password?
            </Text>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <Text
              style={[
                styles.subtitle,
                {
                  color: isDark
                    ? "#9DB5C0"
                    : "#667085",
                },
              ]}
            >
              Enter your registered email address.
              We will send you an OTP to reset your
              password.
            </Text>

            {/* =================================================
                EMAIL LABEL
            ================================================= */}

            <Text
              style={[
                styles.label,
                {
                  color: isDark
                    ? "#FFFFFF"
                    : "#344054",
                },
              ]}
            />

            {/* =================================================
                EMAIL INPUT
            ================================================= */}

            <TextInput
              value={email}
              onChangeText={handleEmailChange}
              onFocus={() => handleFocus(70)}
              onSubmitEditing={handleSendOtp}
              placeholder="Enter your email"
              placeholderTextColor={
                isDark
                  ? "#7894A2"
                  : "#98A2B3"
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              returnKeyType="done"
              editable={!loading}
              style={[
                styles.input,
                {
                  color: isDark
                    ? "#FFFFFF"
                    : "#101828",

                  backgroundColor: isDark
                    ? "#17394B"
                    : "#F8FAFC",

                  borderColor: emailError
                    ? "#EF4444"
                    : isDark
                    ? "#2C596B"
                    : "#D0D5DD",
                },
              ]}
            />

            {/* =================================================
                ERROR
            ================================================= */}

            {emailError ? (
              <Text style={styles.errorText}>
                {emailError}
              </Text>
            ) : null}

            {/* =================================================
                SEND OTP
            ================================================= */}

            <Pressable
              onPress={handleSendOtp}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                pressed &&
                  !loading &&
                  styles.buttonPressed,
                loading &&
                  styles.buttonDisabled,
              ]}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator
                    size="small"
                    color="#071E2B"
                  />

                  <Text style={styles.buttonText}>
                    Sending OTP...
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>
                  Send OTP
                </Text>
              )}
            </Pressable>

            {/* =================================================
                BACK TO LOGIN
            ================================================= */}

            <Pressable
              disabled={loading}
              onPress={() =>
                router.replace("/login")
              }
              style={[
                styles.backButton,
                loading &&
                  styles.backButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.backText,
                  {
                    color: isDark
                      ? "#F4A000"
                      : "#D97706",
                  },
                ]}
              >
                ← Back to Login
              </Text>
            </Pressable>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#071E2B",
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },

  card: {
    width: "100%",
    maxWidth: 450,
    paddingHorizontal: 25,
    paddingVertical: 30,
    borderRadius: 18,

    backgroundColor: "#102F40",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,

    elevation: 8,
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
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 15,
  },

  label: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },

  input: {
    width: "100%",
    height: 52,

    backgroundColor: "#17394B",

    borderWidth: 1,
    borderColor: "#2C596B",
    borderRadius: 10,

    paddingHorizontal: 15,

    fontSize: 15,
    marginBottom: 5,
  },

  errorText: {
    width: "100%",
    color: "#EF4444",

    fontSize: 12,
    fontWeight: "700",

    marginTop: 5,
    marginBottom: 8,
  },

  button: {
    width: "100%",
    height: 52,

    backgroundColor: "#F4A000",

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 15,

    shadowColor: "#F4A000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,

    elevation: 5,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  buttonText: {
    color: "#071E2B",
    fontSize: 16,
    fontWeight: "900",
  },

  backButton: {
    alignItems: "center",
    marginTop: 22,
  },

  backButtonDisabled: {
    opacity: 0.5,
  },

  backText: {
    fontSize: 14,
    fontWeight: "800",
  },

  bottomSpace: {
    height: 80,
  },
});