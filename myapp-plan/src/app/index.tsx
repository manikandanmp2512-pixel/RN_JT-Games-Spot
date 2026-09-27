import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Navbar from "@/components/Navbar";
import { useAppTheme } from "@/context/AppThemeContext";

export default function Index() {
  const { isDark } = useAppTheme();

  const [checkingLogin, setCheckingLogin] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        if (token) {
          // Already logged in → go directly to User page
          router.replace("/user");
          return;
        }
      } catch (error) {
        console.error("Login check error:", error);
      } finally {
        setCheckingLogin(false);
      }
    };

    checkLogin();
  }, []);

  // Checking login status
  if (checkingLogin) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#6366F1"
        />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("@/assets/images/background.png")}
      resizeMode="cover"
      style={styles.background}
    >
      {/* Background overlay */}
      {/* <View
        style={[
          styles.overlay,
          {
            backgroundColor: isDark
              ? "rgba(2, 6, 23, 0.72)"
              : "rgba(255, 255, 255, 0.35)",
          },
        ]}
      /> */}

      <View style={styles.container}>
        {/* Navbar */}
        <Navbar />

        {/* Home Content */}
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              {
                color: isDark ? "#b2dff2" : "#03b3ff",
              },
            ]}
          >
            Welcome to Jay Tech Games Spot
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: isDark
                  ? "#f1dfbc"
                  : "#F4A000",
              },
            ]}
          >
            Connect with Your Friends
          </Text>

          <Text
            style={[
              styles.developed,
              {
                color: isDark
                  ? "#C4B5FD"
                  : "#c5c6c9",
              },
            ]}
          >
            © 2026     Developed by Manikandan M
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  // overlay: {
  //   ...StyleSheet.absoluteFillObject,
  // },

  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  content: {
    backgroundColor: "rgba(7, 30, 43, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(44, 89, 107, 0.8)",
    maxHeight: 180,
    marginTop: 575,
    borderRadius: 30,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    shadowOpacity: 0.0,
  },

  title: {
    // marginTop: 570,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
  },

  subtitle: {
    // marginTop: 5,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },

  developed: {
    marginTop: 50,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});