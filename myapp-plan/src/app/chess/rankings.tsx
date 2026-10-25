import { useCallback, useState } from "react";
import { useFocusEffect, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type RankedPlayer = {
  id: string;
  name: string;
  rating: number;
  countryCode?: string;
  randomAvatar?: string;
  profilePhoto?: string;
};

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

export default function ChessRankingsScreen() {
  const [scope, setScope] = useState<"world" | "india">("world");
  const [players, setPlayers] = useState<RankedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/chess-rankings?scope=${scope}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to load rankings"
        );
      }

      setPlayers(
        Array.isArray(data.players) ? data.players : []
      );
    } catch (e: any) {
      setError(e?.message || "Unable to load rankings");
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const countryLabel = (countryCode?: string) => {
    if (
      countryCode === "+91" ||
      countryCode === "IN"
    ) {
      return "🇮🇳 India";
    }

    return countryCode || "Worldwide";
  };

  const renderPlayer = ({
    item,
    index,
  }: {
    item: RankedPlayer;
    index: number;
  }) => {
    const isFirst = index === 0;
    const isSecond = index === 1;
    const isThird = index === 2;
    const isTopThree = index < 3;

    const medalColor = isFirst
      ? "#FFC857"
      : isSecond
        ? "#B9C9DF"
        : "#D99A69";

    return (
      <View
        style={[
          styles.playerCard,
          isFirst && styles.firstPlayerCard,
        ]}
      >
        {isFirst ? (
          <LinearGradient
            colors={[
              "rgba(255,200,87,0.10)",
              "rgba(255,200,87,0.015)",
            ]}
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        <View
          style={[
            styles.rankBox,
            isTopThree
              ? {
                  borderColor: `${medalColor}80`,
                  backgroundColor: `${medalColor}18`,
                }
              : styles.normalRankBox,
          ]}
        >
          {isFirst ? (
            <MaterialCommunityIcons
              name="trophy"
              size={19}
              color={medalColor}
            />
          ) : isSecond ? (
            <MaterialCommunityIcons
              name="medal"
              size={19}
              color={medalColor}
            />
          ) : isThird ? (
            <MaterialCommunityIcons
              name="medal-outline"
              size={19}
              color={medalColor}
            />
          ) : (
            <Text style={styles.rankNumber}>
              {index + 1}
            </Text>
          )}
        </View>

        <View
          style={[
            styles.avatarFrame,
            isFirst && styles.firstAvatarFrame,
          ]}
        >
          {item.profilePhoto ? (
            <Image
              source={{ uri: item.profilePhoto }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>
                {item.randomAvatar || "♟️"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.playerInfo}>
          <View style={styles.nameLine}>
            <Text
              numberOfLines={1}
              style={[
                styles.playerName,
                isFirst && styles.firstPlayerName,
              ]}
            >
              {item.name || "Player"}
            </Text>

            {isFirst ? (
              <View style={styles.championTag}>
                <Text style={styles.championTagText}>
                  TOP 1
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.countryRow}>
            <Text style={styles.country}>
              {countryLabel(item.countryCode)}
            </Text>
            {isTopThree ? (
              <Text style={styles.eliteLabel}>
                ELITE PLAYER
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.ratingBox}>
          <Text
            style={[
              styles.rating,
              isFirst && styles.firstRating,
            ]}
          >
            {item.rating ?? 100}
          </Text>

          <View style={styles.ratingLabelRow}>
            <MaterialCommunityIcons
              name="chess-knight"
              size={11}
              color={isFirst ? "#FFC857" : "#6E91C0"}
            />
            <Text style={styles.ratingLabel}>
              RATING
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color="#FFFFFF"
          />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>
            Leaderboard
          </Text>
          <Text style={styles.headerSubtitle}>
            The chess arena rankings
          </Text>
        </View>

        <Pressable
          onPress={() => void load()}
          accessibilityRole="button"
          accessibilityLabel="Refresh rankings"
          style={styles.refreshButton}
        >
          <Ionicons
            name="refresh"
            size={19}
            color="#31D6FF"
          />
        </Pressable>
      </View>

      {/* LEADERBOARD HERO */}
      <View style={styles.heroWrapper}>
        <LinearGradient
          colors={["#172B4C", "#171A3A", "#302044"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroText}>
            <Text style={styles.heroEyebrow}>
              JAY TECH CHESS
            </Text>

            <Text style={styles.heroTitle}>
              Rise to the{"\n"}
              <Text style={styles.heroGold}>
                top.
              </Text>
            </Text>

            <Text style={styles.heroSubtitle}>
              Every move takes you closer.
            </Text>
          </View>

          <View style={styles.trophyArtwork}>
            <LinearGradient
              colors={[
                "rgba(255,202,92,0.24)",
                "rgba(255,151,51,0.06)",
              ]}
              style={styles.trophyGlow}
            >
              <MaterialCommunityIcons
                name="trophy-award"
                size={57}
                color="#FFD16A"
              />
            </LinearGradient>
          </View>

          <View style={styles.heroFooter}>
            <View style={styles.heroFooterItem}>
              <Ionicons
                name="people"
                size={16}
                color="#32D6FF"
              />
              <Text style={styles.heroFooterText}>
                REGISTERED PLAYERS
              </Text>
            </View>

            <View style={styles.heroLiveBadge}>
              <View style={styles.heroLiveDot} />
              <Text style={styles.heroLiveText}>
                {scope === "world" ? "WORLDWIDE" : "INDIA"}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* REGION FILTER */}
      <View style={styles.filterHeader}>
        <View>
          <Text style={styles.filterEyebrow}>
            COMPETE WITH THE BEST
          </Text>
          <Text style={styles.filterTitle}>
            Rankings
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <Pressable
          onPress={() => setScope("world")}
          accessibilityRole="button"
          accessibilityState={{ selected: scope === "world" }}
          style={styles.tabPressable}
        >
          <LinearGradient
            colors={
              scope === "world"
                ? ["#18CFFF", "#2876FF"]
                : ["#111D35", "#111D35"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.tab,
              scope === "world" && styles.activeTab,
            ]}
          >
            <Ionicons
              name="globe-outline"
              size={17}
              color={scope === "world" ? "#FFFFFF" : "#8EA6CC"}
            />
            <Text
              style={[
                styles.tabText,
                scope === "world" && styles.activeTabText,
              ]}
            >
              Worldwide
            </Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => setScope("india")}
          accessibilityRole="button"
          accessibilityState={{ selected: scope === "india" }}
          style={styles.tabPressable}
        >
          <LinearGradient
            colors={
              scope === "india"
                ? ["#18CFFF", "#2876FF"]
                : ["#111D35", "#111D35"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.tab,
              scope === "india" && styles.activeTab,
            ]}
          >
            <Text style={styles.indiaFlag}>🇮🇳</Text>
            <Text
              style={[
                styles.tabText,
                scope === "india" && styles.activeTabText,
              ]}
            >
              India
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* PLAYER LIST */}
      {loading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator
            size="large"
            color="#29D6FF"
          />
          <Text style={styles.stateTitle}>
            Loading rankings
          </Text>
          <Text style={styles.stateSubtitle}>
            Fetching registered chess players...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <View style={styles.stateIcon}>
            <Ionicons
              name="cloud-offline-outline"
              size={31}
              color="#FF8CA4"
            />
          </View>
          <Text style={styles.stateTitle}>
            Couldn't load rankings
          </Text>
          <Text style={styles.errorText}>
            {error}
          </Text>
          <Pressable
            onPress={() => void load()}
            style={styles.retryButton}
          >
            <Ionicons
              name="refresh"
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.retryText}>
              Try again
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={(item, index) =>
            String(item.id || `${item.name}-${index}`)
          }
          renderItem={renderPlayer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.listHeadingLeft}>
                <MaterialCommunityIcons
                  name="format-list-numbered"
                  size={19}
                  color="#35D5FF"
                />
                <Text style={styles.listTitle}>
                  Player standings
                </Text>
              </View>

              <Text style={styles.listCount}>
                {players.length} PLAYERS
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons
                name="chess-king"
                size={42}
                color="#7794C1"
              />
              <Text style={styles.emptyTitle}>
                No players yet
              </Text>
              <Text style={styles.emptyText}>
                Registered players will appear here when rankings are available.
              </Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color="#6D8EBB"
              />
              <Text style={styles.footerText}>
                Rankings based on registered player ratings
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#070E20",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 17,
    paddingTop: 12,
    paddingBottom: 13,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: "#152642",
    borderWidth: 1,
    borderColor: "#29476D",
    alignItems: "center",
    justifyContent: "center",
  },

  headerCopy: {
    flex: 1,
  },

  headerTitle: {
    color: "#F5F8FF",
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    color: "#8EA7CD",
    fontSize: 10,
    marginTop: 4,
  },

  refreshButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: "#112640",
    borderWidth: 1,
    borderColor: "#23527B",
    alignItems: "center",
    justifyContent: "center",
  },

  heroWrapper: {
    paddingHorizontal: 15,
    marginBottom: 22,
  },

  hero: {
    minHeight: 193,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,195,86,0.35)",
    padding: 18,
    overflow: "hidden",
  },

  heroText: {
    maxWidth: "72%",
    zIndex: 1,
  },

  heroEyebrow: {
    color: "#FFD06A",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 9,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
  },

  heroGold: {
    color: "#FFD16A",
  },

  heroSubtitle: {
    color: "#B5C8E8",
    fontSize: 10,
    marginTop: 9,
  },

  trophyArtwork: {
    position: "absolute",
    right: 15,
    top: 22,
  },

  trophyGlow: {
    width: 88,
    height: 88,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "rgba(255,202,92,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroFooter: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(154,174,220,0.19)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heroFooterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  heroFooterText: {
    color: "#A8BFDF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  heroLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(30,45,75,0.8)",
    borderWidth: 1,
    borderColor: "rgba(137,160,209,0.25)",
  },

  heroLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2BDCB0",
  },

  heroLiveText: {
    color: "#E5EDFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  filterHeader: {
    paddingHorizontal: 17,
    marginBottom: 12,
  },

  filterEyebrow: {
    color: "#819BC2",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  filterTitle: {
    color: "#F5F8FF",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 4,
  },

  tabs: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 5,
    borderRadius: 17,
    backgroundColor: "#0D172C",
    borderWidth: 1,
    borderColor: "#213858",
    gap: 6,
  },

  tabPressable: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },

  tab: {
    minHeight: 43,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 8,
  },

  activeTab: {
    borderWidth: 1,
    borderColor: "rgba(116,213,255,0.45)",
  },

  tabText: {
    color: "#8EA6CC",
    fontSize: 12,
    fontWeight: "800",
  },

  activeTabText: {
    color: "#FFFFFF",
  },

  indiaFlag: {
    fontSize: 15,
  },

  list: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 2,
  },

  listHeadingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  listTitle: {
    color: "#EAF2FF",
    fontSize: 14,
    fontWeight: "900",
  },

  listCount: {
    color: "#829CC3",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  playerCard: {
    position: "relative",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    marginBottom: 10,
    borderRadius: 19,
    backgroundColor: "#101B32",
    borderWidth: 1,
    borderColor: "#263D61",
  },

  firstPlayerCard: {
    borderColor: "rgba(255,200,87,0.55)",
    backgroundColor: "#191E32",
  },

  rankBox: {
    width: 34,
    height: 37,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  normalRankBox: {
    backgroundColor: "#182944",
    borderColor: "#2A4265",
  },

  rankNumber: {
    color: "#A6B9D7",
    fontSize: 13,
    fontWeight: "900",
  },

  avatarFrame: {
    width: 47,
    height: 47,
    borderRadius: 17,
    padding: 1.5,
    backgroundColor: "#314D76",
  },

  firstAvatarFrame: {
    backgroundColor: "#FFC857",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 15.5,
    backgroundColor: "#17243B",
  },

  avatarFallback: {
    flex: 1,
    borderRadius: 15.5,
    backgroundColor: "#17243B",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 24,
  },

  playerInfo: {
    flex: 1,
    minWidth: 0,
  },

  nameLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
  },

  playerName: {
    color: "#EAF2FF",
    fontSize: 13,
    fontWeight: "900",
    flexShrink: 1,
  },

  firstPlayerName: {
    color: "#FFE3A1",
  },

  championTag: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: "rgba(255,200,87,0.17)",
    borderWidth: 1,
    borderColor: "rgba(255,200,87,0.38)",
  },

  championTagText: {
    color: "#FFD16A",
    fontSize: 7,
    fontWeight: "900",
  },

  countryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },

  country: {
    color: "#8EA7CD",
    fontSize: 10,
    fontWeight: "600",
  },

  eliteLabel: {
    color: "#B49AFF",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  ratingBox: {
    alignItems: "flex-end",
    minWidth: 57,
  },

  rating: {
    color: "#D8E7FF",
    fontSize: 20,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },

  firstRating: {
    color: "#FFD16A",
  },

  ratingLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },

  ratingLabel: {
    color: "#8098BC",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingBottom: 40,
  },

  stateTitle: {
    color: "#F1F6FF",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 15,
    textAlign: "center",
  },

  stateSubtitle: {
    color: "#8EA7CD",
    fontSize: 11,
    marginTop: 7,
    textAlign: "center",
  },

  stateIcon: {
    width: 62,
    height: 62,
    borderRadius: 21,
    backgroundColor: "#17233D",
    borderWidth: 1,
    borderColor: "#34496D",
    alignItems: "center",
    justifyContent: "center",
  },

  errorText: {
    color: "#FF9BAC",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
    marginTop: 8,
  },

  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 17,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#176FC2",
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  emptyCard: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderRadius: 19,
    backgroundColor: "#101B32",
    borderWidth: 1,
    borderColor: "#263D61",
  },

  emptyTitle: {
    color: "#EAF2FF",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 12,
  },

  emptyText: {
    color: "#8EA7CD",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 6,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 18,
  },

  footerText: {
    color: "#6D8EBB",
    fontSize: 9,
    fontWeight: "600",
  },
});
