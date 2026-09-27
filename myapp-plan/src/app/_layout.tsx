import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from "expo-router";

import * as SplashScreen from "expo-splash-screen";

import { useEffect } from "react";
import { useColorScheme } from "react-native";

import { AppThemeProvider } from "@/context/AppThemeContext";

import Toast from "react-native-toast-message";

// Keep splash screen visible while app initializes
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };

    hideSplash();
  }, []);

  return (
    <ThemeProvider
      value={
        colorScheme === "dark"
          ? DarkTheme
          : DefaultTheme
      }
    >
      <AppThemeProvider>

        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />

        <Toast />

      </AppThemeProvider>
    </ThemeProvider>
  );
}