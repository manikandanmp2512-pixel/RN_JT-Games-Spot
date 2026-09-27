import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getLoggedInPlayerName(): Promise<string> {
  try {
    const possibleKeys = [
      "user",
      "userData",
      "userInfo",
      "authUser",
      "profile",
    ];

    for (const key of possibleKeys) {
      const raw = await AsyncStorage.getItem(key);

      if (!raw) {
        continue;
      }

      try {
        const data = JSON.parse(raw);

        const firstName =
          data?.fname ||
          data?.firstName ||
          "";

        const lastName =
          data?.lname ||
          data?.lastName ||
          "";

        const fullName =
          data?.name ||
          data?.fullName ||
          `${firstName} ${lastName}`.trim();

        if (fullName.trim()) {
          return fullName.trim();
        }
      } catch {
        if (raw.trim()) {
          return raw.trim();
        }
      }
    }

    const directNameKeys = [
      "playerName",
      "name",
      "fname",
    ];

    for (const key of directNameKeys) {
      const value =
        await AsyncStorage.getItem(key);

      if (value?.trim()) {
        return value.trim();
      }
    }
  } catch (error) {
    console.log(
      "Unable to read player name:",
      error
    );
  }

  return "Player";
}