
import { showError, showSuccess } from "@/components/JayToast";
import { uploadProfilePhoto } from "@/services/chessApi";
import { countryCodeToFlag } from "@/utils/chessUtils";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

import { useEffect, useState } from "react";

import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

const AVATAR_SIZE = 70;

export default function ChessHeader({
  rating = 100,
  gems = 0,
  onStatsPress,
}: Props) {
  const [user, setUser] = useState<any>(null);
  const [avatar, setAvatar] = useState<string>(RANDOM_AVATARS[0]);
  const [imageVersion, setImageVersion] = useState(Date.now());
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD USER
  |--------------------------------------------------------------------------
  */

  const loadUser = async () => {
    try {
      const raw = await AsyncStorage.getItem("user");

      if (!raw) return;

      const parsed = JSON.parse(raw);
      setUser(parsed);

      const savedAvatar = RANDOM_AVATARS.includes(parsed.randomAvatar)
        ? parsed.randomAvatar
        : RANDOM_AVATARS[0];

      setAvatar(savedAvatar);

      if (!parsed.randomAvatar) {
        const updated = {
          ...parsed,
          randomAvatar: savedAvatar,
        };

        await AsyncStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
      }
    } catch (error) {
      console.error("ChessHeader user load error:", error);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SELECT EMOJI AVATAR
  |--------------------------------------------------------------------------
  */

  const selectAvatar = async (selectedAvatar: string) => {
    try {
      const updatedUser = {
        ...(user || {}),
        randomAvatar: selectedAvatar,
        // An emoji selection should display instead of the uploaded photo.
        profilePhoto: null,
      };

      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

      setUser(updatedUser);
      setAvatar(selectedAvatar);
      setImageVersion(Date.now());
      setAvatarPickerVisible(false);

      showSuccess("Avatar Updated", "Your avatar has been changed.");
    } catch (error) {
      console.error("Avatar selection error:", error);
      showError("Update Failed", "Could not save your selected avatar.");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PICK + UPLOAD PHOTO
  |--------------------------------------------------------------------------
  */

  const choosePhoto = async () => {
    if (uploading) return;

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showError(
          "Permission Required",
          "Allow photo access to upload your profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setUploading(true);

      const response = await uploadProfilePhoto(result.assets[0].uri);

      if (!response?.success) {
        throw new Error(response?.message || "Profile upload failed");
      }

      const uploadedPhoto = response?.profilePhoto;

      if (!uploadedPhoto) {
        throw new Error("Backend did not return profile image URL");
      }

      const updatedUser = {
        ...(user || {}),
        ...(response.user || {}),
        profilePhoto: uploadedPhoto,
      };

      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

      setUser(updatedUser);
      setImageVersion(Date.now());
      setAvatarPickerVisible(false);

      showSuccess(
        "Profile Updated",
        "Your profile picture has been uploaded successfully."
      );
    } catch (error: any) {
      console.error("Profile upload error:", error);

      showError(
        "Upload Failed",
        error?.message ||
          "Unable to upload your profile picture. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | USER DISPLAY DATA
  |--------------------------------------------------------------------------
  */

  const name = user
    ? `${user.fname || ""} ${user.lname || ""}`.trim() || "Player"
    : "Player";

  const flag = countryCodeToFlag(user?.countryCode);
  const photo = user?.profilePhoto;

  const imageUri = photo
    ? `${photo}${photo.includes("?") ? "&" : "?"}t=${imageVersion}`
    : null;

  // Display the latest saved user rating, falling back to the supplied prop.
  const winningPoints = Number(user?.rating ?? rating);
  const displayedGems = user?.gems ?? gems;

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <View style={styles.container}>
        <Pressable
          onPress={() => setAvatarPickerVisible(true)}
          style={styles.avatarWrap}
          accessibilityRole="button"
          accessibilityLabel="Choose avatar or upload profile photo"
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarEmoji}>{avatar}</Text>
          )}

          <View style={styles.camera}>
            <Ionicons name="camera" size={11} color="#071E2B" />
          </View>
        </Pressable>

        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.name}>
            {name}
          </Text>

          <View style={styles.meta}>
            <Text style={styles.flag}>{flag}</Text>

            <Pressable
              onPress={onStatsPress}
              style={styles.statItem}
              accessibilityRole="button"
              accessibilityLabel={`Rating ${winningPoints} points`}
            >
              <Ionicons name="trophy" size={13} color="#F4A000" />
              <Text style={styles.rating}>{winningPoints}</Text>
            </Pressable>

            <View style={styles.statItem}>
              <Text style={styles.gemIcon}>💎</Text>
              <Text style={styles.gems}>{displayedGems}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* AVATAR + PHOTO CAROUSEL */}

      <Modal
        visible={avatarPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAvatarPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>Choose your avatar</Text>
                <Text style={styles.modalSubtitle}>
                  Swipe to browse and select
                </Text>
              </View>

              <Pressable
                onPress={() => setAvatarPickerVisible(false)}
                style={styles.closeButton}
                accessibilityLabel="Close avatar selector"
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
            >
              {RANDOM_AVATARS.map((item) => {
                const selected = !imageUri && avatar === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() => selectAvatar(item)}
                    style={[
                      styles.avatarOption,
                      selected && styles.avatarOptionSelected,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${item} avatar`}
                  >
                    <Text style={styles.carouselEmoji}>{item}</Text>

                    {selected && (
                      <View style={styles.selectedBadge}>
                        <Ionicons
                          name="checkmark"
                          size={12}
                          color="#071E2B"
                        />
                      </View>
                    )}
                  </Pressable>
                );
              })}

              {/* UPLOAD PHOTO OPTION */}

              <Pressable
                onPress={choosePhoto}
                disabled={uploading}
                style={[
                  styles.avatarOption,
                  styles.uploadOption,
                  imageUri && styles.avatarOptionSelected,
                  uploading && styles.disabledOption,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Upload profile photo"
              >
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.uploadPreview}
                  />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={30} color="#F4A000" />
                )}

                <Text style={styles.uploadLabel}>
                  {uploading ? "Uploading..." : "Upload Photo"}
                </Text>

                {imageUri && (
                  <View style={styles.selectedBadge}>
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color="#071E2B"
                    />
                  </View>
                )}
              </Pressable>
            </ScrollView>

            <Text style={styles.carouselHint}>
              Select an emoji or tap Upload Photo to use your own picture.
            </Text>

            {/* <Pressable
              onPress={() => setAvatarPickerVisible(false)}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable> */}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 78,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#021c82b8",
  },

  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#17394B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F4A000",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },

  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#17394B",
  },

  avatarEmoji: {
    fontSize: 30,
  },

  camera: {
    position: "absolute",
    right: -2,
    bottom: -1,
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#F4A000",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#071E2B",
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
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 9,
  },

  flag: {
    fontSize: 16,
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  rating: {
    color: "#F4A000",
    fontSize: 12,
    fontWeight: "900",
  },

  gemIcon: {
    fontSize: 12,
  },

  gems: {
    color: "#AFC5CF",
    fontSize: 11,
    fontWeight: "800",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  modalCard: {
    backgroundColor: "#030637",
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#244F65",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  modalTitleWrap: {
    flex: 1,
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  modalSubtitle: {
    color: "#AFC5CF",
    fontSize: 12,
    marginTop: 5,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#17394B",
    marginLeft: 10,
  },

  carouselContent: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 2,
    gap: 12,
  },

  avatarOption: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 20,
    backgroundColor: "#03138b",
    borderWidth: 2,
    borderColor: "#244F65",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  avatarOptionSelected: {
    borderColor: "#F4A000",
    backgroundColor: "#06024e",
  },

  carouselEmoji: {
    fontSize: 38,
  },

  selectedBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F4A000",
    alignItems: "center",
    justifyContent: "center",
  },

  uploadOption: {
    width: 100,
    padding: 5,
  },

  uploadPreview: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  uploadLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 4,
  },

  disabledOption: {
    opacity: 0.6,
  },

  carouselHint: {
    color: "#AFC5CF",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 18,
    textAlign: "center",
  },

  doneButton: {
    marginTop: 20,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#F4A000",
    alignItems: "center",
    justifyContent: "center",
  },

  doneButtonText: {
    color: "#071E2B",
    fontSize: 15,
    fontWeight: "900",
  },
});
