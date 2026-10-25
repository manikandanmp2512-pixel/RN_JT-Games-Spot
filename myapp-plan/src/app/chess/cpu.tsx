import { Ionicons } from "@expo/vector-icons";
import { Chess, Move, Square } from "chess.js";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// import ChessBoard from "@/components/chess/ChessBoard";
import ChessGameSettings, {
  useChessSettings,
} from "@/components/chess/ChessGameSettings";
import { playChessMoveSound } from "@/components/chess/chessSound";

import type { Difficulty } from "@/types/chess";

import { useAppTheme } from "@/context/AppThemeContext";
import { getLoggedInPlayerName } from "@/utils/playerStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";

import ChessBoard, {
  BoardImageTheme,
  CHESS_BOARD_THEME_STORAGE_KEY,
  CHESS_PIECE_SET_STORAGE_KEY,
} from "@/components/chess/ChessBoard";

import type { ChessPieceSet } from "@/components/chess/ChessBoard";

const VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

type PromotionPiece = "q" | "r" | "b" | "n";

type PendingPromotion = {
  from: Square;
  to: Square;
} | null;

export default function ChessCpuScreen() {
  const { isDark } = useAppTheme();

  const params = useLocalSearchParams<{
    mode?: string;
    difficulty?: string;
    theme?: string;
    pieceSet?: string;
  }>();

  const [playerName, setPlayerName] = useState("You");
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);
  const [thinking, setThinking] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [pendingPromotion, setPendingPromotion] =
    useState<PendingPromotion>(null);
  const [lastMove, setLastMove] = useState<string | null>(null);

  const {
    settings,
    toggle,
  } = useChessSettings();

  const [difficulty, setDifficulty] = useState<Difficulty>(
    params.difficulty === "simple" || params.difficulty === "complex"
      ? (params.difficulty as Difficulty)
      : "medium"
  );

  // const [boardTheme] = useState<ChessBoardTheme>(
  //   params.theme === "marble" || params.theme === "neon"
  //     ? (params.theme as ChessBoardTheme)
  //     : "wood"
  // );

const isValidPieceSet = (
    value: unknown
  ): value is ChessPieceSet =>
    value === "set_1" ||
    value === "set_2" ||
    value === "set_3" ||
    value === "set_4";

  const [pieceSet, setPieceSet] = useState<ChessPieceSet>(
    isValidPieceSet(params.pieceSet) ? params.pieceSet : "set_1"
  );

  useEffect(() => {
    let active = true;

    if (isValidPieceSet(params.pieceSet)) {
      setPieceSet(params.pieceSet);
      return () => {
        active = false;
      };
    }

    AsyncStorage.getItem(CHESS_PIECE_SET_STORAGE_KEY)
      .then((savedSet) => {
        if (active && isValidPieceSet(savedSet)) {
          setPieceSet(savedSet);
        }
      })
      .catch((error) => {
        console.warn("Unable to load selected chess piece style:", error);
      });

    return () => {
      active = false;
    };
  }, [params.pieceSet]);

    
  const VALID_BOARD_THEMES: BoardImageTheme[] = [
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

  const [boardTheme, setBoardTheme] =  useState<BoardImageTheme>("images_1");

  useEffect(() => {
    let isActive = true;

    const loadBoardTheme = async () => {
      try {
        // The saved carousel selection takes priority over route parameters.
        const savedTheme = await AsyncStorage.getItem(
          CHESS_BOARD_THEME_STORAGE_KEY
        );

        if (
          savedTheme &&
          VALID_BOARD_THEMES.includes(savedTheme as BoardImageTheme)
        ) {
          if (isActive) {
            setBoardTheme(savedTheme as BoardImageTheme);
          }
          return;
        }

        // Use a valid route theme only when no saved selection exists.
        const routeTheme = params.theme;

        if (
          routeTheme &&
          VALID_BOARD_THEMES.includes(routeTheme as BoardImageTheme)
        ) {
          if (isActive) {
            setBoardTheme(routeTheme as BoardImageTheme);
          }
          return;
        }

        // Keep older routes that use wood, marble, or neon working.
        const legacyThemes: Record<string, BoardImageTheme> = {
          wood: "images_1",
          marble: "images_2",
          neon: "images_3",
        };

        if (isActive && routeTheme && legacyThemes[routeTheme]) {
          setBoardTheme(legacyThemes[routeTheme]);
        }
      } catch (error) {
        console.warn("Unable to load selected chess board:", error);
      }
    };

    void loadBoardTheme();

    return () => {
      isActive = false;
    };
  }, [params.theme]);




  useEffect(() => {
    getLoggedInPlayerName().then(setPlayerName);
  }, []);

  const commitPlayerMove = (
    from: Square,
    to: Square,
    promotion: PromotionPiece
  ) => {
    try {
      const next = new Chess(game.fen());
      const result = next.move({
        from,
        to,
        promotion,
      });

      if (!result) return;

      const commit = () => {
        setGame(next);
        setLastMove(`${result.from} → ${result.to}`);
        setSelected(null);
        setPendingPromotion(null);
        playChessMoveSound(settings.sound);
      };

      if (settings.pieceAnimation) {
        setTimeout(commit, 120);
      } else {
        commit();
      }
    } catch (error) {
      console.log("CPU move error:", error);
    }
  };

  const requestPlayerMove = (
    from: Square,
    to: Square
  ) => {
    const test = new Chess(game.fen());

    try {
      const move = test.move({
        from,
        to,
        promotion: "q",
      });

      if (!move) return;

      const isPromotion =
        move.promotion === "q" ||
        move.promotion === "r" ||
        move.promotion === "b" ||
        move.promotion === "n";

      const continueMove = () => {
        if (settings.autoPromoteQueen || !isPromotion) {
          if (settings.confirmMoves) {
            Alert.alert(
              "Confirm move",
              `${move.from} → ${move.to}${
                move.promotion ? "=Q" : ""
              }`,
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => setSelected(null),
                },
                {
                  text: "Move",
                  onPress: () =>
                    commitPlayerMove(
                      from,
                      to,
                      "q"
                    ),
                },
              ]
            );
          } else {
            commitPlayerMove(from, to, "q");
          }
          return;
        }

        setPendingPromotion({ from, to });
      };

      continueMove();
    } catch {
      const ownPiece = game.get(to);
      if (ownPiece?.color === "w") {
        setSelected(to);
      } else {
        setSelected(null);
      }
    }
  };

  const move = (square: Square) => {
    if (
      game.isGameOver() ||
      game.turn() !== "w" ||
      thinking
    ) {
      return;
    }

    if (!selected) {
      const piece = game.get(square);

      if (piece?.color === "w") {
        setSelected(square);
      }
      return;
    }

    if (selected === square) {
      setSelected(null);
      return;
    }

    const piece = game.get(square);

    if (piece?.color === "w") {
      setSelected(square);
      return;
    }

    requestPlayerMove(selected, square);
  };

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
      const cpu = new Chess(game.fen());
      const moves = cpu.moves({
        verbose: true,
      }) as Move[];

      let chosen: Move | null = null;

      if (difficulty === "simple") {
        chosen =
          moves[Math.floor(Math.random() * moves.length)] ||
          null;
      } else {
        const scored = moves
          .map((m) => {
            let score =
              Math.random() *
              (difficulty === "medium" ? 40 : 10);

            if (m.captured) {
              score +=
                (VALUES[m.captured] || 0) *
                (difficulty === "medium" ? 1 : 1.5);
            }

            if (m.promotion) {
              score += difficulty === "medium" ? 900 : 1800;
            }

            if (m.san.includes("+")) {
              score += difficulty === "medium" ? 500 : 1000;
            }

            if (m.san.includes("#")) {
              score += difficulty === "medium" ? 10000 : 30000;
            }

            return { m, score };
          })
          .sort((a, b) => b.score - a.score);

        chosen = scored[0]?.m || null;
      }

      if (chosen) {
        cpu.move({
          from: chosen.from,
          to: chosen.to,
          promotion: "q",
        });

        const commit = () => {
          setGame(cpu);
          setLastMove(`${chosen!.from} → ${chosen!.to}`);
          playChessMoveSound(settings.sound);
        };

        if (settings.pieceAnimation) {
          setTimeout(commit, 120);
        } else {
          commit();
        }
      }

      setThinking(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [
    game,
    difficulty,
    settings.pieceAnimation,
    settings.sound,
  ]);

  const legalHelp =
    selected && settings.showMoveHelp
      ? game
          .moves({
            square: selected,
            verbose: true,
          })
          .map((m: any) => m.to)
          .join(", ")
      : "";

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
          backgroundColor: isDark
            ? "#173A4C"
            : "#07151D",
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.back}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#ffffff"
          />
        </Pressable>

        <View>
          <Text style={styles.title}>CPU CHESS</Text>
          <Text style={styles.sub}>
            {params.mode || "rapid"} • {difficulty}
          </Text>
        </View>

        <Pressable
          onPress={() => setSettingsVisible(true)}
          style={styles.gear}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color="#ffffff"
          />
        </Pressable>
      </View>

      <View style={styles.playerRowcpu}>
        <View>
          <Text style={styles.player}>🤖 CPU</Text>
          <Text style={styles.colorText}>♚ Black</Text>
        </View>
      </View>

      <ChessBoard
        game={game}
        selectedSquare={selected}
        onSquarePress={move}
        theme={boardTheme}
        orientation="white"
        pieceSet={pieceSet}
      />

      {settings.showLastMove && lastMove ? (
        <View style={styles.lastMove}>
          <Ionicons
            name="scan-outline"
            size={15}
            color="#ff9a1f"
          />
          <Text style={styles.lastMoveText}>
            Last move: {lastMove}
          </Text>
        </View>
      ) : null}

      {settings.showMoveHelp && legalHelp ? (
        <Text style={styles.helpText}>
          Legal moves: {legalHelp}
        </Text>
      ) : null}

      <View style={styles.playerRowuser}>
        <View>
          <Text style={styles.player}>
            👤 {playerName}
          </Text>
          <Text style={styles.colorText}>♔ White</Text>
        </View>
      </View>

      <Text style={styles.status}>{status}</Text>

      <Pressable
        onPress={() => {
          setGame(new Chess());
          setSelected(null);
          setThinking(false);
          setLastMove(null);
          setPendingPromotion(null);
        }}
        style={styles.new}
      >
        <Text style={styles.newText}>🔄 New Game</Text>
      </Pressable>

      <ChessGameSettings
        visible={settingsVisible}
        settings={settings}
        onToggle={toggle}
        onClose={() => setSettingsVisible(false)}
      />

      <Modal
        visible={!!pendingPromotion}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingPromotion(null)}
      >
        <View style={styles.promotionOverlay}>
          <View style={styles.promotionCard}>
            <Text style={styles.promotionTitle}>
              Choose promotion
            </Text>

            {(
              [
                ["q", "♛", "Queen"],
                ["r", "♜", "Rook"],
                ["b", "♝", "Bishop"],
                ["n", "♞", "Knight"],
              ] as Array<[PromotionPiece, string, string]>
            ).map(([piece, symbol, label]) => (
              <Pressable
                key={piece}
                style={styles.promotionButton}
                onPress={() => {
                  if (!pendingPromotion) return;

                  const { from, to } = pendingPromotion;

                  if (settings.confirmMoves) {
                    Alert.alert(
                      "Confirm move",
                      `${from} → ${to}=${label}`,
                      [
                        {
                          text: "Cancel",
                          style: "cancel",
                        },
                        {
                          text: "Move",
                          onPress: () =>
                            commitPlayerMove(
                              from,
                              to,
                              piece
                            ),
                        },
                      ]
                    );
                  } else {
                    commitPlayerMove(
                      from,
                      to,
                      piece
                    );
                  }
                }}
              >
                <Text style={styles.promotionSymbol}>
                  {symbol}
                </Text>
                <Text style={styles.promotionLabel}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
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
    backgroundColor: "#0c1829",
    width: "105%",
    maxWidth: 500,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    top: -46,
    height: 65,
    paddingHorizontal: 12,
  },

  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a2c47",
  },

  title: {
    color: "#ffffff",
    fontSize: 17,
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
    backgroundColor: "#1a2c47",
    alignItems: "center",
    justifyContent: "center",
  },

  status: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },

  playerRowcpu: {
    width: "100%",
    marginHorizontal: 12,
    marginTop: -50,
    minHeight: 72,
    borderRadius: 15,
    backgroundColor: "#111f32",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  playerRowuser: {
    width: "100%",
    marginHorizontal: 12,
    marginTop: 20,
    minHeight: 72,
    borderRadius: 15,
    backgroundColor: "#111f32",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
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

  lastMove: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#111f32",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 8,
  },

  lastMoveText: {
    color: "#cbd7df",
    fontSize: 11,
    fontWeight: "700",
  },

  helpText: {
    color: "#ffb15c",
    fontSize: 11,
    marginTop: 5,
    fontWeight: "700",
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

  promotionOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  promotionCard: {
    width: "92%",
    maxWidth: 360,
    borderRadius: 20,
    backgroundColor: "#12344a",
    padding: 18,
  },

  promotionTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },

  promotionButton: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: "#1d4f68",
    marginTop: 8,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  promotionSymbol: {
    color: "#ffffff",
    fontSize: 30,
    width: 48,
    textAlign: "center",
  },

  promotionLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  
  // params: {
  //   mode: selectedMode,
  //   theme: boardTheme,
  //   difficulty,
  //   pieceSet,
  // },
  // params: {
  //   mode: selectedMode,
  //   theme: boardTheme,
  //   pieceSet,
  // },
});
