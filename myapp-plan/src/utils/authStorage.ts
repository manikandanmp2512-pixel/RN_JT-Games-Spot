import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "token";

export const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);

    if (!token) {
      return null;
    }

    return token;
  } catch (error) {
    console.log("❌ Failed to read auth token:", error);
    return null;
  }
};

export const saveAuthToken = async (
  token: string
): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.log("❌ Failed to save auth token:", error);
    throw error;
  }
};

export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.log("❌ Failed to remove auth token:", error);
  }
};