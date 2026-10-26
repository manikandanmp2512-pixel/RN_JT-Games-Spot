import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

import ChessGameResultModal from "@/components/chess/ChessGameResultModal";
import { calculateStatsFromGame } from "@/utils/chessGameStats";


import ChessRewardModePicker from "@/components/chess/ChessRewardModePicker";

import { ChessRewardMode, ChessRewardModeId } from "@/types/chessRewards";
import type { ChessPieceSet } from "@/components/chess/ChessBoard";
import { CHESS_PIECE_SET_STORAGE_KEY } from "@/components/chess/ChessBoard";

import ChessBoard, {
  type BoardImageTheme,
} from "@/components/chess/ChessBoard";
import ChessGameSettings, {
  useChessSettings,
} from "@/components/chess/ChessGameSettings";
import { playChessMoveSound } from "@/components/chess/chessSound";
// import { showGameCompletionAd } from "@/services/chessAds";
import {
  ChessColor,
  ClockState,
  GameModeId
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

  const PIECE_SETS: Record<ChessPieceSet, Record<string, any>> = {
    set_1: {
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
    },
    set_2: {
      white_p: require("@/assets/chess-pieces/set_2/white_p.png"),
      white_n: require("@/assets/chess-pieces/set_2/white_n.png"),
      white_b: require("@/assets/chess-pieces/set_2/white_b.png"),
      white_r: require("@/assets/chess-pieces/set_2/white_r.png"),
      white_q: require("@/assets/chess-pieces/set_2/white_q.png"),
      white_k: require("@/assets/chess-pieces/set_2/white_k.png"),
      black_p: require("@/assets/chess-pieces/set_2/black_p.png"),
      black_n: require("@/assets/chess-pieces/set_2/black_n.png"),
      black_b: require("@/assets/chess-pieces/set_2/black_b.png"),
      black_r: require("@/assets/chess-pieces/set_2/black_r.png"),
      black_q: require("@/assets/chess-pieces/set_2/black_q.png"),
      black_k: require("@/assets/chess-pieces/set_2/black_k.png"),
    },
    set_3: {
      white_p: require("@/assets/chess-pieces/set_3/white_p.png"),
      white_n: require("@/assets/chess-pieces/set_3/white_n.png"),
      white_b: require("@/assets/chess-pieces/set_3/white_b.png"),
      white_r: require("@/assets/chess-pieces/set_3/white_r.png"),
      white_q: require("@/assets/chess-pieces/set_3/white_q.png"),
      white_k: require("@/assets/chess-pieces/set_3/white_k.png"),
      black_p: require("@/assets/chess-pieces/set_3/black_p.png"),
      black_n: require("@/assets/chess-pieces/set_3/black_n.png"),
      black_b: require("@/assets/chess-pieces/set_3/black_b.png"),
      black_r: require("@/assets/chess-pieces/set_3/black_r.png"),
      black_q: require("@/assets/chess-pieces/set_3/black_q.png"),
      black_k: require("@/assets/chess-pieces/set_3/black_k.png"),
    },
    set_4: {
      white_p: require("@/assets/chess-pieces/set_4/white_p.png"),
      white_n: require("@/assets/chess-pieces/set_4/white_n.png"),
      white_b: require("@/assets/chess-pieces/set_4/white_b.png"),
      white_r: require("@/assets/chess-pieces/set_4/white_r.png"),
      white_q: require("@/assets/chess-pieces/set_4/white_q.png"),
      white_k: require("@/assets/chess-pieces/set_4/white_k.png"),
      black_p: require("@/assets/chess-pieces/set_4/black_p.png"),
      black_n: require("@/assets/chess-pieces/set_4/black_n.png"),
      black_b: require("@/assets/chess-pieces/set_4/black_b.png"),
      black_r: require("@/assets/chess-pieces/set_4/black_r.png"),
      black_q: require("@/assets/chess-pieces/set_4/black_q.png"),
      black_k: require("@/assets/chess-pieces/set_4/black_k.png"),
    },
  };

  const BOARD_THEME_STORAGE_KEY = "@jaytech/online-chess-board-theme";

  const BOARD_THEMES: {
    id: BoardImageTheme;
    label: string;
    image: number;
  }[] = [
    { id: "images_1", label: "Classic", image: require("@/assets/chess/images_1.png") },
    { id: "images_2", label: "Theme 2", image: require("@/assets/chess/images_2.png") },
    { id: "images_3", label: "Theme 3", image: require("@/assets/chess/images_3.png") },
    { id: "images_4", label: "Theme 4", image: require("@/assets/chess/images_4.png") },
    { id: "images_5", label: "Theme 5", image: require("@/assets/chess/images_5.png") },
    { id: "images_6", label: "Theme 6", image: require("@/assets/chess/images_6.png") },
    { id: "images_7", label: "Theme 7", image: require("@/assets/chess/images_7.png") },
    { id: "images_8", label: "Theme 8", image: require("@/assets/chess/images_8.png") },
    { id: "images_9", label: "Theme 9", image: require("@/assets/chess/images_9.png") },
    { id: "images_10", label: "Theme 10", image: require("@/assets/chess/images_10.png") },
  ];

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


  /* Chess material scoring: king is deliberately not assigned points. */
  const PIECE_POINT_VALUES: Record<CapturedPieceType, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 10,
  };

  const getMaterialPoints = (
    chessGame: Chess,
    pieceColor: ChessColor
  ): number => {
    return chessGame.board().reduce((total, row) => {
      return total + row.reduce((rowTotal, piece) => {
        if (!piece || (piece.color === "w" ? "white" : "black") !== pieceColor) {
          return rowTotal;
        }
        if (piece.type === "k") return rowTotal;
        return rowTotal + PIECE_POINT_VALUES[piece.type as CapturedPieceType];
      }, 0);
    }, 0);
  };

  const getCapturedPoints = (counts: CapturedCounts): number =>
    (counts.p || 0) * 1 +
    (counts.n || 0) * 3 +
    (counts.b || 0) * 3 +
    (counts.r || 0) * 5 +
    (counts.q || 0) * 10;

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
    pieceImages,
  }: {
    title: string;
    capturedPieces: CapturedCounts;
    capturedPieceColor: "white" | "black";
    pieceImages: Record<string, any>;
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

              const asset = pieceImages[`${capturedPieceColor}_${type}`];

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
    const { settings, toggle } = useChessSettings();
    const settingsRef = useRef(settings);

    const [resultModalVisible, setResultModalVisible] = useState(false);

    const [isSearching, setIsSearching] = useState(false);
    
    const [selectedRewardMode, setSelectedRewardMode] = useState<ChessRewardModeId>("free");

    const [selectedModeConfig, setSelectedModeConfig] = useState<ChessRewardMode | null>(null);



    type RatingChangeInfo = {
      previousRating: number;
      change: number;
      newRating: number;
    };

    const [ratingResults, setRatingResults] = useState<{
      player: RatingChangeInfo | null;
      opponent: RatingChangeInfo | null;
    }>({ player: null, opponent: null });
    const resultModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [gameStats, setGameStats] = useState(() => ({
      white: {
        accuracy: 100,
        missedWins: 0,
        blunders: 0,
        checks: 0,
        captures: 0,
        pieceValue: 0,
      },
      black: {
        accuracy: 100,
        missedWins: 0,
        blunders: 0,
        checks: 0,
        captures: 0,
        pieceValue: 0,
      },
    }));

    useEffect(() => {
      settingsRef.current = settings;
    }, [settings]);
    const params =
      useLocalSearchParams<{
        mode?: GameModeId;
        pieceSet?: string;
      }>();

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

    const selectedPieceImages =
      PIECE_SETS[pieceSet] ?? PIECE_SETS.set_1;

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
      useState(false);

    const [searchSeconds, setSearchSeconds] = useState(1);

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

    const [checkmatedColor, setCheckmatedColor] =
      useState<ChessColor | null>(null);

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

    const [boardTheme, setBoardTheme] = useState<BoardImageTheme>("images_1");

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

    // Number of incoming chat messages not yet viewed by the player.
    const [unreadChatCount, setUnreadChatCount] =
      useState(0);

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

    const [lastMove, setLastMove] =
      useState<{ from: Square; to: Square } | null>(null);

    // A dedicated confirmation sheet avoids platform Alert dialogs that only
    // show coordinate notation (for example, e3 → f4).
    const [pendingMoveConfirmation, setPendingMoveConfirmation] =
      useState<{
        from: Square;
        to: Square;
        promotion: "q" | "r" | "b" | "n";
      } | null>(null);

    const [pendingPromotion, setPendingPromotion] =
      useState<{
        from: Square;
        to: Square;
      } | null>(null);

    const [pendingPremove, setPendingPremove] =
      useState<{
        from: Square;
        to: Square;
        promotion: "q" | "r" | "b" | "n";
      } | null>(null);

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

    // Refs let socket callbacks read the latest chat visibility without
    // recreating the socket listeners.
    const chatVisibleRef = useRef(false);
    const seenChatIdsRef = useRef<Set<string>>(new Set());

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
      data: Partial<ChessMatchPayload> & {
        player?: ChessMatchPayload["player"];
        opponent?: ChessMatchPayload["opponent"];
        gameId?: string;
        color?: ChessColor;
        fen?: string;
        clocks?: ClockState;
      }
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

      /* ====================================================================== */
      /* GAME ID                                                                */
      /* ====================================================================== */

      const previousGameId =
        gameIdRef.current;

      const nextGameId =
        data.gameId ||
        previousGameId ||
        null;

      const isNewGame =
        Boolean(
          nextGameId &&
          nextGameId !==
            previousGameId
        );

      if (nextGameId) {
        gameIdRef.current =
          nextGameId;

        setGameId(
          nextGameId
        );
      }

      /* ====================================================================== */
      /* COLOR                                                                  */
      /* ====================================================================== */

      const nextColor =
        data.color ||
        colorRef.current ||
        "white";

      colorRef.current =
        nextColor;

      setColor(
        nextColor
      );

      /* ====================================================================== */
      /* PLAYER                                                                  */
      /*
      * IMPORTANT:
      *
      * chess:matchFound may contain:
      *
      *   player
      *   opponent
      *
      * But chess:gameReady may only contain:
      *
      *   gameId
      *   color
      *   fen
      *   clocks
      *
      * Therefore NEVER replace the stored player
      * with undefined.
      */
      /* ====================================================================== */

      const rawPlayer = data.player || playerRef.current || null;
      const nextPlayer = rawPlayer
        ? {
            ...rawPlayer,
            id: String(rawPlayer.id ?? (rawPlayer as any)._id ?? ""),
            name: String(rawPlayer.name || (rawPlayer as any).displayName || [
              (rawPlayer as any).fname ||
              (rawPlayer as any).firstName,
              (rawPlayer as any).lname ||
              (rawPlayer as any).lastName,
            ].filter(Boolean).join(" ") || "You"
            ).trim(),
          }
        : null;

      if (nextPlayer) {
        playerRef.current = nextPlayer;
        setPlayer(nextPlayer);
      }

      /* ====================================================================== */
      /* OPPONENT                                                                 */
      /* ====================================================================== */

      const rawOpponent = data.opponent || opponentRef.current || null;
      const nextOpponent = rawOpponent
        ? {
            ...rawOpponent,
            id: String(rawOpponent.id ?? (rawOpponent as any)._id ?? ""),
            name: String(
              rawOpponent.name || (rawOpponent as any).displayName || [
                (rawOpponent as any).fname || 
                (rawOpponent as any).firstName,
                (rawOpponent as any).lname ||
                (rawOpponent as any).lastName
              ].filter(Boolean).join(" ") || "Opponent"
            ).trim(),
          }
        : null;

      if (nextOpponent) {
        opponentRef.current = nextOpponent;
        setOpponent(nextOpponent);
      }

      /* ====================================================================== */
      /* BOARD                                                                    */
      /* ====================================================================== */

      let nextGame =
        gameRef.current;

      if (data.fen) {
        try {
          nextGame =
            new Chess(
              data.fen
            );

          gameRef.current =
            nextGame;

          setGame(
            nextGame
          );

          console.log(
            "♟️ FEN loaded:",
            data.fen
          );
        } catch (error) {
          console.error(
            "❌ Invalid chess FEN:",
            data.fen,
            error
          );
        }
      }

      /* ====================================================================== */
      /* RESET CAPTURED PIECES ONLY FOR A NEW GAME                              */
      /* ====================================================================== */

      if (isNewGame) {
        setCapturedByColor(
          createEmptyCapturedByColor()
        );
      }

      /* ====================================================================== */
      /* CLOCKS                                                                   */
      /* ====================================================================== */

      if (data.clocks) {
        setClocks(
          data.clocks
        );

        setDisplayClocks(
          data.clocks
        );
      }

      /* ====================================================================== */
      /* GAME STATE                                                               */
      /* ====================================================================== */

      setSelectedSquare(
        null
      );

      setSearching(false);
      setSearchSeconds(1);

      setStarted(
        true
      );

      setGameFinished(
        false
      );

      setGameResult(
        ""
      );

      setMovePending(
        false
      );

      setErrorMessage(
        ""
      );

      setMessages([]);
      setUnreadChatCount(0);
      seenChatIdsRef.current.clear();

      /* ====================================================================== */
      /* SAFE LOGGING                                                             */
      /* ====================================================================== */

      console.log(
        `🎨 My color: ${
          nextColor
        }`
      );

      console.log(
        `👤 My name: ${
          nextPlayer?.name ||
          "You"
        }`
      );

      console.log(
        `👤 Opponent: ${
          nextOpponent?.name ||
          "Opponent"
        }`
      );

      console.log(
        `🆔 Opponent ID: ${
          nextOpponent?.id ||
          "unknown"
        }`
      );

      console.log(
        `🆔 Game ID: ${
          nextGameId ||
          "unknown"
        }`
      );

      console.log(
        "✅ CHESS GAME STARTED"
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

      // The server returns rating changes keyed by MongoDB user ID.
      // Resolve both players using the IDs supplied by chess:matchFound.
      const myPlayerId = playerRef.current?.id;
      const opponentPlayerId = opponentRef.current?.id;
      const myRatingUpdate = myPlayerId
        ? data?.ratingUpdates?.[String(myPlayerId)]
        : null;
      const opponentRatingUpdate = opponentPlayerId
        ? data?.ratingUpdates?.[String(opponentPlayerId)]
        : null;

      setRatingResults({
        player: myRatingUpdate && !data?.ratingUpdateError
          ? myRatingUpdate
          : null,
        opponent: opponentRatingUpdate && !data?.ratingUpdateError
          ? opponentRatingUpdate
          : null,
      });

      if (data?.players?.white && data?.players?.black) {
        const white = data.players.white;
        const black = data.players.black;
        const myColorNow = colorRef.current;
        const updatedPlayer = myColorNow === "black" ? black : white;
        const updatedOpponent = myColorNow === "black" ? white : black;
        if (updatedPlayer?.rating != null && playerRef.current) {
          playerRef.current = { ...playerRef.current, rating: updatedPlayer.rating };
        }
        if (updatedOpponent?.rating != null && opponentRef.current) {
          opponentRef.current = { ...opponentRef.current, rating: updatedOpponent.rating };
        }
      }

      // Preserve the final server position so checkmate can be highlighted
      // even when the final event arrives after the normal move event.
      if (typeof data.fen === "string" && data.fen.trim()) {
        try {
          const finalGame = new Chess(data.fen);
          gameRef.current = finalGame;
          setGame(finalGame);
        } catch {
          // Keep the last valid local board if the server payload has no valid FEN.
        }
      }

      if (data.reason === "checkmate") {
        const declaredWinner = data.winner;
        let losingColor: ChessColor | null = null;
        if (declaredWinner === "white" || declaredWinner === "black") {
          losingColor = declaredWinner === "white" ? "black" : "white";
        } else if (gameRef.current.isCheckmate()) {
          losingColor = gameRef.current.turn() === "w" ? "white" : "black";
        }
        setCheckmatedColor(losingColor);
      } else {
        setCheckmatedColor(null);
      }

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
        data.reason === "opponentDisconnected" ||
        data.reason === "disconnect"
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

      setGameFinished(true);

      setStarted(false);

      setSearching(false);

      setMovePending(false);

      setSelectedSquare(null);

      setGameResult(result);

      /*
      * Calculate complete game statistics
      * before showing the result popup.
      */
      const calculatedStats =
        calculateStatsFromGame(
          gameRef.current
        );

      setGameStats(
        calculatedStats
      );

      // Give the final board position a moment to render before showing results.
      // The modal is intentionally NOT auto-dismissed; the player closes it manually.
      if (resultModalTimerRef.current) {
        clearTimeout(resultModalTimerRef.current);
      }
      resultModalTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setResultModalVisible(true);
        }
        resultModalTimerRef.current = null;
      }, 1000);

      if (data.clocks) {
        setClocks(data.clocks);
        setDisplayClocks(data.clocks);
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

            const onMatchFound = (
                data: any
              ) => {
                setIsSearching(false);
                console.log(
                  "🎯 MATCH FOUND:",
                  JSON.stringify(
                    data,
                    null,
                    2
                  )
                );

                applyMatch(
                  data
                );
              };

            /* -------------------------------------------------------------- */
            /* Game Ready                                                     */
            /* -------------------------------------------------------------- */

            const onGameReady = (
                data: any
              ) => {
                console.log(
                  "🚀 GAME READY:",
                  JSON.stringify(
                    data,
                    null,
                    2
                  )
                );

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

                  const moveFrom =
                    data?.from ??
                    data?.move?.from;
                  const moveTo =
                    data?.to ??
                    data?.move?.to;

                  if (moveFrom && moveTo) {
                    setLastMove({
                      from: moveFrom as Square,
                      to: moveTo as Square,
                    });
                  }

                  gameRef.current =
                    nextGame;

                  const commitBoard =
                    () => {
                      setGame(nextGame);
                      playChessMoveSound(
                        settingsRef.current.sound
                      );
                    };

                  if (settingsRef.current.pieceAnimation) {
                    setTimeout(
                      commitBoard,
                      120
                    );
                  } else {
                    commitBoard();
                  }
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

                // Ignore duplicate socket deliveries so the badge counts
                // each incoming message only once.
                if (seenChatIdsRef.current.has(message.id)) {
                  return;
                }
                seenChatIdsRef.current.add(message.id);

                setMessages((previous) => [
                  ...previous,
                  message,
                ]);

                // Count only opponent messages while the chat window is closed.
                if (
                  message.from !== playerRef.current?.id &&
                  !chatVisibleRef.current
                ) {
                  setUnreadChatCount((count) => count + 1);
                }
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

                setMovePending(false);
                setErrorMessage(data?.message || "Something went wrong.");

                // A missing game ID means the server no longer has this match
                // (commonly after a backend restart or a stale screen state).
                // Clear local match references so no more moves are sent to it.
                if (data?.code === "GAME_NOT_FOUND" || data?.code === "GAME_NOT_ACTIVE") {
                  gameIdRef.current = null;
                  colorRef.current = null;
                  gameRef.current = new Chess();
                  playerRef.current = null;
                  opponentRef.current = null;
                  setGameId(null);
                  setColor(null);
                  setPlayer(null);
                  setOpponent(null);
                  setStarted(false);
                  setSearching(false);
                  setGameFinished(true);
                }
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

            // Matchmaking starts only after the player reviews the reward
            // sharing details and taps FIND OPPONENT.
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

        if (resultModalTimerRef.current) {
          clearTimeout(resultModalTimerRef.current);
          resultModalTimerRef.current = null;
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
    /* Matchmaking timeout: close search after 30 seconds if no game starts     */
    /* ------------------------------------------------------------------------ */
    useEffect(() => {
      if (!searching || started || gameFinished) return;

      const startedAt = Date.now();
      setSearchSeconds(0);
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        if (elapsed >= 30) {
          clearInterval(timer);
          cancelMatchmaking();
          setSearching(false);
          setIsSearching(false);
          setSearchSeconds(30);
          router.replace("/chess");
          return;
        }
        setSearchSeconds(elapsed);
      }, 250);

      return () => clearInterval(timer);
    }, [searching, started, gameFinished]);

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
    /* Start Search                                                             */
    /* ------------------------------------------------------------------------ */

    const handleFindOpponent = async () => {
      const reward = selectedModeConfig;

      if (!reward) {
        Alert.alert(
          "Select reward mode",
          "Please select a reward-sharing mode before finding an opponent."
        );
        return;
      }

      // Open the 30-second search UI immediately on button press.
      // Do not wait for the socket connection before changing the screen.
      setErrorMessage("");
      setSearchSeconds(0);
      setStarted(false);
      setGameFinished(false);
      setGameId(null);
      setSearching(true);
      setIsSearching(true);

      try {
        const connectedSocket = await connectChessSocket();

        if (!connectedSocket.connected) {
          throw new Error("Chess server is not connected. Please try again.");
        }

        // The search UI is already visible; now send the matchmaking request.
        findRandomOpponent(selectedMode, selectedRewardMode);
      } catch (error: any) {
        console.error("Find opponent failed:", error);
        cancelMatchmaking();
        setSearching(false);
        setIsSearching(false);
        setErrorMessage(
          error?.message || "Unable to connect to chess server. Please try again."
        );
        Alert.alert(
          "Unable to find opponent",
          error?.message || "Could not connect to the chess server. Please try again."
        );
      }
    };

    /* ------------------------------------------------------------------------ */
    /* Cancel Search                                                            */
    /* ------------------------------------------------------------------------ */

    const handleCancelSearch =
      () => {
        setSearching(false);
        setIsSearching(false);

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

    const sendValidatedMove = (
      from: Square,
      to: Square,
      promotion: "q" | "r" | "b" | "n"
    ) => {
      if (!gameId) return;

      const send = () => {
        setMovePending(true);
        setSelectedSquare(null);
        setPendingPremove(null);

        makeChessMove(
          gameId,
          from,
          to,
          promotion
        );
      };

      if (settings.confirmMoves) {
        setPendingMoveConfirmation({ from, to, promotion });
      } else {
        send();
      }
    };

    const requestPromotion = (
      from: Square,
      to: Square
    ) => {
      setPendingPromotion({
        from,
        to,
      });
    };

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

        /*
        * Premove: if it is not our turn, allow us
        * to select our piece and store one move.
        */
        if (
          settings.premove &&
          game.turn() !== myTurnColor
        ) {
          const piece = game.get(square);

          if (!selectedSquare) {
            if (
              piece &&
              piece.color === myTurnColor
            ) {
              setSelectedSquare(square);
            }
            return;
          }

          if (selectedSquare === square) {
            setSelectedSquare(null);
            return;
          }

          if (
            piece &&
            piece.color === myTurnColor
          ) {
            setSelectedSquare(square);
            return;
          }

          try {
            const testGame =
              new Chess(game.fen());

            const move =
              testGame.move({
                from: selectedSquare,
                to: square,
                promotion: "q",
              });

            if (!move) return;

            const isPromotion =
              move.promotion != null;

            if (
              isPromotion &&
              !settings.autoPromoteQueen
            ) {
              requestPromotion(
                selectedSquare,
                square
              );
              return;
            }

            setPendingPremove({
              from: selectedSquare,
              to: square,
              promotion: "q",
            });
            setSelectedSquare(null);
          } catch {
            setSelectedSquare(null);
          }

          return;
        }

        if (
          game.turn() !==
          myTurnColor
        ) {
          return;
        }

        const piece =
          game.get(square);

        if (!selectedSquare) {
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
          setSelectedSquare(null);
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

          const isPromotion =
            move.promotion != null;

          if (
            isPromotion &&
            !settings.autoPromoteQueen
          ) {
            requestPromotion(
              selectedSquare,
              square
            );
            return;
          }

          sendValidatedMove(
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

    useEffect(() => {
      if (
        !settings.premove ||
        !pendingPremove ||
        !started ||
        gameFinished ||
        movePending ||
        !gameId ||
        !color
      ) {
        return;
      }

      const myTurnColor =
        color === "white" ? "w" : "b";

      if (game.turn() !== myTurnColor) {
        return;
      }

      const { from, to, promotion } =
        pendingPremove;

      try {
        const testGame =
          new Chess(game.fen());

        const move =
          testGame.move({
            from,
            to,
            promotion,
          });

        if (!move) {
          setPendingPremove(null);
          return;
        }

        sendValidatedMove(
          from,
          to,
          promotion
        );
      } catch {
        setPendingPremove(null);
      }
    }, [
      game,
      pendingPremove,
      settings.premove,
      started,
      gameFinished,
      movePending,
      gameId,
      color,
    ]);

    /* ------------------------------------------------------------------------ */
    /* Chat                                                                     */
    /* ------------------------------------------------------------------------ */

    const openChat = () => {
      chatVisibleRef.current = true;
      setUnreadChatCount(0);
      setChatVisible(true);
    };

    const closeChat = () => {
      chatVisibleRef.current = false;
      setChatVisible(false);
    };

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
    /* Reward Selection / Find Opponent Lobby                                  */
    /* ------------------------------------------------------------------------ */

    if (!searching && !started && !gameId) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }}>
            <Pressable
              style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#142237", marginBottom: 18 }}
              onPress={() => router.replace("/chess")}
            >
              <Ionicons name="arrow-back" size={25} color="#ffffff" />
            </Pressable>

            <Text style={{ color: "#ffffff", fontSize: 27, fontWeight: "900", marginBottom: 8 }}>
              Online Chess
            </Text>
            <Text style={{ color: "#a9bdcc", fontSize: 14, lineHeight: 21, marginBottom: 20 }}>
              Choose your virtual coin reward-sharing mode. Review the entry fee and reward details, then find an opponent.
            </Text>

            <View style={{ backgroundColor: "#102438", borderColor: "#244f65", borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 16 }}>
              <Text style={{ color: "#ffb547", fontSize: 15, fontWeight: "800", marginBottom: 8 }}>
                TIME CONTROL
              </Text>
              <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "800" }}>
                {MODE_NAMES[selectedMode]}
              </Text>
            </View>

            <ChessRewardModePicker
              selectedMode={selectedRewardMode}
              onSelectMode={(mode) => {
                setSelectedRewardMode(mode.id);
                setSelectedModeConfig(mode);
                setErrorMessage("");
              }}
              disabled={isSearching}
            />

            {selectedModeConfig ? (
              <View style={{ backgroundColor: "#102438", borderColor: "#f4a000", borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 16 }}>
                <Text style={{ color: "#ffb547", fontSize: 17, fontWeight: "900", marginBottom: 12 }}>
                  {selectedModeConfig.name} — Reward sharing
                </Text>
                {[
                  ["Entry fee per player", `${selectedModeConfig.entryCoins} virtual coins`],
                  ["Winner receives", `${selectedModeConfig.winnerCoins} virtual coins`],
                  ["Loser receives", `${selectedModeConfig.loserCoins} virtual coins`],
                  ["Platform share", `${selectedModeConfig.platformCoins} virtual coins`],
                ].map(([label, value]) => (
                  <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "#24465b" }}>
                    <Text style={{ color: "#d5e2eb", flex: 1, marginRight: 10 }}>{label}</Text>
                    <Text style={{ color: "#ffffff", fontWeight: "800", textAlign: "right" }}>{value}</Text>
                  </View>
                ))}
                <Text style={{ color: "#a9bdcc", fontSize: 12, lineHeight: 18, marginTop: 12 }}>
                  These are virtual coins only, not real money. You will be matched with a player using the same time control and reward mode.
                </Text>
              </View>
            ) : (
              <Text style={{ color: "#ffcf70", marginTop: 14 }}>
                Select a reward-sharing mode to view its details.
              </Text>
            )}

            {errorMessage ? (
              <Text style={{ color: "#ff7373", marginTop: 12 }}>{errorMessage}</Text>
            ) : null}

            <Pressable
              style={{ backgroundColor: "#f4a000", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 22, opacity: selectedModeConfig ? 1 : 0.55 }}
              disabled={!selectedModeConfig || isSearching}
              onPress={handleFindOpponent}
            >
              <Text style={{ color: "#071e2b", fontSize: 16, fontWeight: "900" }}>
                FIND AN OPPONENT
              </Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      );
    }

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
              Searching for another player using the same time control
            </Text>
            <Text style={{ color: "#FFD166", fontSize: 20, fontWeight: "900", marginTop: 12 }}>
              {searchSeconds}/30 sec
            </Text>
            <View style={{ width: "80%", height: 7, borderRadius: 8, backgroundColor: "#315869", marginTop: 8, overflow: "hidden" }}>
              <View style={{ width: `${(searchSeconds / 30) * 100}%`, height: "100%", backgroundColor: "#FFD166" }} />
            </View>

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
                {opponent?.name || "Opponent"} · {opponent?.rating ?? 100}
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
            pieceImages={selectedPieceImages}
          />
          </View>

          {/* ================================================================ */}
          {/* OPPONENT CAPTURED PIECES                                        */}
          {/* ================================================================ */}

          

          {/* ================================================================ */}
          {/* BOARD                                                            */}
          {/* ================================================================ */}

          {/* {settings.showLastMove &&
          lastMove ? (
            <View style={styles.lastMoveBar}>
              <Ionicons
                name="scan-outline"
                size={16}
                color="#ff9a1f"
              />
              <Text style={styles.lastMoveText}>
                Last move: {lastMove.from.toUpperCase()} → {lastMove.to.toUpperCase()}
              </Text>
            </View>
          ) : null} */}

          {/* {settings.showMoveHelp && selectedSquare ? (
            <View style={styles.moveHelpPanel}>
              <Text style={styles.moveHelpHeading}>
                <Text style={styles.moveHelpHeadingStrong}>Move help</Text>
                {`  ·  ${selectedSquare.toUpperCase()}`}
              </Text>
              <Text style={styles.moveHelpCaption}>
                Legal destination squares
              </Text>
              <View style={styles.moveHelpChips}>
                {(game.moves({ square: selectedSquare, verbose: true } as any) as any[]).length > 0 ? (
                  (game.moves({ square: selectedSquare, verbose: true } as any) as any[]).map((move: any) => (
                    <View key={`${move.from}-${move.to}-${move.promotion || ""}`} style={styles.moveHelpChip}>
                      <Text style={styles.moveHelpChipText}>{String(move.to).toUpperCase()}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.moveHelpEmpty}>No legal moves from this square.</Text>
                )}
              </View>
            </View>
          ) : null} */}

          {/* <View style={styles.themePickerContainer}>
            <Text style={styles.themePickerTitle}>
              Chessboard Themes
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.themeCarouselContent}
            >
              {BOARD_THEMES.map((item) => {
                const selected = boardTheme === item.id;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setBoardTheme(item.id)}
                    style={[
                      styles.themeCarouselItem,
                      selected && styles.themeCarouselItemSelected,
                    ]}
                  >
                    <Image
                      source={item.image}
                      style={styles.themePreviewImage}
                      resizeMode="cover"
                    />

                    <View style={styles.themePreviewFooter}>
                      <Text style={styles.themePreviewLabel}>
                        {item.label}
                      </Text>

                      {selected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#32d583"
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View> */}

          <View
            style={
              styles.boardContainer
            }
          >
            <ChessBoard
              game={game}
              selectedSquare={selectedSquare}
              onSquarePress={handleSquarePress}
              theme={boardTheme}
              orientation={color === "black" ? "black" : "white"}
              lastMove={lastMove}
              showLastMove={settings.showLastMove}
              showMoveHelp={settings.showMoveHelp}
              checkmatedColor={checkmatedColor}
              pieceSet={pieceSet}
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
                {player?.name || "You"} · {player?.rating ?? 100}
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
            pieceImages={selectedPieceImages}
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
            {settings.showChat ? (
              <Pressable
                style={
                  styles.actionButton
                }
                onPress={openChat}
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
            ) : null}

            <Pressable
              style={
                styles.actionButton
              }
              onPress={
                handleOfferDraw
              }
            >
              <View style={styles.handIconWrapper}>
                <Ionicons
                  name="hand-left-outline"
                  size={22}
                  color="#ffffff"
                />
                {unreadChatCount > 0 ? (
                  <View style={styles.chatNotificationBadge}>
                    <Text style={styles.chatNotificationBadgeText}>
                      {unreadChatCount > 99 ? "99+" : unreadChatCount}
                    </Text>
                  </View>
                ) : null}
              </View>

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

        <Modal
          visible={pendingMoveConfirmation !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setPendingMoveConfirmation(null)}
        >
          <View style={styles.confirmMoveOverlay}>
            <View style={styles.confirmMoveCard}>
              <View style={styles.confirmMoveIconWrap}>
                <Ionicons name="git-commit-outline" size={26} color="#f6b84b" />
              </View>
              <Text style={styles.confirmMoveTitle}>Confirm your move</Text>
              <Text style={styles.confirmMoveDescription}>
                Are you sure you want to make this move?
              </Text>
              <View style={styles.confirmMoveActions}>
                <Pressable
                  accessibilityRole="button"
                  style={styles.confirmMoveCancel}
                  onPress={() => setPendingMoveConfirmation(null)}
                >
                  <Text style={styles.confirmMoveCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  style={styles.confirmMoveAccept}
                  onPress={() => {
                    const move = pendingMoveConfirmation;
                    setPendingMoveConfirmation(null);
                    if (!move || !gameId) return;
                    setMovePending(true);
                    setSelectedSquare(null);
                    setPendingPremove(null);
                    makeChessMove(gameId, move.from, move.to, move.promotion);
                  }}
                >
                  <Text style={styles.confirmMoveAcceptText}>Confirm Move</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <ChessGameSettings
          visible={settingsVisible}
          settings={settings}
          onToggle={toggle}
          onClose={() =>
            setSettingsVisible(false)
          }
        />

        {/* ================================================================ */}
        {/* CHAT MODAL                                                       */}
        {/* ================================================================ */}

        <Modal
          visible={
            chatVisible
          }
          transparent
          animationType="slide"
          onRequestClose={closeChat}
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
                  onPress={closeChat}
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

        <Modal
          visible={!!pendingPromotion}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setPendingPromotion(null)
          }
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
                ] as Array<
                  [
                    "q" | "r" | "b" | "n",
                    string,
                    string
                  ]
                >
              ).map(
                ([piece, symbol, label]) => (
                  <Pressable
                    key={piece}
                    style={styles.promotionButton}
                    onPress={() => {
                      if (!pendingPromotion) {
                        return;
                      }

                      const {
                        from,
                        to,
                      } = pendingPromotion;

                      const send = () => {
                        setPendingPromotion(null);
                        sendValidatedMove(
                          from,
                          to,
                          piece
                        );
                      };

                      // sendValidatedMove handles the optional confirmation
                      // dialog, including promoted moves, exactly once.
                      send();
                    }}
                  >
                    <Text style={styles.promotionSymbol}>
                      {symbol}
                    </Text>
                    <Text style={styles.promotionLabel}>
                      {label}
                    </Text>
                  </Pressable>
                )
              )}
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
        
        {/* Game Over pop up */}
        
        <ChessGameResultModal
            resultMessage={gameResult}
            playerMaterialPoints={getMaterialPoints(game, color === "black" ? "black" : "white")}
            opponentMaterialPoints={getMaterialPoints(game, color === "black" ? "white" : "black")}
            playerCapturedPoints={getCapturedPoints(capturedByColor[color === "black" ? "black" : "white"])}
            opponentCapturedPoints={getCapturedPoints(capturedByColor[color === "black" ? "white" : "black"])}
            playerScore={40 + getCapturedPoints(capturedByColor[color === "black" ? "black" : "white"]) - getCapturedPoints(capturedByColor[color === "black" ? "white" : "black"])}
            opponentScore={40 + getCapturedPoints(capturedByColor[color === "black" ? "white" : "black"]) - getCapturedPoints(capturedByColor[color === "black" ? "black" : "white"])}
            visible={
              resultModalVisible
            }

            winner={
              gameResult.includes(
                "DRAW"
              )
                ? "draw"
                : gameResult.includes(
                    "YOU WIN"
                  )
                ? color === "white"
                  ? "white"
                  : "black"
                : color === "white"
                ? "black"
                : "white"
            }

            myColor={
              color === "black"
                ? "black"
                : "white"
            }

            playerName={
              player?.name || "You"
            }

            opponentName={
              opponent?.name ||
              "Opponent"
            }

            playerRating={ratingResults.player}

            opponentRating={ratingResults.opponent}

            playerStats={
              color === "black"
                ? gameStats.black
                : gameStats.white
            }

            opponentStats={
              color === "black"
                ? gameStats.white
                : gameStats.black
            }

            playerAvatar={player?.avatar || "🦊"}

            opponentAvatar={opponent?.avatar || "🐼"}

            playerFlag={player?.countryCode === "+91" || player?.countryCode === "IN" ? "🇮🇳" : "🌐"}

            opponentFlag={opponent?.countryCode === "+91" || opponent?.countryCode === "IN" ? "🇮🇳" : "🌐"}

            points={
              gameResult.includes(
                "YOU WIN"
              )
                ? 3
                : gameResult.includes(
                    "YOU LOST"
                  )
                ? -3
                : 0
            }

            onlineWinCoins={
              gameResult.includes(
                "YOU WIN"
              )
                ? 5
                : 0
            }

            dailyGameCoins={
              gameResult.includes(
                "YOU WIN"
              )
                ? 50
                : 0
            }

            onSaveGame={() => {
              Alert.alert(
                "Game Saved",
                "Your chess game has been saved."
              );
            }}

            onNewGame={() => {
              // void showGameCompletionAd();
              if (resultModalTimerRef.current) {
                clearTimeout(resultModalTimerRef.current);
                resultModalTimerRef.current = null;
              }
              setResultModalVisible(
                false
              );

              setGameFinished(
                false
              );

              setGameResult("");
              setCheckmatedColor(null);
              setRatingResults({ player: null, opponent: null });

              setGame(
                new Chess()
              );

              gameRef.current =
                new Chess();

              setSelectedSquare(
                null
              );
              setLastMove(null);
              setPendingMoveConfirmation(null);

              setCapturedByColor(
                createEmptyCapturedByColor()
              );

              setSearching(true);

              setStarted(false);

              /*
              * Start a fresh matchmaking
              * session.
              */
              findRandomOpponent(
                selectedMode,
                selectedRewardMode
              );
            }}

            onClose={() => {
              setResultModalVisible(false);
              // void showGameCompletionAd();
            }}

            onReviewGame={() => {
              setResultModalVisible(
                false
              );

              /*
              * We will use this for
              * the move-review screen.
              */
              Alert.alert(
                "Review Game",
                "Game review will open here."
              );
            }}
          />
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
      color: "#e27d0a",
      borderColor: "#e27d0a",
      backgroundColor: "#1b2430",
    },

    clockText: {
      color: "#ffffff",
      fontSize: 15,
      marginLeft: -7,
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

    handIconWrapper: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },

    chatNotificationBadge: {
      position: "absolute",
      top: -8,
      right: -13,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: 9,
      backgroundColor: "#F04444",
      borderWidth: 1,
      borderColor: "#ffffff",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 5,
    },

    chatNotificationBadgeText: {
      color: "#ffffff",
      fontSize: 10,
      fontWeight: "900",
      lineHeight: 12,
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
    lastMoveBar: {
      alignSelf: "stretch",
      marginHorizontal: 12,
      marginBottom: 6,
      minHeight: 32,
      borderRadius: 9,
      backgroundColor: "#111f32",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 11,
      gap: 7,
    },

    lastMoveText: {
      color: "#d4dee5",
      fontSize: 11,
      fontWeight: "800",
    },

    moveHelpText: {
      color: "#ffb15c",
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 6,
      paddingHorizontal: 10,
    },

    moveHelpPanel: {
      alignSelf: "stretch",
      marginHorizontal: 12,
      marginBottom: 8,
      padding: 11,
      borderRadius: 12,
      backgroundColor: "#101e30",
      borderWidth: 1,
      borderColor: "#29445f",
    },
    moveHelpHeading: {
      color: "#c7d7e8",
      fontSize: 12,
      fontWeight: "700",
    },
    moveHelpHeadingStrong: {
      color: "#ffbd59",
      fontSize: 12,
      fontWeight: "900",
    },
    moveHelpCaption: {
      color: "#8298ad",
      fontSize: 10,
      marginTop: 3,
      marginBottom: 7,
    },
    moveHelpChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    moveHelpChip: {
      minWidth: 38,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 7,
      backgroundColor: "#1c684f",
      borderWidth: 1,
      borderColor: "#45b98b",
      alignItems: "center",
    },
    moveHelpChipText: {
      color: "#eafff5",
      fontSize: 11,
      fontWeight: "900",
    },
    moveHelpEmpty: {
      color: "#aebccc",
      fontSize: 11,
      fontWeight: "600",
    },
    confirmMoveOverlay: {
      flex: 1,
      backgroundColor: "rgba(2, 8, 18, 0.78)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    confirmMoveCard: {
      width: "100%",
      maxWidth: 360,
      borderRadius: 20,
      padding: 22,
      backgroundColor: "#122238",
      borderWidth: 1,
      borderColor: "#35516e",
      alignItems: "center",
    },
    confirmMoveIconWrap: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: "#49381b",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    confirmMoveTitle: {
      color: "#ffffff",
      fontSize: 20,
      fontWeight: "900",
      textAlign: "center",
    },
    confirmMoveDescription: {
      color: "#b6c5d6",
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center",
      marginTop: 8,
      marginBottom: 20,
    },
    confirmMoveActions: {
      width: "100%",
      flexDirection: "row",
      gap: 10,
    },
    confirmMoveCancel: {
      flex: 1,
      minHeight: 46,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: "#5b7086",
      alignItems: "center",
      justifyContent: "center",
    },
    confirmMoveCancelText: {
      color: "#e1eaf3",
      fontSize: 13,
      fontWeight: "800",
    },
    confirmMoveAccept: {
      flex: 1.35,
      minHeight: 46,
      borderRadius: 11,
      backgroundColor: "#16845d",
      alignItems: "center",
      justifyContent: "center",
    },
    confirmMoveAcceptText: {
      color: "#ffffff",
      fontSize: 13,
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
    themePickerContainer: {
      marginVertical: 12,
    },

    themePickerTitle: {
      color: "#ffffff",
      fontSize: 17,
      fontWeight: "900",
      marginBottom: 12,
    },

    themeCarouselContent: {
      gap: 12,
      paddingVertical: 5,
      paddingRight: 12,
    },

    themeCarouselItem: {
      width: 145,
      padding: 7,
      borderRadius: 14,
      backgroundColor: "#142237",
      borderWidth: 2,
      borderColor: "#26374e",
    },

    themeCarouselItemSelected: {
      borderColor: "#32d583",
    },

    themePreviewImage: {
      width: "100%",
      height: 105,
      borderRadius: 9,
    },

    themePreviewFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
    },

    themePreviewLabel: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "800",
    },

  });
