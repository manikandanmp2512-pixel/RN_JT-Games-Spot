import { SafeAreaView, StyleSheet, Text, View, FlatList } from "react-native";
import ChessBottomNav from "@/components/chess/ChessBottomNav";
const players = [
  { id: "1", name: "Chess Master", rating: 2450, flag: "🇮🇳" },
  { id: "2", name: "Grand Player", rating: 2380, flag: "🇺🇸" },
  { id: "3", name: "Knight King", rating: 2310, flag: "🇬🇧" },
  { id: "4", name: "You", rating: 1200, flag: "🇮🇳" },
];
export default function Rankings() { return <SafeAreaView style={styles.safe}><View style={styles.header}><Text style={styles.title}>Rankings</Text><Text style={styles.sub}>Top chess players</Text></View><FlatList data={players} keyExtractor={(x) => x.id} contentContainerStyle={styles.list} renderItem={({ item, index }) => <View style={styles.row}><Text style={styles.rank}>{index + 1}</Text><Text style={styles.flag}>{item.flag}</Text><View style={{ flex: 1 }}><Text style={styles.name}>{item.name}</Text><Text style={styles.rating}>Rating {item.rating}</Text></View><Text style={styles.medal}>{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "♟️"}</Text></View>} /><ChessBottomNav activeTab="rankings" /></SafeAreaView>; }

const styles = StyleSheet.create({ safe: { marginTop: 30, flex: 1, backgroundColor: "#214E65" }, header: { backgroundColor: "#071E2B", padding: 22 }, title: { color: "#FFF", fontSize: 24, fontWeight: "900" }, sub: { color: "#F4A000", marginTop: 3, fontSize: 11 }, list: { padding: 14 }, row: { minHeight: 72, backgroundColor: "#244F65", borderRadius: 16, marginBottom: 9, flexDirection: "row", alignItems: "center", paddingHorizontal: 14 }, rank: { color: "#F4A000", fontSize: 18, fontWeight: "900", width: 30 }, flag: { fontSize: 25, marginRight: 12 }, name: { color: "#FFF", fontSize: 15, fontWeight: "900" }, rating: { color: "#9FB6C0", fontSize: 10, marginTop: 2 }, medal: { fontSize: 24 } });
