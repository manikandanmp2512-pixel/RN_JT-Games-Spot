import {
  useEffect,
  useState,
} from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  Chess,
  Move,
  Square,
} from "chess.js";

import ChessBoard from "@/components/chess/ChessBoard";
import ChessThemeSettings from "@/components/chess/ChessThemeSettings";

import {
  ChessBoardTheme,
  Difficulty,
} from "@/types/chess";

import { useAppTheme } from "@/context/AppThemeContext";

import {
  getLoggedInPlayerName,
} from "@/utils/playerStorage";

const VALUES: Record<
  string,
  number
> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

export default function ChessCpuScreen() {
  const { isDark } =
    useAppTheme();

  const params =
    useLocalSearchParams<{
      mode?: string;
      difficulty?: string;
      theme?: string;
    }>();

  const [
    playerName,
    setPlayerName,
  ] = useState("You");

  const [game, setGame] =
    useState(() => new Chess());

  const [selected, setSelected] =
    useState<Square | null>(null);

  const [thinking, setThinking] =
    useState(false);

  const [difficulty, setDifficulty] =
    useState<Difficulty>(
      params.difficulty ===
        "simple" ||
      params.difficulty ===
        "complex"
        ? (params.difficulty as Difficulty)
        : "medium"
    );

  const [boardTheme, setBoardTheme] =
    useState<ChessBoardTheme>(
      params.theme === "marble" ||
      params.theme === "neon"
        ? (params.theme as ChessBoardTheme)
        : "wood"
    );

  const [
    settingsVisible,
    setSettingsVisible,
  ] = useState(false);

  useEffect(() => {
    getLoggedInPlayerName().then(
      setPlayerName
    );
  }, []);

  const move = (
    square: Square
  ) => {
    if (
      game.isGameOver() ||
      game.turn() !== "w" ||
      thinking
    ) {
      return;
    }

    if (!selected) {
      const piece =
        game.get(square);

      if (
        piece?.color === "w"
      ) {
        setSelected(square);
      }

      return;
    }

    try {
      const next =
        new Chess(game.fen());

      next.move({
        from: selected,
        to: square,
        promotion: "q",
      });

      setGame(next);
      setSelected(null);
    } catch {
      if (
        game.get(square)?.color ===
        "w"
      ) {
        setSelected(square);
      } else {
        setSelected(null);
      }
    }
  };

  /*
   * CPU move.
   */
  useEffect(() => {
    if (
      game.isGameOver() ||
      game.turn() !== "b"
    ) {
      return;
    }

    setThinking(true);

    const delay =
      difficulty === "simple"
        ? 350
        : difficulty === "medium"
        ? 600
        : 900;

    const timer = setTimeout(() => {
      const cpu =
        new Chess(game.fen());

      const moves =
        cpu.moves({
          verbose: true,
        }) as Move[];

      let chosen:
        | Move
        | null = null;

      if (
        difficulty ===
        "simple"
      ) {
        chosen =
          moves[
            Math.floor(
              Math.random() *
                moves.length
            )
          ] || null;
      } else {
        const scored = moves
          .map((m) => {
            let score =
              Math.random() *
              (difficulty ===
              "medium"
                ? 40
                : 10);

            if (m.captured) {
              score +=
                (VALUES[
                  m.captured
                ] || 0) *
                (difficulty ===
                "medium"
                  ? 1
                  : 1.5);
            }

            if (m.promotion) {
              score +=
                difficulty ===
                "medium"
                  ? 900
                  : 1800;
            }

            if (
              m.san.includes("+")
            ) {
              score +=
                difficulty ===
                "medium"
                  ? 500
                  : 1000;
            }

            if (
              m.san.includes("#")
            ) {
              score +=
                difficulty ===
                "medium"
                  ? 10000
                  : 30000;
            }

            return {
              m,
              score,
            };
          })
          .sort(
            (a, b) =>
              b.score -
              a.score
          );

        chosen =
          scored[0]?.m ||
          null;
      }

      if (chosen) {
        cpu.move({
          from: chosen.from,
          to: chosen.to,
          promotion: "q",
        });

        setGame(cpu);
      }

      setThinking(false);
    }, delay);

    return () =>
      clearTimeout(timer);
  }, [
    game,
    difficulty,
  ]);

  const status =
    game.isCheckmate()
      ? "Checkmate"
      : game.isDraw()
      ? "Draw"
      : thinking
      ? "CPU thinking…"
      : game.inCheck()
      ? "Check! Your turn"
      : game.turn() === "w"
      ? "Your turn"
      : "CPU turn";

  return (
    <View
      style={[
        styles.safe,
        {
          backgroundColor:
            isDark
              ? "#07151D"
              : "#173A4C",
        },
      ]}
    >

      {/* HEADER */}

      <View style={styles.header}>
        <Pressable
          onPress={() =>
            router.back()
          }
        >
          <Text style={styles.back}>
            ‹
          </Text>
        </Pressable>

        <View>
          <Text style={styles.title}>
            CPU CHESS
          </Text>

          <Text style={styles.sub}>
            {params.mode ||
              "rapid"}{" "}
            •{" "}
            {difficulty}
          </Text>
        </View>

        <Pressable
          onPress={() =>
            setSettingsVisible(true)
          }
          style={styles.gear}
        >
          <Text>⚙️</Text>
        </Pressable>
      </View>

      <Text style={styles.status}>
        {status}
      </Text>

      {/* CPU ALWAYS TOP */}

      <View style={styles.playerRow}>
        <View>
          <Text style={styles.player}>
            🤖 CPU
          </Text>

          <Text style={styles.colorText}>
            ♚ Black
          </Text>
        </View>
      </View>

      {/* BOARD */}

      <ChessBoard
        game={game}
        selectedSquare={selected}
        onSquarePress={move}
        theme={boardTheme}
        orientation="white"
      />

      {/* USER ALWAYS BOTTOM */}

      <View style={styles.playerRow}>
        <View>
          <Text style={styles.player}>
            👤 {playerName}
          </Text>

          <Text style={styles.colorText}>
            ♔ White
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => {
          setGame(new Chess());
          setSelected(null);
          setThinking(false);
        }}
        style={styles.new}
      >
        <Text style={styles.newText}>
          🔄 New Game
        </Text>
      </Pressable>

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
  );
}

const styles = StyleSheet.create({
  safe: {
    marginTop: 30,
    flex: 1,
    alignItems: "center",
    paddingTop: 46,
    paddingHorizontal: 10,
  },

  header: {
    width: "100%",
    maxWidth: 500,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 14,
  },

  back: {
    color: "#FFF",
    fontSize: 38,
    lineHeight: 36,
  },

  title: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },

  sub: {
    color: "#9DB6C1",
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
  },

  gear: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#244F65",
    alignItems: "center",
    justifyContent: "center",
  },

  status: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },

  playerRow: {
    width: "100%",
    maxWidth: 500,
    flexDirection: "row",
    justifyContent:
      "space-between",
    marginBottom: 8,
  },

  player: {
    color: "#D8E5EA",
    fontSize: 14,
    fontWeight: "800",
  },

  colorText: {
    color: "#8EAAB8",
    fontSize: 10,
    marginTop: 3,
  },

  new: {
    marginTop: 16,
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 11,
  },

  newText: {
    color: "#FFF",
    fontWeight: "900",
  },
});