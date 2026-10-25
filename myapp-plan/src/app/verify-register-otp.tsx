// import { router, useLocalSearchParams } from "expo-router";
// import { useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Pressable,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   View,
// } from "react-native";

// import { showError, showSuccess } from "@/components/JayToast";
// import { useAppTheme } from "@/context/AppThemeContext";
// import { verifyRegisterOtp } from "@/services/authApi";

// export default function VerifyRegisterOtpScreen() {
//   const { isDark } = useAppTheme();

//   const { email } = useLocalSearchParams<{
//     email?: string;
//   }>();

//   const scrollRef = useRef<ScrollView>(null);

//   const [otp, setOtp] = useState("");
//   const [otpError, setOtpError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const normalizedEmail = String(email || "")
//     .trim()
//     .toLowerCase();

//   // =========================================================
//   // KEYBOARD SCROLL
//   // =========================================================

//   const handleFocus = (y: number) => {
//     setTimeout(() => {
//       scrollRef.current?.scrollTo({
//         y,
//         animated: true,
//       });
//     }, 100);
//   };

//   // =========================================================
//   // OTP CHANGE
//   // =========================================================

//   const handleOtpChange = (value: string) => {
//     const cleaned = value
//       .replace(/[^0-9]/g, "")
//       .slice(0, 6);

//     setOtp(cleaned);

//     if (otpError) {
//       setOtpError("");
//     }
//   };

//   // =========================================================
//   // VERIFY OTP
//   // =========================================================

//   const handleVerifyOtp = async () => {
//     if (loading) {
//       return;
//     }

//     setOtpError("");

//     if (!normalizedEmail) {
//       showError(
//         "Registration Error",
//         "Email address is missing. Please register again."
//       );
//       return;
//     }

//     if (!otp) {
//       setOtpError("Please enter the OTP.");
//       return;
//     }

//     if (!/^\d{6}$/.test(otp)) {
//       setOtpError("OTP must contain 6 digits.");
//       return;
//     }

//     try {
//       setLoading(true);

//       const result = await verifyRegisterOtp({
//         email: normalizedEmail,
//         otp,
//       });

//       if (!result?.success) {
//         const message =
//           result?.message ||
//           "Invalid or expired OTP.";

//         setOtpError(message);

//         showError(
//           "OTP Verification Failed",
//           message
//         );

//         return;
//       }

//       showSuccess(
//         "Registration Successful",
//         result?.message ||
//           "Your account has been verified successfully."
//       );

//       // =====================================================
//       // GO TO LOGIN
//       // =====================================================

//       router.replace("/login");
//     } catch (error: any) {
//       console.error(
//         "REGISTER OTP ERROR:",
//         error
//       );

//       const message =
//         error?.response?.data?.message ||
//         error?.message ||
//         "OTP verification failed.";

//       setOtpError(message);

//       showError(
//         "OTP Verification Failed",
//         message
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View
//       style={[
//         styles.root,
//         {
//           backgroundColor: isDark
//             ? "#071E2B"
//             : "#F5F7FA",
//         },
//       ]}
//     >
//       <StatusBar
//         barStyle={
//           isDark
//             ? "light-content"
//             : "dark-content"
//         }
//         backgroundColor={
//           isDark
//             ? "#071E2B"
//             : "#F5F7FA"
//         }
//       />

//       <KeyboardAvoidingView
//         style={styles.keyboardContainer}
//         behavior={
//           Platform.OS === "ios"
//             ? "padding"
//             : "height"
//         }
//         keyboardVerticalOffset={
//           Platform.OS === "ios"
//             ? 10
//             : 0
//         }
//       >
//         <ScrollView
//           ref={scrollRef}
//           style={styles.scrollView}
//           contentContainerStyle={
//             styles.scrollContent
//           }
//           keyboardShouldPersistTaps="handled"
//           keyboardDismissMode={
//             Platform.OS === "ios"
//               ? "interactive"
//               : "on-drag"
//           }
//           showsVerticalScrollIndicator={false}
//           automaticallyAdjustKeyboardInsets={true}
//         >
//           <View
//             style={[
//               styles.card,
//               {
//                 backgroundColor: isDark
//                   ? "#102F40"
//                   : "#FFFFFF",
//               },
//             ]}
//           >
//             {/* LOGO */}

//             <View style={styles.logoContainer}>
//               <View style={styles.logoCircle}>
//                 <Text style={styles.logoLetter}>
//                   J
//                 </Text>
//               </View>

//               <Text style={styles.logoText}>
//                 JAY TECH
//               </Text>
//             </View>

//             {/* TITLE */}

//             <Text
//               style={[
//                 styles.title,
//                 {
//                   color: isDark
//                     ? "#FFFFFF"
//                     : "#111827",
//                 },
//               ]}
//             >
//               Verify Your Email
//             </Text>

//             {/* DESCRIPTION */}

//             <Text
//               style={[
//                 styles.subtitle,
//                 {
//                   color: isDark
//                     ? "#9DB5C0"
//                     : "#667085",
//                 },
//               ]}
//             >
//               Enter the 6-digit OTP sent to
//             </Text>

//             <Text
//               style={[
//                 styles.emailText,
//                 {
//                   color: isDark
//                     ? "#F4A000"
//                     : "#D97706",
//                 },
//               ]}
//             >
//               {normalizedEmail || "your email"}
//             </Text>

//             {/* OTP LABEL */}

//             <Text
//               style={[
//                 styles.label,
//                 {
//                   color: isDark
//                     ? "#FFFFFF"
//                     : "#344054",
//                 },
//               ]}
//             >
//               Verification Code
//             </Text>

//             {/* OTP INPUT */}

//             <TextInput
//               value={otp}
//               onChangeText={handleOtpChange}
//               onFocus={() => handleFocus(80)}
//               onSubmitEditing={handleVerifyOtp}
//               placeholder="Enter 6-digit OTP"
//               placeholderTextColor={
//                 isDark
//                   ? "#7894A2"
//                   : "#98A2B3"
//               }
//               keyboardType="number-pad"
//               maxLength={6}
//               returnKeyType="done"
//               editable={!loading}
//               style={[
//                 styles.input,
//                 {
//                   color: isDark
//                     ? "#FFFFFF"
//                     : "#101828",

//                   backgroundColor: isDark
//                     ? "#17394B"
//                     : "#F8FAFC",

//                   borderColor: otpError
//                     ? "#EF4444"
//                     : isDark
//                     ? "#2C596B"
//                     : "#D0D5DD",
//                 },
//               ]}
//             />

//             {otpError ? (
//               <Text style={styles.errorText}>
//                 {otpError}
//               </Text>
//             ) : null}

//             {/* VERIFY */}

//             <Pressable
//               onPress={handleVerifyOtp}
//               disabled={loading}
//               style={({ pressed }) => [
//                 styles.button,
//                 pressed &&
//                   !loading &&
//                   styles.buttonPressed,
//                 loading &&
//                   styles.buttonDisabled,
//               ]}
//             >
//               {loading ? (
//                 <View style={styles.loadingRow}>
//                   <ActivityIndicator
//                     size="small"
//                     color="#071E2B"
//                   />

//                   <Text style={styles.buttonText}>
//                     Verifying...
//                   </Text>
//                 </View>
//               ) : (
//                 <Text style={styles.buttonText}>
//                   Verify OTP
//                 </Text>
//               )}
//             </Pressable>

//             {/* BACK */}

//             <Pressable
//               disabled={loading}
//               onPress={() =>
//                 router.replace("/register")
//               }
//               style={styles.backButton}
//             >
//               <Text
//                 style={[
//                   styles.backText,
//                   {
//                     color: isDark
//                       ? "#F4A000"
//                       : "#D97706",
//                   },
//                 ]}
//               >
//                 ← Back to Register
//               </Text>
//             </Pressable>
//           </View>

//           <View style={styles.bottomSpace} />
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   root: {
//     flex: 1,
//   },

//   keyboardContainer: {
//     flex: 1,
//   },

//   scrollView: {
//     flex: 1,
//   },

//   scrollContent: {
//     flexGrow: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingVertical: 30,
//   },

//   card: {
//     width: "100%",
//     maxWidth: 450,

//     paddingHorizontal: 25,
//     paddingVertical: 30,

//     borderRadius: 18,

//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 6,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 12,

//     elevation: 8,
//   },

//   logoContainer: {
//     alignItems: "center",
//     marginBottom: 18,
//   },

//   logoCircle: {
//     width: 62,
//     height: 62,
//     borderRadius: 31,

//     backgroundColor: "#F4A000",

//     alignItems: "center",
//     justifyContent: "center",

//     marginBottom: 8,
//   },

//   logoLetter: {
//     color: "#071E2B",
//     fontSize: 35,
//     fontWeight: "900",
//   },

//   logoText: {
//     color: "#F4A000",
//     fontSize: 16,
//     fontWeight: "900",
//     letterSpacing: 2,
//   },

//   title: {
//     fontSize: 28,
//     fontWeight: "900",
//     textAlign: "center",
//     marginBottom: 10,
//   },

//   subtitle: {
//     fontSize: 14,
//     textAlign: "center",
//     lineHeight: 21,
//   },

//   emailText: {
//     fontSize: 14,
//     fontWeight: "800",
//     textAlign: "center",
//     marginTop: 5,
//     marginBottom: 28,
//   },

//   label: {
//     fontSize: 14,
//     fontWeight: "800",
//     marginBottom: 8,
//   },

//   input: {
//     width: "100%",
//     height: 52,

//     borderWidth: 1,
//     borderRadius: 10,

//     paddingHorizontal: 15,

//     fontSize: 20,
//     fontWeight: "800",

//     letterSpacing: 7,

//     textAlign: "center",
//   },

//   errorText: {
//     width: "100%",

//     color: "#EF4444",

//     fontSize: 12,
//     fontWeight: "700",

//     marginTop: 5,
//     marginBottom: 8,
//   },

//   button: {
//     width: "100%",
//     height: 52,

//     backgroundColor: "#F4A000",

//     borderRadius: 10,

//     alignItems: "center",
//     justifyContent: "center",

//     marginTop: 15,

//     shadowColor: "#F4A000",
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 8,

//     elevation: 5,
//   },

//   buttonPressed: {
//     opacity: 0.75,
//   },

//   buttonDisabled: {
//     opacity: 0.65,
//   },

//   loadingRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//   },

//   buttonText: {
//     color: "#071E2B",
//     fontSize: 16,
//     fontWeight: "900",
//   },

//   backButton: {
//     alignItems: "center",
//     marginTop: 22,
//   },

//   backText: {
//     fontSize: 14,
//     fontWeight: "800",
//   },

//   bottomSpace: {
//     height: 80,
//   },
// });

import { useState } from "react";

import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  verifyRegisterOtp,
} from "@/services/authApi";

import {
  showError,
  showSuccess,
} from "@/components/JayToast";

export default function VerifyRegisterOtp() {
  const params =
    useLocalSearchParams<{
      email?: string;
    }>();

  const email =
    String(
      params.email || ""
    ).trim().toLowerCase();

  const [
    emailOtp,
    setEmailOtp,
  ] = useState("");

  const [
    mobileOtp,
    setMobileOtp,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  // ==========================================================
  // VERIFY
  // ==========================================================

  const verify = async () => {
    if (loading) {
      return;
    }

    if (!email) {
      showError(
        "Registration Error",
        "Registration email is missing. Please register again."
      );

      return;
    }

    if (!/^\d{6}$/.test(emailOtp)) {
      showError(
        "Invalid Email OTP",
        "Enter the 6-digit OTP sent to your Gmail."
      );

      return;
    }

    if (!/^\d{6}$/.test(mobileOtp)) {
      showError(
        "Invalid Mobile OTP",
        "Enter the 6-digit OTP sent to your mobile number."
      );

      return;
    }

    try {
      setLoading(true);

      const result =
        await verifyRegisterOtp({
          email,
          emailOtp,
          mobileOtp,
        });

      if (!result.success) {
        showError(
          "Verification Failed",
          result.message ||
            "Invalid OTP."
        );

        return;
      }

      // --------------------------------------------------------
      // SAVE LOGIN SESSION
      // --------------------------------------------------------

      if (result.token) {
        await AsyncStorage.setItem(
          "token",
          result.token
        );
      }

      if (result.user) {
        await AsyncStorage.setItem(
          "user",
          JSON.stringify(
            result.user
          )
        );
      }

      showSuccess(
        "Registration Complete",
        "Your JayTech account has been created successfully."
      );

      setTimeout(() => {
        router.replace(
          "/login"
        );
      }, 700);
    } catch (error: any) {
      console.error(
        "OTP VERIFY ERROR:",
        error
      );

      showError(
        "Verification Failed",
        error?.response?.data
          ?.message ||
          error?.message ||
          "Unable to verify OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
    >
      <View style={styles.card}>
        <Text style={styles.title}>
          Verify Account
        </Text>

        <Text style={styles.subtitle}>
          Enter the OTPs sent to:
        </Text>

        <Text style={styles.email}>
          {email}
        </Text>

        {/* ==================================================
            EMAIL OTP
        ================================================== */}

        <Text style={styles.label}>
          Gmail OTP
        </Text>

        <TextInput
          value={emailOtp}
          onChangeText={(value) =>
            setEmailOtp(
              value
                .replace(/\D/g, "")
                .slice(0, 6)
            )
          }
          placeholder="Enter Gmail OTP"
          placeholderTextColor="#7894A2"
          keyboardType="number-pad"
          maxLength={6}
          style={styles.input}
        />

        {/* ==================================================
            MOBILE OTP
        ================================================== */}

        <Text style={styles.label}>
          Mobile OTP
        </Text>

        <TextInput
          value={mobileOtp}
          onChangeText={(value) =>
            setMobileOtp(
              value
                .replace(/\D/g, "")
                .slice(0, 6)
            )
          }
          placeholder="Enter mobile OTP"
          placeholderTextColor="#7894A2"
          keyboardType="number-pad"
          maxLength={6}
          style={styles.input}
        />

        {/* ==================================================
            VERIFY BUTTON
        ================================================== */}

        <Pressable
          disabled={loading}
          onPress={verify}
          style={({ pressed }) => [
            styles.button,
            {
              opacity:
                loading ||
                pressed
                  ? 0.7
                  : 1,
            },
          ]}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "Verifying..."
              : "Verify & Create Account"}
          </Text>
        </Pressable>

        <Pressable
          disabled={loading}
          onPress={() =>
            router.back()
          }
        >
          <Text style={styles.back}>
            Back to Registration
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#071E2B",
      justifyContent:
        "center",
      padding: 22,
    },

    card: {
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

    subtitle: {
      color: "#9DB5C0",
      fontSize: 14,
      textAlign: "center",
      marginTop: 10,
    },

    email: {
      color: "#F4A000",
      fontSize: 15,
      fontWeight: "800",
      textAlign: "center",
      marginTop: 5,
      marginBottom: 28,
    },

    label: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "800",
      marginBottom: 7,
    },

    input: {
      height: 52,
      borderRadius: 13,
      backgroundColor:
        "#17394B",
      borderWidth: 1,
      borderColor:
        "#2C596B",
      color: "#FFFFFF",
      paddingHorizontal: 15,
      fontSize: 18,
      letterSpacing: 5,
      textAlign: "center",
      marginBottom: 18,
    },

    button: {
      height: 52,
      borderRadius: 14,
      backgroundColor:
        "#F4A000",
      alignItems: "center",
      justifyContent:
        "center",
      marginTop: 8,
      elevation: 4,
    },

    buttonText: {
      color: "#071E2B",
      fontWeight: "900",
      fontSize: 15,
    },

    back: {
      color: "#F4A000",
      textAlign: "center",
      marginTop: 20,
      fontSize: 14,
      fontWeight: "800",
    },
  });