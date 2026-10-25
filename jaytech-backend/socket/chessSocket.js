const jwt = require("jsonwebtoken");
const { Chess } = require("chess.js");
const crypto = require("crypto");

const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");
const {settleChessMatch} = require("../services/chessRewardService");

const MODE = {
  rapid: { base: 600000, increment: 0 },
  chill: { base: 0, perMove: 60000, increment: 0 },
  blitz5: { base: 300000, increment: 3000 },
  tempo: { base: 0, perMove: 20000, increment: 0 },
  blitz3: { base: 180000, increment: 0 },
  bullet: { base: 120000, increment: 1000 },
};

// Chess piece points: pawn 1, knight 3, bishop 3, rook 5, queen 10.
const PIECE_POINTS = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 10,
};

const games = new Map();
const queues = new Map();
const online = new Map();

let ioRef = null;
let tickStarted = false;

const getPlayerName = (user) => {
  const fullName = `${user?.fname || ""} ${user?.lname || ""}`.trim();
  return fullName || user?.name || "Player";
};

const playerSummary = async (id, color) => {
  try {
    if (!id) {
      return {
        id: "",
        name: "Player",
        rating: 100,
        color,
        avatar: null,
        countryCode: null,
      };
    }

    const user = await User.findById(id).select(
      "fname lname name rating countryCode randomAvatar profilePhoto"
    );

    if (!user) {
      return {
        id: String(id),
        name: "Player",
        rating: 100,
        color,
        avatar: null,
        countryCode: null,
      };
    }

    return {
      id: user._id.toString(),
      name: getPlayerName(user),
      rating: Number.isFinite(Number(user.rating))
        ? Number(user.rating)
        : 100,
      color,
      avatar: user.profilePhoto || user.randomAvatar || null,
      countryCode: user.countryCode || null,
    };
  } catch (error) {
    console.error("playerSummary error:", error.message);

    return {
      id: String(id || ""),
      name: "Player",
      rating: 100,
      color,
      avatar: null,
      countryCode: null,
    };
  }
};

const emitPresence = () => {
  if (ioRef) {
    ioRef.emit("chess:presence", { count: online.size });
  }
};

const roomPlayers = (game) =>
  [game.white, game.black]
    .filter(Boolean)
    .map((player) => String(player.userId));

const removeFromQueue = (socketId) => {
  for (const [mode, socketIds] of queues.entries()) {
    const remaining = socketIds.filter((id) => id !== socketId);

    if (remaining.length) {
      queues.set(mode, remaining);
    } else {
      queues.delete(mode);
    }
  }
};

const getClocks = (game) => ({
  white: Math.max(0, game.clocks.white),
  black: Math.max(0, game.clocks.black),
  active: game.activeColor,
  serverAt: Date.now(),
});

const sendClocks = (game) => {
  const clocks = getClocks(game);
  ioRef.to(game.room).emit("chess:clock", clocks);
  return clocks;
};

const getCapturedPoints = (game) => ({
  white: game.capturedPoints.white,
  black: game.capturedPoints.black,
});

const getCapturedCounts = (game) => ({
  white: { ...game.capturedCounts.white },
  black: { ...game.capturedCounts.black },
});

/*
 * Rating system:
 * - New users begin at 100.
 * - A decisive result changes both ratings by a combined 10 points.
 * - The Elo expectation adjusts how the 10-point swing is distributed.
 * - A draw does not change ratings in this implementation.
 *
 * The rating changes are stored on the User records and returned to both
 * clients in chess:gameOver.
 */
const updateGameRatings = async (game, winnerColor) => {
  if (game.ratingUpdated) {
    return game.ratingResult || {
      ratingUpdates: {},
      ratingUpdateError: false,
    };
  }

  game.ratingUpdated = true;

  if (winnerColor !== "white" && winnerColor !== "black") {
    game.ratingResult = {
      ratingUpdates: {},
      ratingUpdateError: false,
    };
    return game.ratingResult;
  }

  const whiteId = String(game.white.userId);
  const blackId = String(game.black.userId);

  if (!whiteId || !blackId || whiteId === blackId) {
    game.ratingResult = {
      ratingUpdates: {},
      ratingUpdateError: true,
    };
    return game.ratingResult;
  }

  try {
    const [whiteUser, blackUser] = await Promise.all([
      User.findById(whiteId).select(
        "fname lname name rating countryCode randomAvatar profilePhoto"
      ),
      User.findById(blackId).select(
        "fname lname name rating countryCode randomAvatar profilePhoto"
      ),
    ]);

    if (!whiteUser || !blackUser) {
      game.ratingResult = {
        ratingUpdates: {},
        ratingUpdateError: true,
      };
      return game.ratingResult;
    }

    const whitePrevious = Number.isFinite(Number(whiteUser.rating))
      ? Number(whiteUser.rating)
      : 100;

    const blackPrevious = Number.isFinite(Number(blackUser.rating))
      ? Number(blackUser.rating)
      : 100;

    const winnerPrevious =
      winnerColor === "white" ? whitePrevious : blackPrevious;

    const loserPrevious =
      winnerColor === "white" ? blackPrevious : whitePrevious;

    const winnerExpected =
      1 / (1 + Math.pow(10, (loserPrevious - winnerPrevious) / 400));

    const winnerGain = Math.max(
      0,
      Math.min(10, Math.round(10 * (1 - winnerExpected)))
    );

    const loserChange = -(10 - winnerGain);

    const whiteChange =
      winnerColor === "white" ? winnerGain : loserChange;

    const blackChange =
      winnerColor === "black" ? winnerGain : loserChange;

    const whiteNew = Math.max(0, whitePrevious + whiteChange);
    const blackNew = Math.max(0, blackPrevious + blackChange);

    whiteUser.rating = whiteNew;
    blackUser.rating = blackNew;

    await Promise.all([whiteUser.save(), blackUser.save()]);

    const ratingUpdates = {
      [whiteId]: {
        previousRating: whitePrevious,
        change: whiteNew - whitePrevious,
        newRating: whiteNew,
      },
      [blackId]: {
        previousRating: blackPrevious,
        change: blackNew - blackPrevious,
        newRating: blackNew,
      },
    };

    game.ratingResult = {
      ratingUpdates,
      ratingUpdateError: false,
    };

    return game.ratingResult;
  } catch (error) {
    console.error("Failed to update chess ratings:", error);

    game.ratingResult = {
      ratingUpdates: {},
      ratingUpdateError: true,
    };

    return game.ratingResult;
  }
};

const finishGame = async (
  game,
  { reason, winner = null, resignedBy = null } = {}
) => {
  if (!game || game.gameOver) return;

  // Set immediately so timeout, disconnect, resignation, and checkmate cannot
  // process the same game result more than once in this server process.
  game.gameOver = true;
  game.activeColor = null;

  const clocks = sendClocks(game);

  let ratingData = {
    ratingUpdates: {},
    ratingUpdateError: false,
  };

  if (winner === "white" || winner === "black") {
    ratingData =
      (await updateGameRatings(game, winner)) || ratingData;
  } else {
    game.ratingUpdated = true;
  }

  const [white, black] = await Promise.all([
    playerSummary(game.white.userId, "white"),
    playerSummary(game.black.userId, "black"),
  ]);

  // Include current persisted rating values when possible.
  const ratingUpdates = ratingData.ratingUpdates || {};

  if (ratingUpdates[white.id]) {
    white.rating = ratingUpdates[white.id].newRating;
  }

  if (ratingUpdates[black.id]) {
    black.rating = ratingUpdates[black.id].newRating;
  }

  const winnerPlayer =
    winner === "white" ? white : winner === "black" ? black : null;

  const loserPlayer =
    winner === "white" ? black : winner === "black" ? white : null;

  const payload = {
    gameId: game.id,
    mode: game.mode,
    reason,
    winner,
    resignedBy,
    clocks,

    players: {
      white,
      black,
    },

    winnerPlayer,
    loserPlayer,

    // Rating details are keyed by registered user ID.
    ratingUpdates,
    ratingUpdateError: Boolean(ratingData.ratingUpdateError),

    // Captured points belong to the player who captured the pieces.
    capturedPoints: getCapturedPoints(game),
    capturedCounts: getCapturedCounts(game),

    // Compatibility aliases for existing frontend screens.
    whiteCapturedPoints: game.capturedPoints.white,
    blackCapturedPoints: game.capturedPoints.black,

    // These are capture points, not Elo rating points.
    whiteScore: game.capturedPoints.white,
    blackScore: game.capturedPoints.black,

    finalFen: game.game.fen(),
    pgn: game.game.pgn(),
    moveCount: game.game.history().length,
    finishedAt: new Date().toISOString(),
  };

  ioRef.to(game.room).emit("chess:gameOver", payload);

  console.log("♟️ Chess game finished:", {
    gameId: game.id,
    reason,
    winner,
    ratingUpdateError: payload.ratingUpdateError,
  });
};

const tick = () => {
  if (!ioRef) return;

  const now = Date.now();

  for (const game of games.values()) {
    if (!game.started || game.gameOver || !game.activeColor) continue;

    const elapsed = now - game.turnStartedAt;
    const remaining = game.clocks[game.activeColor] - elapsed;

    if (remaining <= 0) {
      game.clocks[game.activeColor] = 0;

      const winner =
        game.activeColor === "white" ? "black" : "white";

      ioRef.to(game.room).emit("chess:clock", {
        ...game.clocks,
        active: game.activeColor,
        serverAt: now,
      });

      void finishGame(game, {
        reason: "timeout",
        winner,
      });
    }
  }
};

const startGame = (game) => {
  game.started = true;
  game.activeColor = "white";
  game.turnStartedAt = Date.now();

  if (game.config.perMove) {
    game.clocks.white = game.config.perMove;
    game.clocks.black = game.config.perMove;
  }
};

const matchmake = async (socket, mode) => {
  try {
    if (!MODE[mode]) {
      socket.emit("chess:error", {
        code: "INVALID_MODE",
        message: "Invalid time control.",
      });
      return;
    }

    if (!socket.userId) {
      socket.emit("chess:error", {
        code: "AUTH_FAILED",
        message: "User authentication failed.",
      });
      return;
    }

    removeFromQueue(socket.id);

    const ids = queues.get(mode) || [];
    const opponentId = ids.find(
      (id) => id !== socket.id && ioRef.sockets.sockets.get(id)
    );

    if (!opponentId) {
      ids.push(socket.id);
      queues.set(mode, ids);
      socket.emit("chess:searching", { mode });
      return;
    }

    queues.set(
      mode,
      ids.filter((id) => id !== opponentId)
    );

    const opponentSocket = ioRef.sockets.sockets.get(opponentId);

    if (!opponentSocket) {
      return matchmake(socket, mode);
    }

    if (!opponentSocket.userId) {
      socket.emit("chess:error", {
        code: "OPPONENT_AUTH_FAILED",
        message: "Opponent authentication failed.",
      });
      return;
    }

    if (String(socket.userId) === String(opponentSocket.userId)) {
      return matchmake(socket, mode);
    }

    const gameId = crypto.randomUUID();
    const room = `chess:${gameId}`;
    const config = MODE[mode];

    const game = {
      id: gameId,
      room,
      mode,
      config,
      game: new Chess(),

      white: {
        socketId: socket.id,
        userId: socket.userId,
      },

      black: {
        socketId: opponentSocket.id,
        userId: opponentSocket.userId,
      },

      clocks: {
        white: config.base,
        black: config.base,
      },

      // Points and piece counts are tracked per capturing player.
      capturedPoints: {
        white: 0,
        black: 0,
      },

      capturedCounts: {
        white: { p: 0, n: 0, b: 0, r: 0, q: 0 },
        black: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      },

      activeColor: null,
      turnStartedAt: 0,
      started: false,
      gameOver: false,
      ratingUpdated: false,
      ratingResult: null,
      drawOfferedBy: null,
    };

    games.set(gameId, game);

    socket.join(room);
    opponentSocket.join(room);

    startGame(game);

    const [white, black] = await Promise.all([
      playerSummary(game.white.userId, "white"),
      playerSummary(game.black.userId, "black"),
    ]);

    const payload = {
      gameId,
      fen: game.game.fen(),
      mode,
      clocks: getClocks(game),
    };

    socket.emit("chess:matchFound", {
      ...payload,
      color: "white",
      player: white,
      opponent: black,
    });

    opponentSocket.emit("chess:matchFound", {
      ...payload,
      color: "black",
      player: black,
      opponent: white,
    });

    ioRef.to(room).emit("chess:gameReady", payload);

    console.log("✅ CHESS GAME CREATED", {
      gameId,
      room,
      white: white.name,
      black: black.name,
    });
  } catch (error) {
    console.error("CHESS MATCHMAKING ERROR:", error);

    socket.emit("chess:error", {
      code: "MATCHMAKING_FAILED",
      message: "Unable to start chess game. Please try again.",
    });
  }
};

const makeMove = async (socket, data = {}) => {
  const gameId = String(data.gameId || "").trim();
  const game = games.get(gameId);

  if (!game || game.gameOver || !game.started) {
    socket.emit("chess:error", {
      code: "GAME_NOT_FOUND",
      message:
        "This chess match is no longer active. Return to the lobby and find a new opponent.",
      gameId,
      recoverable: true,
    });
    return;
  }

  const color =
    game.white.socketId === socket.id
      ? "white"
      : game.black.socketId === socket.id
        ? "black"
        : null;

  if (!color) {
    socket.emit("chess:error", {
      code: "NOT_A_PLAYER",
      message: "You are not a player in this match.",
      gameId,
    });
    return;
  }

  if (game.activeColor !== color) {
    socket.emit("chess:error", {
      code: "NOT_YOUR_TURN",
      message: "It is not your turn.",
      gameId,
    });
    return;
  }

  const elapsed = Date.now() - game.turnStartedAt;
  const remaining = game.clocks[color] - elapsed;

  if (remaining <= 0) {
    game.clocks[color] = 0;

    await finishGame(game, {
      reason: "timeout",
      winner: color === "white" ? "black" : "white",
    });

    return;
  }

  try {
    const move = game.game.move({
      from: data.from,
      to: data.to,
      promotion: data.promotion || "q",
    });

    // Add the value of the captured piece to the capturing player's total.
    if (move.captured) {
      const capturedPiece = String(move.captured).toLowerCase();
      const points = PIECE_POINTS[capturedPiece] || 0;

      game.capturedPoints[color] += points;

      if (
        Object.prototype.hasOwnProperty.call(
          game.capturedCounts[color],
          capturedPiece
        )
      ) {
        game.capturedCounts[color][capturedPiece] += 1;
      }
    }

    game.clocks[color] = remaining + (game.config.increment || 0);

    const next = color === "white" ? "black" : "white";

    game.activeColor = next;
    game.turnStartedAt = Date.now();

    if (game.config.perMove) {
      game.clocks[next] = game.config.perMove;
    }

    const clocks = getClocks(game);
    const checkmate = game.game.isCheckmate();
    const isGameOver = game.game.isGameOver();

    const payload = {
      gameId: game.id,

      move: {
        from: move.from,
        to: move.to,
        promotion: move.promotion,
        san: move.san,
        captured: move.captured || null,
        capturedPoints: move.captured
          ? PIECE_POINTS[String(move.captured).toLowerCase()] || 0
          : 0,
      },

      fen: game.game.fen(),
      turn: next,
      check: game.game.isCheck(),
      checkmate,
      draw: game.game.isDraw(),
      gameOver: isGameOver,
      clocks,

      capturedPoints: getCapturedPoints(game),
      capturedCounts: getCapturedCounts(game),
      whiteCapturedPoints: game.capturedPoints.white,
      blackCapturedPoints: game.capturedPoints.black,
    };

    ioRef.to(game.room).emit("chess:moveMade", payload);
    ioRef.to(game.room).emit("chess:clock", clocks);

    if (isGameOver) {
      if (checkmate) {
        // After the mating move, next is the side that was checkmated.
        await finishGame(game, {
          reason: "checkmate",
          winner: next === "white" ? "black" : "white",
        });
      } else {
        await finishGame(game, {
          reason: "draw",
          winner: null,
        });
      }
    }
  } catch (error) {
    socket.emit("chess:error", {
      code: "ILLEGAL_MOVE",
      message: "Illegal move.",
      gameId,
    });
  }
};

const friendRequest = async (socket, userId, ack) => {
  const reply = (value) => {
    if (typeof ack === "function") ack(value);
  };

  try {
    if (!userId) {
      return reply({
        success: false,
        message: "Target user is required.",
      });
    }

    if (String(userId) === String(socket.userId)) {
      return reply({
        success: false,
        message: "You cannot add yourself.",
      });
    }

    const targetUser = await User.findById(userId).select(
      "fname lname name rating countryCode randomAvatar profilePhoto friends"
    );

    if (!targetUser) {
      return reply({
        success: false,
        message: "User not found.",
      });
    }

    const me = await User.findById(socket.userId).select("friends");

    if (me?.friends?.some((id) => String(id) === String(userId))) {
      return reply({
        success: false,
        message: "You are already friends.",
      });
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { from: socket.userId, to: userId },
        { from: userId, to: socket.userId },
      ],
    }).sort({ updatedAt: -1 });

    if (existing?.status === "pending") {
      return reply({
        success: false,
        message: "A friend request is already pending.",
      });
    }

    if (existing?.status === "accepted") {
      return reply({
        success: false,
        message: "You are already friends.",
      });
    }

    const request =
      existing ||
      new FriendRequest({
        from: socket.userId,
        to: userId,
      });

    request.from = socket.userId;
    request.to = userId;
    request.status = "pending";

    await request.save();

    const fromUser = await User.findById(socket.userId).select(
      "fname lname name rating countryCode randomAvatar profilePhoto"
    );

    const requestData = {
      id: request._id.toString(),
      requestId: request._id.toString(),
      from: socket.userId.toString(),

      fromName: getPlayerName(fromUser),
      fromRating: fromUser?.rating ?? 100,
      fromCountryCode: fromUser?.countryCode || null,
      fromAvatar: fromUser?.profilePhoto || fromUser?.randomAvatar || null,
    };

    const targetSocket = [...online.values()].find(
      (item) => String(item.userId) === String(userId)
    );

    if (targetSocket) {
      targetSocket.emit("friend:request", requestData);
    }

    socket.emit("friend:requestSent", {
      ...requestData,
      to: userId.toString(),
      toName: getPlayerName(targetUser),
    });

    reply({
      success: true,
      message: "Friend request sent.",
      requestId: request._id.toString(),
    });
  } catch (error) {
    console.error("friend:request error:", error);

    reply({
      success: false,
      message: error.message || "Friend request failed.",
    });
  }
};

const friendRespond = async (socket, requestId, accept, ack) => {
  const reply = (value) => {
    if (typeof ack === "function") ack(value);
  };

  try {
    const request = await FriendRequest.findOne({
      _id: requestId,
      to: socket.userId,
      status: "pending",
    });

    if (!request) {
      return reply({
        success: false,
        message: "Friend request not found or already handled.",
      });
    }

    request.status = accept ? "accepted" : "rejected";
    await request.save();

    if (accept) {
      // Add each user to the other's friend list without duplicates.
      await Promise.all([
        User.findByIdAndUpdate(socket.userId, {
          $addToSet: { friends: request.from },
        }),

        User.findByIdAndUpdate(request.from, {
          $addToSet: { friends: socket.userId },
        }),
      ]);
    }

    const responsePayload = {
      requestId: String(request._id),
      accepted: Boolean(accept),
      userId: String(socket.userId),
      friendId: String(request.from),
    };

    const senderSocket = [...online.values()].find(
      (item) => String(item.userId) === String(request.from)
    );

    if (senderSocket) {
      senderSocket.emit("friend:response", responsePayload);
      senderSocket.emit("friends:refresh");
    }

    socket.emit("friend:response", responsePayload);
    socket.emit("friends:refresh");

    reply({
      success: true,
      accepted: Boolean(accept),
      message: accept
        ? "Friend request accepted."
        : "Friend request rejected.",
    });
  } catch (error) {
    console.error("friend:respond error:", error);

    reply({
      success: false,
      message: error.message || "Unable to respond to friend request.",
    });
  }
};

const setupChessSocket = (io, app) => {
  ioRef = io;
  app.locals.onlineCount = 0;

  if (!tickStarted) {
    setInterval(tick, 250);
    tickStarted = true;
  }

  io.use((socket, next) => {
    try {
      const rawToken = socket.handshake.auth?.token;

      if (!rawToken || typeof rawToken !== "string") {
        console.error("❌ Chess socket: token missing");
        return next(new Error("Authentication token missing"));
      }

      const token = rawToken
        .replace(/^Bearer\s+/i, "")
        .trim();

      if (!process.env.JWT_SECRET) {
        console.error(
          "❌ Chess socket: JWT_SECRET is not configured in this backend process"
        );
        return next(new Error("Server authentication configuration error"));
      }

      // Verify the token with the same secret used by generateToken.js.
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // The token generator stores the user's database ID in `id`.
      const userId = decoded.id || decoded._id || decoded.userId;

      if (!userId) {
        console.error(
          "❌ Chess socket: verified token has no user ID"
        );
        return next(new Error("User ID missing from token"));
      }

      // Both properties are used by the existing chess server.
      socket.user = decoded;
      socket.userId = String(userId);

      console.log("✅ Chess socket authenticated:", {
        userId: socket.userId,
      });

      return next();
    } catch (error) {
      console.error("❌ Chess socket authentication failed:", {
        name: error.name,
        message: error.message,
      });

      if (error.name === "TokenExpiredError") {
        return next(new Error("Token expired. Please log in again."));
      }

      if (error.name === "JsonWebTokenError") {
        return next(new Error("Invalid token"));
      }

      return next(new Error("Socket authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    online.set(socket.id, socket);
    app.locals.onlineCount = online.size;

    emitPresence();

    socket.on("chess:requestPresence", () => {
      socket.emit("chess:presence", { count: online.size });
    });

    socket.on("chess:matchmake", async ({ mode } = {}) => {
      await matchmake(socket, mode);
    });

    socket.on("chess:cancelMatchmaking", () => {
      removeFromQueue(socket.id);
      socket.emit("chess:searchCancelled");
    });

    socket.on("chess:makeMove", (data) => {
      void makeMove(socket, data);
    });

    socket.on("chess:chat", ({ gameId, message } = {}, ack) => {
      const game = games.get(String(gameId || ""));
      const text = String(message || "").trim().slice(0, 500);

      const isPlayer =
        game &&
        (game.white.socketId === socket.id ||
          game.black.socketId === socket.id);

      if (!game || game.gameOver || !isPlayer || !text) {
        if (typeof ack === "function") {
          ack({
            success: false,
            message: "Invalid chat message or inactive game.",
          });
        }
        return;
      }

      const payload = {
        id: crypto.randomUUID(),
        from: socket.userId,
        fromName: "Player",
        message: text,
        createdAt: new Date().toISOString(),
      };

      User.findById(socket.userId)
        .select("fname lname name")
        .lean()
        .then((user) => {
          payload.fromName = getPlayerName(user);
          ioRef.to(game.room).emit("chess:chat", payload);
        })
        .catch(() => {
          ioRef.to(game.room).emit("chess:chat", payload);
        });

      if (typeof ack === "function") {
        ack({ success: true });
      }
    });

    socket.on("chess:drawOffer", ({ gameId } = {}) => {
      const game = games.get(String(gameId || ""));

      if (
        !game ||
        game.gameOver ||
        !roomPlayers(game).includes(String(socket.userId))
      ) {
        return;
      }

      game.drawOfferedBy = socket.id;
      socket.to(game.room).emit("chess:drawOffer");
    });

    socket.on("chess:drawAnswer", async ({ gameId, accept } = {}) => {
      const game = games.get(String(gameId || ""));

      if (
        !game ||
        game.gameOver ||
        !roomPlayers(game).includes(String(socket.userId))
      ) {
        return;
      }

      if (accept) {
        await finishGame(game, {
          reason: "draw agreement",
          winner: null,
        });
      } else {
        const offerer =
          game.drawOfferedBy &&
          ioRef.sockets.sockets.get(game.drawOfferedBy);

        offerer?.emit("chess:drawDeclined");
      }

      game.drawOfferedBy = null;
    });

    socket.on("chess:resign", async ({ gameId } = {}) => {
      const game = games.get(String(gameId || ""));

      if (!game || game.gameOver) {
        socket.emit("chess:error", {
          code: "GAME_NOT_FOUND",
          message: "This chess match is no longer active.",
          gameId,
          recoverable: true,
        });
        return;
      }

      const color =
        game.white.socketId === socket.id
          ? "white"
          : game.black.socketId === socket.id
            ? "black"
            : null;

      if (!color) {
        socket.emit("chess:error", {
          code: "NOT_A_PLAYER",
          message: "You are not a player in this match.",
        });
        return;
      }

      await finishGame(game, {
        reason: "resignation",
        winner: color === "white" ? "black" : "white",
        resignedBy: socket.userId,
      });
    });

    socket.on("friend:request", ({ userId } = {}, ack) => {
      void friendRequest(socket, userId, ack);
    });

    socket.on(
      "friend:respond",
      ({ requestId, accept } = {}, ack) => {
        void friendRespond(socket, requestId, Boolean(accept), ack);
      }
    );

    socket.on("disconnect", () => {
      removeFromQueue(socket.id);
      online.delete(socket.id);

      app.locals.onlineCount = online.size;

      for (const game of games.values()) {
        if (game.gameOver) continue;

        const disconnectedColor =
          game.white.socketId === socket.id
            ? "white"
            : game.black.socketId === socket.id
              ? "black"
              : null;

        if (!disconnectedColor) continue;

        const winner =
          disconnectedColor === "white" ? "black" : "white";

        void finishGame(game, {
          reason: "opponentDisconnected",
          winner,
        });

        socket.to(game.room).emit("chess:opponentDisconnected");
      }

      emitPresence();
    });
  });
};

module.exports = { setupChessSocket };