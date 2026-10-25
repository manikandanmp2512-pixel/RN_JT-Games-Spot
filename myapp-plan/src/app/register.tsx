import { useRef, useState } from "react";

import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { router } from "expo-router";

import { registerUser } from "@/services/authApi";

import { showError, showSuccess } from "@/components/JayToast";

// =============================================================
// REGEX
// =============================================================

// Name: letters only, 2-30 characters
const FNAME_REGEX = /^[A-Za-z]{2,30}$/;
const LNAME_REGEX = /^[A-Z]{1,2}$/;

// Email
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Country code
const COUNTRY_CODE_REGEX = /^\+[1-9]\d{0,2}$/;

// Indian mobile number
const MOBILE_REGEX = /^[6-9]\d{9}$/;

// Password:
// minimum 6 characters
// at least one uppercase
// at least one lowercase
// at least one number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

export default function Register() {
  // ===========================================================
  // FORM
  // ===========================================================

  const [form, setForm] = useState({
    fname: "",
    lname: "",
    email: "",
    countryCode: "+91",
    mobilenumber: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] =
    useState(false);

  // ===========================================================
  // PASSWORD VISIBILITY
  // ===========================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // ===========================================================
  // SCROLL VIEW
  // ===========================================================

  const scrollRef =
    useRef<ScrollView>(null);

  // ===========================================================
  // UPDATE FORM
  // ===========================================================

  const update = (
    key: keyof typeof form,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

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
  // VALIDATION
  // ===========================================================

  const validateForm = () => {
    const firstName =
      form.fname.trim();

    const lastName =
      form.lname.trim();

    const email =
      form.email.trim().toLowerCase();

    const countryCode =
      form.countryCode.trim();

    const mobile =
      form.mobilenumber.trim();

    // ---------------------------------------------------------
    // FIRST NAME
    // ---------------------------------------------------------

    if (!firstName) {
      showError(
        "First Name Required",
        "Please enter your first name."
      );
      return false;
    }

    if (!FNAME_REGEX.test(firstName)) {
      showError(
        "Invalid First Name",
        "First name should contain only letters."
      );
      return false;
    }

    // ---------------------------------------------------------
    // LAST NAME
    // ---------------------------------------------------------

    if (!lastName) {
      showError(
        "Last Name Required",
        "Please enter your last name."
      );
      return false;
    }

    if (!LNAME_REGEX.test(lastName)) {
      showError(
        "Invalid Last Name",
        "Last name should contain only one letters."
      );
      return false;
    }

    // ---------------------------------------------------------
    // EMAIL
    // ---------------------------------------------------------

    if (!email) {
      showError(
        "Email Required",
        "Please enter your email address."
      );
      return false;
    }

    if (!EMAIL_REGEX.test(email)) {
      showError(
        "Invalid Email",
        "Please enter a valid email address."
      );
      return false;
    }

    // ---------------------------------------------------------
    // COUNTRY CODE
    // ---------------------------------------------------------

    if (!COUNTRY_CODE_REGEX.test(countryCode)) {
      showError(
        "Invalid Country Code",
        "Enter a valid country code such as +91."
      );
      return false;
    }

    // ---------------------------------------------------------
    // MOBILE
    // ---------------------------------------------------------

    if (!mobile) {
      showError(
        "Mobile Number Required",
        "Please enter your mobile number."
      );
      return false;
    }

    if (!MOBILE_REGEX.test(mobile)) {
      showError(
        "Invalid Mobile Number",
        "Enter a valid 10-digit mobile number."
      );
      return false;
    }

    // ---------------------------------------------------------
    // PASSWORD
    // ---------------------------------------------------------

    if (!form.password) {
      showError(
        "Password Required",
        "Please enter a password."
      );
      return false;
    }

    if (!PASSWORD_REGEX.test(form.password)) {
      showError(
        "Invalid Password",
        "Use at least 6 characters with uppercase, lowercase and a number."
      );
      return false;
    }

    // ---------------------------------------------------------
    // CONFIRM PASSWORD
    // ---------------------------------------------------------

    if (!form.confirmPassword) {
      showError(
        "Confirm Password",
        "Please confirm your password."
      );
      return false;
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      showError(
        "Password Mismatch",
        "Password and confirm password must match."
      );
      return false;
    }

    return true;
  };

  // ===========================================================
  // SUBMIT
  // ===========================================================

  // const submit = async () => {
  //   if (!validateForm()) {
  //     return;
  //   }

  //   try {
  //     setLoading(true);

  //     // IMPORTANT:
  //     // Existing backend payload is preserved.

  //     const result = await registerUser({
  //       ...form,
  //       fname: form.fname.trim(),
  //       lname: form.lname.trim(),
  //       email: form.email.trim().toLowerCase(),
  //       countryCode:
  //         form.countryCode.trim(),
  //       mobilenumber:
  //         form.mobilenumber.trim(),
  //     });

  //     setLoading(false);

  //     // -------------------------------------------------------
  //     // BACKEND ERROR
  //     // -------------------------------------------------------

  //     if (!result.success) {
  //       showError(
  //         "Registration Failed",
  //         result.message ||
  //           "Please try again."
  //       );

  //       return;
  //     }

  //     // -------------------------------------------------------
  //     // OTP SUCCESS
  //     // -------------------------------------------------------

  //     showSuccess(
  //       "OTP Sent",
  //       "Check your email for the registration OTP."
  //     );

  //     setTimeout(() => {
  //       router.push({
  //         pathname:
  //           "/verify-register-otp",

  //         params: {
  //           email: form.email
  //             .trim()
  //             .toLowerCase(),
  //         },
  //       });
  //     }, 600);

  //   } catch (error: any) {
  //     setLoading(false);

  //     console.error(
  //       "REGISTER ERROR:",
  //       error
  //     );

  //     showError(
  //       "Registration Failed",
  //       error?.response?.data?.message ||
  //         error?.message ||
  //         "Something went wrong. Please try again."
  //     );
  //   }
  // };

  const submit = async () => {
    if (loading) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const result = await registerUser({
        fname: form.fname.trim(),

        lname: form.lname.trim(),

        email:
          form.email
            .trim()
            .toLowerCase(),

        countryCode:
          form.countryCode.trim(),

        mobilenumber:
          form.mobilenumber.trim(),

        password:
          form.password,

        confirmPassword:
          form.confirmPassword,
      });

      if (!result.success) {
        showError(
          "Registration Failed",
          result.message ||
            "Unable to start registration."
        );

        return;
      }

      showSuccess(
        "OTP Sent",
        "OTP has been sent to your Gmail and mobile number."
      );

      setTimeout(() => {
        router.push({
          pathname:
            "/verify-register-otp",

          params: {
            email:
              form.email
                .trim()
                .toLowerCase(),
          },
        });
      }, 600);
    } catch (error: any) {
        console.error("========== REGISTER DEBUG ==========");
        console.error("Request URL:", error?.config?.url);
        console.error("HTTP Status:", error?.response?.status);
        console.error("Backend Response:", error?.response?.data);
        console.error("Request Payload:", error?.config?.data);
        console.error("Error Message:", error?.message);
        console.error("====================================");

        const backendMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data?.details;

        showError(
          "Registration Failed",
          typeof backendMessage === "string"
            ? backendMessage
            : "The server could not complete registration. Check the backend terminal for the exact error."
        );
      } finally {
      setLoading(false);
    }
  };

// ===========================================================
  // UI
  // ===========================================================

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={ Platform.OS === "ios" ? "padding" : "height" }
      keyboardVerticalOffset={ Platform.OS === "ios" ? 10 : 0 } >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={ true } >
        <View style={styles.formContainer}>

          {/* =================================================
              TITLE
          ================================================= */}

          <Text style={styles.title}>
            Create Account
          </Text>

          <Text style={styles.sub}>
            Register once, then play Chess, Carrom and Ludo.
          </Text>

          {/* =================================================
              FIRST + LAST NAME
          ================================================= */}

          <View style={[ styles.row, styles.nameRow ]} >
            <TextInput
              value={form.fname}
              onChangeText={(value) => update("fname", value.replace(/[^A-Za-z]/g, "").slice(0, 30))}
              onFocus={() => handleFocus(0)}
              placeholder="First name"
              placeholderTextColor="#7894A2"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              style={[ styles.input, styles.half]} />

            <TextInput
              value={form.lname}
              onChangeText={(value) =>
                update(
                  "lname",
                  value
                    .replace(
                      /[^A-Za-z]/g,
                      ""
                    )
                    .slice(0, 30)
                )
              }
              onFocus={() =>
                handleFocus(0)
              }
              placeholder="Last name"
              placeholderTextColor="#7894A2"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              style={[
                styles.input,
                styles.half,
              ]}
            />
          </View>

          {/* =================================================
              EMAIL
          ================================================= */}

          <TextInput
            value={form.email}
            onChangeText={(value) =>
              update(
                "email",
                value
                  .replace(/\s/g, "")
                  .slice(0, 100)
              )
            }
            onFocus={() =>
              handleFocus(45)
            }
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
            placeholder="Email"
            placeholderTextColor="#7894A2"
            style={styles.input}
          />

          {/* =================================================
              COUNTRY + MOBILE
          ================================================= */}

          <View style={styles.row}>

            <TextInput
              value={form.countryCode}
              onChangeText={(value) => {
                let cleaned =
                  value.replace(
                    /[^\d+]/g,
                    ""
                  );

                if (
                  cleaned &&
                  !cleaned.startsWith("+")
                ) {
                  cleaned =
                    "+" + cleaned;
                }

                update(
                  "countryCode",
                  cleaned.slice(0, 4)
                );
              }}
              onFocus={() =>
                handleFocus(90)
              }
              keyboardType="phone-pad"
              returnKeyType="next"
              placeholder="+91"
              placeholderTextColor="#7894A2"
              style={[
                styles.input,
                styles.code,
              ]}
            />

            <TextInput
              value={
                form.mobilenumber
              }
              onChangeText={(value) =>
                update(
                  "mobilenumber",
                  value
                    .replace(/\D/g, "")
                    .slice(0, 10)
                )
              }
              onFocus={() =>
                handleFocus(90)
              }
              keyboardType="phone-pad"
              returnKeyType="next"
              placeholder="Mobile number"
              placeholderTextColor="#7894A2"
              style={[
                styles.input,
                styles.mobile,
              ]}
            />
          </View>

          <Text style={styles.hint}>
            Country code controls the chess country flag.
          </Text>

          {/* =================================================
              PASSWORD
          ================================================= */}

          <View
            style={[
              styles.passwordContainer,
              styles.passwordFirst,
            ]}
          >
            <TextInput
              value={form.password}
              onChangeText={(value) =>
                update(
                  "password",
                  value
                )
              }
              onFocus={() =>
                handleFocus(145)
              }
              secureTextEntry={
                !showPassword
              }
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              placeholder="Password"
              placeholderTextColor="#7894A2"
              style={[
                styles.input,
                styles.passwordInput,
              ]}
            />

            <Pressable
              style={({ pressed }) => [
                styles.showButton,
                {
                  opacity: pressed
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
              <Text style={styles.showText}>
                {showPassword
                  ? "Hide"
                  : "Show"}
              </Text>
            </Pressable>
          </View>

          {/* =================================================
              CONFIRM PASSWORD
          ================================================= */}

          <View
            style={
              styles.passwordContainer
            }
          >
            <TextInput
              value={
                form.confirmPassword
              }
              onChangeText={(value) =>
                update(
                  "confirmPassword",
                  value
                )
              }
              onFocus={() =>
                handleFocus(200)
              }
              secureTextEntry={
                !showConfirmPassword
              }
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              placeholder="Confirm password"
              placeholderTextColor="#7894A2"
              style={[
                styles.input,
                styles.passwordInput,
              ]}
            />

            <Pressable
              style={({ pressed }) => [
                styles.showButton,
                {
                  opacity: pressed
                    ? 0.6
                    : 1,
                },
              ]}
              onPress={() =>
                setShowConfirmPassword(
                  (previous) =>
                    !previous
                )
              }
            >
              <Text style={styles.showText}>
                {showConfirmPassword
                  ? "Hide"
                  : "Show"}
              </Text>
            </Pressable>
          </View>

          {/* =================================================
              CREATE ACCOUNT
          ================================================= */}

          <Pressable
            disabled={loading}
            onPress={submit}
            style={({ pressed }) => [
              styles.button,
              {
                opacity:
                  loading || pressed
                    ? 0.7
                    : 1,
              },
            ]}
          >
            <Text
              style={
                styles.buttonText
              }
            >
              {loading
                ? "Creating…"
                : "Create Account"}
            </Text>
          </Pressable>

          {/* =================================================
              LOGIN
          ================================================= */}

          <Pressable
            onPress={() =>
              router.replace("/login")
            }
          >
            <Text style={styles.textlogin}>
              Already have an account?   <Text style={styles.login}>Login</Text>
            </Text>
          </Pressable>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// =============================================================
// STYLES
// =============================================================

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

  // ===========================================================
  // TITLE
  // ===========================================================

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

  // ===========================================================
  // ROW
  // ===========================================================

  row: {
    flexDirection: "row",
    gap: 9,
  },

  nameRow: {
    width: "100%",
  },

  // ===========================================================
  // INPUT
  // ===========================================================

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
    width: 75,
  },

  mobile: {
    flex: 1,
  },

  // ===========================================================
  // HINT
  // ===========================================================

  hint: {
    color: "#F4A000",
    fontSize: 10,
    marginTop: -4,
    marginBottom: 8,
  },

  // ===========================================================
  // PASSWORD
  // ===========================================================

  passwordContainer: {
    position: "relative",
    width: "100%",
  },

  passwordFirst: {
    marginTop: 0,
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

  // ===========================================================
  // BUTTON
  // ===========================================================

  button: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F4A000",

    alignItems: "center",
    justifyContent: "center",

    marginTop: 7,

    elevation: 4,

    shadowColor: "#F4A000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },

  buttonText: {
    color: "#071E2B",
    fontWeight: "900",
    fontSize: 16,
  },

  // ===========================================================
  // LOGIN LINK
  // ===========================================================
  textlogin: {
    color: "#7894A2",
    textAlign: "center",
    marginTop: 18,
    fontWeight: "800",
    fontSize: 14,
  },
  login: {
    color: "#F4A000",
  },
});