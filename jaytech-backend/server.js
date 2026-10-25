require("dotenv").config();

const http = require("http");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const chessRewardRoutes = require("./routes/chessRewardRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const chessRoutes = require("./routes/chessRoutes");
const adRevenueRoutes = require("./routes/adRevenueRoutes");

const mobileOtpRoutes = require("./routes/mobileOtpRoutes");

const { setupChessSocket } = require("./socket/chessSocket");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

//  Database
connectDB();

//  App settings
app.locals.onlineCount = 0;

//  Middleware
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));


//  Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// HEALTH CHECK
app.get("/", (req, res) => res.json({ status: "OK", message: "JayTech API running" }));
app.get("/health", (req, res) => res.json({ status: "OK" }));

//  API routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chess", chessRoutes);

app.use("/api/chess-rewards", chessRewardRoutes);
app.use("/api/ad-revenue", adRevenueRoutes);
app.use("/api/chess-rankings",  require("./routes/chessRankingRoutes"));

app.use("/api/auth", mobileOtpRoutes);

//  Chess Socket.IO
setupChessSocket(io, app);

//  404 handler
app.use((req, res) => res.status(404).json({ success: true, message: "JayTech API running" }));

//  Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Jay Tech Server running on port ${PORT}`)
    console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
});





// require("dotenv").config();

// const http = require("http");
// const express = require("express");
// const cors = require("cors");
// const { Server } = require("socket.io");

// const connectDB = require("./config/db");

// const authRoutes = require("./routes/authRoutes");
// const chessRoutes = require("./routes/chessRoutes");

// const { setupChessSocket } = require("./socket/chessSocket");

// const app = express();
// const server = http.createServer(app);

// const PORT = Number(process.env.PORT) || 5000;

// // ==========================================
// // DATABASE
// // ==========================================

// connectDB();

// // ==========================================
// // CORS
// // ==========================================

// app.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// // ==========================================
// // BODY PARSER
// // ==========================================

// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// // ==========================================
// // STATIC UPLOADS
// // ==========================================

// app.use("/uploads", express.static("uploads"));

// // ==========================================
// // HEALTH CHECK
// // ==========================================

// app.get("/", (req, res) => {
//   res.json({
//     success: true,
//     message: "Jay Tech API is running",
//     database: "MongoDB",
//     environment: process.env.NODE_ENV || "development",
//   });
// });

// app.get("/health", (req, res) => {
//   res.json({
//     success: true,
//     message: "Server is healthy",
//   });
// });

// // ==========================================
// // API ROUTES
// // ==========================================

// app.use("/api/auth", authRoutes);

// app.use("/api/chess", chessRoutes);

// // ==========================================
// // SOCKET.IO
// // ==========================================

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// // Online users count
// let onlineCount = 0;

// io.on("connection", (socket) => {
//   onlineCount++;

//   console.log(`🟢 Socket connected: ${socket.id}`);
//   console.log(`👥 Online users: ${onlineCount}`);

//   io.emit("onlineCount", onlineCount);

//   socket.on("disconnect", () => {
//     onlineCount--;

//     console.log(`🔴 Socket disconnected: ${socket.id}`);
//     console.log(`👥 Online users: ${onlineCount}`);

//     io.emit("onlineCount", onlineCount);
//   });
// });

// // Chess socket setup
// setupChessSocket(io);

// // ==========================================
// // 404
// // ==========================================

// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route not found: ${req.method} ${req.originalUrl}`,
//   });
// });

// // ==========================================
// // ERROR HANDLER
// // ==========================================

// app.use((err, req, res, next) => {
//   console.error("❌ Server Error:", err);

//   res.status(err.status || 500).json({
//     success: false,
//     message: err.message || "Internal Server Error",
//   });
// });

// // ==========================================
// // START SERVER
// // ==========================================

// server.listen(PORT, "0.0.0.0", () => {
//   console.log("=================================");
//   console.log("🚀 Jay Tech Server Started");
//   console.log(`📡 Port: ${PORT}`);
//   console.log(`🌐 Local: http://localhost:${PORT}`);
//   console.log(`📱 Mobile: http://YOUR_PC_IP:${PORT}`);
//   console.log("🎮 Chess Socket.IO enabled");
//   console.log("=================================");
// });