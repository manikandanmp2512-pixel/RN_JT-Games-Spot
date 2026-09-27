import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Tab = "play" | "friends" | "rankings" | "profile";
type Props = { activeTab: Tab };

export default function ChessBottomNav({ activeTab }: Props) {
  const tabs = [
    { id: "play" as const, label: "Play", icon: "game-controller", route: "/chess" },
    { id: "friends" as const, label: "Friends", icon: "account-multiple", route: "/chess/friends" },
    { id: "rankings" as const, label: "Rankings", icon: "crown", route: "/chess/rankings" },
    { id: "profile" as const, label: "Profile", icon: "person", route: "/user" },
  ];
  return <View style={styles.container}>{tabs.map((tab) => {
    const active = activeTab === tab.id;
    return <TouchableOpacity key={tab.id} onPress={() => router.replace(tab.route as any)} style={[styles.item, active && styles.activeItem]}>
      {tab.id === "profile" || tab.id === "play" ? <Ionicons name={tab.icon as any} size={28} color={active ? "#F4A000" : "#7FA3B5"} /> : <MaterialCommunityIcons name={tab.icon as any} size={29} color={active ? "#F4A000" : "#7FA3B5"} />}
      <Text style={[styles.text, active && styles.activeText]}>{tab.label}</Text>
    </TouchableOpacity>;
  })}</View>;
}
const styles = StyleSheet.create({ container: { height: 78, flexDirection: "row", backgroundColor: "#071E2B", borderTopWidth: 2, borderTopColor: "#F5A000" }, item: { flex: 1, alignItems: "center", justifyContent: "center" }, activeItem: { marginTop: -18, paddingTop: 18, borderTopLeftRadius: 25, borderTopRightRadius: 25, borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: "#F5A000", backgroundColor: "#0A2838" }, text: { color: "#C1D0D7", fontSize: 12, marginTop: 3 }, activeText: { color: "#FFB01A", fontWeight: "900" } });
