import { GameMode } from "@/types/chess";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = { mode: GameMode; selected: boolean; onPress: () => void };
export default function GameModeCard({ mode, selected, onPress }: Props) {
  return <Pressable onPress={onPress} style={[styles.card, selected && styles.selected]}>
    <View style={styles.top}>
    <Text style={styles.icon}>{mode.icon}</Text>
    <View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.dot} />}</View>
    </View>
    <Text style={styles.title}>{mode.title}</Text>
    <Text style={styles.time}>{mode.time}</Text>{mode.increment && <Text style={styles.increment}>{mode.increment}</Text>}
  </Pressable>;
}
const styles = StyleSheet.create({ card: { width: "48.5%", minHeight: 95, borderRadius: 17, padding: 13, marginBottom: 10, backgroundColor: "#244F65", borderWidth: 1, borderColor: "#3C6B80" }, selected: { borderColor: "#F4A000", backgroundColor: "#2D5D73" }, top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, icon: { fontSize: 24 }, radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#7695A3", alignItems: "center", justifyContent: "center" }, radioSelected: { borderColor: "#05df26" }, dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#05df26" }, title: { color: "#FFF", fontWeight: "900", fontSize: 16, marginTop: -25, marginLeft: 43 }, time: { color: "#D7E4EA", fontSize: 12, marginTop: 8 }, increment: { color: "#F4A000", fontSize: 10, fontWeight: "800", marginTop: 3 } });
