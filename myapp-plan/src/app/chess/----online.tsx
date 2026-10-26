import { Ionicons } from "@expo/vector-icons";
import { Chess, Square } from "chess.js";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  Alert,
  BackHandler,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import ChessBoard from "@/components/chess/ChessBoard";

import {
  ChessBoardTheme,
  ChessColor,
  ClockState,
  GameModeId,
} from "@/types/chess";

import {
  answerDraw,
  cancelMatchmaking,
  ChessChatMessage,
  ChessMatchPayload,
  connectChessSocket,
  disconnectChessSocket,
  findRandomOpponent,
  makeChessMove,
  offerDraw,
  resignGame,
  sendChessChat,
  sendFriendRequest,
} from "@/services/chessSocket";

/* -------------------------------------------------------------------------- */
/* Mode Names                                                                 */
/* -------------------------------------------------------------------------- */

const MODE_NAMES: Record<GameModeId, string> = {
  rapid: "Rapid 10 min",
  chill: "Chill 60 sec/move",
  blitz5: "Blitz 5+3",
  tempo: "Tempo 20 sec/move",
  blitz3: "Blitz 3 min",
  bullet: "Bullet 2+1",
};

/* -------------------------------------------------------------------------- */
/* Captured Pieces                                                            */
/* -------------------------------------------------------------------------- */

type CapturedPieceType =
  | "p"
  | "n"
  | "b"
  | "r"
  | "q";

type CapturedCounts = Record<
  CapturedPieceType,
  number
>;

type CapturedByColor = {
  white: CapturedCounts;
  black: CapturedCounts;
};

const PIECE_IMAGES: Record<string, any> = {
  white_p: require("@/assets/chess-pieces/white_p.png"),
  white_n: require("@/assets/chess-pieces/white_n.png"),
  white_b: require("@/assets/chess-pieces/white_b.png"),
  white_r: require("@/assets/chess-pieces/white_r.png"),
  white_q: require("@/assets/chess-pieces/white_q.png"),

  black_p: require("@/assets/chess-pieces/black_p.png"),
  black_n: require("@/assets/chess-pieces/black_n.png"),
  black_b: require("@/assets/chess-pieces/black_b.png"),
  black_r: require("@/assets/chess-pieces/black_r.png"),
  black_q: require("@/assets/chess-pieces/black_q.png"),
};

const createEmptyCapturedCounts =
  (): CapturedCounts => ({
    p: 0,
    n: 0,
    b: 0,
    r: 0,
    q: 0,
  });

const createEmptyCapturedByColor =
  (): CapturedByColor => ({
    white: createEmptyCapturedCounts(),
    black: createEmptyCapturedCounts(),
  });

const isCapturedPieceType = (
  value: unknown
): value is CapturedPieceType =>
  value === "p" ||
  value === "n" ||
  value === "b" ||
  value === "r" ||
  value === "q";

/* -------------------------------------------------------------------------- */
/* Detect Captured Piece                                                      */
/* -------------------------------------------------------------------------- */

const getCapturedPieceFromMove = (
  previousGame: Chess,
  data: any
): {
  type: CapturedPieceType;
  movingColor: ChessColor;
} | null => {
  const from =
    data?.from ??
    data?.move?.from;

  const to =
    data?.to ??
    data?.move?.to;

  /*
   * First use the actual move if available.
   */
  if (from && to) {
    try {
      const possibleMoves =
        previousGame.moves({
          verbose: true,
        }) as any[];

      const matchingMove =
        possibleMoves.find(
          (move) =>
            move.from === from &&
            move.to === to
        );

      if (
        matchingMove?.captured &&
        isCapturedPieceType(
          matchingMove.captured
        )
      ) {
        return {
          type: matchingMove.captured,

          movingColor:
            matchingMove.color === "w"
              ? "white"
              : "black",
        };
      }
    } catch {
      // FEN fallback below.
    }
  }

  /*
   * FEN fallback.
   */
  if (!data?.fen) {
    return null;
  }

  try {
    const movingColor: ChessColor =
      previousGame.turn() === "w"
        ? "white"
        : "black";

    const capturedColor: ChessColor =
      movingColor === "white"
        ? "black"
        : "white";

    const nextGame =
      new Chess(data.fen);

    const countPieces = (
      chessGame: Chess,
      pieceColor:
        | "white"
        | "black"
    ): CapturedCounts => {
      const counts =
        createEmptyCapturedCounts();

      const board =
        chessGame.board();

      for (const row of board) {
        for (const piece of row) {
          if (!piece) {
            continue;
          }

          const sameColor =
            pieceColor === "white"
              ? piece.color === "w"
              : piece.color === "b";

          if (
            sameColor &&
            isCapturedPieceType(
              piece.type
            )
          ) {
            counts[piece.type] += 1;
          }
        }
      }

      return counts;
    };

    const before =
      countPieces(
        previousGame,
        capturedColor
      );

    const after =
      countPieces(
        nextGame,
        capturedColor
      );

    const pieceTypes: CapturedPieceType[] =
      [
        "p",
        "n",
        "b",
        "r",
        "q",
      ];

    const capturedType =
      pieceTypes.find(
        (pieceType) =>
          after[pieceType] <
          before[pieceType]
      );

    if (capturedType) {
      return {
        type: capturedType,
        movingColor,
      };
    }
  } catch {
    // Ignore malformed FEN.
  }

  return null;
};

/* -------------------------------------------------------------------------- */
/* Captured Pieces Panel                                                      */
/* -------------------------------------------------------------------------- */

function CapturedPiecesPanel({
  title,
  capturedPieces,
  capturedPieceColor,
}: {
  title: string;

  capturedPieces: CapturedCounts;

  capturedPieceColor:
    | "white"
    | "black";
}) {
  const pieceTypes: CapturedPieceType[] =
    [
      "p",
      "n",
      "b",
      "r",
      "q",
    ];

  const totalCaptured =
    pieceTypes.reduce(
      (total, type) =>
        total +
        (capturedPieces[type] || 0),
      0
    );

  /*
   * Always show the panel.
   * If nothing is captured yet,
   * display the title and empty area.
   */
  return (
    <View style={styles.capturedSection}>
      {/* <View
        style={
          styles.capturedHeader
        }
      >
        <Text
          style={
            styles.capturedTitle
          }
        >
          {title}
        </Text>

        <View
          style={
            styles.capturedTotalBadge
          }
        >
          <Text
            style={
              styles.capturedTotalText
            }
          >
            {totalCaptured}
          </Text>
        </View>
      </View> */}

      <View
        style={
          styles.capturedPiecesRow
        }
      >
        {pieceTypes.map(
          (type) => {
            const count =
              capturedPieces[
                type
              ] || 0;

            /*
             * Do not display empty piece
             * types. Only show pieces that
             * have actually been captured.
             */
            if (count <= 0) {
              return null;
            }

            const asset =
              PIECE_IMAGES[
                `${capturedPieceColor}_${type}`
              ];

            return (
              <View
                key={type}
                style={
                  styles.capturedItem
                }
              >
                {/* COUNT BADGE ABOVE PIECE */}

                <View
                  style={
                    styles.countBadge
                  }
                >
                  <Text
                    style={
                      styles.countBadgeText
                    }
                  >
                    {count}
                  </Text>
                </View>

                {/* CAPTURED PIECE */}

                <Image
                  source={asset}
                  resizeMode="contain"
                  style={
                    styles.capturedPieceImage
                  }
                />
              </View>
            );
          }
        )}

        {totalCaptured === 0 && (
          <Text
            style={
              styles.noCapturedText
            }
          >
            No pieces captured
          </Text>
        )}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Time Formatter                                                             */
/* -------------------------------------------------------------------------- */

const formatTime = (
  milliseconds: number
): string => {
  const safeMilliseconds =
    Math.max(
      0,
      milliseconds || 0
    );

  const totalSeconds =
    Math.ceil(
      safeMilliseconds / 1000
    );

  const minutes =
    Math.floor(
      totalSeconds / 60
    );

  const seconds =
    totalSeconds % 60;

  return `${String(
    minutes
  ).padStart(
    2,
    "0"
  )}:${String(
    seconds
  ).padStart(
    2,
    "0"
  )}`;
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function OnlineChessScreen() {
  const params =
    useLocalSearchParams<{
      mode?: GameModeId;
    }>();

  const selectedMode: GameModeId =
    params.mode &&
    MODE_NAMES[params.mode]
      ? params.mode
      : "rapid";

  /* ------------------------------------------------------------------------ */
  /* Game State                                                               */
  /* ------------------------------------------------------------------------ */

  const [game, setGame] =
    useState<Chess>(
      () => new Chess()
    );

  const [
    capturedByColor,
    setCapturedByColor,
  ] =
    useState<CapturedByColor>(
      createEmptyCapturedByColor
    );

  const [
    selectedSquare,
    setSelectedSquare,
  ] =
    useState<Square | null>(
      null
    );

  const [color, setColor] =
    useState<ChessColor | null>(
      null
    );

  const [gameId, setGameId] =
    useState<string | null>(
      null
    );

  const [player, setPlayer] =
    useState<
      ChessMatchPayload["player"] | null
    >(null);

  const [
    opponent,
    setOpponent,
  ] =
    useState<
      ChessMatchPayload["opponent"] | null
    >(null);

  /* ------------------------------------------------------------------------ */
  /* Matchmaking                                                              */
  /* ------------------------------------------------------------------------ */

  const [searching, setSearching] =
    useState(true);

  const [started, setStarted] =
    useState(false);

  const [
    gameFinished,
    setGameFinished,
  ] =
    useState(false);

  const [
    gameResult,
    setGameResult,
  ] =
    useState("");

  /* ------------------------------------------------------------------------ */
  /* Clock                                                                    */
  /* ------------------------------------------------------------------------ */

  const [clocks, setClocks] =
    useState<ClockState>({
      white: 0,
      black: 0,
      active: null,
      serverAt: Date.now(),
    });

  const [
    displayClocks,
    setDisplayClocks,
  ] =
    useState<ClockState>({
      white: 0,
      black: 0,
      active: null,
      serverAt: Date.now(),
    });

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  const [boardTheme, setBoardTheme] =
    useState<ChessBoardTheme>(
      "wood"
    );

  const [
    settingsVisible,
    setSettingsVisible,
  ] =
    useState(false);

  const [
    chatVisible,
    setChatVisible,
  ] =
    useState(false);

  const [
    drawVisible,
    setDrawVisible,
  ] =
    useState(false);

  const [chatText, setChatText] =
    useState("");

  const [messages, setMessages] =
    useState<ChessChatMessage[]>(
      []
    );

  const [
    movePending,
    setMovePending,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  /* ------------------------------------------------------------------------ */
  /* Refs                                                                     */
  /* ------------------------------------------------------------------------ */

  const socketRef =
    useRef<any>(null);

  const gameRef =
    useRef<Chess>(
      new Chess()
    );

  const colorRef =
    useRef<ChessColor | null>(
      null
    );

  const playerRef =
    useRef<
      ChessMatchPayload["player"] | null
    >(null);

  const opponentRef =
    useRef<
      ChessMatchPayload["opponent"] | null
    >(null);

  const gameIdRef =
    useRef<string | null>(
      null
    );

  const mountedRef =
    useRef(true);

  const navigationTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  /* ------------------------------------------------------------------------ */
  /* Apply Match                                                              */
  /* ------------------------------------------------------------------------ */

  const applyMatch = (
    data: ChessMatchPayload
  ) => {
    if (!mountedRef.current) {
      return;
    }

    console.log(
      "♟️ MATCH RECEIVED:",
      JSON.stringify(
        data,
        null,
        2
      )
    );

    colorRef.current =
      data.color;

    playerRef.current =
      data.player;

    opponentRef.current =
      data.opponent;

    gameIdRef.current =
      data.gameId;

    const nextGame =
      new Chess(data.fen);

    gameRef.current =
      nextGame;

    setGame(nextGame);

    /*
     * New game = reset captured pieces.
     */
    setCapturedByColor(
      createEmptyCapturedByColor()
    );

    setGameId(
      data.gameId
    );

    setColor(
      data.color
    );

    setPlayer(
      data.player
    );

    setOpponent(
      data.opponent
    );

    setClocks(
      data.clocks
    );

    setDisplayClocks(
      data.clocks
    );

    setSelectedSquare(
      null
    );

    setSearching(false);

    setStarted(true);

    setGameFinished(
      false
    );

    setGameResult("");

    setMovePending(
      false
    );

    setErrorMessage("");

    setMessages([]);

    console.log(
      `🎨 My color: ${data.color}`
    );

    console.log(
      `👤 My name: ${data.player.name}`
    );

    console.log(
      `👤 Opponent: ${data.opponent.name}`
    );

    console.log(
      `🆔 Opponent ID: ${data.opponent.id}`
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Game Over                                                                */
  /* ------------------------------------------------------------------------ */

  const handleGameOver = (
    data: any
  ) => {
    if (!mountedRef.current) {
      return;
    }

    const myColor =
      colorRef.current;

    let result =
      "GAME OVER";

    if (
      data.reason ===
      "resignation"
    ) {
      if (
        data.resignedBy &&
        playerRef.current?.id &&
        String(
          data.resignedBy
        ) ===
          String(
            playerRef.current.id
          )
      ) {
        result =
          "YOU RESIGNED — YOU LOST";
      } else {
        result =
          "OPPONENT RESIGNED — YOU WIN";
      }
    } else if (
      data.reason ===
      "timeout"
    ) {
      if (
        data.winner &&
        myColor &&
        data.winner ===
          myColor
      ) {
        result =
          "TIME OUT — YOU WIN";
      } else {
        result =
          "TIME OUT — YOU LOST";
      }
    } else if (
      data.reason ===
      "checkmate"
    ) {
      if (
        data.winner &&
        myColor &&
        data.winner ===
          myColor
      ) {
        result =
          "CHECKMATE — YOU WIN";
      } else {
        result =
          "CHECKMATE — YOU LOST";
      }
    } else if (
      data.reason === "draw" ||
      data.reason ===
        "stalemate" ||
      data.reason ===
        "threefold" ||
      data.reason ===
        "insufficient"
    ) {
      result = "DRAW";
    } else if (
      data.reason ===
      "opponentDisconnected"
    ) {
      result =
        "OPPONENT DISCONNECTED — YOU WIN";
    } else if (
      data.winner &&
      myColor
    ) {
      result =
        data.winner ===
        myColor
          ? "YOU WIN"
          : "YOU LOST";
    }

    setGameFinished(
      true
    );

    setStarted(false);

    setSearching(false);

    setMovePending(false);

    setSelectedSquare(
      null
    );

    setGameResult(
      result
    );

    if (data.clocks) {
      setClocks(
        data.clocks
      );

      setDisplayClocks(
        data.clocks
      );
    }

    if (
      data.reason ===
        "resignation" ||
      data.reason ===
        "opponentDisconnected"
    ) {
      if (
        navigationTimerRef.current
      ) {
        clearTimeout(
          navigationTimerRef.current
        );
      }

      navigationTimerRef.current =
        setTimeout(() => {
          if (
            !mountedRef.current
          ) {
            return;
          }

          router.replace(
            "/chess"
          );
        }, 1500);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Socket Setup                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    mountedRef.current =
      true;

    let localSocket: any =
      null;

    const setupSocket =
      async () => {
        try {
          setErrorMessage("");

          localSocket =
            await connectChessSocket();

          if (
            !mountedRef.current
          ) {
            return;
          }

          socketRef.current =
            localSocket;

          /* -------------------------------------------------------------- */
          /* Searching                                                      */
          /* -------------------------------------------------------------- */

          const onSearching =
            () => {
              if (
                !mountedRef.current
              ) {
                return;
              }

              setSearching(
                true
              );

              setStarted(
                false
              );

              setGameFinished(
                false
              );
            };

          /* -------------------------------------------------------------- */
          /* Match Found                                                    */
          /* -------------------------------------------------------------- */

          const onMatchFound =
            (
              data: ChessMatchPayload
            ) => {
              applyMatch(
                data
              );
            };

          /* -------------------------------------------------------------- */
          /* Game Ready                                                     */
          /* -------------------------------------------------------------- */

          const onGameReady =
            (
              data: ChessMatchPayload
            ) => {
              applyMatch(
                data
              );
            };

          /* -------------------------------------------------------------- */
          /* Move Made                                                      */
          /* -------------------------------------------------------------- */

          const onMoveMade =
            (data: any) => {
              if (
                !mountedRef.current
              ) {
                return;
              }

              const previousGame =
                gameRef.current;

              /*
               * IMPORTANT:
               *
               * Captured pieces are calculated
               * here in ONLINE SCREEN only.
               */
              if (data.fen) {
                const captured =
                  getCapturedPieceFromMove(
                    previousGame,
                    data
                  );

                if (captured) {
                  setCapturedByColor(
                    (
                      previous
                    ) => ({
                      ...previous,

                      [captured.movingColor]:
                        {
                          ...previous[
                            captured.movingColor
                          ],

                          [captured.type]:
                            previous[
                              captured.movingColor
                            ][
                              captured.type
                            ] + 1,
                        },
                    })
                  );
                }

                const nextGame =
                  new Chess(
                    data.fen
                  );

                gameRef.current =
                  nextGame;

                setGame(
                  nextGame
                );
              }

              setSelectedSquare(
                null
              );

              setMovePending(
                false
              );

              if (
                data.clocks
              ) {
                setClocks(
                  data.clocks
                );

                setDisplayClocks(
                  data.clocks
                );
              }

              if (
                data.gameOver
              ) {
                setGameFinished(
                  true
                );

                setStarted(
                  false
                );
              }
            };

          /* -------------------------------------------------------------- */
          /* Clock                                                          */
          /* -------------------------------------------------------------- */

          const onClock =
            (
              data: ClockState
            ) => {
              if (
                !mountedRef.current
              ) {
                return;
              }

              setClocks(
                data
              );

              setDisplayClocks(
                data
              );
            };

          /* -------------------------------------------------------------- */
          /* Chat                                                           */
          /* -------------------------------------------------------------- */

          const onChat =
            (
              message: ChessChatMessage
            ) => {
              if (
                !mountedRef.current
              ) {
                return;
              }

              setMessages(
                (previous) => {
                  const exists =
                    previous.some(
                      (
                        item
                      ) =>
                        item.id ===
                        message.id
                    );

                  if (
                    exists
                  ) {
                    return previous;
                  }

                  return [
                    ...previous,
                    message,
                  ];
                }
              );
            };

          /* -------------------------------------------------------------- */
          /* Draw Offer                                                      */
          /* -------------------------------------------------------------- */

          const onDrawOffer =
            () => {
              if (
                !mountedRef.current
              ) {
                return;
              }

              setDrawVisible(
                true
              );
            };

          /* -------------------------------------------------------------- */
          /* Draw Declined                                                   */
          /* -------------------------------------------------------------- */

          const onDrawDeclined =
            () => {
              if (
                !mountedRef.current
              ) {
                return;
              }

              Alert.alert(
                "Draw Declined",
                "Your opponent declined the draw offer."
              );
            };

          /* -------------------------------------------------------------- */
          /* Friend Request Sent                                             */
          /* -------------------------------------------------------------- */

          const onFriendRequestSent =
            (data: any) => {
              if (
                !mountedRef.current
              ) {
                return;
              }

              Alert.alert(
                "Friend Request",
                `Friend request sent to ${
                  data?.toName ||
                  opponentRef
                    .current
                    ?.name ||
                  "your opponent"
                }.`
              );
            };

          /* -------------------------------------------------------------- */
          /* Incoming Friend Request                                         */
          /* -------------------------------------------------------------- */

          const onFriendRequest =
            (data: any) => {
              if (
                !mountedRef.current
              ) {
                return;
              }

              Alert.alert(
                "Friend Request",
                `${
                  data?.fromName ||
                  "Your opponent"
                } sent you a friend request.`
              );
            };

          /* -------------------------------------------------------------- */
          /* Game Over                                                       */
          /* -------------------------------------------------------------- */

          const onGameOver =
            (data: any) => {
              handleGameOver(
                data
              );
            };

          /* -------------------------------------------------------------- */
          /* Socket Error                                                    */
          /* -------------------------------------------------------------- */

          const onSocketError =
            (data: any) => {
              if (
                !mountedRef.current
              ) {
                return;
              }

              console.error(
                "❌ Chess socket error:",
                data
              );

              setMovePending(
                false
              );

              setErrorMessage(
                data?.message ||
                  "Something went wrong."
              );
            };

          /* -------------------------------------------------------------- */
          /* Register Listeners                                               */
          /* -------------------------------------------------------------- */

          localSocket.on(
            "chess:searching",
            onSearching
          );

          localSocket.on(
            "chess:matchFound",
            onMatchFound
          );

          localSocket.on(
            "chess:gameReady",
            onGameReady
          );

          localSocket.on(
            "chess:moveMade",
            onMoveMade
          );

          localSocket.on(
            "chess:clock",
            onClock
          );

          localSocket.on(
            "chess:chat",
            onChat
          );

          localSocket.on(
            "chess:drawOffer",
            onDrawOffer
          );

          localSocket.on(
            "chess:drawDeclined",
            onDrawDeclined
          );

          localSocket.on(
            "friend:requestSent",
            onFriendRequestSent
          );

          localSocket.on(
            "friend:request",
            onFriendRequest
          );

          localSocket.on(
            "chess:gameOver",
            onGameOver
          );

          localSocket.on(
            "chess:error",
            onSocketError
          );

          /*
           * Start matchmaking.
           */
          findRandomOpponent(
            selectedMode
          );
        } catch (
          error: any
        ) {
          console.error(
            "❌ Chess socket setup error:",
            error
          );

          if (
            !mountedRef.current
          ) {
            return;
          }

          setSearching(
            false
          );

          setErrorMessage(
            error?.message ||
              "Unable to connect to chess server."
          );
        }
      };

    setupSocket();

    return () => {
      mountedRef.current =
        false;

      if (
        navigationTimerRef.current
      ) {
        clearTimeout(
          navigationTimerRef.current
        );

        navigationTimerRef.current =
          null;
      }

      try {
        cancelMatchmaking();
      } catch (
        error
      ) {
        console.log(
          "Cleanup matchmaking error:",
          error
        );
      }

      try {
        disconnectChessSocket();
      } catch (
        error
      ) {
        console.log(
          "Cleanup socket error:",
          error
        );
      }
    };
  }, [
    selectedMode,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Local Clock                                                              */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (
      !started ||
      gameFinished
    ) {
      setDisplayClocks(
        clocks
      );

      return;
    }

    const updateClock =
      () => {
        const now =
          Date.now();

        const elapsed =
          Math.max(
            0,
            now -
              clocks.serverAt
          );

        const nextClock: ClockState =
          {
            ...clocks,

            white:
              clocks.active ===
              "white"
                ? Math.max(
                    0,
                    clocks.white -
                      elapsed
                  )
                : clocks.white,

            black:
              clocks.active ===
              "black"
                ? Math.max(
                    0,
                    clocks.black -
                      elapsed
                  )
                : clocks.black,
          };

        setDisplayClocks(
          nextClock
        );
      };

    updateClock();

    const interval =
      setInterval(
        updateClock,
        100
      );

    return () => {
      clearInterval(
        interval
      );
    };
  }, [
    clocks,
    started,
    gameFinished,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Android Back Button                                                      */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const subscription =
      BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (
            started &&
            !gameFinished &&
            gameId
          ) {
            Alert.alert(
              "Resign Game?",
              "Are you sure you want to resign?",
              [
                {
                  text: "Continue",
                  style: "cancel",
                },
                {
                  text: "Resign",
                  style: "destructive",
                  onPress: () => {
                    resignGame(
                      gameId
                    );
                  },
                },
              ]
            );

            return true;
          }

          router.replace(
            "/chess"
          );

          return true;
        }
      );

    return () => {
      subscription.remove();
    };
  }, [
    started,
    gameFinished,
    gameId,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Top Back Button                                                          */
  /* ------------------------------------------------------------------------ */

  const handleBackPress =
    () => {
      if (
        started &&
        !gameFinished &&
        gameId
      ) {
        Alert.alert(
          "Resign Game?",
          "Are you sure you want to resign?",
          [
            {
              text: "Continue",
              style: "cancel",
            },
            {
              text: "Resign",
              style: "destructive",
              onPress: () => {
                resignGame(
                  gameId
                );
              },
            },
          ]
        );

        return;
      }

      router.replace(
        "/chess"
      );
    };

  /* ------------------------------------------------------------------------ */
  /* Cancel Search                                                            */
  /* ------------------------------------------------------------------------ */

  const handleCancelSearch =
    () => {
      setSearching(false);

      setStarted(false);

      setGameFinished(
        false
      );

      try {
        cancelMatchmaking();
      } catch (
        error
      ) {
        console.log(
          "Cancel matchmaking error:",
          error
        );
      }

      router.replace(
        "/chess"
      );
    };

  /* ------------------------------------------------------------------------ */
  /* Board Square Press                                                       */
  /* ------------------------------------------------------------------------ */

  const handleSquarePress =
    (
      square: Square
    ) => {
      if (
        !started ||
        gameFinished ||
        movePending ||
        !color ||
        !gameId
      ) {
        return;
      }

      const myTurnColor =
        color === "white"
          ? "w"
          : "b";

      if (
        game.turn() !==
        myTurnColor
      ) {
        return;
      }

      const piece =
        game.get(square);

      if (
        !selectedSquare
      ) {
        if (
          !piece ||
          piece.color !==
            myTurnColor
        ) {
          return;
        }

        setSelectedSquare(
          square
        );

        return;
      }

      if (
        selectedSquare ===
        square
      ) {
        setSelectedSquare(
          null
        );

        return;
      }

      if (
        piece &&
        piece.color ===
          myTurnColor
      ) {
        setSelectedSquare(
          square
        );

        return;
      }

      try {
        const testGame =
          new Chess(
            game.fen()
          );

        const move =
          testGame.move({
            from:
              selectedSquare,
            to: square,
            promotion: "q",
          });

        if (!move) {
          return;
        }

        setMovePending(
          true
        );

        setSelectedSquare(
          null
        );

        makeChessMove(
          gameId,
          selectedSquare,
          square,
          "q"
        );
      } catch (
        error
      ) {
        console.log(
          "Illegal chess move:",
          error
        );
      }
    };

  /* ------------------------------------------------------------------------ */
  /* Chat                                                                     */
  /* ------------------------------------------------------------------------ */

  const handleSendChat =
    () => {
      const message =
        chatText.trim();

      if (
        !message ||
        !gameId
      ) {
        return;
      }

      sendChessChat(
        gameId,
        message
      );

      setChatText("");
    };

  /* ------------------------------------------------------------------------ */
  /* Draw                                                                     */
  /* ------------------------------------------------------------------------ */

  const handleOfferDraw =
    () => {
      if (!gameId) {
        return;
      }

      offerDraw(
        gameId
      );

      Alert.alert(
        "Draw Offer",
        "Draw offer sent to your opponent."
      );
    };

  const handleDrawAnswer =
    (
      accepted: boolean
    ) => {
      setDrawVisible(
        false
      );

      if (!gameId) {
        return;
      }

      answerDraw(
        gameId,
        accepted
      );
    };

  /* ------------------------------------------------------------------------ */
  /* Friend Request                                                           */
  /* ------------------------------------------------------------------------ */

  const handleFriendRequest =
    () => {
      const opponentId =
        opponentRef.current
          ?.id;

      if (!opponentId) {
        Alert.alert(
          "Friend Request",
          "Opponent ID is not available."
        );

        return;
      }

      sendFriendRequest(
        opponentId
      );
    };

  /* ------------------------------------------------------------------------ */
  /* Searching Screen                                                         */
  /* ------------------------------------------------------------------------ */

  if (searching) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <View
          style={
            styles.searchScreen
          }
        >
          <Pressable
            style={
              styles.backButton
            }
            onPress={
              handleCancelSearch
            }
          >
            <Ionicons
              name="arrow-back"
              size={25}
              color="#ffffff"
            />
          </Pressable>
{/*  */}
          <View
            style={
              styles.searchIconCircle
            }
          >
            <Ionicons
              name="search"
              size={42}
              color="#ff8a00"
            />
          </View>

          <Text
            style={
              styles.searchTitle
            }
          >
            Searching for Opponent
          </Text>

          <Text
            style={
              styles.searchSubtitle
            }
          >
            Searching for another
            player using the same
            time control
          </Text>

          <View
            style={
              styles.modeBadge
            }
          >
            <Ionicons
              name="time-outline"
              size={18}
              color="#ff9d2e"
            />

            <Text
              style={
                styles.modeBadgeText
              }
            >
              {
                MODE_NAMES[
                  selectedMode
                ]
              }
            </Text>
          </View>

          {errorMessage ? (
            <Text
              style={
                styles.errorText
              }
            >
              {errorMessage}
            </Text>
          ) : null}

          <Pressable
            style={
              styles.cancelSearchButton
            }
            onPress={
              handleCancelSearch
            }
          >
            <Text
              style={
                styles.cancelButtonText
              }
            >
              CANCEL
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Which pieces each player captured                                       */
  /* ------------------------------------------------------------------------ */

  /*
   * capturedByColor.white
   *
   * = WHITE pieces captured by BLACK.
   *
   * If I am WHITE:
   *   my captured pieces =
   *   black pieces captured by me
   *
   * Therefore:
   *
   * My panel -> pieces of opponent color
   * Opponent panel -> pieces of my color
   */

  const myCapturedPieces =
    capturedByColor[
      color === "white"
        ? "black"
        : "white"
    ];

  const opponentCapturedPieces =
    capturedByColor[
      color === "white"
        ? "white"
        : "black"
    ];

  const myCapturedPieceColor:
    | "white"
    | "black" =
    color === "white"
      ? "white"
      : "black";

  const opponentCapturedPieceColor:
    | "white"
    | "black" =
    color === "white"
      ? "black"
      : "white";

  /* ------------------------------------------------------------------------ */
  /* Main Game Screen                                                         */
  /* ------------------------------------------------------------------------ */

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* ================================================================ */}
        {/* HEADER                                                           */}
        {/* ================================================================ */}

        <View
          style={
            styles.header
          }
        >
          <Pressable
            style={
              styles.headerIconButton
            }
            onPress={
              handleBackPress
            }
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color="#ffffff"
            />
          </Pressable>

          <View
            style={
              styles.headerCenter
            }
          >
            <Text
              style={
                styles.headerTitle
              }
            >
              ONLINE CHESS
            </Text>

            <Text
              style={
                styles.headerMode
              }
            >
              {
                MODE_NAMES[
                  selectedMode
                ]
              }
            </Text>
          </View>

          <Pressable
            style={
              styles.headerIconButton
            }
            onPress={() =>
              setSettingsVisible(
                true
              )
            }
          >
            <Ionicons
              name="settings-outline"
              size={23}
              color="#ffffff"
            />
          </Pressable>
        </View>

        {/* ================================================================ */}
        {/* OPPONENT CARD                                                    */}
        {/* ================================================================ */}

        <View
          style={
            styles.playerCard
          }
        >
          <View
            style={
              styles.playerAvatar
            }
          >
            <Text
              style={
                styles.avatarText
              }
            >
              {(
                opponent?.name ||
                "?"
              )
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View
            style={
              styles.playerInfo
            }
          >
            <Text
              style={
                styles.playerName
              }
              numberOfLines={1}
            >
              {
                opponent?.name ||
                "Opponent"
              }
            </Text>

            <View
              style={[
                styles.clock,
                clocks.active ===
                  (color ===
                  "black"
                    ? "white"
                    : "black") &&
                  styles.activeClock,
              ]}
            >
              <Text
                style={
                  styles.clockText
                }
              >
                ⏱️{" "}
                {formatTime(
                  color ===
                    "black"
                    ? displayClocks.white
                    : displayClocks.black
                )}
              </Text>
            </View>
          </View>
          <CapturedPiecesPanel
          title="Captured by You"
          capturedPieces={
            myCapturedPieces
          }
          capturedPieceColor={
            myCapturedPieceColor
          }
        />
        </View>

        {/* ================================================================ */}
        {/* OPPONENT CAPTURED PIECES                                        */}
        {/* ================================================================ */}

        

        {/* ================================================================ */}
        {/* BOARD                                                            */}
        {/* ================================================================ */}

        <View
          style={
            styles.boardContainer
          }
        >
          <ChessBoard
            game={game}
            selectedSquare={
              selectedSquare
            }
            onSquarePress={
              handleSquarePress
            }
            theme={
              boardTheme
            }
            orientation={
              color === "black"
                ? "black"
                : "white"
            }
          />
        </View>

        {/* ================================================================ */}
        {/* MY CAPTURED PIECES                                               */}
        {/* ================================================================ */}

        

        {/* ================================================================ */}
        {/* CURRENT PLAYER CARD                                             */}
        {/* ================================================================ */}

        <View
          style={
            styles.playerCard
          }
        >
          <View
            style={
              styles.playerAvatar
            }
          >
            <Text
              style={
                styles.avatarText
              }
            >
              {(
                player?.name ||
                "?"
              )
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View
            style={
              styles.playerInfo
            }
          >
            <Text
              style={
                styles.playerName
              }
              numberOfLines={1}
            >
              {
                player?.name ||
                "You"
              }
            </Text>

            <View
              style={[
                styles.clock,
                clocks.active ===
                  (color ===
                  "black"
                    ? "black"
                    : "white") &&
                  styles.activeClock,
              ]}
            >
              <Text
                style={
                  styles.clockText
                }
              >
                ⏱️{" "}
                {formatTime(
                  color ===
                    "black"
                    ? displayClocks.black
                    : displayClocks.white
                )}
              </Text>
            </View>
          </View>
          <CapturedPiecesPanel
          title="Captured by Opponent"
          capturedPieces={
            opponentCapturedPieces
          }
          capturedPieceColor={
            opponentCapturedPieceColor
          }
        />
        </View>

        {/* ================================================================ */}
        {/* ACTIONS                                                          */}
        {/* ================================================================ */}

        <View
          style={
            styles.actionsRow
          }
        >
          <Pressable
            style={
              styles.actionButton
            }
            onPress={() =>
              setChatVisible(
                true
              )
            }
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color="#ffffff"
            />

            <Text
              style={
                styles.actionText
              }
            >
              Chat
            </Text>
          </Pressable>

          <Pressable
            style={
              styles.actionButton
            }
            onPress={
              handleOfferDraw
            }
          >
            <Ionicons
              name="hand-left-outline"
              size={22}
              color="#ffffff"
            />

            <Text
              style={
                styles.actionText
              }
            >
              Draw
            </Text>
          </Pressable>

          <Pressable
            style={
              styles.actionButton
            }
            onPress={
              handleFriendRequest
            }
          >
            <Ionicons
              name="person-add-outline"
              size={22}
              color="#ffffff"
            />

            <Text
              style={
                styles.actionText
              }
            >
              Friend
            </Text>
          </Pressable>

          <Pressable
            style={
              styles.resignButton
            }
            onPress={() => {
              if (!gameId) {
                return;
              }

              Alert.alert(
                "Resign Game?",
                "Are you sure you want to resign?",
                [
                  {
                    text: "Continue",
                    style: "cancel",
                  },
                  {
                    text: "Resign",
                    style: "destructive",
                    onPress: () => {
                      resignGame(
                        gameId
                      );
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons
              name="flag-outline"
              size={22}
              color="#ffffff"
            />

            <Text
              style={
                styles.actionText
              }
            >
              Resign
            </Text>
          </Pressable>
        </View>

        {/* ================================================================ */}
        {/* ERROR                                                            */}
        {/* ================================================================ */}

        {errorMessage ? (
          <Text
            style={
              styles.errorText
            }
          >
            {errorMessage}
          </Text>
        ) : null}

        {/* ================================================================ */}
        {/* GAME RESULT                                                      */}
        {/* ================================================================ */}

        {gameFinished &&
        gameResult ? (
          <View
            style={
              styles.resultCard
            }
          >
            <Text
              style={
                styles.resultTitle
              }
            >
              {gameResult}
            </Text>

            {gameResult.includes(
              "RESIGNED"
            ) ? (
              <Text
                style={
                  styles.resultSubText
                }
              >
                Returning to Chess Home...
              </Text>
            ) : (
              <Pressable
                style={
                  styles.homeButton
                }
                onPress={() =>
                  router.replace(
                    "/chess"
                  )
                }
              >
                <Text
                  style={
                    styles.homeButtonText
                  }
                >
                  BACK TO CHESS
                </Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* ================================================================ */}
      {/* BOARD SETTINGS MODAL                                             */}
      {/* ================================================================ */}

      <Modal
        visible={
          settingsVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSettingsVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              BOARD SETTINGS
            </Text>

            {(
              [
                "wood",
                "marble",
                "neon",
              ] as ChessBoardTheme[]
            ).map(
              (theme) => (
                <Pressable
                  key={
                    theme
                  }
                  style={[
                    styles.themeButton,
                    boardTheme ===
                      theme &&
                      styles.themeButtonActive,
                  ]}
                  onPress={() => {
                    setBoardTheme(
                      theme
                    );

                    setSettingsVisible(
                      false
                    );
                  }}
                >
                  <Text
                    style={
                      styles.themeButtonText
                    }
                  >
                    {theme
                      .charAt(
                        0
                      )
                      .toUpperCase() +
                      theme.slice(
                        1
                      )}
                  </Text>
                </Pressable>
              )
            )}

            <Pressable
              style={
                styles.closeButton
              }
              onPress={() =>
                setSettingsVisible(
                  false
                )
              }
            >
              <Text
                style={
                  styles.closeButtonText
                }
              >
                CLOSE
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ================================================================ */}
      {/* CHAT MODAL                                                       */}
      {/* ================================================================ */}

      <Modal
        visible={
          chatVisible
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setChatVisible(
            false
          )
        }
      >
        <View
          style={
            styles.chatOverlay
          }
        >
          <View
            style={
              styles.chatCard
            }
          >
            <View
              style={
                styles.chatHeader
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                CHAT
              </Text>

              <Pressable
                onPress={() =>
                  setChatVisible(
                    false
                  )
                }
              >
                <Ionicons
                  name="close"
                  size={27}
                  color="#ffffff"
                />
              </Pressable>
            </View>

            <ScrollView
              style={
                styles.messagesList
              }
              contentContainerStyle={
                styles.messagesContent
              }
            >
              {messages.length ===
              0 ? (
                <Text
                  style={
                    styles.emptyChatText
                  }
                >
                  No messages yet.
                </Text>
              ) : (
                messages.map(
                  (
                    message
                  ) => {
                    const mine =
                      message.from ===
                      player?.id;

                    return (
                      <View
                        key={
                          message.id
                        }
                        style={[
                          styles.messageBubble,
                          mine
                            ? styles.myMessage
                            : styles.opponentMessage,
                        ]}
                      >
                        <Text
                          style={
                            styles.messageSender
                          }
                        >
                          {mine
                            ? "You"
                            : message.fromName}
                        </Text>

                        <Text
                          style={
                            styles.messageSenderId
                          }
                        >
                          ID:{" "}
                          {
                            message.from
                          }
                        </Text>

                        <Text
                          style={
                            styles.messageText
                          }
                        >
                          {
                            message.message
                          }
                        </Text>
                      </View>
                    );
                  }
                )
              )}
            </ScrollView>

            <View
              style={
                styles.chatInputRow
              }
            >
              <TextInput
                value={
                  chatText
                }
                onChangeText={
                  setChatText
                }
                placeholder="Type a message..."
                placeholderTextColor="#8d94a3"
                style={
                  styles.chatInput
                }
                multiline
              />

              <Pressable
                style={
                  styles.sendButton
                }
                onPress={
                  handleSendChat
                }
              >
                <Ionicons
                  name="send"
                  size={21}
                  color="#ffffff"
                />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================================ */}
      {/* DRAW MODAL                                                       */}
      {/* ================================================================ */}

      <Modal
        visible={
          drawVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setDrawVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              DRAW OFFER
            </Text>

            <Text
              style={
                styles.drawText
              }
            >
              {
                opponent?.name ||
                "Your opponent"
              }{" "}
              offered a draw.
            </Text>

            <View
              style={
                styles.drawButtons
              }
            >
              <Pressable
                style={
                  styles.acceptDrawButton
                }
                onPress={() =>
                  handleDrawAnswer(
                    true
                  )
                }
              >
                <Text
                  style={
                    styles.drawButtonText
                  }
                >
                  ACCEPT
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.rejectDrawButton
                }
                onPress={() =>
                  handleDrawAnswer(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.drawButtonText
                  }
                >
                  DECLINE
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ========================================================================== */
/* STYLES                                                                     */
/* ========================================================================== */

const styles = StyleSheet.create({
  container: {
    marginTop:30,
    flex: 1,
    backgroundColor: "#08111f",
  },

  scrollContent: {
    paddingBottom: 30,
  },

  /* ---------------------------------------------------------------------- */
  /* SEARCH                                                                  */
  /* ---------------------------------------------------------------------- */

  searchScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  backButton: {
    position: "absolute",
    top: 20,
    left: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#142237",
  },

  searchIconCircle: {
    width: 95,
    height: 95,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#142237",
    marginBottom: 24,
  },

  searchTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },

  searchSubtitle: {
    color: "#a8b1c2",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 12,
    maxWidth: 320,
  },

  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#142237",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
    marginTop: 22,
  },

  modeBadgeText: {
    color: "#ff9d2e",
    fontSize: 14,
    fontWeight: "700",
  },

  cancelSearchButton: {
    marginTop: 35,
    width: "80%",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#b72d35",
  },

  cancelButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
  },

  /* ---------------------------------------------------------------------- */
  /* HEADER                                                                  */
  /* ---------------------------------------------------------------------- */

  header: {
    height: 65,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "#0c1829",
  },

  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#142237",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },

  headerMode: {
    color: "#ff9d2e",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "700",
  },

  /* ---------------------------------------------------------------------- */
  /* PLAYER CARD                                                             */
  /* ---------------------------------------------------------------------- */

  playerCard: {
    marginHorizontal: 12,
    marginTop: 10,
    minHeight: 72,
    borderRadius: 15,
    backgroundColor: "#111f32",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  playerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#253a55",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#ff9d2e",
    fontSize: 20,
    fontWeight: "900",
  },

  playerInfo: {
    flex: 1,
    marginLeft: 11,
  },

  playerName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },

  clock: {
    width: 90,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 10,
    marginTop: 4,
    justifyContent: "center",
    backgroundColor: "#07101d",
    borderWidth: 1,
    borderColor: "#26374e",
  },

  activeClock: {
    color: "#27f103",
    borderColor: "#ff9d2e",
    backgroundColor: "#1b2430",
  },

  clockText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    fontVariant: [
      "tabular-nums",
    ],
  },

  /* ---------------------------------------------------------------------- */
  /* BOARD                                                                   */
  /* ---------------------------------------------------------------------- */

  boardContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },

  /* ---------------------------------------------------------------------- */
  /* CAPTURED PIECES                                                         */
  /* ---------------------------------------------------------------------- */

  capturedSection: {
    marginHorizontal: 12,
    marginTop: 7,
    marginBottom: 4,
    minHeight: 65,
    borderRadius: 14,
    backgroundColor: "#111f32",
    borderWidth: 1,
    borderColor: "#26374e",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  capturedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 22,
  },

  capturedTitle: {
    color: "#aeb9c9",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  // capturedTotalBadge: {
  //   minWidth: 21,
  //   height: 21,
  //   borderRadius: 11,
  //   backgroundColor: "#e87800",
  //   alignItems: "center",
  //   justifyContent: "center",
  //   paddingHorizontal: 5,
  // },

  capturedTotalText: {
    color: "#08111f",
    fontSize: 10,
    fontWeight: "900",
  },

  capturedPiecesRow: {
    minHeight: 35,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  capturedItem: {
    position: "relative",
    width: 36,
    height: 38,
    alignItems: "center",
    justifyContent: "flex-end",
    marginRight: 3,
  },

  capturedPieceImage: {
    width: 30,
    height: 30,
  },

  /*
   * COUNT BADGE
   *
   * This sits above the captured piece.
   */
  countBadge: {
    position: "absolute",
    top: -2,
    right: -1,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 3,
    backgroundColor: "#F4A000",
    borderWidth: 1,
    borderColor: "#FFD15A",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 5,
  },

  countBadgeText: {
    color: "#071E2B",
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
  },

  noCapturedText: {
    color: "#59687b",
    fontSize: 10,
    fontStyle: "italic",
    marginLeft: 3,
  },

  /* ---------------------------------------------------------------------- */
  /* ACTIONS                                                                 */
  /* ---------------------------------------------------------------------- */

  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    gap: 7,
    marginTop: 12,
  },

  actionButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: "#142237",
    alignItems: "center",
    justifyContent: "center",
  },

  resignButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: "#9f3038",
    alignItems: "center",
    justifyContent: "center",
  },

  actionText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },

  /* ---------------------------------------------------------------------- */
  /* ERROR                                                                   */
  /* ---------------------------------------------------------------------- */

  errorText: {
    color: "#ff6974",
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 20,
  },

  /* ---------------------------------------------------------------------- */
  /* RESULT                                                                  */
  /* ---------------------------------------------------------------------- */

  resultCard: {
    marginHorizontal: 14,
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: "#142237",
    padding: 20,
    alignItems: "center",
  },

  resultTitle: {
    color: "#ff9d2e",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },

  resultSubText: {
    color: "#9ca7b7",
    fontSize: 13,
    marginTop: 8,
  },

  homeButton: {
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#ff8a00",
  },

  homeButtonText: {
    color: "#08111f",
    fontSize: 13,
    fontWeight: "900",
  },

  /* ---------------------------------------------------------------------- */
  /* MODAL                                                                   */
  /* ---------------------------------------------------------------------- */

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 18,
    backgroundColor: "#111f32",
    padding: 22,
  },

  modalTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 18,
  },

  themeButton: {
    height: 48,
    borderRadius: 11,
    backgroundColor: "#182940",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  themeButtonActive: {
    backgroundColor: "#b86213",
  },

  themeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  closeButton: {
    height: 46,
    borderRadius: 11,
    backgroundColor: "#29384d",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  closeButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },

  /* ---------------------------------------------------------------------- */
  /* CHAT                                                                    */
  /* ---------------------------------------------------------------------- */

  chatOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },

  chatCard: {
    height: "78%",
    backgroundColor: "#0e1a2b",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 15,
  },

  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  messagesList: {
    flex: 1,
  },

  messagesContent: {
    paddingVertical: 10,
  },

  emptyChatText: {
    color: "#8995a8",
    textAlign: "center",
    marginTop: 30,
  },

  messageBubble: {
    maxWidth: "82%",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 13,
    marginBottom: 8,
  },

  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#9b570e",
  },

  opponentMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#1b2b40",
  },

  messageSender: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },

  messageSenderId: {
    color: "#b7c0ce",
    fontSize: 9,
    marginTop: 2,
  },

  messageText: {
    color: "#ffffff",
    fontSize: 14,
    marginTop: 5,
  },

  chatInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 8,
  },

  chatInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 100,
    borderRadius: 12,
    backgroundColor: "#182940",
    color: "#ffffff",
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 14,
  },

  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#e87800",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ---------------------------------------------------------------------- */
  /* DRAW                                                                    */
  /* ---------------------------------------------------------------------- */

  drawText: {
    color: "#c1cad7",
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 20,
  },

  drawButtons: {
    flexDirection: "row",
    gap: 10,
  },

  acceptDrawButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#268a58",
    alignItems: "center",
    justifyContent: "center",
  },

  rejectDrawButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#9f3038",
    alignItems: "center",
    justifyContent: "center",
  },

  drawButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
});