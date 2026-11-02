// import { useState } from "react";

// import {
//   KeyboardAvoidingView,
//   Platform,
//   Pressable,
//   StyleSheet,
//   Text,
//   TextInput,
//   View,
// } from "react-native";

// import {
//   router,
//   useLocalSearchParams,
// } from "expo-router";

// import AsyncStorage from "@react-native-async-storage/async-storage";

// import {
//   verifyRegisterOtp,
// } from "@/services/authApi";

// import {
//   showError,
//   showSuccess,
// } from "@/components/JayToast";

// export default function VerifyRegisterOtp() {
//   const params =
//     useLocalSearchParams<{
//       email?: string;
//     }>();

//   const email =
//     String(
//       params.email || ""
//     ).trim().toLowerCase();

//   const [
//     emailOtp,
//     setEmailOtp,
//   ] = useState("");

//   const [
//     mobileOtp,
//     setMobileOtp,
//   ] = useState("");

//   const [
//     loading,
//     setLoading,
//   ] = useState(false);

//   // ==========================================================
//   // VERIFY
//   // ==========================================================

//   const verify = async () => {
//     if (loading) {
//       return;
//     }

//     if (!email) {
//       showError(
//         "Registration Error",
//         "Registration email is missing. Please register again."
//       );

//       return;
//     }

//     if (!/^\d{6}$/.test(emailOtp)) {
//       showError(
//         "Invalid Email OTP",
//         "Enter the 6-digit OTP sent to your Gmail."
//       );

//       return;
//     }

//     if (!/^\d{6}$/.test(mobileOtp)) {
//       showError(
//         "Invalid Mobile OTP",
//         "Enter the 6-digit OTP sent to your mobile number."
//       );

//       return;
//     }

//     try {
//       setLoading(true);

//       const result =
//         await verifyRegisterOtp({
//           email,
//           emailOtp,
//           mobileOtp,
//         });

//       if (!result.success) {
//         showError(
//           "Verification Failed",
//           result.message ||
//             "Invalid OTP."
//         );

//         return;
//       }

//       // --------------------------------------------------------
//       // SAVE LOGIN SESSION
//       // --------------------------------------------------------

//       if (result.token) {
//         await AsyncStorage.setItem(
//           "token",
//           result.token
//         );
//       }

//       if (result.user) {
//         await AsyncStorage.setItem(
//           "user",
//           JSON.stringify(
//             result.user
//           )
//         );
//       }

//       showSuccess(
//         "Registration Complete",
//         "Your JayTech account has been created successfully."
//       );

//       setTimeout(() => {
//         router.replace(
//           "/login"
//         );
//       }, 700);
//     } catch (error: any) {
//       console.error(
//         "OTP VERIFY ERROR:",
//         error
//       );

//       showError(
//         "Verification Failed",
//         error?.response?.data
//           ?.message ||
//           error?.message ||
//           "Unable to verify OTP."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ==========================================================
//   // UI
//   // ==========================================================

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={
//         Platform.OS === "ios"
//           ? "padding"
//           : "height"
//       }
//     >
//       <View style={styles.card}>
//         <Text style={styles.title}>
//           Verify Account
//         </Text>

//         <Text style={styles.subtitle}>
//           Enter the OTPs sent to:
//         </Text>

//         <Text style={styles.email}>
//           {email}
//         </Text>

//         {/* ==================================================
//             EMAIL OTP
//         ================================================== */}

//         <Text style={styles.label}>
//           Gmail OTP
//         </Text>

//         <TextInput
//           value={emailOtp}
//           onChangeText={(value) =>
//             setEmailOtp(
//               value
//                 .replace(/\D/g, "")
//                 .slice(0, 6)
//             )
//           }
//           placeholder="Enter Gmail OTP"
//           placeholderTextColor="#7894A2"
//           keyboardType="number-pad"
//           maxLength={6}
//           style={styles.input}
//         />

//         {/* ==================================================
//             MOBILE OTP
//         ================================================== */}

//         <Text style={styles.label}>
//           Mobile OTP
//         </Text>

//         <TextInput
//           value={mobileOtp}
//           onChangeText={(value) =>
//             setMobileOtp(
//               value
//                 .replace(/\D/g, "")
//                 .slice(0, 6)
//             )
//           }
//           placeholder="Enter mobile OTP"
//           placeholderTextColor="#7894A2"
//           keyboardType="number-pad"
//           maxLength={6}
//           style={styles.input}
//         />

//         {/* ==================================================
//             VERIFY BUTTON
//         ================================================== */}

//         <Pressable
//           disabled={loading}
//           onPress={verify}
//           style={({ pressed }) => [
//             styles.button,
//             {
//               opacity:
//                 loading ||
//                 pressed
//                   ? 0.7
//                   : 1,
//             },
//           ]}
//         >
//           <Text style={styles.buttonText}>
//             {loading
//               ? "Verifying..."
//               : "Verify & Create Account"}
//           </Text>
//         </Pressable>

//         <Pressable
//           disabled={loading}
//           onPress={() =>
//             router.back()
//           }
//         >
//           <Text style={styles.back}>
//             Back to Registration
//           </Text>
//         </Pressable>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// // ============================================================
// // STYLES
// // ============================================================

// const styles =
//   StyleSheet.create({
//     container: {
//       flex: 1,
//       backgroundColor:
//         "#071E2B",
//       justifyContent:
//         "center",
//       padding: 22,
//     },

//     card: {
//       width: "100%",
//       maxWidth: 450,
//       alignSelf: "center",
//     },

//     title: {
//       color: "#FFFFFF",
//       fontSize: 30,
//       fontWeight: "900",
//       textAlign: "center",
//     },

//     subtitle: {
//       color: "#9DB5C0",
//       fontSize: 14,
//       textAlign: "center",
//       marginTop: 10,
//     },

//     email: {
//       color: "#F4A000",
//       fontSize: 15,
//       fontWeight: "800",
//       textAlign: "center",
//       marginTop: 5,
//       marginBottom: 28,
//     },

//     label: {
//       color: "#FFFFFF",
//       fontSize: 14,
//       fontWeight: "800",
//       marginBottom: 7,
//     },

//     input: {
//       height: 52,
//       borderRadius: 13,
//       backgroundColor:
//         "#17394B",
//       borderWidth: 1,
//       borderColor:
//         "#2C596B",
//       color: "#FFFFFF",
//       paddingHorizontal: 15,
//       fontSize: 18,
//       letterSpacing: 5,
//       textAlign: "center",
//       marginBottom: 18,
//     },

//     button: {
//       height: 52,
//       borderRadius: 14,
//       backgroundColor:
//         "#F4A000",
//       alignItems: "center",
//       justifyContent:
//         "center",
//       marginTop: 8,
//       elevation: 4,
//     },

//     buttonText: {
//       color: "#071E2B",
//       fontWeight: "900",
//       fontSize: 15,
//     },

//     back: {
//       color: "#F4A000",
//       textAlign: "center",
//       marginTop: 20,
//       fontSize: 14,
//       fontWeight: "800",
//     },
//   });