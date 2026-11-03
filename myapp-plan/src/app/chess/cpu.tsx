import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

import ChessGameSettings, {
  useChessSettings,
} from "@/components/chess/ChessGameSettings";

import ChessBoard, {
  BoardImageTheme,
  CHESS_BOARD_THEME_STORAGE_KEY,
  CHESS_PIECE_SET_STORAGE_KEY,
} from "@/components/chess/ChessBoard";

import type { ChessPieceSet } from "@/components/chess/ChessBoard";
import type { Difficulty } from "@/types/chess";

import { playChessMoveSound } from "@/components/chess/chessSound";
import { useAppTheme } from "@/context/AppThemeContext";
import { getLoggedInPlayerName } from "@/utils/playerStorage";

/* -------------------------------------------------------------------------- */
/* CPU ENGINE CONFIGURATION                                                   */
/* -------------------------------------------------------------------------- */

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

const MATE_SCORE = 100000;

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

type PromotionPiece = "q" | "r" | "b" | "n";

type PendingPromotion = {
  from: Square;
  to: Square;
} | null;

/* -------------------------------------------------------------------------- */
/* CPU MOVE ORDERING                                                           */
/* -------------------------------------------------------------------------- */

function getMoveOrderScore(move: Move): number {
  let score = 0;

  if (move.captured) {
    const capturedValue = PIECE_VALUES[move.captured] || 0;
    const movingValue = PIECE_VALUES[move.piece] || 0;

    // Prefer capturing valuable pieces with cheaper pieces.
    score += 10000 + capturedValue * 10 - movingValue;
  }

  if (move.promotion) {
    score += 8000 + (PIECE_VALUES[move.promotion] || 0);
  }

  if (move.san.includes("#")) {
    score += 50000;
  } else if (move.san.includes("+")) {
    score += 500;
  }

  return score;
}

function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort(
    (a, b) => getMoveOrderScore(b) - getMoveOrderScore(a)
  );
}

/* -------------------------------------------------------------------------- */
/* POSITION EVALUATION                                                        */
/* -------------------------------------------------------------------------- */

function evaluatePosition(game: Chess): number {
  if (game.isCheckmate()) {
    // The side that just moved has delivered checkmate.
    return game.turn() === "w" ? -MATE_SCORE : MATE_SCORE;
  }

  if (game.isDraw() || game.isGameOver()) {
    return 0;
  }

  let score = 0;
  const board = game.board();

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];

      if (!piece) continue;

      const colorMultiplier = piece.color === "w" ? 1 : -1;
      const pieceValue = PIECE_VALUES[piece.type] || 0;

      score += colorMultiplier * pieceValue;

      // Central squares are useful for active pieces.
      const centerDistance =
        Math.abs(3.5 - col) + Math.abs(3.5 - row);

      const centerBonus = Math.max(0, 7 - centerDistance * 2);

      if (piece.type === "n" || piece.type === "b") {
        score += colorMultiplier * centerBonus * 7;
      }

      if (piece.type === "q") {
        score += colorMultiplier * centerBonus * 3;
      }

      // Encourage pawns to advance.
      if (piece.type === "p") {
        const advancement =
          piece.color === "w" ? 6 - row : row - 1;

        score += colorMultiplier * advancement * 7;

        // Encourage central pawn control.
        if (col >= 2 && col <= 5) {
          score += colorMultiplier * 8;
        }
      }

      // Rooks benefit from more active files.
      if (piece.type === "r") {
        const fileHasOwnPawn = board.some(
          (rank) =>
            rank[col]?.type === "p" &&
            rank[col]?.color === piece.color
        );

        if (!fileHasOwnPawn) {
          score += colorMultiplier * 15;
        }
      }

      // Keep the king safer during the middlegame.
      if (piece.type === "k") {
        const nonKingPieces = board
          .flat()
          .filter((p) => p && p.type !== "k").length;

        if (nonKingPieces > 6) {
          const kingCenterPenalty =
            Math.max(0, 4 - centerDistance) * 8;

          score -= colorMultiplier * kingCenterPenalty;
        }
      }
    }
  }

  return score;
}

/* -------------------------------------------------------------------------- */
/* MINIMAX + ALPHA-BETA SEARCH                                                 */
/* -------------------------------------------------------------------------- */

function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number
): number {
  if (game.isCheckmate()) {
    return game.turn() === "w" ? -MATE_SCORE : MATE_SCORE;
  }

  if (game.isDraw() || game.isGameOver()) {
    return 0;
  }

  if (depth <= 0) {
    return evaluatePosition(game);
  }

  const moves = orderMoves(
    game.moves({ verbose: true }) as Move[]
  );

  if (moves.length === 0) {
    return evaluatePosition(game);
  }

  const maximizing = game.turn() === "w";

  if (maximizing) {
    let bestScore = -Infinity;

    for (const move of moves) {
      game.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || "q",
      });

      const score = minimax(
        game,
        depth - 1,
        alpha,
        beta
      );

      game.undo();

      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, bestScore);

      if (beta <= alpha) {
        break;
      }
    }

    return bestScore;
  }

  let bestScore = Infinity;

  for (const move of moves) {
    game.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion || "q",
    });

    const score = minimax(
      game,
      depth - 1,
      alpha,
      beta
    );

    game.undo();

    bestScore = Math.min(bestScore, score);
    beta = Math.min(beta, bestScore);

    if (beta <= alpha) {
      break;
    }
  }

  return bestScore;
}

/* -------------------------------------------------------------------------- */
/* DIFFICULTY-SPECIFIC MOVE SELECTION                                          */
/* -------------------------------------------------------------------------- */

function chooseSimpleMove(moves: Move[]): Move | null {
  if (moves.length === 0) return null;

  // Simple level: mostly varied legal moves, with a small preference
  // for captures, promotions and checks.
  const weightedMoves = moves.map((move) => ({
    move,
    score:
      getMoveOrderScore(move) * 0.08 +
      Math.random() * 100,
  }));

  weightedMoves.sort((a, b) => b.score - a.score);

  // Choose among a few candidates so the simple level remains varied.
  const candidateCount = Math.min(4, weightedMoves.length);
  const candidates = weightedMoves.slice(0, candidateCount);

  return candidates[
    Math.floor(Math.random() * candidates.length)
  ]?.move || null;
}

function chooseSearchedMove(
  position: Chess,
  depth: number
): Move | null {
  const game = new Chess(position.fen());

  const moves = orderMoves(
    game.moves({ verbose: true }) as Move[]
  );

  if (moves.length === 0) return null;

  let bestMove: Move | null = null;
  let bestScore = Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  // The CPU plays Black in this screen, so it minimizes
  // the evaluation score from White's perspective.
  for (const move of moves) {
    game.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion || "q",
    });

    const score = minimax(
      game,
      depth - 1,
      alpha,
      beta
    );

    game.undo();

    // Small random tie-breaker prevents identical play every game.
    const adjustedScore = score + Math.random() * 0.15;

    if (adjustedScore < bestScore) {
      bestScore = adjustedScore;
      bestMove = move;
    }

    alpha = Math.max(alpha, bestScore);
  }

  return bestMove;
}

function chooseCpuMove(
  position: Chess,
  difficulty: Difficulty
): Move | null {
  const moves = position.moves({
    verbose: true,
  }) as Move[];

  if (moves.length === 0) return null;

  if (difficulty === "simple") {
    return chooseSimpleMove(moves);
  }

  if (difficulty === "medium") {
    // CPU move + opponent response.
    return chooseSearchedMove(position, 2);
  }

  // Complex: CPU move, opponent response, and another CPU search ply.
  return chooseSearchedMove(position, 3);
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                     */
/* -------------------------------------------------------------------------- */

const isValidPieceSet = (
  value: unknown
): value is ChessPieceSet =>
  value === "set_1" ||
  value === "set_2" ||
  value === "set_3" ||
  value === "set_4";

/* -------------------------------------------------------------------------- */
/* CPU CHESS SCREEN                                                            */
/* -------------------------------------------------------------------------- */

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

  // Shared chess settings are used here.
  const { settings, toggle } = useChessSettings();

  const [difficulty, setDifficulty] = useState<Difficulty>(
    params.difficulty === "simple" ||
      params.difficulty === "complex"
      ? (params.difficulty as Difficulty)
      : "medium"
  );

  const [pieceSet, setPieceSet] = useState<ChessPieceSet>(
    isValidPieceSet(params.pieceSet)
      ? params.pieceSet
      : "set_1"
  );

  const [boardTheme, setBoardTheme] =
    useState<BoardImageTheme>("images_1");

  /* ------------------------------------------------------------------------ */
  /* LOAD PLAYER NAME                                                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let active = true;

    getLoggedInPlayerName()
      .then((name) => {
        if (active && name) {
          setPlayerName(name);
        }
      })
      .catch((error) => {
        console.warn("Unable to load player name:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /* LOAD PIECE SET                                                           */
  /* ------------------------------------------------------------------------ */

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
        console.warn(
          "Unable to load selected chess piece style:",
          error
        );
      });

    return () => {
      active = false;
    };
  }, [params.pieceSet]);

  /* ------------------------------------------------------------------------ */
  /* LOAD BOARD THEME                                                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let active = true;

    const loadBoardTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(
          CHESS_BOARD_THEME_STORAGE_KEY
        );

        if (
          savedTheme &&
          VALID_BOARD_THEMES.includes(
            savedTheme as BoardImageTheme
          )
        ) {
          if (active) {
            setBoardTheme(savedTheme as BoardImageTheme);
          }

          return;
        }

        const routeTheme = params.theme;

        if (
          routeTheme &&
          VALID_BOARD_THEMES.includes(
            routeTheme as BoardImageTheme
          )
        ) {
          if (active) {
            setBoardTheme(routeTheme as BoardImageTheme);
          }

          return;
        }

        // Compatibility with older route parameters.
        const legacyThemes: Record<string, BoardImageTheme> = {
          wood: "images_1",
          marble: "images_2",
          neon: "images_3",
        };

        if (active && routeTheme && legacyThemes[routeTheme]) {
          setBoardTheme(legacyThemes[routeTheme]);
        }
      } catch (error) {
        console.warn(
          "Unable to load selected chess board:",
          error
        );
      }
    };

    void loadBoardTheme();

    return () => {
      active = false;
    };
  }, [params.theme]);

  /* ------------------------------------------------------------------------ */
  /* COMMIT PLAYER MOVE                                                       */
  /* ------------------------------------------------------------------------ */

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
      console.log("CPU player move error:", error);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* PLAYER MOVE REQUEST                                                      */
  /* ------------------------------------------------------------------------ */

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
                    commitPlayerMove(from, to, "q"),
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

  /* ------------------------------------------------------------------------ */
  /* BOARD INPUT                                                              */
  /* ------------------------------------------------------------------------ */

  const move = (square: Square) => {
    if (
      game.isGameOver() ||
      game.turn() !== "w" ||
      thinking ||
      pendingPromotion
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

  /* ------------------------------------------------------------------------ */
  /* CPU TURN                                                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (game.isGameOver() || game.turn() !== "b") {
      setThinking(false);
      return;
    }

    let active = true;

    setThinking(true);

    const delay =
      difficulty === "simple"
        ? 350
        : difficulty === "medium"
        ? 700
        : 1000;

    const timer = setTimeout(() => {
      if (!active) return;

      try {
        const cpu = new Chess(game.fen());

        const chosen = chooseCpuMove(cpu, difficulty);

        if (!chosen) {
          setThinking(false);
          return;
        }

        const result = cpu.move({
          from: chosen.from,
          to: chosen.to,
          promotion: chosen.promotion || "q",
        });

        if (!result) {
          setThinking(false);
          return;
        }

        const commit = () => {
          if (!active) return;

          setGame(cpu);
          setLastMove(`${result.from} → ${result.to}`);
          setSelected(null);
          playChessMoveSound(settings.sound);
          setThinking(false);
        };

        if (settings.pieceAnimation) {
          setTimeout(commit, 120);
        } else {
          commit();
        }
      } catch (error) {
        console.error("CPU thinking error:", error);
        setThinking(false);
      }
    }, delay);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    game,
    difficulty,
    settings.pieceAnimation,
    settings.sound,
  ]);

  /* ------------------------------------------------------------------------ */
  /* MOVE HELP                                                                */
  /* ------------------------------------------------------------------------ */

  const legalHelp =
    selected && settings.showMoveHelp
      ? game
          .moves({
            square: selected,
            verbose: true,
          })
          .map((item) => item.to)
          .join(", ")
      : "";

  /* ------------------------------------------------------------------------ */
  /* GAME STATUS                                                              */
  /* ------------------------------------------------------------------------ */

  const status = game.isCheckmate()
    ? "Checkmate"
    : game.isDraw()
    ? "Draw"
    : thinking
    ? difficulty === "complex"
      ? "CPU calculating..."
      : "CPU thinking..."
    : game.inCheck()
    ? "Check! Your turn"
    : game.turn() === "w"
    ? "Your turn"
    : "CPU turn";

  /* ------------------------------------------------------------------------ */
  /* NEW GAME                                                                 */
  /* ------------------------------------------------------------------------ */

  const startNewGame = () => {
    setGame(new Chess());
    setSelected(null);
    setThinking(false);
    setLastMove(null);
    setPendingPromotion(null);
  };

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

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
        onPress={startNewGame}
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
                            commitPlayerMove(from, to, piece),
                        },
                      ]
                    );
                  } else {
                    commitPlayerMove(from, to, piece);
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

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

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
});