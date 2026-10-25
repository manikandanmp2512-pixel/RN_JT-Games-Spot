
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";

import {
  ChessColor,
  GameModeId,
} from "@/types/chess";

import { ChessRewardModeId } from "@/types/chessRewards";

/* -------------------------------------------------------------------------- */
/* Socket URL                                                                 */
/* -------------------------------------------------------------------------- */

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || "http://192.168.31.214:5000";

// const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || "http://172.27.170.226:5000";
// const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || "https://jaytech-backend.onrender.com";

/* -------------------------------------------------------------------------- */
/* Player                                                                     */
/* -------------------------------------------------------------------------- */

export type ChessPlayer = {
  id: string;
  name: string;
  rating?: number;
  color?: ChessColor;
  avatar?: string | null;
  countryCode?: string | null;
};

/* -------------------------------------------------------------------------- */
/* Chat                                                                       */
/* -------------------------------------------------------------------------- */

export type ChessChatMessage = {
  id: string;
  from: string;
  fromName: string;
  message: string;
  createdAt: string | number;
};

/* -------------------------------------------------------------------------- */
/* Match                                                                      */
/* -------------------------------------------------------------------------- */

export type ChessMatchPayload = {
  gameId: string;
  fen?: string;
  color: ChessColor;
  player: ChessPlayer;
  opponent: ChessPlayer;

  clocks: {
    white: number;
    black: number;
    active: ChessColor | null;
    serverAt: number;
  };

  mode?: GameModeId;

  // Optional for compatibility with existing server responses.
  rewardModeId?: ChessRewardModeId;
};

/* -------------------------------------------------------------------------- */
/* Socket                                                                     */
/* -------------------------------------------------------------------------- */

let currentSocket: Socket | null = null;
let connectingPromise: Promise<Socket> | null = null;

/* -------------------------------------------------------------------------- */
/* Connect                                                                    */
/* -------------------------------------------------------------------------- */

export const connectChessSocket = async (): Promise<Socket> => {
  if (currentSocket?.connected) {
    return currentSocket;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = (async () => {
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      throw new Error(
        "Authentication token not found. Please login again."
      );
    }

    if (currentSocket) {
      try {
        currentSocket.removeAllListeners();
        currentSocket.disconnect();
      } catch (error) {
        console.log("Old socket cleanup error:", error);
      }

      currentSocket = null;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: false,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    currentSocket = socket;

    return new Promise<Socket>((resolve, reject) => {
      let finished = false;

      const cleanup = () => {
        socket.off("connect", onConnect);
        socket.off("connect_error", onConnectError);
      };

      const onConnect = () => {
        if (finished) return;

        finished = true;
        cleanup();

        console.log("Chess socket connected:", socket.id);
        resolve(socket);
      };

      const onConnectError = (error: Error) => {
        if (finished) return;

        finished = true;
        cleanup();

        console.log("Chess socket connection error:", error.message);

        if (currentSocket === socket) {
          currentSocket = null;
        }

        try {
          socket.disconnect();
        } catch (disconnectError) {
          console.log("Socket disconnect error:", disconnectError);
        }

        if (/token expired|invalid token/i.test(error.message)) {
          void AsyncStorage.multiRemove(["token", "user"]).catch(
            (storageError) => {
              console.error(
                "Failed to clear expired session:",
                storageError
              );
            }
          );
        }

        reject(error);
      };

      socket.once("connect", onConnect);
      socket.once("connect_error", onConnectError);
      socket.connect();
    });
  })().finally(() => {
    connectingPromise = null;
  });

  return connectingPromise;
};

/* -------------------------------------------------------------------------- */
/* Matchmaking                                                                */
/* -------------------------------------------------------------------------- */

/**
 * mode: chess time-control mode, such as rapid or blitz5.
 * rewardModeId: virtual-coin reward mode, such as free or bronze.
 *
 * The backend must validate rewardModeId and apply its rules server-side.
 */
export const findRandomOpponent = (
  mode: GameModeId,
  rewardModeId: ChessRewardModeId = "free"
) => {
  if (!currentSocket?.connected) {
    console.log("Cannot matchmake: socket not connected");
    return;
  }

  console.log("Searching for opponent:", {
    mode,
    rewardModeId,
  });

  currentSocket.emit("chess:matchmake", {
    mode,
    rewardModeId,
  });
};

/* -------------------------------------------------------------------------- */
/* Cancel Matchmaking                                                         */
/* -------------------------------------------------------------------------- */

export const cancelMatchmaking = () => {
  if (!currentSocket) return;

  try {
    if (currentSocket.connected) {
      console.log("Cancelling matchmaking");
      currentSocket.emit("chess:cancelMatchmaking");
    }
  } catch (error) {
    console.log("Cancel matchmaking error:", error);
  }
};

/* -------------------------------------------------------------------------- */
/* Make Move                                                                  */
/* -------------------------------------------------------------------------- */

export const makeChessMove = (
  gameId: string,
  from: string,
  to: string,
  promotion?: string
) => {
  if (!currentSocket?.connected) {
    console.log("Cannot make move: socket not connected");
    return;
  }

  console.log("Sending chess move:", {
    gameId,
    from,
    to,
    promotion,
  });

  currentSocket.emit("chess:makeMove", {
    gameId,
    from,
    to,
    promotion,
  });
};

/* -------------------------------------------------------------------------- */
/* Chat                                                                       */
/* -------------------------------------------------------------------------- */

export const sendChessChat = (gameId: string, message: string) => {
  if (!currentSocket?.connected) return;

  const text = message.trim();
  if (!text) return;

  currentSocket.emit("chess:chat", {
    gameId,
    message: text,
  });
};

/* -------------------------------------------------------------------------- */
/* Draw                                                                       */
/* -------------------------------------------------------------------------- */

export const offerDraw = (gameId: string) => {
  if (!currentSocket?.connected) return;

  currentSocket.emit("chess:drawOffer", { gameId });
};

export const answerDraw = (gameId: string, accept: boolean) => {
  if (!currentSocket?.connected) return;

  currentSocket.emit("chess:drawAnswer", {
    gameId,
    accept,
  });
};

/* -------------------------------------------------------------------------- */
/* Resign                                                                     */
/* -------------------------------------------------------------------------- */

export const resignGame = (gameId: string) => {
  if (!currentSocket?.connected) return;

  console.log("Resigning game:", gameId);
  currentSocket.emit("chess:resign", { gameId });
};

/* -------------------------------------------------------------------------- */
/* Friend Request                                                             */
/* -------------------------------------------------------------------------- */

export const sendFriendRequest = (userId: string) => {
  if (!currentSocket?.connected) {
    console.log("Cannot send friend request: socket not connected");
    return;
  }

  currentSocket.emit("friend:request", { userId });
};

/* -------------------------------------------------------------------------- */
/* Respond Friend Request                                                     */
/* -------------------------------------------------------------------------- */


export const respondFriendRequest = (
  requestId: string,
  accept: boolean,
): Promise<{ success: boolean; message?: string; accepted?: boolean }> => {
  return new Promise(async (resolve, reject) => {
    try {
      const socket = await connectChessSocket();

      if (!socket.connected) {
        reject(new Error("Chess server is not connected. Please try again."));
        return;
      }

      if (!requestId?.trim()) {
        reject(new Error("Friend request ID is missing."));
        return;
      }

      socket.emit(
        "friend:respond",
        { requestId, accept },
        (result: {
          success?: boolean;
          message?: string;
          accepted?: boolean;
        }) => {
          if (!result || result.success !== true) {
            reject(
              new Error(
                result?.message || "Unable to update friend request.",
              ),
            );
            return;
          }

          resolve({
            success: true,
            message: result.message,
            accepted: result.accepted,
          });
        },
      );
    } catch (error) {
      reject(
        error instanceof Error
          ? error
          : new Error("Unable to connect to the chess server."),
      );
    }
  });
};


/* -------------------------------------------------------------------------- */
/* Get Current Socket                                                         */
/* -------------------------------------------------------------------------- */

export const getChessSocket = () => currentSocket;

/* -------------------------------------------------------------------------- */
/* Disconnect                                                                 */
/* -------------------------------------------------------------------------- */

export const disconnectChessSocket = () => {
  if (!currentSocket) return;

  console.log("Disconnecting chess socket");

  try {
    currentSocket.removeAllListeners();
    currentSocket.disconnect();
  } catch (error) {
    console.log("Socket disconnect error:", error);
  }

  currentSocket = null;
  connectingPromise = null;
};
