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

  const [countryCode, setCountryCode] = useState("+91");
  const [mobilenumber, setMobilenumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFocus = (y: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    }, 100);
  };

  const handleSendOtp = async () => {
    if (loading) return;

    setPhoneError("");

    const cleanCode = countryCode.trim();
    const cleanMobile = mobilenumber.replace(/\D/g, "");

    if (!/^\+[1-9]\d{0,3}$/.test(cleanCode)) {
      setPhoneError("Enter a valid country calling code, such as +91.");
      return;
    }

    if (
      !cleanMobile ||
      cleanMobile.length < 6 ||
      cleanMobile.length > 15
    ) {
      setPhoneError("Please enter a valid registered mobile number.");
      return;
    }

    try {
      setLoading(true);

      console.log("FORGOT PASSWORD REQUEST:", {
        countryCode: cleanCode,
        mobilenumber: cleanMobile,
      });

      const result = await sendForgotPasswordOtp({
        countryCode: cleanCode,
        mobilenumber: cleanMobile,
      });

      console.log("FORGOT PASSWORD RESPONSE:", result);

      if (!result?.success) {
        const message = result?.message || "Unable to send OTP.";
        setPhoneError(message);
        showError("OTP Failed", message);
        return;
      }

      showSuccess(
        "OTP Sent",
        result?.message || "Password reset OTP sent to your mobile number."
      );

      router.push({
        pathname: "/forgot-password/verify-otp",
        params: {
          countryCode: cleanCode,
          mobilenumber: cleanMobile,
        },
      });
    } catch (error: any) {
      console.error("FORGOT PASSWORD OTP ERROR:", error);
      console.error(
        "FORGOT PASSWORD OTP RESPONSE:",
        error?.response?.data
      );
      console.error(
        "FORGOT PASSWORD REQUEST URL:",
        error?.config?.baseURL,
        error?.config?.url
      );

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to send OTP. Please try again.";

      setPhoneError(message);
      showError("OTP Failed", message);
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
              Forgot Password?
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: isDark ? "#9DB5C0" : "#667085" },
              ]}
            >
              Enter your registered mobile number. We will send you an SMS OTP
              to reset your password.
            </Text>

            <Text
              style={[
                styles.label,
                { color: isDark ? "#FFFFFF" : "#344054" },
              ]}
            >
              Mobile Number
            </Text>

            <View style={styles.phoneRow}>
              <TextInput
                value={countryCode}
                onChangeText={(value) => {
                  const cleaned = value.replace(/[^\d+]/g, "");
                  setCountryCode(
                    cleaned.startsWith("+") ? cleaned : `+${cleaned}`
                  );
                  setPhoneError("");
                }}
                placeholder="+91"
                placeholderTextColor={isDark ? "#7894A2" : "#98A2B3"}
                keyboardType="phone-pad"
                editable={!loading}
                style={[
                  styles.input,
                  styles.countryCodeInput,
                  {
                    color: isDark ? "#FFFFFF" : "#101828",
                    backgroundColor: isDark ? "#17394B" : "#F8FAFC",
                    borderColor: phoneError
                      ? "#EF4444"
                      : isDark
                      ? "#2C596B"
                      : "#D0D5DD",
                  },
                ]}
              />

              <TextInput
                value={mobilenumber}
                onChangeText={(value) => {
                  setMobilenumber(value.replace(/\D/g, "").slice(0, 15));
                  setPhoneError("");
                }}
                onFocus={() => handleFocus(70)}
                onSubmitEditing={handleSendOtp}
                placeholder="Enter mobile number"
                placeholderTextColor={isDark ? "#7894A2" : "#98A2B3"}
                keyboardType="phone-pad"
                autoCorrect={false}
                returnKeyType="done"
                editable={!loading}
                style={[
                  styles.input,
                  styles.mobileInput,
                  {
                    color: isDark ? "#FFFFFF" : "#101828",
                    backgroundColor: isDark ? "#17394B" : "#F8FAFC",
                    borderColor: phoneError
                      ? "#EF4444"
                      : isDark
                      ? "#2C596B"
                      : "#D0D5DD",
                  },
                ]}
              />
            </View>

            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : null}

            <Pressable
              onPress={handleSendOtp}
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
                  <Text style={styles.buttonText}>Sending OTP...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Send SMS OTP</Text>
              )}
            </Pressable>

            <Pressable
              disabled={loading}
              onPress={() => router.replace("/login")}
              style={styles.backButton}
            >
              <Text
                style={[
                  styles.backText,
                  { color: isDark ? "#F4A000" : "#D97706" },
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
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 22,
  },
  label: { fontSize: 14, fontWeight: "800", marginBottom: 8 },
  phoneRow: { flexDirection: "row", gap: 9 },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 5,
  },
  countryCodeInput: { width: 88 },
  mobileInput: { flex: 1 },
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