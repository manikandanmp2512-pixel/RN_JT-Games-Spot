import { useMemo, useRef, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

import {
  registerUser,
  verifyRegisterOtp,
} from "@/services/authApi";

import {
  showError,
  showSuccess,
} from "@/components/JayToast";

const FNAME_REGEX = /^[A-Za-z]{2,30}$/;
const LNAME_REGEX = /^[A-Za-z]{1,30}$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

type CountryItem = {
  name: string;
  code: string;
  cca2: CountryCode;
};

const getCountryName = (countryCode: CountryCode) => {
  try {
    if (typeof Intl !== "undefined" && Intl.DisplayNames) {
      const names = new Intl.DisplayNames(["en"], {
        type: "region",
      });
      return names.of(countryCode) || countryCode;
    }
  } catch {}
  return countryCode;
};

const getCountryFlag = (countryCode: CountryCode) =>
  countryCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(char.charCodeAt(0) + 127397)
    );

const COUNTRY_CODES: CountryItem[] = getCountries()
  .map((cca2) => ({
    name: getCountryName(cca2),
    code: `+${getCountryCallingCode(cca2)}`,
    cca2,
  }))
  .filter((country) => country.name !== country.cca2)
  .sort((a, b) => a.name.localeCompare(b.name));

export default function Register() {
  const [form, setForm] = useState({
    fname: "",
    lname: "",
    countryCode: "+91",
    mobilenumber: "",
    password: "",
    confirmPassword: "",
  });

  const [selectedCountry, setSelectedCountry] =
    useState<CountryCode>("IN");

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [mobileOtp, setMobileOtp] = useState("");
  const [developmentOtp, setDevelopmentOtp] = useState(false);

  const [countryPickerVisible, setCountryPickerVisible] =
    useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const filteredCountries = useMemo(() => {
    const search = countrySearch.trim().toLowerCase();

    if (!search) return COUNTRY_CODES;

    return COUNTRY_CODES.filter(
      (country) =>
        country.name.toLowerCase().includes(search) ||
        country.code.includes(search) ||
        country.cca2.toLowerCase().includes(search)
    );
  }, [countrySearch]);

  const currentCountryFlag = getCountryFlag(selectedCountry);

  const update = (
    key: keyof typeof form,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleFocus = (y: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y,
        animated: true,
      });
    }, 100);
  };

  const getValidatedPhone = () => {
    const phone = parsePhoneNumberFromString(
      form.mobilenumber.trim(),
      selectedCountry
    );

    if (!phone || !phone.isValid()) {
      showError(
        "Invalid Mobile Number",
        "Please check your selected country and mobile number."
      );
      return null;
    }

    return phone;
  };

  const validateForm = () => {
    if (!FNAME_REGEX.test(form.fname.trim())) {
      showError(
        "Invalid First Name",
        "First name must contain 2–30 letters."
      );
      return false;
    }

    if (!LNAME_REGEX.test(form.lname.trim())) {
      showError(
        "Invalid Last Name",
        "Last name must contain 1–30 letters."
      );
      return false;
    }

    if (!getValidatedPhone()) return false;

    if (!PASSWORD_REGEX.test(form.password)) {
      showError(
        "Invalid Password",
        "Use at least 6 characters with uppercase, lowercase and a number."
      );
      return false;
    }

    if (form.password !== form.confirmPassword) {
      showError(
        "Password Mismatch",
        "Password and confirm password must match."
      );
      return false;
    }

    return true;
  };

  const handleCountrySelect = (country: CountryItem) => {
    setSelectedCountry(country.cca2);
    update("countryCode", country.code);
    update("mobilenumber", "");
    setCountryPickerVisible(false);
    setCountrySearch("");
  };

  const submit = async () => {
    if (loading || otpLoading) return;
    if (!validateForm()) return;

    const phone = getValidatedPhone();
    if (!phone) return;

    try {
      setLoading(true);

      const result = await registerUser({
        fname: form.fname.trim(),
        lname: form.lname.trim(),
        countryCode: `+${phone.countryCallingCode}`,
        mobilenumber: phone.nationalNumber,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      if (!result?.success) {
        showError(
          "Registration Failed",
          result?.message || "Unable to start registration."
        );
        return;
      }

      setMobileOtp("");
      setDevelopmentOtp(result.developmentOnly === true);

      if (result.developmentOnly === true) {
        if (!result.developmentOtp) {
          showError(
            "OTP Error",
            "The development OTP was not returned by the server."
          );
          return;
        }

        setMobileOtp(String(result.developmentOtp));

        showSuccess(
          "Development OTP",
          `Local test OTP: ${result.developmentOtp}`
        );
      } else {
        showSuccess(
          "Mobile OTP Sent",
          "Enter the OTP sent to your mobile number."
        );
      }

      setOtpModalVisible(true);
    } catch (error: any) {
      console.error("REGISTER ERROR:", {
        status: error?.response?.status,
        response: error?.response?.data,
        message: error?.message,
      });

      showError(
        "Registration Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to start registration."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFinalRegister = async () => {
    if (otpLoading) return;

    const otp = mobileOtp.trim();

    if (!/^\d{6}$/.test(otp)) {
      showError(
        "Invalid OTP",
        "Please enter the 6-digit mobile OTP."
      );
      return;
    }

    const phone = getValidatedPhone();
    if (!phone) return;

    try {
      setOtpLoading(true);

      const result = await verifyRegisterOtp({
        countryCode: `+${phone.countryCallingCode}`,
        mobilenumber: phone.nationalNumber,
        mobileOtp: otp,
      });

      if (!result?.success) {
        showError(
          "OTP Verification Failed",
          result?.message || "Please check your OTP."
        );
        return;
      }

      setOtpModalVisible(false);
      setMobileOtp("");

      showSuccess(
        "Registration Successful",
        "Your Jay Tech account has been created. Please log in."
      );

      setTimeout(() => {
        router.replace("/login");
      }, 700);
    } catch (error: any) {
      console.error("FINAL REGISTRATION ERROR:", {
        status: error?.response?.status,
        response: error?.response?.data,
        message: error?.message,
      });

      showError(
        "Verification Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to verify OTP."
      );
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.safe}
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
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>

          <Text style={styles.sub}>
            Register once, then play Chess, Carrom and Ludo.
          </Text>

          <View style={[styles.row, styles.nameRow]}>
            <TextInput
              value={form.fname}
              onChangeText={(value) =>
                update("fname", value.replace(/[^A-Za-z]/g, "").slice(0, 30))
              }
              placeholder="First name"
              placeholderTextColor="#7894A2"
              autoCapitalize="words"
              style={[styles.input, styles.half]}
            />

            <TextInput
              value={form.lname}
              onChangeText={(value) =>
                update("lname", value.replace(/[^A-Za-z]/g, "").slice(0, 30))
              }
              placeholder="Last name"
              placeholderTextColor="#7894A2"
              autoCapitalize="words"
              style={[styles.input, styles.half]}
            />
          </View>

          <View style={styles.row}>
            <Pressable
              onPress={() => setCountryPickerVisible(true)}
              style={[
                styles.input,
                styles.code,
                styles.countryButton,
              ]}
            >
              <Text style={styles.countryButtonText}>
                {currentCountryFlag} {form.countryCode} ▾
              </Text>
            </Pressable>

            <TextInput
              value={form.mobilenumber}
              onChangeText={(value) =>
                update(
                  "mobilenumber",
                  value.replace(/\D/g, "").slice(0, 15)
                )
              }
              keyboardType="phone-pad"
              placeholder="Mobile number"
              placeholderTextColor="#7894A2"
              style={[styles.input, styles.mobile]}
            />
          </View>

          <Text style={styles.hint}>
            Select your country and enter your mobile number.
          </Text>

          <View style={styles.passwordContainer}>
            <TextInput
              value={form.password}
              onChangeText={(value) => update("password", value)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              placeholder="Password"
              placeholderTextColor="#7894A2"
              style={[styles.input, styles.passwordInput]}
            />
            <Pressable
              style={styles.showButton}
              onPress={() => setShowPassword((value) => !value)}
            >
              <Text style={styles.showText}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              value={form.confirmPassword}
              onChangeText={(value) =>
                update("confirmPassword", value)
              }
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              placeholder="Confirm password"
              placeholderTextColor="#7894A2"
              style={[styles.input, styles.passwordInput]}
            />
            <Pressable
              style={styles.showButton}
              onPress={() =>
                setShowConfirmPassword((value) => !value)
              }
            >
              <Text style={styles.showText}>
                {showConfirmPassword ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            disabled={loading || otpLoading}
            onPress={submit}
            style={[
              styles.button,
              { opacity: loading ? 0.6 : 1 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#071E2B" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.replace("/login")}>
            <Text style={styles.textlogin}>
              Already have an account?{" "}
              <Text style={styles.login}>Login</Text>
            </Text>
          </Pressable>
        </View>

        <Modal
          visible={countryPickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCountryPickerVisible(false)}
        >
          <View style={styles.countryModalOverlay}>
            <View style={styles.countryModalContainer}>
              <Text style={styles.countryModalTitle}>
                Select Country Code
              </Text>

              <TextInput
                style={styles.countrySearchInput}
                placeholder="Search country or calling code..."
                placeholderTextColor="#7894A2"
                value={countrySearch}
                onChangeText={setCountrySearch}
                autoCapitalize="none"
              />

              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item.cca2}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.countryItem}
                    onPress={() => handleCountrySelect(item)}
                  >
                    <Text style={styles.countryItemText}>
                      {getCountryFlag(item.cca2)} {item.name}
                    </Text>
                    <Text style={styles.countryItemCode}>
                      {item.code}
                    </Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyCountryText}>
                    No country found.
                  </Text>
                }
              />

              <Pressable
                onPress={() => setCountryPickerVisible(false)}
                style={styles.countryCloseButton}
              >
                <Text style={styles.countryCloseText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal
          visible={otpModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!otpLoading) setOtpModalVisible(false);
          }}
        >
          <View style={styles.otpOverlay}>
            <View style={styles.otpContainer}>
              <Text style={styles.otpTitle}>
                Mobile Verification
              </Text>

              <Text style={styles.otpDescription}>
                Enter the 6-digit OTP sent to:
              </Text>

              <Text style={styles.otpMobile}>
                {form.countryCode} {form.mobilenumber}
              </Text>

              <TextInput
                value={mobileOtp}
                onChangeText={(value) =>
                  setMobileOtp(value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#7894A2"
                keyboardType="number-pad"
                maxLength={6}
                textContentType="oneTimeCode"
                style={styles.otpInput}
              />

              <Pressable
                disabled={otpLoading}
                onPress={handleFinalRegister}
                style={[
                  styles.otpFinalButton,
                  { opacity: otpLoading ? 0.6 : 1 },
                ]}
              >
                {otpLoading ? (
                  <ActivityIndicator color="#071E2B" />
                ) : (
                  <Text style={styles.otpFinalButtonText}>
                    Verify & Register
                  </Text>
                )}
              </Pressable>

              <Pressable
                disabled={otpLoading}
                onPress={() => {
                  setOtpModalVisible(false);
                  setMobileOtp("");
                }}
                style={styles.otpCancelButton}
              >
                <Text style={styles.otpCancelText}>Cancel</Text>
              </Pressable>

              <Text style={styles.otpExpiry}>
                OTP expires in 10 minutes.
              </Text>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: {
    marginTop: 30,
    flex: 1,
    backgroundColor: "#071E2B",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 22,
    paddingBottom: 60,
    justifyContent: "center",
  },
  formContainer: {
    width: "100%",
    maxWidth: 450,
    alignSelf: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  sub: {
    color: "#9DB5C0",
    textAlign: "center",
    marginTop: 7,
    marginBottom: 22,
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    gap: 9,
  },
  nameRow: {
    width: "100%",
  },
  input: {
    height: 50,
    borderRadius: 13,
    backgroundColor: "#17394B",
    color: "#FFFFFF",
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2C596B",
    fontSize: 15,
  },
  half: {
    flex: 1,
  },
  code: {
    width: 115,
  },
  mobile: {
    flex: 1,
  },
  countryButton: {
    justifyContent: "center",
  },
  countryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  hint: {
    color: "#F4A000",
    fontSize: 10,
    marginTop: -4,
    marginBottom: 8,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 65,
    width: "100%",
  },
  showButton: {
    position: "absolute",
    right: 14,
    top: 13,
  },
  showText: {
    color: "#F4A000",
    fontWeight: "800",
  },
  button: {
    height: 52,
    backgroundColor: "#F4A000",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#071E2B",
    fontSize: 16,
    fontWeight: "900",
  },
  textlogin: {
    color: "#9DB5C0",
    textAlign: "center",
    marginTop: 22,
  },
  login: {
    color: "#F4A000",
    fontWeight: "900",
  },
  countryModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: 20,
  },
  countryModalContainer: {
    maxHeight: "80%",
    backgroundColor: "#102F40",
    borderRadius: 18,
    padding: 18,
  },
  countryModalTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 12,
  },
  countrySearchInput: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#17394B",
    color: "#FFFFFF",
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  countryItem: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#2C596B",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  countryItemText: {
    color: "#FFFFFF",
  },
  countryItemCode: {
    color: "#F4A000",
    fontWeight: "800",
  },
  emptyCountryText: {
    color: "#FFFFFF",
    textAlign: "center",
    padding: 20,
  },
  countryCloseButton: {
    padding: 13,
    alignItems: "center",
    marginTop: 8,
  },
  countryCloseText: {
    color: "#F4A000",
    fontWeight: "900",
  },
  otpOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 22,
  },
  otpContainer: {
    backgroundColor: "#102F40",
    borderRadius: 18,
    padding: 22,
  },
  otpTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
    textAlign: "center",
  },
  otpDescription: {
    color: "#9DB5C0",
    textAlign: "center",
    marginTop: 12,
  },
  otpMobile: {
    color: "#F4A000",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    marginVertical: 10,
  },
  otpInput: {
    height: 54,
    backgroundColor: "#17394B",
    borderWidth: 1,
    borderColor: "#2C596B",
    borderRadius: 12,
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 22,
    letterSpacing: 8,
    marginTop: 10,
  },
  otpFinalButton: {
    height: 52,
    backgroundColor: "#F4A000",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  otpFinalButtonText: {
    color: "#071E2B",
    fontSize: 15,
    fontWeight: "900",
  },
  otpCancelButton: {
    padding: 12,
    alignItems: "center",
    marginTop: 4,
  },
  otpCancelText: {
    color: "#9DB5C0",
    fontWeight: "800",
  },
  otpExpiry: {
    color: "#7894A2",
    textAlign: "center",
    fontSize: 11,
    marginTop: 10,
  },
});