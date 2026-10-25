import { useMemo } from "react";

import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { Chess, Square } from "chess.js";

import {
  getSquareName,
  pieceAssetKey,
} from "@/utils/chessUtils";

import { ChessBoardTheme } from "@/types/chess";

export type { ChessBoardTheme } from "@/types/chess";

/* -------------------------------------------------------------------------- */
/* Piece Images                                                               */
/* -------------------------------------------------------------------------- */

const PIECE_IMAGES: Record<string, any> = {
  white_p: require("@/assets/chess-pieces/white_p.png"),
  white_n: require("@/assets/chess-pieces/white_n.png"),
  white_b: require("@/assets/chess-pieces/white_b.png"),
  white_r: require("@/assets/chess-pieces/white_r.png"),
  white_q: require("@/assets/chess-pieces/white_q.png"),
  white_k: require("@/assets/chess-pieces/white_k.png"),

  black_p: require("@/assets/chess-pieces/black_p.png"),
  black_n: require("@/assets/chess-pieces/black_n.png"),
  black_b: require("@/assets/chess-pieces/black_b.png"),
  black_r: require("@/assets/chess-pieces/black_r.png"),
  black_q: require("@/assets/chess-pieces/black_q.png"),
  black_k: require("@/assets/chess-pieces/black_k.png"),
};

/* -------------------------------------------------------------------------- */
/* Board Images                                                               */
/* -------------------------------------------------------------------------- */

// The ten selectable board background images.
export type BoardImageTheme =
  | "images_1"
  | "images_2"
  | "images_3"
  | "images_4"
  | "images_5"
  | "images_6"
  | "images_7"
  | "images_8"
  | "images_9"
  | "images_10";

// Keep existing theme names compatible with current screens.
type ChessBoardDisplayTheme = ChessBoardTheme | BoardImageTheme;

const BOARD_IMAGES: Record<BoardImageTheme, number> = {
  images_1: require("@/assets/chess/images_1.png"),
  images_2: require("@/assets/chess/images_2.png"),
  images_3: require("@/assets/chess/images_3.png"),
  images_4: require("@/assets/chess/images_4.png"),
  images_5: require("@/assets/chess/images_5.png"),
  images_6: require("@/assets/chess/images_6.png"),
  images_7: require("@/assets/chess/images_7.png"),
  images_8: require("@/assets/chess/images_8.png"),
  images_9: require("@/assets/chess/images_9.png"),
  images_10: require("@/assets/chess/images_10.png"),

  // // Backward compatibility with existing theme values.
  // wood: require("@/assets/images/images_1.png"),
  // marble: require("@/assets/images/images_2.png"),
  // neon: require("@/assets/images/images_3.png"),
};

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type CapturedPieceType =
  | "p"
  | "n"
  | "b"
  | "r"
  | "q";

export type CapturedPieces = Record<
  CapturedPieceType,
  number
>;

export type ChessClockDisplay = {
  milliseconds: number;
  active?: boolean;
};

type Props = {
  game: Chess;

  selectedSquare: Square | null;

  onSquarePress: (
    square: Square
  ) => void;

  theme?: ChessBoardDisplayTheme;

  orientation?: "white" | "black";

  /**
   * Last server-confirmed move. Both source and destination squares
   * remain highlighted until another move is received.
   */
  lastMove?: {
    from: Square;
    to: Square;
  } | null;

  /** Respect the user's settings instead of always drawing move highlights. */
  showLastMove?: boolean;
  showMoveHelp?: boolean;

  /** Explicit losing king color supplied by the game-over event. */
  checkmatedColor?: "white" | "black" | null;

  /*
   * Captured pieces belonging to the opponent.
   *
   * Example:
   * {
   *   p: 2,
   *   n: 1,
   *   b: 0,
   *   r: 1,
   *   q: 0
   * }
   */
  capturedPieces?: Partial<CapturedPieces>;

  /*
   * Which color's pieces were captured.
   *
   * If you are White:
   * capturedPieceColor = "black"
   *
   * If you are Black:
   * capturedPieceColor = "white"
   */
  capturedPieceColor?: "white" | "black";

  /*
   * Opponent clock.
   * Always rendered at TOP-RIGHT when enabled in the JSX below.
   */
  opponentClock?: ChessClockDisplay;

  /*
   * Player clock.
   * Always rendered at BOTTOM-RIGHT when enabled in the JSX below.
   */
  playerClock?: ChessClockDisplay;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatClock = (
  milliseconds: number
): string => {
  const safe = Math.max(
    0,
    milliseconds || 0
  );

  const totalSeconds = Math.ceil(
    safe / 1000
  );

  const minutes = Math.floor(
    totalSeconds / 60
  );

  const seconds =
    totalSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

/* -------------------------------------------------------------------------- */
/* Captured Pieces Component                                                  */
/* -------------------------------------------------------------------------- */

function CapturedPiecesPanel({
  capturedPieces,
  capturedPieceColor,
  boardSize,
}: {
  capturedPieces: Partial<CapturedPieces>;

  capturedPieceColor: "white" | "black";

  boardSize: number;
}) {
  const pieceTypes: CapturedPieceType[] = [
    "p",
    "n",
    "b",
    "r",
    "q",
  ];

  const hasAnyCapturedPiece =
    pieceTypes.some(
      (type) =>
        (capturedPieces[type] || 0) > 0
    );

  /*
   * We still display every piece type when the
   * panel is active, so the user can see the
   * separate count for every piece.
   */
  if (!hasAnyCapturedPiece) {
    return null;
  }

  const imageSize = Math.max(
    20,
    Math.min(boardSize * 0.055, 34)
  );

  return (
    <View
      pointerEvents="none"
      style={[
        styles.capturedPanel,
        {
          maxWidth:
            boardSize * 0.58,
        },
      ]}
    >
      {pieceTypes.map((type) => {
        const count =
          capturedPieces[type] || 0;

        const asset =
          PIECE_IMAGES[
            `${capturedPieceColor}_${type}`
          ];

        return (
          <View
            key={type}
            style={[
              styles.capturedItem,
              {
                width:
                  imageSize + 8,
              },
            ]}
          >
            {/* COUNT BADGE ABOVE PIECE */}

            <View
              style={[
                styles.countBadge,
                {
                  minWidth:
                    Math.max(
                      16,
                      imageSize * 0.55
                    ),
                  height:
                    Math.max(
                      16,
                      imageSize * 0.55
                    ),
                  borderRadius:
                    Math.max(
                      8,
                      imageSize * 0.275
                    ),
                },
              ]}
            >
              <Text
                style={[
                  styles.countBadgeText,
                  {
                    fontSize:
                      Math.max(
                        9,
                        imageSize * 0.28
                      ),
                  },
                ]}
              >
                {count}
              </Text>
            </View>

            {/* CAPTURED PIECE */}

            <Image
              source={asset}
              resizeMode="contain"
              style={{
                width: imageSize,
                height: imageSize,
              }}
            />
          </View>
        );
      })}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Clock Component                                                            */
/* -------------------------------------------------------------------------- */

function ClockBadge({
  clock,
  position,
}: {
  clock?: ChessClockDisplay;

  position: "top" | "bottom";
}) {
  if (!clock) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[
        styles.clockBadge,
        position === "top"
          ? styles.clockTop
          : styles.clockBottom,
        clock.active &&
          styles.clockActive,
      ]}
    >
      <Text
        style={[
          styles.clockText,
          clock.active &&
            styles.clockActiveText,
        ]}
      >
        {formatClock(
          clock.milliseconds
        )}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Board                                                                 */
/* -------------------------------------------------------------------------- */

export default function ChessBoard({
  game,
  selectedSquare,
  onSquarePress,
  theme = "wood",
  orientation = "white",
  lastMove = null,
  showLastMove = false,
  showMoveHelp = false,
  checkmatedColor = null,
  capturedPieces,
  capturedPieceColor,
  // opponentClock,
  // playerClock,
}: Props) {
  const { width } =
    useWindowDimensions();

  /*
   * Board size.
   *
   * Maximum 720px.
   * On phones it uses almost the
   * full available screen width.
   */
  const boardSize = Math.min(
    Math.max(width - 20, 300),
    720
  );

  const squareSize =
    boardSize / 8;

  const board = game.board();

  /* ------------------------------------------------------------------------ */
  /* Legal Moves                                                              */
  /* ------------------------------------------------------------------------ */

  const legalSquares =
    useMemo(() => {
      if (!selectedSquare) {
        return [];
      }

      return game
        .moves({
          square: selectedSquare,
          verbose: true,
        })
        .map(
          (move) =>
            move.to as Square
        );
    }, [
      game,
      selectedSquare,
    ]);

  /* ------------------------------------------------------------------------ */
  /* Board Orientation                                                        */
  /* ------------------------------------------------------------------------ */

  const rows =
    orientation === "white"
      ? board
      : [...board]
          .reverse()
          .map((row) =>
            [...row].reverse()
          );

  /*
   * If capturedPieceColor is not supplied,
   * automatically use the opponent's color.
   */
  const resolvedCapturedColor =
    capturedPieceColor ||
    (orientation === "white"
      ? "black"
      : "white");

  // Use the selected background, falling back to the first image.
  const boardImage = BOARD_IMAGES.images_1;

  return (
    <View
      style={[
        styles.boardContainer,
        {
          width: boardSize,
          height: boardSize,
        },
      ]}
    >
      <ImageBackground
        source={boardImage}
        resizeMode="cover"
        style={[
          styles.boardBackground,
          {
            width: boardSize,
            height: boardSize,
          },
        ]}
      >
        {/* ================================================================ */}
        {/* BOARD                                                            */}
        {/* ================================================================ */}

        {rows.map(
          (row, rowIndex) =>
            row.map(
              (
                piece,
                columnIndex
              ) => {
                const actualRow =
                  orientation ===
                  "white"
                    ? rowIndex
                    : 7 - rowIndex;

                const actualColumn =
                  orientation ===
                  "white"
                    ? columnIndex
                    : 7 - columnIndex;

                const square =
                  getSquareName(
                    actualRow,
                    actualColumn
                  );

                const selected =
                  selectedSquare ===
                  square;

                const legal =
                  showMoveHelp &&
                  legalSquares.includes(square);

                /*
                 * Highlight the last completed move directly on the board.
                 * This is deliberately square-based rather than a text such
                 * as "f2 to c7". Both source and destination stay marked
                 * until the next server-confirmed move arrives.
                 */
                const isLastMoveSquare =
                  showLastMove &&
                  Boolean(
                    lastMove &&
                      (lastMove.from === square ||
                        lastMove.to === square)
                  );

                /*
                 * After checkmate, game.turn() is the side whose king has
                 * been checkmated. Highlight that king with a strong red
                 * border/glow.
                 */
                const inferredCheckmatedColor: "white" | "black" | null =
                  game.isCheckmate()
                    ? (game.turn() === "w" ? "white" : "black")
                    : null;

                const losingKingColor =
                  checkmatedColor || inferredCheckmatedColor;

                const isCheckmatedKing =
                  losingKingColor !== null &&
                  piece?.type === "k" &&
                  (piece.color === "w" ? "white" : "black") === losingKingColor;

                const asset = piece
                  ? PIECE_IMAGES[
                      pieceAssetKey(
                        piece.color,
                        piece.type
                      )
                    ]
                  : null;

                /*
                 * Alternate square colors.
                 */
                const isLight =
                  (actualRow +
                    actualColumn) %
                    2 ===
                  0;

                return (
                  <Pressable
                    key={square}
                    onPress={() =>
                      onSquarePress(
                        square
                      )
                    }
                    style={[
                      styles.square,
                      {
                        width:
                          squareSize,
                        height:
                          squareSize,
                      },
                    ]}
                  >
                    {/* -------------------------------------------------- */}
                    {/* SQUARE COLOR                                       */}
                    {/* -------------------------------------------------- */}

                    <View
                      pointerEvents="none"
                      style={[
                        styles.squareColor,
                        isLight
                          ? styles.lightSquare
                          : styles.darkSquare,
                        {
                          width:
                            squareSize,
                          height:
                            squareSize,
                        },
                      ]}
                    />

                    {/* -------------------------------------------------- */}
                    {/* LAST MOVE                                          */}
                    {/* -------------------------------------------------- */}

                    {isLastMoveSquare && (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.lastMoveSquare,
                          {
                            width: squareSize,
                            height: squareSize,
                          },
                        ]}
                      />
                    )}

                    {/* -------------------------------------------------- */}
                    {/* CHECKMATE KING                                     */}
                    {/* -------------------------------------------------- */}

                    {isCheckmatedKing && (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.checkmateSquare,
                          {
                            width: squareSize,
                            height: squareSize,
                          },
                        ]}
                      />
                    )}

                    {/* -------------------------------------------------- */}
                    {/* SELECTED                                           */}
                    {/* -------------------------------------------------- */}

                    {selected && (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.selectedSquare,
                          {
                            width:
                              squareSize,
                            height:
                              squareSize,
                          },
                        ]}
                      />
                    )}

                    {/* -------------------------------------------------- */}
                    {/* LEGAL MOVE                                         */}
                    {/* -------------------------------------------------- */}

                    {legal && (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.legalDot,
                          {
                            width:
                              squareSize *
                              0.28,

                            height:
                              squareSize *
                              0.28,

                            borderRadius:
                              squareSize *
                              0.15,

                            left:
                              squareSize *
                              0.37,

                            top:
                              squareSize *
                              0.39,
                          },
                        ]}
                      />
                    )}

                    {/* -------------------------------------------------- */}
                    {/* PIECE                                              */}
                    {/* -------------------------------------------------- */}

                    {piece &&
                      asset && (
                        <Image
                          source={asset}
                          resizeMode="contain"
                          style={[
                            styles.piece,
                            {
                              width:
                                squareSize *
                                0.88,

                              height:
                                squareSize *
                                0.88,
                            },
                            isCheckmatedKing &&
                              styles.checkmatePieceGlow,
                          ]}
                        />
                      )}

                    {/* -------------------------------------------------- */}
                    {/* RANK                                               */}
                    {/* -------------------------------------------------- */}

                    {columnIndex ===
                      0 && (
                      <Text
                        pointerEvents="none"
                        style={[
                          styles.rank,
                          {
                            fontSize:
                              Math.max(
                                squareSize *
                                  0.13,
                                8
                              ),
                          },
                        ]}
                      >
                        {orientation ===
                        "white"
                          ? 8 -
                            rowIndex
                          : rowIndex +
                            1}
                      </Text>
                    )}

                    {/* -------------------------------------------------- */}
                    {/* FILE                                               */}
                    {/* -------------------------------------------------- */}

                    {rowIndex ===
                      7 && (
                      <Text
                        pointerEvents="none"
                        style={[
                          styles.file,
                          {
                            fontSize:
                              Math.max(
                                squareSize *
                                  0.13,
                                8
                              ),
                          },
                        ]}
                      >
                        {orientation ===
                        "white"
                          ? String.fromCharCode(
                              97 +
                                columnIndex
                            )
                          : String.fromCharCode(
                              104 -
                                columnIndex
                            )}
                      </Text>
                    )}
                  </Pressable>
                );
              }
            )
        )}

        {/* ================================================================ */}
        {/* OPPONENT CLOCK — TOP RIGHT                                      */}
        {/* ================================================================ */}

        {/* Kept commented as in your original file. */}

        {/* <ClockBadge
          clock={opponentClock}
          position="top"
        /> */}

        {/* ================================================================ */}
        {/* CAPTURED PIECES — BOTTOM RIGHT                                  */}
        {/* ================================================================ */}

        {capturedPieces && (
          <CapturedPiecesPanel
            capturedPieces={
              capturedPieces
            }
            capturedPieceColor={
              resolvedCapturedColor
            }
            boardSize={boardSize}
          />
        )}

        {/* ================================================================ */}
        {/* PLAYER CLOCK — BOTTOM RIGHT                                    */}
        {/* ================================================================ */}

        {/* Kept commented as in your original file. */}

        {/* <ClockBadge
          clock={playerClock}
          position="bottom"
        /> */}
      </ImageBackground>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  boardContainer: {
    top: 10,
    overflow: "hidden",

    borderWidth: 2,
    borderRadius: 10,
    borderColor: "#35180B",

    elevation: 10,

    shadowColor: "#000",

    shadowOffset: {
      width: 20,
      height: 20,
    },

    shadowOpacity: 0.45,

    shadowRadius: 15,
  },

  boardBackground: {
    flexDirection: "row",

    flexWrap: "wrap",

    overflow: "hidden",

    position: "relative",
  },

  square: {
    alignItems: "center",

    justifyContent: "center",

    overflow: "hidden",
  },

  squareColor: {
    position: "absolute",

    left: 0,

    top: 0,
  },

  lightSquare: {
    backgroundColor:
      "rgba(252, 250, 246, 0.34)",
  },

  darkSquare: {
    backgroundColor:
      "rgba(44, 15, 1, 0.42)",
  },

  selectedSquare: {
    position: "absolute",

    // backgroundColor: "#a5f297",

    borderWidth: 3,

    borderColor: "#27f103",
  },

  /* Red border for the last server-confirmed move. */
  lastMoveSquare: {
    position: "absolute",
    left: 0,
    top: 0,
    borderWidth: 3,
    borderColor: "#ff2b2b",
    backgroundColor: "rgba(255, 0, 0, 0.10)",
    zIndex: 4,
  },

  /* Strong red checkmate highlight behind the king. */
  checkmateSquare: {
    position: "absolute",
    left: 0,
    top: 0,
    borderWidth: 4,
    borderColor: "#ff1f1f",
    backgroundColor: "rgba(255, 0, 0, 0.42)",
    shadowColor: "#ff0000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 14,
    zIndex: 6,
  },

  checkmatePieceGlow: {
    shadowColor: "#ff0000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 16,
    zIndex: 8,
  },

  legalDot: {
    position: "absolute",

    backgroundColor: "#27f103",

    borderWidth: 1,

    borderColor: "#0c0c0c",

    zIndex: 5,
  },

  piece: {
    zIndex: 3,
  },

  rank: {
    position: "absolute",

    top: 2,

    left: 3,

    color: "#FFFFFF",

    fontWeight: "700",

    textShadowColor: "#000",

    textShadowOffset: {
      width: 1,
      height: 1,
    },

    textShadowRadius: 5,

    zIndex: 10,
  },

  file: {
    position: "absolute",

    right: 6,

    bottom: 3,

    color: "#FFFFFF",

    fontWeight: "700",

    textShadowColor: "#000",

    textShadowOffset: {
      width: 1,
      height: 1,
    },

    textShadowRadius: 5,

    zIndex: 10,
  },

  /* ====================================================================== */
  /* CLOCK                                                                  */
  /* ====================================================================== */

  clockBadge: {
    position: "absolute",

    right: 8,

    minWidth: 74,

    height: 38,

    paddingHorizontal: 10,

    borderRadius: 10,

    backgroundColor:
      "rgba(7, 30, 43, 0.92)",

    borderWidth: 1,

    borderColor:
      "rgba(244, 160, 0, 0.45)",

    alignItems: "center",

    justifyContent: "center",

    zIndex: 50,

    elevation: 12,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.35,

    shadowRadius: 5,
  },

  clockTop: {
    top: 8,
  },

  clockBottom: {
    bottom: 8,
  },

  clockActive: {
    backgroundColor:
      "rgba(244, 160, 0, 0.96)",

    borderColor: "#FFD15A",
  },

  clockText: {
    color: "#FFFFFF",

    fontSize: 18,

    fontWeight: "900",

    letterSpacing: 0.5,
  },

  clockActiveText: {
    color: "#071E2B",
  },

  /* ====================================================================== */
  /* CAPTURED PIECES                                                        */
  /* ====================================================================== */

  capturedPanel: {
    position: "absolute",

    right: 8,

    bottom: 52,

    minHeight: 43,

    paddingHorizontal: 6,

    paddingVertical: 5,

    borderRadius: 10,

    backgroundColor:
      "rgba(7, 30, 43, 0.90)",

    borderWidth: 1,

    borderColor:
      "rgba(244, 160, 0, 0.35)",

    flexDirection: "row",

    alignItems: "flex-end",

    justifyContent: "flex-end",

    zIndex: 45,

    elevation: 10,
  },

  capturedItem: {
    position: "relative",

    alignItems: "center",

    justifyContent: "flex-end",

    marginHorizontal: 1,

    minHeight: 34,
  },

  countBadge: {
    position: "absolute",

    top: -5,

    right: -2,

    backgroundColor: "#F4A000",

    borderWidth: 1,

    borderColor: "#FFD15A",

    alignItems: "center",

    justifyContent: "center",

    zIndex: 60,

    elevation: 8,

    paddingHorizontal: 2,
  },

  countBadgeText: {
    color: "#071E2B",

    fontWeight: "900",

    textAlign: "center",
  },
});
