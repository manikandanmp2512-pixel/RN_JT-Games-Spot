import { router, useLocalSearchParams } from "expo-router";
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
import { resetPassword } from "@/services/authApi";

export default function ResetPasswordScreen() {
  const { isDark } = useAppTheme();

  const { email } = useLocalSearchParams<{
    email?: string;
  }>();

  const scrollRef = useRef<ScrollView>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const [confirmPasswordError, setConfirmPasswordError] =
    useState("");

  const [loading, setLoading] = useState(false);

  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  // =========================================================
  // PASSWORD VALIDATION
  // Same concept as Register
  // =========================================================

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

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
  // PASSWORD CHANGE
  // =========================================================

  const handlePasswordChange = (value: string) => {
    setPassword(value);

    if (passwordError) {
      setPasswordError("");
    }
  };

  // =========================================================
  // CONFIRM PASSWORD CHANGE
  // =========================================================

  const handleConfirmPasswordChange = (
    value: string
  ) => {
    setConfirmPassword(value);

    if (confirmPasswordError) {
      setConfirmPasswordError("");
    }
  };

  // =========================================================
  // RESET PASSWORD
  // =========================================================

  const handleResetPassword = async () => {
    if (loading) {
      return;
    }

    setPasswordError("");
    setConfirmPasswordError("");

    if (!normalizedEmail) {
      showError(
        "Email Missing",
        "Please start the forgot password process again."
      );
      return;
    }

    // PASSWORD EMPTY
    if (!password) {
      setPasswordError(
        "Please enter your new password."
      );
      return;
    }

    // PASSWORD FORMAT
    if (!passwordRegex.test(password)) {
      setPasswordError(
        "Password must contain at least 6 characters, one uppercase letter, one lowercase letter, and one number."
      );
      return;
    }

    // CONFIRM EMPTY
    if (!confirmPassword) {
      setConfirmPasswordError(
        "Please confirm your new password."
      );
      return;
    }

    // PASSWORD MATCH
    if (password !== confirmPassword) {
      setConfirmPasswordError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const result = await resetPassword(
        normalizedEmail,
        password
      );

      if (!result?.success) {
        const message =
          result?.message ||
          "Password reset failed.";

        setPasswordError(message);

        showError(
          "Password Reset Failed",
          message
        );

        return;
      }

      showSuccess(
        "Password Reset",
        result?.message ||
          "Your password has been reset successfully."
      );

      // =====================================================
      // GO TO LOGIN
      // =====================================================

      router.replace("/login");
    } catch (error: any) {
      console.error(
        "RESET PASSWORD ERROR:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Password reset failed.";

      setPasswordError(message);

      showError(
        "Password Reset Failed",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: isDark
            ? "#071E2B"
            : "#F5F7FA",
        },
      ]}
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
            {/* LOGO */}

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

            {/* TITLE */}

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
              Reset Password
            </Text>

            {/* DESCRIPTION */}

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
              Create a new password for your Jay
              Tech account.
            </Text>

            {/* EMAIL */}

            <Text
              style={[
                styles.emailText,
                {
                  color: isDark
                    ? "#F4A000"
                    : "#D97706",
                },
              ]}
            >
              {normalizedEmail || "your email"}
            </Text>

            {/* PASSWORD LABEL */}

            <Text
              style={[
                styles.label,
                {
                  color: isDark
                    ? "#FFFFFF"
                    : "#344054",
                },
              ]}
            >
              New Password
            </Text>

            {/* PASSWORD */}

            <TextInput
              value={password}
              onChangeText={handlePasswordChange}
              onFocus={() => handleFocus(70)}
              placeholder="Enter new password"
              placeholderTextColor={
                isDark
                  ? "#7894A2"
                  : "#98A2B3"
              }
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
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

                  borderColor: passwordError
                    ? "#EF4444"
                    : isDark
                    ? "#2C596B"
                    : "#D0D5DD",
                },
              ]}
            />

            {passwordError ? (
              <Text style={styles.errorText}>
                {passwordError}
              </Text>
            ) : null}

            {/* CONFIRM LABEL */}

            <Text
              style={[
                styles.label,
                styles.confirmLabel,
                {
                  color: isDark
                    ? "#FFFFFF"
                    : "#344054",
                },
              ]}
            >
              Confirm Password
            </Text>

            {/* CONFIRM PASSWORD */}

            <TextInput
              value={confirmPassword}
              onChangeText={
                handleConfirmPasswordChange
              }
              onFocus={() => handleFocus(160)}
              onSubmitEditing={
                handleResetPassword
              }
              placeholder="Confirm new password"
              placeholderTextColor={
                isDark
                  ? "#7894A2"
                  : "#98A2B3"
              }
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
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

                  borderColor:
                    confirmPasswordError
                      ? "#EF4444"
                      : isDark
                      ? "#2C596B"
                      : "#D0D5DD",
                },
              ]}
            />

            {confirmPasswordError ? (
              <Text style={styles.errorText}>
                {confirmPasswordError}
              </Text>
            ) : null}

            {/* RESET BUTTON */}

            <Pressable
              onPress={handleResetPassword}
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
                    Resetting...
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>
                  Reset Password
                </Text>
              )}
            </Pressable>

            {/* BACK LOGIN */}

            <Pressable
              disabled={loading}
              onPress={() =>
                router.replace("/login")
              }
              style={styles.backButton}
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
    marginBottom: 8,
  },

  emailText: {
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 25,
  },

  label: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },

  confirmLabel: {
    marginTop: 10,
  },

  input: {
    width: "100%",
    height: 52,

    borderWidth: 1,
    borderRadius: 10,

    paddingHorizontal: 15,

    fontSize: 15,
  },

  errorText: {
    width: "100%",

    color: "#EF4444",

    fontSize: 12,
    fontWeight: "700",

    marginTop: 5,
    marginBottom: 5,
  },

  button: {
    width: "100%",
    height: 52,

    backgroundColor: "#F4A000",

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 20,

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

  backText: {
    fontSize: 14,
    fontWeight: "800",
  },

  bottomSpace: {
    height: 80,
  },
});
