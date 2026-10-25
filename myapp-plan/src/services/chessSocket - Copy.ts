import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";

import {
  ChessColor,
  GameModeId,
} from "@/types/chess";

/* -------------------------------------------------------------------------- */
/* Socket URL                                                                 */
/* -------------------------------------------------------------------------- */

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || "http://192.168.31.214:5000";  // Connect local from expo

// const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || "http://172.27.170.226:5000";  // Connect local from expo

// const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || "https://jaytech-backend.onrender.com";  // connect render

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
};

/* -------------------------------------------------------------------------- */
/* Socket                                                                     */
/* -------------------------------------------------------------------------- */

let currentSocket: Socket | null = null;

let connectingPromise: Promise<Socket> | null = null;

/* -------------------------------------------------------------------------- */
/* Connect                                                                    */
/* -------------------------------------------------------------------------- */

export const connectChessSocket =
  async (): Promise<Socket> => {
    if (
      currentSocket &&
      currentSocket.connected
    ) {
      return currentSocket;
    }

    if (connectingPromise) {
      return connectingPromise;
    }

    connectingPromise =
      (async () => {
        const token =
          await AsyncStorage.getItem("token");

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
            console.log(
              "Old socket cleanup error:",
              error
            );
          }

          currentSocket = null;
        }

        const socket = io(
          SOCKET_URL,
          {
            transports: ["websocket"],

            autoConnect: false,

            auth: {
              token,
            },

            reconnection: true,

            reconnectionAttempts: 5,

            reconnectionDelay: 1000,
          }
        );

        currentSocket = socket;

        return new Promise<Socket>(
          (
            resolve,
            reject
          ) => {
            let finished = false;

            const cleanup = () => {
              socket.off(
                "connect",
                onConnect
              );

              socket.off(
                "connect_error",
                onConnectError
              );
            };

            const onConnect = () => {
              if (finished) {
                return;
              }

              finished = true;

              cleanup();

              console.log(
                "✅ Chess socket connected:",
                socket.id
              );

              resolve(socket);
            };

            const onConnectError = ( error: Error ) => {
              if (finished) return;

              finished = true;

              cleanup();

              console.log(
                "❌ Chess socket connection error:",
                error.message
              );

              if (currentSocket === socket) {
                currentSocket = null;
              }

              try {
                socket.disconnect();
              } catch (disconnectError){
                console.log("socket disconnect error:", disconnectError);
              }
              // An expired token must not be retried as the same session.
                if (/token expired|invalid token/i.test(error.message)) {
                  void AsyncStorage.multiRemove([
                    "token",
                    "user",
                  ]).catch((storageError) => {
                    console.error(
                      "Failed to clear expired session:",
                      storageError
                    );
                  });
                }
                reject(error);
            };

            socket.once(
              "connect",
              onConnect
            );

            socket.once(
              "connect_error",
              onConnectError
            );

            socket.connect();
          }
        );
      })().finally(() => {
        connectingPromise = null;
      });

    return connectingPromise;
  };

/* -------------------------------------------------------------------------- */
/* Matchmaking                                                                */
/* -------------------------------------------------------------------------- */

export const findRandomOpponent = (
  mode: GameModeId
) => {
  if (
    !currentSocket ||
    !currentSocket.connected
  ) {
    console.log(
      "❌ Cannot matchmake: socket not connected"
    );

    return;
  }

  console.log(
    "🔎 Searching opponent for mode:",
    mode
  );

  currentSocket.emit(
    "chess:matchmake",
    {
      mode,
    }
  );
};

/* -------------------------------------------------------------------------- */
/* Cancel Matchmaking                                                         */
/* -------------------------------------------------------------------------- */

export const cancelMatchmaking = () => {
  if (!currentSocket) {
    return;
  }

  try {
    if (currentSocket.connected) {
      console.log(
        "❌ Cancelling matchmaking"
      );

      currentSocket.emit(
        "chess:cancelMatchmaking"
      );
    }
  } catch (error) {
    console.log(
      "❌ Cancel matchmaking error:",
      error
    );
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
  if (
    !currentSocket ||
    !currentSocket.connected
  ) {
    console.log(
      "❌ Cannot make move: socket not connected"
    );

    return;
  }

  console.log(
    "♟️ Sending chess move:",
    {
      gameId,
      from,
      to,
      promotion,
    }
  );

  currentSocket.emit(
    "chess:makeMove",
    {
      gameId,
      from,
      to,
      promotion,
    }
  );
};

/* -------------------------------------------------------------------------- */
/* Chat                                                                       */
/* -------------------------------------------------------------------------- */

export const sendChessChat = (
  gameId: string,
  message: string
) => {
  if (
    !currentSocket ||
    !currentSocket.connected
  ) {
    return;
  }

  const text =
    message.trim();

  if (!text) {
    return;
  }

  currentSocket.emit(
    "chess:chat",
    {
      gameId,
      message: text,
    }
  );
};

/* -------------------------------------------------------------------------- */
/* Draw                                                                       */
/* -------------------------------------------------------------------------- */

export const offerDraw = (
  gameId: string
) => {
  if (
    !currentSocket ||
    !currentSocket.connected
  ) {
    return;
  }

  currentSocket.emit(
    "chess:drawOffer",
    {
      gameId,
    }
  );
};

export const answerDraw = (
  gameId: string,
  accept: boolean
) => {
  if (
    !currentSocket ||
    !currentSocket.connected
  ) {
    return;
  }

  currentSocket.emit(
    "chess:drawAnswer",
    {
      gameId,
      accept,
    }
  );
};

/* -------------------------------------------------------------------------- */
/* Resign                                                                     */
/* -------------------------------------------------------------------------- */

export const resignGame = (
  gameId: string
) => {
  if (
    !currentSocket ||
    !currentSocket.connected
  ) {
    return;
  }

  console.log(
    "🏳️ Resigning game:",
    gameId
  );

  currentSocket.emit(
    "chess:resign",
    {
      gameId,
    }
  );
};

/* -------------------------------------------------------------------------- */
/* Friend Request                                                             */
/* -------------------------------------------------------------------------- */

export const sendFriendRequest = (
  userId: string
) => {
  if (
    !currentSocket ||
    !currentSocket.connected
  ) {
    console.log(
      "❌ Cannot send friend request: socket not connected"
    );

    return;
  }

  currentSocket.emit(
    "friend:request",
    {
      userId,
    }
  );
};

/* -------------------------------------------------------------------------- */
/* Respond Friend Request                                                     */
/* -------------------------------------------------------------------------- */

export const respondFriendRequest = (
  requestId: string,
  accept: boolean
) => {
  if (
    !currentSocket ||
    !currentSocket.connected
  ) {
    console.log(
      "❌ Cannot respond to friend request: socket not connected"
    );

    return;
  }

  currentSocket.emit(
    "friend:respond",
    {
      requestId,
      accept,
    }
  );
};

/* -------------------------------------------------------------------------- */
/* Get Current Socket                                                         */
/* -------------------------------------------------------------------------- */

export const getChessSocket =
  () => {
    return currentSocket;
  };

/* -------------------------------------------------------------------------- */
/* Disconnect                                                                 */
/* -------------------------------------------------------------------------- */

export const disconnectChessSocket =
  () => {
    if (!currentSocket) {
      return;
    }

    console.log(
      "🔌 Disconnecting chess socket"
    );

    try {
      currentSocket.removeAllListeners();

      currentSocket.disconnect();
    } catch (error) {
      console.log(
        "Socket disconnect error:",
        error
      );
    }

    currentSocket = null;

    connectingPromise = null;
  };