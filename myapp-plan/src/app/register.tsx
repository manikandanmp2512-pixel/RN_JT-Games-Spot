import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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

import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

import { showError, showSuccess } from "@/components/JayToast";
import { registerUser, verifyRegisterOtp } from "@/services/authApi";

const FNAME_REGEX = /^[A-Za-z]{2,30}$/;
const LNAME_REGEX = /^[A-Za-z]{1,30}$/;
const EMAIL_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9.]{0,62}[a-zA-Z0-9])?@gmail\.com$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

type CountryItem = {
  name: string;
  code: string;
  cca2: CountryCode;
};

const AnimatedLinearGradient =
  Animated.createAnimatedComponent(LinearGradient);

const getCountryName = (code: CountryCode) => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
};

const getCountryFlag = (code: CountryCode) =>
  code.toUpperCase().replace(/./g, (char) =>
    String.fromCodePoint(char.charCodeAt(0) + 127397)
  );

const COUNTRY_CODES: CountryItem[] = getCountries()
  .map((cca2) => ({
    name: getCountryName(cca2),
    code: `+${getCountryCallingCode(cca2)}`,
    cca2,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export default function Register() {
  const [form, setForm] = useState({
    fname: "",
    lname: "",
    email: "",
    countryCode: "+91",
    mobilenumber: "",
    password: "",
    confirmPassword: "",
  });

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("IN");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [focusedField, setFocusedField] = useState("");

  // Background animations.
  const floatTop = useRef(new Animated.Value(0)).current;
  const floatBottom = useRef(new Animated.Value(0)).current;
  const accentShimmer = useRef(new Animated.Value(0)).current;

  // Main card entrance.
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;

  // Staggered field animations.
  const brandFade = useRef(new Animated.Value(0)).current;
  const brandSlide = useRef(new Animated.Value(12)).current;
  const headingFade = useRef(new Animated.Value(0)).current;
  const headingSlide = useRef(new Animated.Value(15)).current;
  const personalFade = useRef(new Animated.Value(0)).current;
  const personalSlide = useRef(new Animated.Value(12)).current;
  const emailFade = useRef(new Animated.Value(0)).current;
  const emailSlide = useRef(new Animated.Value(12)).current;
  const phoneFade = useRef(new Animated.Value(0)).current;
  const phoneSlide = useRef(new Animated.Value(12)).current;
  const securityFade = useRef(new Animated.Value(0)).current;
  const securitySlide = useRef(new Animated.Value(12)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(12)).current;
  const footerFade = useRef(new Animated.Value(0)).current;

  // Text, button and panel effects.
  const buttonGlow = useRef(new Animated.Value(0)).current;
  const titleColorProgress = useRef(new Animated.Value(0)).current;
  const brandColorProgress = useRef(new Animated.Value(0)).current;
  const gradientPulse = useRef(new Animated.Value(0)).current;

  // Modal entrance animation.
  const modalFade = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.94)).current;

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

  const update = (key: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  // Main screen animation sequence.
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
          Animated.timing(headingFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(headingSlide, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(personalFade, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(personalSlide, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(emailFade, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(emailSlide, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(phoneFade, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(phoneSlide, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(securityFade, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(securitySlide, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(buttonFade, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(buttonSlide, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),

        Animated.timing(footerFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
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
    gradientLoop.start();

    return () => {
      topFloat.stop();
      bottomFloat.stop();
      shimmerLoop.stop();
      entrance.stop();
      buttonGlowLoop.stop();
      titleTextLoop.stop();
      brandTextLoop.stop();
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
    headingFade,
    headingSlide,
    personalFade,
    personalSlide,
    emailFade,
    emailSlide,
    phoneFade,
    phoneSlide,
    securityFade,
    securitySlide,
    buttonFade,
    buttonSlide,
    footerFade,
    buttonGlow,
    titleColorProgress,
    brandColorProgress,
    gradientPulse,
  ]);

  // Animate country and OTP modal appearance.
  useEffect(() => {
    const visible = countryPickerVisible || otpModalVisible;

    if (visible) {
      modalFade.setValue(0);
      modalScale.setValue(0.94);

      Animated.parallel([
        Animated.timing(modalFade, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          speed: 16,
          bounciness: 5,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [countryPickerVisible, otpModalVisible, modalFade, modalScale]);

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

    const email = form.email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(email) || email.split("@")[0].includes("..")) {
      showError(
        "Invalid Gmail Address",
        "Enter a valid Gmail address ending with @gmail.com."
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
    if (loading || otpLoading || !validateForm()) return;

    const phone = getValidatedPhone();
    if (!phone) return;

    try {
      setLoading(true);

      const result = await registerUser({
        fname: form.fname.trim(),
        lname: form.lname.trim(),
        email: form.email.trim().toLowerCase(),
        countryCode: `+${phone.countryCallingCode}`,
        mobilenumber: phone.nationalNumber,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      if (!result?.success || result.emailOtpSent !== true) {
        showError(
          "Registration Failed",
          result?.message || "Unable to send Gmail OTP."
        );
        return;
      }

      setEmailOtp("");

      showSuccess(
        "Gmail OTP Sent",
        `A verification code has been sent to ${form.email.trim().toLowerCase()}.`
      );

      setOtpModalVisible(true);
    } catch (error: any) {
      console.error("REGISTER ERROR:", error?.response?.data || error);

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

    const otp = emailOtp.trim();

    if (!/^\d{6}$/.test(otp)) {
      showError(
        "Invalid OTP",
        "Please enter the 6-digit OTP sent to your Gmail."
      );
      return;
    }

    try {
      setOtpLoading(true);

      const result = await verifyRegisterOtp({
        email: form.email.trim().toLowerCase(),
        emailOtp: otp,
      });

      if (!result?.success) {
        showError(
          "OTP Verification Failed",
          result?.message || "Please check your Gmail OTP."
        );
        return;
      }

      setOtpModalVisible(false);
      setEmailOtp("");

      showSuccess(
        "Registration Successful",
        "Your Jay Tech account has been created. Please log in."
      );

      setTimeout(() => router.replace("/login"), 700);
    } catch (error: any) {
      console.error(
        "FINAL REGISTRATION ERROR:",
        error?.response?.data || error
      );

      showError(
        "Verification Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to verify Gmail OTP."
      );
    } finally {
      setOtpLoading(false);
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
    outputRange: [0.08, 0.25],
  });

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#07131D" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        {/* ANIMATED BACKGROUND */}
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

        {/* MAIN REGISTRATION CARD */}
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
            colors={["#F4A000", "#62DCE0", "#244F65", "#F4A000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardBorder}
          >
            <LinearGradient
              colors={["#173B4B", "#102A38", "#0B1D29", "#163747"]}
              locations={[0, 0.38, 0.72, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <AnimatedLinearGradient
                pointerEvents="none"
                colors={["#FFFFFF", "#FFFFFF"]}
                style={[
                  styles.cardShimmer,
                  { opacity: gradientOverlayOpacity },
                ]}
              />

              {/* BRAND */}
              <Animated.View
                style={[
                  styles.brandRow,
                  {
                    opacity: brandFade,
                    transform: [{ translateY: brandSlide }],
                  },
                ]}
              >
                <AnimatedLinearGradient
                  colors={["#FFE0A0", "#F4A000", "#C77800"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.logo,
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
                    style={[styles.brand, { color: brandAnimatedColor }]}
                  >
                    JAY TECH
                  </Animated.Text>
                  <Text style={styles.brandCaption}>
                    CREATE YOUR PLAYER ACCOUNT
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.replace("/login")}
                  disabled={loading}
                  style={styles.accessPill}
                  >
                  <Text style={{ color: "#F4A000", fontWeight: "900", fontSize: 11 }}>
                  ← BACK
                  </Text>
                </Pressable>
              </Animated.View>

              {/* HEADING */}
              <Animated.View
                style={{
                  opacity: headingFade,
                  transform: [{ translateY: headingSlide }],
                }}
              >
                {/* <Text style={styles.eyebrow}>JOIN THE COMMUNITY</Text> */}

                <Animated.Text
                  style={[styles.title, { color: titleAnimatedColor }]}
                >
                  Join the Community
                </Animated.Text>

                <Text style={styles.subtitle}>
                  One account. More games. More fun.
                </Text>

                <LinearGradient
                  colors={["#F4A000", "#FFE0A0", "#315160"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.heroRule}
                />
              </Animated.View>

              {/* PERSONAL DETAILS */}
              <Animated.View
                style={{
                  opacity: personalFade,
                  transform: [{ translateY: personalSlide }],
                }}
              >
                <Text style={styles.sectionLabel}>PERSONAL DETAILS</Text>

                <View style={styles.row}>
                  <TextInput
                    value={form.fname}
                    onChangeText={(v) =>
                      update(
                        "fname",
                        v.replace(/[^A-Za-z]/g, "").slice(0, 30)
                      )
                    }
                    onFocus={() => setFocusedField("fname")}
                    onBlur={() => setFocusedField("")}
                    placeholder="First name"
                    placeholderTextColor="#7894A2"
                    autoCapitalize="words"
                    editable={!loading && !otpLoading}
                    style={[
                      styles.input,
                      styles.half,
                      focusedField === "fname" && styles.inputFocused,
                    ]}
                  />

                  <TextInput
                    value={form.lname}
                    onChangeText={(v) =>
                      update(
                        "lname",
                        v.replace(/[^A-Za-z]/g, "").slice(0, 30)
                      )
                    }
                    onFocus={() => setFocusedField("lname")}
                    onBlur={() => setFocusedField("")}
                    placeholder="Last name"
                    placeholderTextColor="#7894A2"
                    autoCapitalize="words"
                    editable={!loading && !otpLoading}
                    style={[
                      styles.input,
                      styles.half,
                      focusedField === "lname" && styles.inputFocused,
                    ]}
                  />
                </View>
              </Animated.View>

              {/* EMAIL */}
              <Animated.View
                style={{
                  opacity: emailFade,
                  transform: [{ translateY: emailSlide }],
                }}
              >
                <TextInput
                  value={form.email}
                  onChangeText={(v) => update("email", v.trim().toLowerCase())}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField("")}
                  placeholder="Registered Gmail address"
                  placeholderTextColor="#7894A2"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  editable={!loading && !otpLoading}
                  style={[
                    styles.input,
                    focusedField === "email" && styles.inputFocused,
                  ]}
                />
              </Animated.View>

              {/* PHONE NUMBER */}
              <Animated.View
                style={{
                  opacity: phoneFade,
                  transform: [{ translateY: phoneSlide }],
                }}
              >
                <View style={styles.row}>
                  <Pressable
                    onPress={() => setCountryPickerVisible(true)}
                    disabled={loading || otpLoading}
                    style={[styles.input, styles.code, styles.countryButton]}
                  >
                    <Text style={styles.countryButtonText}>
                      {getCountryFlag(selectedCountry)} {form.countryCode} ▾
                    </Text>
                  </Pressable>

                  <TextInput
                    value={form.mobilenumber}
                    onChangeText={(v) =>
                      update("mobilenumber", v.replace(/\D/g, "").slice(0, 15))
                    }
                    onFocus={() => setFocusedField("mobile")}
                    onBlur={() => setFocusedField("")}
                    keyboardType="phone-pad"
                    placeholder="Mobile number"
                    placeholderTextColor="#7894A2"
                    editable={!loading && !otpLoading}
                    style={[
                      styles.input,
                      styles.mobile,
                      focusedField === "mobile" && styles.inputFocused,
                    ]}
                  />
                </View>
              </Animated.View>

              {/* SECURITY AND PASSWORDS */}
              <Animated.View
                style={{
                  opacity: securityFade,
                  transform: [{ translateY: securitySlide }],
                }}
              >
                <Text style={styles.sectionLabel}>SECURITY</Text>

                {/* PASSWORD */}
                <View
                  style={[
                    styles.passwordContainer,
                    focusedField === "password" && styles.passwordFocused,
                  ]}
                >
                  <TextInput
                    value={form.password}
                    onChangeText={(v) => update("password", v)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField("")}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Create password"
                    placeholderTextColor="#7894A2"
                    editable={!loading && !otpLoading}
                    style={styles.passwordInput}
                  />

                  <Pressable
                    style={styles.showButton}
                    onPress={() => setShowPassword((current) => !current)}
                    disabled={loading || otpLoading}
                    hitSlop={10}
                  >
                    <Feather
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color={showPassword ? "#62DCE0" : "#F4A000"}
                    />
                  </Pressable>
                </View>

                {/* CONFIRM PASSWORD */}
                <View
                  style={[
                    styles.passwordContainer,
                    focusedField === "confirmPassword" &&
                      styles.passwordFocused,
                  ]}
                >
                  <TextInput
                    value={form.confirmPassword}
                    onChangeText={(v) => update("confirmPassword", v)}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField("")}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Confirm password"
                    placeholderTextColor="#7894A2"
                    editable={!loading && !otpLoading}
                    style={styles.passwordInput}
                  />

                  <Pressable
                    style={styles.showButton}
                    onPress={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    disabled={loading || otpLoading}
                    hitSlop={10}
                  >
                    <Feather
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={20}
                      color={showConfirmPassword ? "#62DCE0" : "#F4A000"}
                    />
                  </Pressable>
                </View>

                <Text style={styles.passwordHint}>
                  Minimum 6 characters, including uppercase, lowercase and a
                  number.
                </Text>
              </Animated.View>

              {/* CREATE ACCOUNT BUTTON */}
              <Animated.View
                style={[
                  styles.buttonShadow,
                  {
                    opacity: buttonFade,
                    transform: [{ translateY: buttonSlide }],
                    shadowOpacity: buttonShadowOpacity,
                    shadowRadius: buttonShadowRadius,
                  },
                ]}
              >
                <Pressable
                  disabled={loading || otpLoading}
                  onPress={submit}
                  style={({ pressed }) => [
                    styles.buttonPressable,
                    pressed && styles.pressed,
                    (loading || otpLoading) && styles.disabled,
                  ]}
                >
                  <LinearGradient
                    colors={["#FFE0A0", "#F4A000", "#D88900"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.button}
                  >
                    {loading ? (
                      <ActivityIndicator color="#071E2B" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>
                          CREATE ACCOUNT
                        </Text>
                        <Text style={styles.buttonArrow}>↗</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>

              {/* LOGIN LINK */}
              <Animated.View
                style={[
                  styles.loginRow,
                  {
                    opacity: buttonFade,
                    transform: [{ translateY: buttonSlide }],
                  },
                ]}
              >
                <Text style={styles.loginHint}>
                  Already have an account?
                </Text>

                <Pressable
                  onPress={() => router.replace("/login")}
                  disabled={loading || otpLoading}
                >
                  <Text style={styles.loginLink}>Sign in</Text>
                </Pressable>
              </Animated.View>

              {/* FOOTER */}
              <Animated.Text
                style={[styles.footer, { opacity: footerFade }]}
              >
                © JAY TECH · PLAY SMARTER
              </Animated.Text>
            </LinearGradient>
          </LinearGradient>
        </Animated.View>

        {/* COUNTRY PICKER MODAL */}
        <Modal
          visible={countryPickerVisible}
          transparent
          animationType="none"
          onRequestClose={() => setCountryPickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.countryModal,
                {
                  opacity: modalFade,
                  transform: [{ scale: modalScale }],
                },
              ]}
            >
              <Text style={styles.modalTitle}>Select country</Text>

              <TextInput
                style={styles.searchInput}
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

                    <Text style={styles.countryItemCode}>{item.code}</Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No country found.</Text>
                }
              />

              <Pressable
                onPress={() => setCountryPickerVisible(false)}
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>CLOSE</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* GMAIL OTP MODAL */}
        <Modal
          visible={otpModalVisible}
          transparent
          animationType="none"
          onRequestClose={() => {
            if (!otpLoading) setOtpModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.otpModal,
                {
                  opacity: modalFade,
                  transform: [{ scale: modalScale }],
                },
              ]}
            >
              <LinearGradient
                colors={["#FFE0A0", "#F4A000"]}
                style={styles.otpIcon}
              >
                <Feather name="mail" size={27} color="#071E2B" />
              </LinearGradient>

              <Text style={styles.modalTitle}>Verify your Gmail</Text>

              <Text style={styles.otpDescription}>
                Enter the six-digit code sent to
              </Text>

              <Text style={styles.otpEmail}>
                {form.email.trim().toLowerCase()}
              </Text>

              <TextInput
                value={emailOtp}
                onChangeText={(v) =>
                  setEmailOtp(v.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                placeholderTextColor="#7894A2"
                keyboardType="number-pad"
                maxLength={6}
                textContentType="oneTimeCode"
                style={styles.otpInput}
              />

              <Pressable
                disabled={otpLoading}
                onPress={handleFinalRegister}
                style={({ pressed }) => [
                  styles.buttonPressable,
                  pressed && styles.pressed,
                  otpLoading && styles.disabled,
                ]}
              >
                <LinearGradient
                  colors={["#FFE0A0", "#F4A000", "#D88900"]}
                  style={styles.button}
                >
                  {otpLoading ? (
                    <ActivityIndicator color="#071E2B" />
                  ) : (
                    <Text style={styles.buttonText}>VERIFY & REGISTER</Text>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable
                disabled={otpLoading}
                onPress={() => {
                  setOtpModalVisible(false);
                  setEmailOtp("");
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Text style={styles.expiry}>
                OTP expires in 10 minutes.
              </Text>
            </Animated.View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#07131D",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 30,
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
    maxWidth: 480,
    alignSelf: "center",
  },

  cardBorder: {
    borderRadius: 28,
    padding: 1.3,
    shadowColor: "#F4A000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 10,
  },

  card: {
    width: "100%",
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "#294653",
    padding: 23,
    overflow: "hidden",
  },

  cardShimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 29,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },

  logo: {
    width: 48,
    height: 48,
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
    fontFamily: "IBM Plex Mono",
    fontSize: 30,
    fontWeight: "900",
  },

  brand: {
    color: "#FFFFFF",
    fontFamily: "Cabinet Grotesk",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },

  brandCaption: {
    color: "#9DB5C0",
    fontSize: 9,
    letterSpacing: 1.1,
    marginTop: 3,
  },

  eyebrow: {
    color: "#F4A000",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },

  title: {
    color: "#F4A000",
    fontSize: 33,
    fontFamily: "Red Hat Display",
    fontWeight: "900",
    lineHeight: 39,
    marginTop: 9,
  },

  subtitle: {
    color: "#9DB5C0",
    fontSize: 13,
    marginTop: 8,
    marginBottom: 17,
  },

  heroRule: {
    width: 86,
    height: 3,
    borderRadius: 3,
    marginBottom: 20,
  },

  sectionLabel: {
    color: "#F4A000",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 10,
    marginTop: 8,
  },

  row: {
    flexDirection: "row",
    gap: 9,
  },

  input: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#0B1D27",
    color: "#FFFFFF",
    paddingHorizontal: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#31566A",
    fontSize: 14,
  },

  inputFocused: {
    borderColor: "#F4A000",
    shadowColor: "#62DCE0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 4,
  },

  half: {
    flex: 1,
    minWidth: 0,
  },

  code: {
    width: 112,
  },

  mobile: {
    flex: 1,
    minWidth: 0,
  },

  countryButton: {
    width: 83,
    justifyContent: "center",
  },

  countryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  passwordContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#31566A",
    backgroundColor: "#0B1D27",
    minHeight: 54,
  },

  passwordFocused: {
    borderColor: "#F4A000",
    shadowColor: "#62DCE0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 4,
  },

  passwordInput: {
    flex: 1,
    minWidth: 0,
    height: 48,
    color: "#FFFFFF",
    paddingLeft: 13,
    paddingRight: 5,
    fontSize: 14,
    borderRadius: 14,
  },

  showButton: {
    width: 44,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  passwordHint: {
    color: "#7894A2",
    fontSize: 10,
    marginTop: -1,
    marginBottom: 13,
    lineHeight: 15,
  },

  buttonShadow: {
    borderRadius: 15,
    shadowColor: "#F4A000",
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },

  buttonPressable: {
    borderRadius: 15,
    overflow: "hidden",
  },

  button: {
    height: 56,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
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

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  disabled: {
    opacity: 0.6,
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 22,
  },

  loginHint: {
    color: "#9DB5C0",
    fontSize: 12,
  },

  loginLink: {
    color: "#F4A000",
    fontSize: 13,
    fontWeight: "900",
  },

  footer: {
    color: "#668391",
    textAlign: "center",
    fontSize: 9,
    letterSpacing: 1.3,
    marginTop: 25,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    padding: 20,
  },

  countryModal: {
    maxHeight: "82%",
    backgroundColor: "#102F40",
    borderRadius: 23,
    padding: 19,
    borderWidth: 1,
    borderColor: "#31566A",
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },

  searchInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#17394B",
    color: "#FFFFFF",
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  countryItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#31566A",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  countryItemText: {
    color: "#FFFFFF",
    fontSize: 13,
  },

  countryItemCode: {
    color: "#F4A000",
    fontWeight: "900",
  },

  emptyText: {
    color: "#FFFFFF",
    textAlign: "center",
    padding: 20,
  },

  modalClose: {
    padding: 13,
    alignItems: "center",
    marginTop: 8,
  },

  modalCloseText: {
    color: "#F4A000",
    fontWeight: "900",
    letterSpacing: 1,
  },

  otpModal: {
    backgroundColor: "#102F40",
    borderRadius: 25,
    padding: 24,
    borderWidth: 1,
    borderColor: "#31566A",
  },

  otpIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },

  otpDescription: {
    color: "#9DB5C0",
    textAlign: "center",
    fontSize: 13,
    marginTop: 5,
  },

  otpEmail: {
    color: "#F4A000",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 15,
  },

  otpInput: {
    height: 60,
    backgroundColor: "#17394B",
    borderWidth: 1,
    borderColor: "#31566A",
    borderRadius: 15,
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 9,
    marginBottom: 12,
  },

  cancelButton: {
    padding: 13,
    alignItems: "center",
    marginTop: 5,
  },

  cancelText: {
    color: "#9DB5C0",
    fontWeight: "800",
  },

  expiry: {
    color: "#7894A2",
    textAlign: "center",
    fontSize: 10,
    marginTop: 8,
  },
  accessPill: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 100,
    gap: 7,
    borderWidth: 1,
    borderColor: "#355665",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 30,
  },
});