import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { router } from "expo-router";

import ChessBottomNav from "@/components/chess/ChessBottomNav";
import ChessHeader from "@/components/chess/ChessHeader";
import ChessThemeSettings from "@/components/chess/ChessThemeSettings";
import GameModeCard from "@/components/chess/GameModeCard";
import MoreWayItem from "@/components/chess/MoreWayItem";
import { showError } from "@/components/JayToast";
import {
  ChessBoardTheme,
  Difficulty,
  GameMode,
  GameModeId,
} from "@/types/chess";

import {
  connectChessSocket,
  disconnectChessSocket,
} from "@/services/chessSocket";

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
    icon: "🥝",
    time: "20 seconds/move",
    baseMs: 0,
    incrementMs: 0,
    perMoveMs: 20000,
  },

  {
    id: "blitz3",
    title: "Blitz",
    icon: "⚡",
    time: "3 min",
    baseMs: 180000,
    incrementMs: 0,
  },

  {
    id: "bullet",
    title: "Bullet",
    icon: "🏉",
    time: "2 min",
    increment: "+1 second/move",
    baseMs: 120000,
    incrementMs: 1000,
  },
];

export default function ChessHome() {
  const [
    selectedMode,
    setSelectedMode,
  ] = useState<GameModeId>("rapid");

  const [
    onlineCount,
    setOnlineCount,
  ] = useState(0);

  const [
    boardTheme,
    setBoardTheme,
  ] = useState<ChessBoardTheme>("wood");

  const [
    difficulty,
    setDifficulty,
  ] = useState<Difficulty>("medium");

  const [
    settingsVisible,
    setSettingsVisible,
  ] = useState(false);

  useEffect(() => {
  let active = true;

  connectChessSocket()
    .then((socket) => {
      if (!active) return;

      const update = (data: { count: number }) => {
        if (active) {
          setOnlineCount(data.count || 0);
        }
      };

      socket.on("chess:presence", update);
      socket.emit("chess:requestPresence");
    })
    .catch((error: unknown) => {
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
          "Unable to connect to the chess server. Please check your connection and try again."
        );
      }
    });

  return () => {
    active = false;
    disconnectChessSocket();
  };
}, []);

  const selected = useMemo(
    () =>
      MODES.find(
        (m) =>
          m.id === selectedMode
      )!,
    [selectedMode]
  );

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
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* <StatusBar
        barStyle="light-content"
        backgroundColor="#071E2B"
      /> */}

      <View style={styles.container}>

        <View style={styles.topHeader}>
          <ChessHeader />

          <Pressable
            style={styles.settingsButton}
            onPress={() =>
              setSettingsVisible(true)
            }
          >
            <Text style={styles.settingsIcon}>
              ⚙️
            </Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.content
          }
        >

          <View style={styles.onlineBox}>

            <View
              style={styles.onlineTitleRow}
            >
              <Text
                style={styles.onlineTitle}
              >
                PLAY ONLINE
              </Text>

              <View style={styles.badge}>
                <View
                  style={styles.dot}
                />

                <Text
                  style={styles.badgeText}
                >
                  {onlineCount} players
                  online
                </Text>
              </View>
            </View>

            <Text style={styles.helper}>
              Choose one time control.
              You will only match with
              the same option.
            </Text>

            <View style={styles.grid}>
              {MODES.map((mode) => (
                <GameModeCard
                  key={mode.id}
                  mode={mode}
                  selected={
                    selectedMode ===
                    mode.id
                  }
                  onPress={() =>
                    setSelectedMode(
                      mode.id
                    )
                  }
                />
              ))}
            </View>

            <Text
              style={styles.selectedText}
            >
              Selected: {selected.title} •{" "}
              {selected.time}
              {selected.increment
                ? ` • ${selected.increment}`
                : ""}
            </Text>

            <TouchableOpacity
              style={styles.playButton}
              onPress={openOnline}
              activeOpacity={0.85}
            >
              <Text style={styles.knight}>
                ♞
              </Text>

              <View>
                <Text
                  style={styles.playTitle}
                >
                  Random Opponent
                </Text>

                <Text
                  style={styles.playSubtitle}
                >
                  Find a player on the
                  same time control
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.moreTitle}>
            MORE WAYS TO PLAY
          </Text>

          <View
            style={styles.moreContainer}
          >
            <MoreWayItem
              title="Play CPU"
              subtitle="Practise & Learn"
              icon="🤖"
              color="#396F88"
              onPress={openCpu}
            />

            <MoreWayItem
              title="Puzzles"
              subtitle="Find the best move"
              icon="🧩"
              color="#E89119"
              onPress={() => {}}
            />

            <MoreWayItem
              title="Watch"
              subtitle="Watch top players live"
              icon="♟️"
              color="#A58AD1"
              onPress={() => {}}
            />

            <MoreWayItem
              title="Highlights"
              subtitle="Community plays"
              icon="🎬"
              color="#40836E"
              onPress={() => {}}
            />

            <MoreWayItem
              title="Missions"
              subtitle="Unlock rewards"
              icon="💎"
              color="#DD4B60"
              onPress={() => {}}
            />
          </View>

          <View style={{ height: 24 }} />

        </ScrollView>

        <ChessBottomNav
          activeTab="play"
        />

        <ChessThemeSettings
          visible={settingsVisible}
          theme={boardTheme}
          onThemeChange={setBoardTheme}
          difficulty={difficulty}
          onDifficultyChange={
            setDifficulty
          }
          showDifficulty
          onClose={() =>
            setSettingsVisible(false)
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    marginTop: 30,
    flex: 1,
    backgroundColor: "#071E2B",
  },

  container: {
    flex: 1,
    backgroundColor: "#214E65",
  },

  topHeader: {
    position: "relative",
  },

  settingsButton: {
    position: "absolute",
    right: 15,
    top: 20,
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#17394B",
    alignItems: "center",
    justifyContent: "center",
  },

  settingsIcon: {
    fontSize: 20,
  },

  content: {
    padding: 16,
    paddingBottom: 20,
  },

  onlineBox: {
    backgroundColor: "#244F65",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#47768A",
    padding: 14,
  },

  onlineTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  onlineTitle: {
    color: "#FF9500",
    fontSize: 21,
    fontWeight: "900",
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#315E6C",
    borderRadius: 18,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#39C978",
    marginRight: 5,
  },

  badgeText: {
    color: "#DDE9ED",
    fontSize: 10,
    fontWeight: "800",
  },

  helper: {
    color: "#AFC5CF",
    fontSize: 11,
    marginBottom: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  selectedText: {
    color: "#FFB13B",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 10,
  },

  playButton: {
    minHeight: 90,
    borderRadius: 18,
    backgroundColor: "#FF9200",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  knight: {
    color: "#FFF",
    fontSize: 50,
    marginRight: 14,
  },

  playTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
  },

  playSubtitle: {
    color: "#FFE2B5",
    fontSize: 11,
    marginTop: 2,
  },

  moreTitle: {
    color: "#91ACB8",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 20,
    marginBottom: 12,
    marginLeft: 5,
  },

  moreContainer: {
    backgroundColor: "#244F65",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#3C6B80",
    paddingHorizontal: 14,
  },
});