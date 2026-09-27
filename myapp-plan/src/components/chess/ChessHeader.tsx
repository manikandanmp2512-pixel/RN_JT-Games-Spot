import { uploadProfilePhoto } from "@/services/chessApi";
import { countryCodeToFlag } from "@/utils/chessUtils";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

import {
  useEffect,
  useState,
} from "react";

import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  showError,
  showSuccess,
} from "@/components/JayToast";

type Props = {
  rating?: number;
  gems?: number;
  onStatsPress?: () => void;
};

const RANDOM_AVATARS = [
  "🦊",
  "🐼",
  "🦁",
  "🐯",
  "🐸",
  "🐺",
  "🦄",
  "🐨",
];

export default function ChessHeader({
  rating = 1200,
  gems = 0,
  onStatsPress,
}: Props) {
  const [user, setUser] =
    useState<any>(null);

  const [avatar, setAvatar] =
    useState<string>(
      RANDOM_AVATARS[0]
    );

  const [imageVersion, setImageVersion] =
    useState<number>(
      Date.now()
    );

  /*
  |--------------------------------------------------------------------------
  | LOAD USER
  |--------------------------------------------------------------------------
  */

  const loadUser = async () => {
    try {
      const raw =
        await AsyncStorage.getItem(
          "user"
        );

      if (!raw) {
        return;
      }

      const parsed =
        JSON.parse(raw);

      setUser(parsed);

      if (
        parsed.randomAvatar
      ) {
        setAvatar(
          parsed.randomAvatar
        );
      } else {
        const next =
          RANDOM_AVATARS[
            Math.floor(
              Math.random() *
                RANDOM_AVATARS.length
            )
          ];

        setAvatar(next);

        const updated = {
          ...parsed,
          randomAvatar:
            next,
        };

        await AsyncStorage.setItem(
          "user",
          JSON.stringify(
            updated
          )
        );

        setUser(updated);
      }
    } catch (error) {
      console.error(
        "ChessHeader user load error:",
        error
      );
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | PICK + UPLOAD PHOTO
  |--------------------------------------------------------------------------
  */

  const choosePhoto =
    async () => {
      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (
          !permission.granted
        ) {
          showError(
            "Permission Required",
            "Allow photo access to upload your profile picture."
          );

          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes:
                ["images"],

              allowsEditing:
                true,

              aspect: [
                1,
                1,
              ],

              quality: 0.85,
            }
          );

        if (
          result.canceled ||
          !result.assets?.[0]
            ?.uri
        ) {
          return;
        }

        const selectedUri =
          result.assets[0].uri;

        /*
         * Upload to Render backend.
         */
        const response =
          await uploadProfilePhoto(
            selectedUri
          );

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Profile upload failed"
          );
        }

        const uploadedPhoto =
          response?.profilePhoto;

        if (!uploadedPhoto) {
          throw new Error(
            "Backend did not return profile image URL"
          );
        }

        /*
         * Prefer the complete
         * backend user object.
         */
        const updatedUser = {
          ...(user || {}),
          ...(response.user ||
            {}),
          profilePhoto:
            uploadedPhoto,
        };

        /*
         * Store latest user locally.
         */
        await AsyncStorage.setItem(
          "user",
          JSON.stringify(
            updatedUser
          )
        );

        /*
         * Update screen immediately.
         */
        setUser(
          updatedUser
        );

        /*
         * Force image refresh.
         */
        setImageVersion(
          Date.now()
        );

        showSuccess(
          "Profile Updated",
          "Your profile picture has been uploaded successfully."
        );
      } catch (error: any) {
        console.error(
          "Profile upload error:",
          error
        );

        showError(
          "Upload Failed",
          error?.message ||
            "Unable to upload your profile picture. Please try again."
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | USER DISPLAY DATA
  |--------------------------------------------------------------------------
  */

  const name =
    user
      ? `${user.fname || ""} ${
          user.lname || ""
        }`.trim() ||
        "Player"
      : "Player";

  const flag =
    countryCodeToFlag(
      user?.countryCode
    );

  const photo =
    user?.profilePhoto;

  const imageUri =
    photo
      ? `${photo}${
          photo.includes("?")
            ? "&"
            : "?"
        }t=${imageVersion}`
      : null;

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <View
      style={styles.container}
    >
      <Pressable
        onPress={choosePhoto}
        style={styles.avatarWrap}
      >
        {imageUri ? (
          <Image
            source={{
              uri: imageUri,
            }}
            style={
              styles.avatarImage
            }
          />
        ) : (
          <Text
            style={
              styles.avatarEmoji
            }
          >
            {avatar}
          </Text>
        )}

        <View
          style={styles.camera}
        >
          <Ionicons
            name="camera"
            size={11}
            color="#071E2B"
          />
        </View>
      </Pressable>

      <View
        style={styles.info}
      >
        <Text
          numberOfLines={1}
          style={styles.name}
        >
          {name}
        </Text>

        <View
          style={styles.meta}
        >
          <Text
            style={styles.flag}
          >
            {flag}
          </Text>

          <Text
            style={styles.rating}
          >
            ♟{" "}
            {user?.rating ??
              rating}
          </Text>

          <Text
            style={styles.gems}
          >
            💎{" "}
            {user?.gems ??
              gems}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      height: 78,
      paddingHorizontal: 18,
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#071E2B",
    },

    avatarWrap: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor:
        "#17394B",
      alignItems:
        "center",
      justifyContent:
        "center",
      borderWidth: 2,
      borderColor:
        "#F4A000",
      position:
        "relative",

      shadowColor:
        "#000",

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity:
        0.3,

      shadowRadius: 5,

      elevation: 5,
    },

    avatarImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor:
        "#17394B",
    },

    avatarEmoji: {
      fontSize: 30,
    },

    camera: {
      position:
        "absolute",
      right: -2,
      bottom: -1,
      width: 19,
      height: 19,
      borderRadius: 10,
      backgroundColor:
        "#F4A000",
      alignItems:
        "center",
      justifyContent:
        "center",
      borderWidth: 2,
      borderColor:
        "#071E2B",
    },

    info: {
      flex: 1,
      marginLeft: 12,
    },

    name: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "900",
    },

    meta: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 4,
      gap: 8,
    },

    flag: {
      fontSize: 16,
    },

    rating: {
      color: "#AFC5CF",
      fontSize: 11,
      fontWeight: "800",
    },

    gems: {
      color: "#AFC5CF",
      fontSize: 11,
      fontWeight: "800",
    },
  });