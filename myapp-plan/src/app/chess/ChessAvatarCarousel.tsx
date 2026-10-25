import { useEffect, useState } from "react";
import { ScrollView, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CHESS_AVATARS = ["🦊", "🐼", "🦁", "🐯", "🐸", "🐺", "🦄", "🐨"] as const;

type Props = {
  value?: string | null;
  onChange: (avatar: string) => void | Promise<void>;
  title?: string;
};

export default function ChessAvatarCarousel({ value, onChange, title = "Choose your avatar" }: Props) {
  const [selected, setSelected] = useState(value || "🦊");
  useEffect(() => { if (value) setSelected(value); }, [value]);

  const choose = async (avatar: string) => {
    setSelected(avatar);
    await AsyncStorage.setItem("@jaytech/chess-avatar-v1", avatar);
    // Persist to the logged-in account as well as local storage.
    const token =
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("authToken"));
    if (token) {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${baseUrl}/api/chess-profile/avatar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ randomAvatar: avatar }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Could not save avatar to your account");
      }
    }
    await onChange(avatar);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {CHESS_AVATARS.map((avatar) => (
          <Pressable key={avatar} onPress={() => void choose(avatar)} style={[styles.item, selected === avatar && styles.selected]}>
            <Text style={styles.emoji}>{avatar}</Text>
            {selected === avatar ? <Text style={styles.check}>✓</Text> : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  title: { color: "#fff", fontSize: 15, fontWeight: "900", marginBottom: 10 },
  row: { gap: 10, paddingVertical: 3, paddingRight: 12 },
  item: { width: 64, height: 64, borderRadius: 18, backgroundColor: "#E8F5F8", borderWidth: 2, borderColor: "#D0E3E9", alignItems: "center", justifyContent: "center" },
  selected: { borderColor: "#FFD166", backgroundColor: "#FFF5D8" },
  emoji: { fontSize: 35 },
  check: { position: "absolute", right: 4, top: 2, color: "#16845D", fontWeight: "900" },
});
