const jwt = require("jsonwebtoken");
const { Chess } = require("chess.js");
const crypto = require("crypto");
const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");

const MODE = {
  rapid: { base: 600000, increment: 0 },
  chill: { base: 0, perMove: 60000, increment: 0 },
  blitz5: { base: 300000, increment: 3000 },
  tempo: { base: 0, perMove: 20000, increment: 0 },
  blitz3: { base: 180000, increment: 0 },
  bullet: { base: 120000, increment: 1000 },
};

const games = new Map();
const queues = new Map();
const online = new Map();
let ioRef = null;
let tickStarted = false;

const playerSummary = async (id, color) => {
  const user = await User.findById(id).select("fname lname rating countryCode randomAvatar profilePhoto");
  if (!user) throw new Error("Player not found");
  return {
    id: user._id.toString(),
    name: `${user.fname || ""} ${user.lname || ""}`.trim() || "Player",
    rating: user.rating ?? 1200,
    color,
    avatar: user.profilePhoto || user.randomAvatar || null,
    countryCode: user.countryCode || null,
  };
};

const emitPresence = () => {
  const count = online.size;
  if (!ioRef) return;
  ioRef.emit("chess:presence", { count });
};

const roomPlayers = (game) => [game.white, game.black].filter(Boolean).map((p) => p.userId);

const removeFromQueue = (socketId) => {
  for (const [mode, ids] of queues.entries()) {
    const next = ids.filter((id) => id !== socketId);
    if (next.length) queues.set(mode, next);
    else queues.delete(mode);
  }
};

const sendClocks = (game) => {
  const clocks = {
    white: Math.max(0, game.clocks.white),
    black: Math.max(0, game.clocks.black),
    active: game.activeColor,
    serverAt: Date.now(),
  };
  ioRef.to(game.room).emit("chess:clock", clocks);
  return clocks;
};

const tick = () => {
  const now = Date.now();
  for (const game of games.values()) {
    if (!game.started || game.gameOver || !game.activeColor) continue;
    const elapsed = now - game.turnStartedAt;
    const remaining = game.clocks[game.activeColor] - elapsed;
    if (remaining <= 0) {
      game.clocks[game.activeColor] = 0;
      game.gameOver = true;
      const winner = game.activeColor === "white" ? "black" : "white";
      ioRef.to(game.room).emit("chess:clock", { ...game.clocks, active: game.activeColor, serverAt: now });
      ioRef.to(game.room).emit("chess:gameOver", { reason: "timeout", winner, clocks: { ...game.clocks, serverAt: now } });
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
  if (!MODE[mode]) return socket.emit("chess:error", { message: "Invalid time control" });
  removeFromQueue(socket.id);
  const ids = queues.get(mode) || [];
  const opponentId = ids.find((id) => id !== socket.id && ioRef.sockets.sockets.get(id));
  if (!opponentId) {
    ids.push(socket.id);
    queues.set(mode, ids);
    socket.emit("chess:searching", { mode });
    return;
  }

  queues.set(mode, ids.filter((id) => id !== opponentId));
  const opponentSocket = ioRef.sockets.sockets.get(opponentId);
  if (!opponentSocket) return matchmake(socket, mode);

  const gameId = crypto.randomUUID();
  const room = `chess:${gameId}`;
  const config = MODE[mode];
  const game = {
    id: gameId,
    room,
    mode,
    config,
    game: new Chess(),
    white: { socketId: socket.id, userId: socket.userId },
    black: { socketId: opponentSocket.id, userId: opponentSocket.userId },
    clocks: { white: config.base, black: config.base },
    activeColor: null,
    turnStartedAt: 0,
    started: false,
    gameOver: false,
    drawOfferedBy: null,
  };
  games.set(gameId, game);
  socket.join(room);
  opponentSocket.join(room);
  startGame(game);

  const white = await playerSummary(game.white.userId, "white");
  const black = await playerSummary(game.black.userId, "black");
  const payload = { gameId, fen: game.game.fen(), mode, clocks: { ...game.clocks, active: game.activeColor, serverAt: Date.now() } };
  socket.emit("chess:matchFound", { ...payload, color: "white", player: white, opponent: black });
  opponentSocket.emit("chess:matchFound", { ...payload, color: "black", player: black, opponent: white });
  ioRef.to(room).emit("chess:gameReady", payload);
};

const makeMove = async (socket, data) => {
  const game = games.get(data?.gameId);
  if (!game || game.gameOver || !game.started) return socket.emit("chess:error", { message: "Game not found" });
  const color = game.white.socketId === socket.id ? "white" : game.black.socketId === socket.id ? "black" : null;
  if (!color || game.activeColor !== color) return socket.emit("chess:error", { message: "Not your turn" });
  const elapsed = Date.now() - game.turnStartedAt;
  const remaining = game.clocks[color] - elapsed;
  if (remaining <= 0) return;

  try {
    const move = game.game.move({ from: data.from, to: data.to, promotion: data.promotion || "q" });
    game.clocks[color] = remaining + (game.config.increment || 0);
    const next = color === "white" ? "black" : "white";
    game.activeColor = next;
    game.turnStartedAt = Date.now();
    if (game.config.perMove) game.clocks[next] = game.config.perMove;
    const clocks = { ...game.clocks, active: game.activeColor, serverAt: Date.now() };
    const payload = { gameId: game.id, move: { from: move.from, to: move.to, promotion: move.promotion, san: move.san }, fen: game.game.fen(), turn: next, check: game.game.inCheck(), checkmate: game.game.isCheckmate(), draw: game.game.isDraw(), gameOver: game.game.isGameOver(), clocks };
    ioRef.to(game.room).emit("chess:moveMade", payload);
    ioRef.to(game.room).emit("chess:clock", clocks);
    if (payload.gameOver) {
      game.gameOver = true;
      ioRef.to(game.room).emit("chess:gameOver", { reason: game.game.isCheckmate() ? "checkmate" : "draw", clocks });
    }
  } catch (error) {
    socket.emit("chess:error", { message: "Illegal move" });
  }
};

const friendRequest = async (socket, userId, ack) => {
  const reply = (value) => { if (typeof ack === "function") ack(value); };
  try {
    if (!userId) return reply({ success: false, message: "Target user is required." });
    if (String(userId) === String(socket.userId)) return reply({ success: false, message: "You cannot add yourself." });
    const targetUser = await User.findById(userId).select("fname lname rating countryCode randomAvatar profilePhoto friends");
    if (!targetUser) return reply({ success: false, message: "User not found." });

    const me = await User.findById(socket.userId).select("friends");
    if (me?.friends?.some((id) => String(id) === String(userId))) return reply({ success: false, message: "You are already friends." });

    const existing = await FriendRequest.findOne({
      $or: [
        { from: socket.userId, to: userId },
        { from: userId, to: socket.userId },
      ],
    }).sort({ updatedAt: -1 });

    if (existing?.status === "pending") return reply({ success: false, message: "A friend request is already pending." });
    if (existing?.status === "accepted") return reply({ success: false, message: "You are already friends." });

    const request = existing || new FriendRequest({ from: socket.userId, to: userId });
    request.from = socket.userId;
    request.to = userId;
    request.status = "pending";
    await request.save();

    const fromUser = await User.findById(socket.userId).select("fname lname rating countryCode randomAvatar profilePhoto");
    const requestData = {
      id: request._id.toString(),
      from: socket.userId.toString(),
      fromName: `${fromUser?.fname || ""} ${fromUser?.lname || ""}`.trim() || "Player",
      fromRating: fromUser?.rating ?? 1200,
      fromCountryCode: fromUser?.countryCode || null,
      fromAvatar: fromUser?.profilePhoto || fromUser?.randomAvatar || null,
    };

    const targetSocket = [...online.values()].find((s) => String(s.userId) === String(userId));
    if (targetSocket) targetSocket.emit("friend:request", requestData);
    socket.emit("friend:requestSent", { ...requestData, to: userId.toString(), toName: `${targetUser.fname || ""} ${targetUser.lname || ""}`.trim() || "Player" });
    reply({ success: true, message: "Friend request sent.", requestId: request._id.toString() });
  } catch (error) {
    console.error("friend:request error:", error);
    reply({ success: false, message: error.message || "Friend request failed." });
  }
};

const friendRespond = async (socket, requestId, accept, ack) => {
  const reply = (value) => { if (typeof ack === "function") ack(value); };
  try {
    const request = await FriendRequest.findOne({ _id: requestId, to: socket.userId, status: "pending" });
    if (!request) return reply({ success: false, message: "Friend request not found or already handled." });

    request.status = accept ? "accepted" : "rejected";
    await request.save();

    if (accept) {
      await Promise.all([
        User.findByIdAndUpdate(socket.userId, { $addToSet: { friends: request.from } }),
        User.findByIdAndUpdate(request.from, { $addToSet: { friends: socket.userId } }),
      ]);
    }

    const senderSocket = [...online.values()].find((s) => String(s.userId) === String(request.from));
    if (senderSocket) senderSocket.emit("friend:response", { requestId, accepted: accept, userId: socket.userId.toString() });
    socket.emit("friend:response", { requestId, accepted: accept, userId: socket.userId.toString() });
    reply({ success: true, accepted: accept, message: accept ? "Friend request accepted." : "Friend request rejected." });
  } catch (error) {
    console.error("friend:respond error:", error);
    reply({ success: false, message: error.message || "Unable to respond to friend request." });
  }
};

const setupChessSocket = (io, app) => {
  ioRef = io;
  app.locals.onlineCount = 0;
  if (!tickStarted) { setInterval(tick, 250); tickStarted = true; }

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = String(decoded.id);
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    online.set(socket.id, socket);
    app.locals.onlineCount = online.size;
    emitPresence();

    socket.on("chess:requestPresence", () => socket.emit("chess:presence", { count: online.size }));
    socket.on("chess:matchmake", ({ mode }) => matchmake(socket, mode));
    socket.on("chess:cancelMatchmaking", () => { removeFromQueue(socket.id); socket.emit("chess:searchCancelled"); });
    socket.on("chess:makeMove", (data) => makeMove(socket, data));

    socket.on("chess:chat", ({ gameId, message }, ack) => {
      const game = games.get(gameId);
      const text = String(message || "").trim().slice(0, 500);
      if (!game || !text) return typeof ack === "function" && ack({ success: false, message: "Invalid chat message." });
      const payload = {
        id: crypto.randomUUID(),
        from: socket.userId,
        fromName: socket.data?.playerName || "Player",
        message: text,
        createdAt: new Date().toISOString(),
      };
      User.findById(socket.userId).select("fname lname").lean().then((user) => {
        payload.fromName = `${user?.fname || ""} ${user?.lname || ""}`.trim() || "Player";
        ioRef.to(game.room).emit("chess:chat", payload);
      }).catch(() => ioRef.to(game.room).emit("chess:chat", payload));
      if (typeof ack === "function") ack({ success: true });
    });

    socket.on("chess:drawOffer", ({ gameId }) => { const game = games.get(gameId); if (!game || game.gameOver) return; game.drawOfferedBy = socket.id; socket.to(game.room).emit("chess:drawOffer"); });
    socket.on("chess:drawAnswer", ({ gameId, accept }) => { const game = games.get(gameId); if (!game || game.gameOver) return; if (accept) { game.gameOver = true; ioRef.to(game.room).emit("chess:gameOver", { reason: "draw agreement", clocks: sendClocks(game) }); } else { const target = game.drawOfferedBy && ioRef.sockets.sockets.get(game.drawOfferedBy); target?.emit("chess:drawDeclined"); } game.drawOfferedBy = null; });
    socket.on("chess:resign", ({ gameId }) => { const game = games.get(gameId); if (!game || game.gameOver) return; const color = game.white.socketId === socket.id ? "white" : game.black.socketId === socket.id ? "black" : null; if (!color) return; game.gameOver = true; ioRef.to(game.room).emit("chess:gameOver", { reason: "resignation", winner: color === "white" ? "black" : "white", clocks: sendClocks(game) }); });

    socket.on("friend:request", ({ userId }, ack) => friendRequest(socket, userId, ack));
    socket.on("friend:respond", ({ requestId, accept }, ack) => friendRespond(socket, requestId, Boolean(accept), ack));

    socket.on("disconnect", () => {
      removeFromQueue(socket.id);
      online.delete(socket.id);
      app.locals.onlineCount = online.size;
      for (const game of games.values()) {
        if (!game.gameOver && roomPlayers(game).includes(String(socket.userId))) {
          game.gameOver = true;
          socket.to(game.room).emit("chess:opponentDisconnected");
        }
      }
      emitPresence();
    });
  });
};

module.exports = { setupChessSocket };
