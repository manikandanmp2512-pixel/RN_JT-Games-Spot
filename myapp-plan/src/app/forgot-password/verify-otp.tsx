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
import { verifyForgotOtp } from "@/services/authApi";

export default function ForgotPasswordVerifyOtpScreen() {
  const { isDark } = useAppTheme();

  const params = useLocalSearchParams<{
    countryCode?: string | string[];
    mobilenumber?: string | string[];
  }>();

  const countryCode = String(
    Array.isArray(params.countryCode)
      ? params.countryCode[0] || "+91"
      : params.countryCode || "+91"
  ).trim();

  const mobilenumber = String(
    Array.isArray(params.mobilenumber)
      ? params.mobilenumber[0] || ""
      : params.mobilenumber || ""
  ).trim();

  const scrollRef = useRef<ScrollView>(null);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFocus = (y: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    }, 100);
  };

  const handleVerifyOtp = async () => {
    if (loading) return;

    setOtpError("");

    if (!mobilenumber || !countryCode) {
      showError(
        "Mobile Number Missing",
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
        countryCode,
        mobilenumber,
        otp: otp.trim(),
      });

      if (!result?.success) {
        const message = result?.message || "Invalid or expired OTP.";
        setOtpError(message);
        showError("OTP Verification Failed", message);
        return;
      }

      showSuccess(
        "OTP Verified",
        result?.message || "OTP verified successfully."
      );

      router.replace({
        pathname: "/forgot-password/reset-password",
        params: {
          countryCode,
          mobilenumber,
        },
      });
    } catch (error: any) {
      console.error("FORGOT OTP VERIFY ERROR:", error);
      console.error(
        "FORGOT OTP VERIFY RESPONSE:",
        error?.response?.data
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

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: isDark ? "#071E2B" : "#F5F7FA" },
      ]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#071E2B" : "#F5F7FA"}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          <View
            style={[
              styles.card,
              { backgroundColor: isDark ? "#102F40" : "#FFFFFF" },
            ]}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoLetter}>J</Text>
              </View>
              <Text style={styles.logoText}>JAY TECH</Text>
            </View>

            <Text
              style={[
                styles.title,
                { color: isDark ? "#FFFFFF" : "#111827" },
              ]}
            >
              Verify OTP
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: isDark ? "#9DB5C0" : "#667085" },
              ]}
            >
              Enter the 6-digit SMS OTP sent to
            </Text>

            <Text
              style={[
                styles.phoneText,
                { color: isDark ? "#F4A000" : "#D97706" },
              ]}
            >
              {countryCode} {mobilenumber}
            </Text>

            <Text
              style={[
                styles.label,
                { color: isDark ? "#FFFFFF" : "#344054" },
              ]}
            >
              Verification Code
            </Text>

            <TextInput
              value={otp}
              onChangeText={(value) => {
                setOtp(value.replace(/\D/g, "").slice(0, 6));
                setOtpError("");
              }}
              onFocus={() => handleFocus(80)}
              onSubmitEditing={handleVerifyOtp}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor={isDark ? "#7894A2" : "#98A2B3"}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="done"
              editable={!loading}
              style={[
                styles.input,
                {
                  color: isDark ? "#FFFFFF" : "#101828",
                  backgroundColor: isDark ? "#17394B" : "#F8FAFC",
                  borderColor: otpError
                    ? "#EF4444"
                    : isDark
                    ? "#2C596B"
                    : "#D0D5DD",
                },
              ]}
            />

            {otpError ? (
              <Text style={styles.errorText}>{otpError}</Text>
            ) : null}

            <Pressable
              onPress={handleVerifyOtp}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                pressed && !loading && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#071E2B" />
                  <Text style={styles.buttonText}>Verifying...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </Pressable>

            <Pressable
              disabled={loading}
              onPress={() => router.replace("/forgot-password")}
              style={styles.backButton}
            >
              <Text
                style={[
                  styles.backText,
                  { color: isDark ? "#F4A000" : "#D97706" },
                ]}
              >
                ← Change Mobile Number
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
  root: { flex: 1 },
  keyboardContainer: { flex: 1 },
  scrollView: { flex: 1 },
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  logoContainer: { alignItems: "center", marginBottom: 18 },
  logoCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#F4A000",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoLetter: { color: "#071E2B", fontSize: 35, fontWeight: "900" },
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
    textAlign: "center",
    lineHeight: 21,
  },
  phoneText: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 7,
    marginBottom: 28,
  },
  label: { fontSize: 14, fontWeight: "800", marginBottom: 8 },
  input: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 7,
    textAlign: "center",
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
    elevation: 5,
  },
  buttonPressed: { opacity: 0.75 },
  buttonDisabled: { opacity: 0.65 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  buttonText: { color: "#071E2B", fontSize: 16, fontWeight: "900" },
  backButton: { alignItems: "center", marginTop: 22 },
  backText: { fontSize: 14, fontWeight: "800" },
  bottomSpace: { height: 80 },
});