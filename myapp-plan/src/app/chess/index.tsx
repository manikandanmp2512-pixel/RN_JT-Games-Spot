import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type {
  BoardImageTheme,
  ChessPieceSet,
} from "@/components/chess/ChessBoard";
import {
  CHESS_BOARD_THEME_STORAGE_KEY,
  CHESS_PIECE_SET_STORAGE_KEY,
} from "@/components/chess/ChessBoard";
import ChessHeader from "@/components/chess/ChessHeader";
import ChessThemeSettings from "@/components/chess/ChessThemeSettings";
import GameModeCard from "@/components/chess/GameModeCard";
import MoreWayItem from "@/components/chess/MoreWayItem";
import { showError } from "@/components/JayToast";
import { getFriendRequests, getFriends } from "@/services/chessApi";
import {
  connectChessSocket,
  disconnectChessSocket,
  respondFriendRequest,
} from "@/services/chessSocket";
import type { Difficulty, GameMode, GameModeId } from "@/types/chess";
import { Ionicons } from "@expo/vector-icons";
const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.31.214:5000"
).replace(/\/+$/, "");

const BOARD_THEMES: BoardImageTheme[] = [
  "images_1",
  "images_2",
  "images_3",
  "images_4",
  "images_5",
  "images_6",
  "images_7",
  "images_8",
  "images_9",
  "images_10",
];

const MODES: GameMode[] = [
  {
    id: "rapid",
    title: "Rapid",
    icon: "⏱️",
    time: "10 min",
    baseMs: 600000,
    incrementMs: 0,
  },
  {
    id: "chill",
    title: "Chill",
    icon: "☕",
    time: "60 seconds/move",
    baseMs: 0,
    incrementMs: 0,
    perMoveMs: 60000,
  },
  {
    id: "blitz5",
    title: "Blitz",
    icon: "⚡",
    time: "5 min",
    increment: "+3 seconds/move",
    baseMs: 300000,
    incrementMs: 3000,
  },
  {
    id: "tempo",
    title: "Tempo",
    icon: "🎯",
    time: "20 seconds/move",
    baseMs: 0,
    incrementMs: 0,
    perMoveMs: 20000,
  },
  {
    id: "blitz3",
    title: "Blitz",
    icon: "🔥",
    time: "3 min",
    baseMs: 180000,
    incrementMs: 0,
  },
  {
    id: "bullet",
    title: "Bullet",
    icon: "🚀",
    time: "2 min",
    increment: "+1 second/move",
    baseMs: 120000,
    incrementMs: 1000,
  },
];

type Tab = "play" | "friends" | "rankings" | "profile";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "play", label: "Play", icon: "game-controller" },
  { id: "friends", label: "Friends", icon: "people" },
  { id: "rankings", label: "Rankings", icon: "trophy" },
  { id: "profile", label: "Profile", icon: "person-circle" },
];

type StoredUser = {
  rating?: number | string;
  chessRating?: number | string;
  user?: {
    rating?: number | string;
    chessRating?: number | string;
  };
};

type RankedPlayer = {
  id: string;
  name: string;
  rating: number;
  countryCode?: string | null;
  randomAvatar?: string | null;
  profilePhoto?: string | null;
};

type FriendItem = {
  _id?: string;
  id?: string;
  userId?: string;
  name?: string;
  fname?: string;
  lname?: string;
  firstName?: string;
  lastName?: string;
  rating?: number;
  randomAvatar?: string;
  profilePhoto?: string;
  countryCode?: string;
  from?: any;
  requestId?: string;
};

const C = {
  background: "#080D1B",
  panel: "#111A2D",
  panelAlt: "#17223A",
  border: "#263654",
  text: "#F5F7FF",
  muted: "#9AA8C4",
  cyan: "#50E5FF",
  blue: "#526CFF",
  purple: "#A47BFF",
  gold: "#FFBF5E",
  green: "#49E5A5",
  red: "#FF6B83",
};

function getRatingFromUser(value: string | null): number {
  if (!value) return 100;

  try {
    const user = JSON.parse(value) as StoredUser;
    const rating = Number(
      user.chessRating ??
        user.rating ??
        user.user?.chessRating ??
        user.user?.rating ??
        100
    );

    return Number.isFinite(rating) && rating >= 0 ? rating : 100;
  } catch {
    return 100;
  }
}

function getName(item: FriendItem): string {
  if (item.name) return item.name;

  const first = item.fname || item.firstName || "";
  const last = item.lname || item.lastName || "";
  return `${first} ${last}`.trim() || "Chess Player";
}

function getId(item: FriendItem): string {
  const raw = item.id || item._id || item.userId;
  return raw ? String(raw) : "";
}

function getRequestId(item: FriendItem): string {
  const raw = item.requestId || item._id || item.id;
  return raw ? String(raw) : "";
}

function isIndia(code?: string | null): boolean {
  const value = String(code || "")
    .trim()
    .toUpperCase();
  return ["+91", "91", "IN", "IND", "INDIA"].includes(value);
}

export default function ChessHome() {
  const [activeTab, setActiveTab] = useState<Tab>("play");

  const [selectedMode, setSelectedMode] = useState<GameModeId>("rapid");
  const [onlineCount, setOnlineCount] = useState(0);

  const [boardTheme, setBoardTheme] = useState<BoardImageTheme>("images_1");
  const [pieceSet, setPieceSet] = useState<ChessPieceSet>("set_1");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [currentRating, setCurrentRating] = useState(100);

  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [requests, setRequests] = useState<FriendItem[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsRefreshing, setFriendsRefreshing] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  const [rankingScope, setRankingScope] = useState<"world" | "india">("world");
  const [players, setPlayers] = useState<RankedPlayer[]>([]);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [rankingsRefreshing, setRankingsRefreshing] = useState(false);
  const [rankingsError, setRankingsError] = useState("");

  const selected = useMemo(
    () => MODES.find((mode) => mode.id === selectedMode)!,
    [selectedMode]
  );

  const handlePieceSetChange = async (nextSet: ChessPieceSet) => {
    setPieceSet(nextSet);

    try {
      await AsyncStorage.setItem(CHESS_PIECE_SET_STORAGE_KEY, nextSet);
    } catch (error) {
      console.warn("Could not save chess piece style:", error);
    }
  };

  const handleThemeChange = async (nextTheme: BoardImageTheme) => {
    setBoardTheme(nextTheme);

    try {
      await AsyncStorage.setItem(CHESS_BOARD_THEME_STORAGE_KEY, nextTheme);
    } catch (error) {
      console.warn("Could not save selected chess board image:", error);
    }
  };

  useEffect(() => {
    let active = true;

    const loadPreferences = async () => {
      try {
        const [savedTheme, savedUser, savedRating, savedPieceSet] =
          await Promise.all([
            AsyncStorage.getItem(CHESS_BOARD_THEME_STORAGE_KEY),
            AsyncStorage.getItem("user"),
            AsyncStorage.getItem("@jaytech/chess-rating-v1"),
            AsyncStorage.getItem(CHESS_PIECE_SET_STORAGE_KEY),
          ]);

        if (!active) return;

        if (
          savedTheme &&
          BOARD_THEMES.includes(savedTheme as BoardImageTheme)
        ) {
          setBoardTheme(savedTheme as BoardImageTheme);
        }

        if (
          savedPieceSet &&
          ["set_1", "set_2", "set_3", "set_4"].includes(savedPieceSet)
        ) {
          setPieceSet(savedPieceSet as ChessPieceSet);
        }

        const storedRating = Number(savedRating);

        setCurrentRating(
          savedRating !== null && Number.isFinite(storedRating)
            ? storedRating
            : getRatingFromUser(savedUser)
        );
      } catch (error) {
        console.warn("Could not load chess preferences:", error);
      }
    };

    void loadPreferences();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let connectedSocket: Awaited<ReturnType<typeof connectChessSocket>> | null =
      null;

    const setup = async () => {
      try {
        const socket = await connectChessSocket();

        if (!active) return;
        connectedSocket = socket;

        const updatePresence = (data: { count?: number }) => {
          if (active) setOnlineCount(Number(data?.count || 0));
        };

        socket.on("chess:presence", updatePresence);
        socket.emit("chess:requestPresence");
      } catch (error: unknown) {
        if (!active) return;

        const message =
          error instanceof Error
            ? error.message
            : "Unable to connect to the chess server.";

        console.error("Chess connection failed:", message);

        if (
          /token expired|invalid token|authentication token not found|authentication token missing/i.test(
            message
          )
        ) {
          showError(
            "Session Expired",
            "Please log in again to continue playing chess."
          );
          router.replace("/login");
        } else {
          showError(
            "Connection Failed",
            "Unable to connect to the chess server. Check your connection and try again."
          );
        }
      }
    };

    void setup();

    return () => {
      active = false;
      connectedSocket?.off("chess:presence");
      disconnectChessSocket();
    };
  }, []);

  const loadFriends = useCallback(async (refresh = false) => {
    if (refresh) setFriendsRefreshing(true);
    else setFriendsLoading(true);

    try {
      const [friendsResponse, requestsResponse] = await Promise.all([
        getFriends(),
        getFriendRequests(),
      ]);

      setFriends(
        Array.isArray(friendsResponse?.friends) ? friendsResponse.friends : []
      );
      setRequests(
        Array.isArray(requestsResponse?.requests)
          ? requestsResponse.requests
          : []
      );
    } catch (error: any) {
      console.error("Friends loading error:", error);
      Alert.alert(
        "Friends",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load friends. Please try again."
      );
    } finally {
      setFriendsLoading(false);
      setFriendsRefreshing(false);
    }
  }, []);

  const loadRankings = useCallback(
    async (refresh = false) => {
      if (refresh) setRankingsRefreshing(true);
      else setRankingsLoading(true);

      setRankingsError("");

      try {
        const response = await fetch(
          `${API_BASE}/api/chess-rankings?scope=${rankingScope}`
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Unable to load rankings (HTTP ${response.status}).`
          );
        }

        if (data?.success === false) {
          throw new Error(data.message || "Unable to load rankings.");
        }

        setPlayers(Array.isArray(data?.players) ? data.players : []);
      } catch (error: any) {
        console.error("Rankings loading error:", error);

        setRankingsError(
          error?.message ||
            "Unable to load rankings. Check your backend connection."
        );
        setPlayers([]);
      } finally {
        setRankingsLoading(false);
        setRankingsRefreshing(false);
      }
    },
    [rankingScope]
  );

  useEffect(() => {
    if (activeTab === "friends") {
      void loadFriends();
    }
  }, [activeTab, loadFriends]);

  useEffect(() => {
    if (activeTab === "rankings") {
      void loadRankings();
    }
  }, [activeTab, loadRankings]);

  const handleRespond = async (request: FriendItem, accept: boolean) => {
    const requestId = getRequestId(request);

    if (!requestId) {
      Alert.alert(
        "Friend request",
        "This request has no ID. Refresh the list and try again."
      );
      return;
    }

    if (busyRequestId) return;

    setBusyRequestId(requestId);

    try {
      const result = await respondFriendRequest(requestId, accept);

      if (!result || result.success !== true) {
        throw new Error(
          result?.message || "The server did not confirm the request."
        );
      }

      await loadFriends(true);

      Alert.alert(
        accept ? "Request accepted" : "Request declined",
        result.message ||
          (accept
            ? "The friend request was accepted."
            : "The friend request was declined.")
      );
    } catch (error: any) {
      Alert.alert(
        "Friend request",
        error?.message || "Unable to update the friend request."
      );
    } finally {
      setBusyRequestId(null);
    }
  };

  const openCpu = () => {
    router.push({
      pathname: "/chess/cpu",
      params: {
        mode: selectedMode,
        theme: boardTheme,
        difficulty,
      },
    });
  };

  const openOnline = () => {
    router.push({
      pathname: "/chess/online",
      params: {
        mode: selectedMode,
        theme: boardTheme,
      },
    });
  };

  const goToProfile = () => {
    router.push("/user");
  };

  const renderBottomNav = () => {
    const tabs = [
      { id: "play" as const, icon: "🎮", label: "Play" },
      { id: "friends" as const, icon: "🤝", label: "Friends" },
      { id: "rankings" as const, icon: "🏅", label: "Rankings" },
    ];

    return (
      <View style={styles.bottomNav}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;

          return (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setActiveTab(tab.id)}
              style={styles.navItem}
            >
              <View
                style={[styles.navIconBox, active && styles.navIconBoxActive]}
              >
                <Text style={[styles.navIcon, active && styles.navIconActive]}>
                  {tab.icon}
                </Text>
              </View>

              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          accessibilityRole="button"
          onPress={goToProfile}
          style={styles.navItem}
        >
          <View style={styles.navIconBox}>
            <Text style={styles.navIcon}><Ionicons name="person-circle-outline" size={26} /></Text>
          </View>
          <Text style={styles.navLabel}>Profile</Text>
        </Pressable>
      </View>
    );
  };

  const renderPageHeading = (
    eyebrow: string,
    title: string,
    subtitle: string
  ) => (
    <View style={styles.pageHeading}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.pageTitle}>{title}</Text>
      <Text style={styles.pageSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderPlay = () => (
    <>
      <View style={styles.onlinePill}>
        <Text style={styles.onlinePillIcon}>●</Text>
        <Text style={styles.onlinePillText}>{onlineCount} online</Text>
      </View>
      {/* <View style={styles.heroCard}>
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />

        <View style={styles.heroTopRow}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE CHESS ARENA</Text>
          </View>
        </View>

        <Text style={styles.heroSmallTitle}>YOUR NEXT MOVE</Text>
        <Text style={styles.heroTitle}>Think sharp.{"\n"}Play bold.</Text>
        <Text style={styles.heroSubtitle}>
          Challenge opponents, improve your rating, and make every move count.
        </Text>

        <View style={styles.heroFooter}>
          <View>
            <Text style={styles.heroRatingCaption}>YOUR RATING</Text>
            <Text style={styles.heroRating}>{currentRating}</Text>
          </View>

          <View style={styles.heroChessMark}>
            <Text style={styles.heroChessPiece}>♞</Text>
          </View>
        </View>
      </View> */}

      {/* <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Choose your match</Text>
          <Text style={styles.sectionSubtitle}>
            Play against someone at the same time control
          </Text>
        </View>
        <Text style={styles.sectionAccent}>01 / PLAY</Text>
      </View> */}

      <View style={styles.modePanel}>
        <View style={styles.modeGrid}>
          {MODES.map((mode) => (
            <GameModeCard
              key={mode.id}
              mode={mode}
              selected={selectedMode === mode.id}
              onPress={() => setSelectedMode(mode.id)}
            />
          ))}
        </View>

        <View style={styles.selectedModeBar}>
          <View style={styles.selectedModeIndicator} />
          <Text style={styles.selectedModeText}>
            {selected.title} · {selected.time}
            {selected.increment ? ` · ${selected.increment}` : ""}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={openOnline}
          activeOpacity={0.85}
        >
          <View style={styles.primaryButtonIcon}>
            <Text style={styles.primaryKnight}>♞</Text>
          </View>

          <View style={styles.primaryButtonCopy}>
            <Text style={styles.primaryButtonTitle}>Find an opponent</Text>
            <Text style={styles.primaryButtonSubtitle}>
              Start a live online match
            </Text>
          </View>

          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Explore more</Text>
          <Text style={styles.sectionSubtitle}>
            Different ways to sharpen your game
          </Text>
        </View>
        <Text style={styles.sectionAccent}>02 / DISCOVER</Text>
      </View>

      <View style={styles.morePanel}>
        <MoreWayItem
          title="Play CPU"
          subtitle="Practise at your own pace"
          icon="🤖"
          color="#526CFF"
          onPress={openCpu}
        />
        <View style={styles.itemDivider} />
        <MoreWayItem
          title="Puzzles"
          subtitle="Find the best move"
          icon="🧩"
          color="#A47BFF"
          onPress={() =>
            Alert.alert("Puzzles", "Puzzle mode is not connected yet.")
          }
        />
        <View style={styles.itemDivider} />
        <MoreWayItem
          title="Watch"
          subtitle="Follow top players"
          icon="👁️"
          color="#50C9FF"
          onPress={() =>
            Alert.alert("Watch", "Watch mode is not connected yet.")
          }
        />
        <View style={styles.itemDivider} />
        <MoreWayItem
          title="Missions"
          subtitle="Discover upcoming challenges"
          icon="💎"
          color="#FFBF5E"
          onPress={() =>
            Alert.alert("Missions", "Missions are not connected yet.")
          }
        />
      </View>
    </>
  );

  const renderFriendRow = (item: FriendItem, isRequest = false) => {
    const id = isRequest ? getRequestId(item) : getId(item);
    const name = isRequest
      ? item.from?.name || getName(item.from || item)
      : getName(item);

    const avatar =
      item.profilePhoto ||
      item.from?.profilePhoto ||
      item.randomAvatar ||
      item.from?.randomAvatar;

    return (
      <View key={id || name} style={styles.personCard}>
        <View style={styles.personAvatar}>
          {typeof avatar === "string" && /^https?:\/\//i.test(avatar) ? (
            <Image source={{ uri: avatar }} style={styles.personAvatarImage} />
          ) : (
            <Text style={styles.personAvatarEmoji}>{avatar || "🦊"}</Text>
          )}
        </View>

        <View style={styles.personDetails}>
          <Text numberOfLines={1} style={styles.personName}>
            {name}
          </Text>
          <Text style={styles.personMeta}>
            {isRequest
              ? `Rating ${
                  item.from?.rating ?? item.rating ?? 100
                } · Pending request`
              : `Rating ${item.rating ?? 100} · Friend`}
          </Text>
        </View>

        {isRequest ? (
          <View style={styles.requestActions}>
            <Pressable
              disabled={busyRequestId === id}
              onPress={() => void handleRespond(item, true)}
              style={[
                styles.acceptButton,
                busyRequestId === id && styles.disabledButton,
              ]}
            >
              <Text style={styles.acceptButtonText}>
                {busyRequestId === id ? "…" : "✓"}
              </Text>
            </Pressable>

            <Pressable
              disabled={busyRequestId === id}
              onPress={() => void handleRespond(item, false)}
              style={styles.rejectButton}
            >
              <Text style={styles.rejectButtonText}>×</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.friendBadge}>
            <Text style={styles.friendBadgeText}>FRIEND</Text>
          </View>
        )}
      </View>
    );
  };

  const renderFriends = () => (
    <>
      {renderPageHeading(
        "YOUR COMMUNITY",
        "Friends",
        "Keep your chess circle close and your next challenge closer."
      )}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>👥   <Text style={styles.statValue}>{friends.length}</Text></Text>
          <Text style={styles.statCaption}>FRIENDS</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>♙+   <Text style={styles.statValue}>{requests.length}</Text></Text>
          <Text style={styles.statCaption}>REQUESTS</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Friend requests</Text>
          <Text style={styles.sectionSubtitle}>
            Accept or decline incoming requests
          </Text>
        </View>

        <Pressable
          onPress={() => void loadFriends(true)}
          style={styles.smallRefresh}
        >
          <Text style={styles.smallRefreshText}>↻ Refresh</Text>
        </Pressable>
      </View>

      {friendsLoading && !friendsRefreshing ? (
        <ActivityIndicator color={C.cyan} size="large" style={styles.loader} />
      ) : requests.length ? (
        <View style={styles.listPanel}>
          {requests.map((item) => renderFriendRow(item, true))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🤝</Text>
          <Text style={styles.emptyTitle}>All caught up</Text>
          <Text style={styles.emptyText}>
            New friend requests will appear here.
          </Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Your friends</Text>
          <Text style={styles.sectionSubtitle}>
            Players connected to your account
          </Text>
        </View>
      </View>

      {friends.length ? (
        <View style={styles.listPanel}>
          {friends.map((item) => renderFriendRow(item))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>♟</Text>
          <Text style={styles.emptyTitle}>Your circle starts here</Text>
          <Text style={styles.emptyText}>
            When a friend request is accepted, your friends will appear here.
          </Text>
        </View>
      )}
    </>
  );

  const renderRankedPlayer = (player: RankedPlayer, index: number) => {
    const avatar = player.profilePhoto || player.randomAvatar;

    return (
      <View key={player.id || `${player.name}-${index}`} style={styles.rankRow}>
        <View
          style={[
            styles.rankNumber,
            index === 0 && styles.rankFirst,
            index === 1 && styles.rankSecond,
            index === 2 && styles.rankThird,
          ]}
        >
          <Text
            style={[
              styles.rankNumberText,
              index < 3 && styles.rankNumberTextTop,
            ]}
          >
            {String(index + 1).padStart(2, "0")}
          </Text>
        </View>

        <View style={styles.rankAvatar}>
          {typeof avatar === "string" && /^https?:\/\//i.test(avatar) ? (
            <Image source={{ uri: avatar }} style={styles.rankAvatarImage} />
          ) : (
            <Text style={styles.rankAvatarEmoji}>{avatar || "♟️"}</Text>
          )}
        </View>

        <View style={styles.rankPlayerDetails}>
          <Text numberOfLines={1} style={styles.rankPlayerName}>
            {player.name || "Chess Player"}
          </Text>
          <Text style={styles.rankPlayerCountry}>
            {isIndia(player.countryCode) ? "🇮🇳 India" : "Global player"}
          </Text>
        </View>

        <View style={styles.ratingChip}>
          <Text style={styles.ratingChipValue}>
            {Number(player.rating ?? 100)}
          </Text>
          <Text style={styles.ratingChipLabel}>POINTS</Text>
        </View>
      </View>
    );
  };

  const renderRankings = () => (
    <>
      {renderPageHeading(
        "THE LEADERBOARD",
        "Rankings",
        "See how registered players rank by their chess rating."
      )}

      <View style={styles.leaderboardHero}>
        <View style={styles.leaderboardIcon}>
          <Text style={styles.leaderboardTrophy}>🏆</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.leaderboardEyebrow}>CLIMB THE LADDER</Text>
          <Text style={styles.leaderboardTitle}>Every move counts.</Text>
          <Text style={styles.leaderboardSubtitle}>
            Higher rating means a higher position.
          </Text>
        </View>
      </View>

      <View style={styles.scopeSwitcher}>
        <Pressable
          onPress={() => setRankingScope("world")}
          style={[
            styles.scopeButton,
            rankingScope === "world" && styles.scopeButtonActive,
          ]}
        >
          <Text
            style={[
              styles.scopeButtonText,
              rankingScope === "world" && styles.scopeButtonTextActive,
            ]}
          >
            🌍 Worldwide
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setRankingScope("india")}
          style={[
            styles.scopeButton,
            rankingScope === "india" && styles.scopeButtonActive,
          ]}
        >
          <Text
            style={[
              styles.scopeButtonText,
              rankingScope === "india" && styles.scopeButtonTextActive,
            ]}
          >
            🇮🇳 India
          </Text>
        </Pressable>
      </View>

      <View style={styles.leaderboardHeader}>
        <Text style={styles.leaderboardSectionTitle}>
          {rankingScope === "india" ? "India leaderboard" : "World leaderboard"}
        </Text>

        <Pressable
          onPress={() => void loadRankings(true)}
          style={styles.smallRefresh}
        >
          <Text style={styles.smallRefreshText}>↻ Refresh</Text>
        </Pressable>
      </View>

      {rankingsLoading && !rankingsRefreshing ? (
        <ActivityIndicator color={C.cyan} size="large" style={styles.loader} />
      ) : rankingsError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.emptyTitle}>Rankings unavailable</Text>
          <Text style={styles.errorText}>{rankingsError}</Text>
          <Pressable
            onPress={() => void loadRankings(true)}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : players.length ? (
        <View style={styles.rankingPanel}>
          {players.map((player, index) => renderRankedPlayer(player, index))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={styles.emptyTitle}>No players to display</Text>
          <Text style={styles.emptyText}>
            Registered players will appear when the rankings API returns them.
          </Text>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.background} />

      <View style={styles.container}>
        <View style={styles.topHeader}>
          <ChessHeader rating={currentRating} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chess settings"
            style={styles.settingsButton}
            onPress={() => setSettingsVisible(true)}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>

        <ScrollView
          key={activeTab}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            activeTab === "friends" ? (
              <RefreshControl
                refreshing={friendsRefreshing}
                onRefresh={() => void loadFriends(true)}
                tintColor={C.cyan}
              />
            ) : activeTab === "rankings" ? (
              <RefreshControl
                refreshing={rankingsRefreshing}
                onRefresh={() => void loadRankings(true)}
                tintColor={C.cyan}
              />
            ) : undefined
          }
        >
          {activeTab === "play" && renderPlay()}
          {activeTab === "friends" && renderFriends()}
          {activeTab === "rankings" && renderRankings()}

          <View style={{ height: 22 }} />
        </ScrollView>

        {renderBottomNav()}

        <ChessThemeSettings
          visible={settingsVisible}
          theme={boardTheme}
          onThemeChange={handleThemeChange}
          pieceSet={pieceSet}
          onPieceSetChange={handlePieceSetChange}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          showDifficulty
          onClose={() => setSettingsVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.background,
  },
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  topHeader: {
    position: "relative",
    backgroundColor: C.background,
    borderBottomWidth: 1,
    borderBottomColor: "#566CC2",
  },
  settingsButton: {
    position: "absolute",
    right: 15,
    top: 17,
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: C.panelAlt,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  settingsIcon: {
    fontSize: 23,
    color: C.cyan,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 22,
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#111D39",
    borderWidth: 1,
    borderColor: "#344A83",
    borderRadius: 27,
    padding: 20,
    marginBottom: 25,
  },
  heroGlowOne: {
    position: "absolute",
    right: -60,
    top: -80,
    width: 190,
    height: 190,
    borderRadius: 100,
    backgroundColor: "#283E88",
    opacity: 0.4,
  },
  heroGlowTwo: {
    position: "absolute",
    right: 40,
    bottom: -115,
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: "#5B35A2",
    opacity: 0.22,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 9,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#1B3151",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.green,
  },
  liveText: {
    color: C.cyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  onlinePill: {
    flexDirection: "row",
    maxWidth: 80,
    marginLeft: 280,
    marginTop: -20,
    gap: 6,
    backgroundColor: "#1A2B3F",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  onlinePillIcon: {
    color: C.green,
    fontSize: 9,
  },
  onlinePillText: {
    color: "#DCE7FF",
    fontSize: 10,
    fontWeight: "800",
  },
  heroSmallTitle: {
    color: C.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 27,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 35,
    lineHeight: 39,
    fontWeight: "900",
    marginTop: 8,
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    color: "#B3C0DE",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
    maxWidth: 290,
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#304064",
    marginTop: 21,
    paddingTop: 15,
  },
  heroRatingCaption: {
    color: C.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  heroRating: {
    color: C.gold,
    fontSize: 29,
    fontWeight: "900",
    marginTop: 2,
  },
  heroChessMark: {
    width: 57,
    height: 57,
    borderRadius: 19,
    backgroundColor: "#243969",
    borderWidth: 1,
    borderColor: "#566CC2",
    alignItems: "center",
    justifyContent: "center",
  },
  heroChessPiece: {
    color: "#FFFFFF",
    fontSize: 36,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 13,
    marginTop: 4,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
    lineHeight: 15,
    flexShrink: 1,
  },
  sectionAccent: {
    color: C.purple,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  modePanel: {
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 23,
    padding: 13,
    marginBottom: 25,
    marginTop: 10,
  },
  modeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 6,
  },
  selectedModeBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  selectedModeIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.cyan,
  },
  selectedModeText: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: "800",
    flexShrink: 1,
  },
  primaryButton: {
    minHeight: 77,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.blue,
    borderRadius: 19,
    padding: 12,
    gap: 11,
  },
  primaryButtonIcon: {
    // marginLeft: 220,
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: "#051268",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryKnight: {
    color: "#FFFFFF",
    fontSize: 32,
  },
  primaryButtonCopy: {
    flex: 1,
  },
  primaryButtonTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  primaryButtonSubtitle: {
    color: "#DCE2FF",
    fontSize: 10,
    marginTop: 4,
  },
  buttonArrow: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "700",
    paddingHorizontal: 5,
  },
  morePanel: {
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingVertical: 3,
  },
  itemDivider: {
    height: 1,
    backgroundColor: "#24304A",
    marginLeft: 53,
  },
  pageHeading: {
    marginBottom: 21,
  },
  eyebrow: {
    color: C.cyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 7,
  },
  pageTitle: {
    color: C.text,
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  pageSubtitle: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 26,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    padding: 15,
  },
  statIcon: {
    color: C.purple,
    fontSize: 20,
  },
  statValue: {
    color: C.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 9,
  },
  statCaption: {
    color: C.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 3,
  },
  smallRefresh: {
    backgroundColor: "#192641",
    borderWidth: 1,
    borderColor: "#304365",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  smallRefreshText: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: "800",
  },
  loader: {
    marginVertical: 35,
  },
  listPanel: {
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  personCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#24304A",
  },
  personAvatar: {
    width: 45,
    height: 45,
    borderRadius: 16,
    backgroundColor: "#253353",
    borderWidth: 1,
    borderColor: "#40557D",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  personAvatarImage: {
    width: "100%",
    height: "100%",
  },
  personAvatarEmoji: {
    color: "#FFFFFF",
    fontSize: 24,
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    color: C.text,
    fontSize: 13,
    fontWeight: "800",
  },
  personMeta: {
    color: C.muted,
    fontSize: 10,
    marginTop: 5,
  },
  requestActions: {
    flexDirection: "row",
    gap: 7,
  },
  acceptButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#164C44",
    borderWidth: 1,
    borderColor: "#287D6A",
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButtonText: {
    color: C.green,
    fontSize: 18,
    fontWeight: "900",
  },
  rejectButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#48263A",
    borderWidth: 1,
    borderColor: "#7C3E5A",
    alignItems: "center",
    justifyContent: "center",
  },
  rejectButtonText: {
    color: C.red,
    fontSize: 22,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
  friendBadge: {
    borderRadius: 10,
    backgroundColor: "#163D3A",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  friendBadgeText: {
    color: C.green,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
  },
  emptyIcon: {
    color: C.purple,
    fontSize: 31,
    marginBottom: 9,
  },
  emptyTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyText: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 7,
  },
  leaderboardHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#191B3C",
    borderWidth: 1,
    borderColor: "#48447C",
    borderRadius: 22,
    padding: 17,
    marginBottom: 17,
  },
  leaderboardIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: "#343263",
    alignItems: "center",
    justifyContent: "center",
  },
  leaderboardTrophy: {
    fontSize: 30,
  },
  leaderboardEyebrow: {
    color: C.gold,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  leaderboardTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 5,
  },
  leaderboardSubtitle: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },
  scopeSwitcher: {
    flexDirection: "row",
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 5,
    marginBottom: 22,
  },
  scopeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  scopeButtonActive: {
    backgroundColor: C.blue,
  },
  scopeButtonText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  scopeButtonTextActive: {
    color: "#FFFFFF",
  },
  leaderboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 13,
  },
  leaderboardSectionTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: "900",
    flexShrink: 1,
  },
  rankingPanel: {
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#24304A",
  },
  rankNumber: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#1B2944",
    alignItems: "center",
    justifyContent: "center",
  },
  rankFirst: {
    backgroundColor: "#4A3B22",
  },
  rankSecond: {
    backgroundColor: "#303B50",
  },
  rankThird: {
    backgroundColor: "#49312A",
  },
  rankNumberText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "900",
  },
  rankNumberTextTop: {
    color: C.gold,
  },
  rankAvatar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#263353",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  rankAvatarImage: {
    width: "100%",
    height: "100%",
  },
  rankAvatarEmoji: {
    color: "#FFFFFF",
    fontSize: 23,
  },
  rankPlayerDetails: {
    flex: 1,
  },
  rankPlayerName: {
    color: C.text,
    fontSize: 12,
    fontWeight: "800",
  },
  rankPlayerCountry: {
    color: C.muted,
    fontSize: 10,
    marginTop: 5,
  },
  ratingChip: {
    alignItems: "flex-end",
    backgroundColor: "#1D2943",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  ratingChipValue: {
    color: C.gold,
    fontSize: 14,
    fontWeight: "900",
  },
  ratingChipLabel: {
    color: C.muted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  errorCard: {
    alignItems: "center",
    backgroundColor: "#291C31",
    borderWidth: 1,
    borderColor: "#704052",
    borderRadius: 20,
    padding: 22,
  },
  errorIcon: {
    color: C.red,
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
  },
  errorText: {
    color: "#E8B7C4",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: "#64364E",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 15,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#0D1528",
    borderTopWidth: 1,
    borderTopColor: "#263654",
    paddingTop: 9,
    paddingBottom: 7,
    paddingHorizontal: 4,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  navIconBox: {
    width: 39,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
  },
  navIconBoxActive: {
    backgroundColor: "#26365C",
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#5368BA",
  },
  navIcon: {
    color: "#8391B0",
    fontSize: 21,
  },
  navIconActive: {
    color: C.cyan,
  },
  navLabel: {
    color: "#8391B0",
    fontSize: 9,
    fontWeight: "700",
  },
  navLabelActive: {
    color: C.cyan,
    fontWeight: "900",
  },
});
