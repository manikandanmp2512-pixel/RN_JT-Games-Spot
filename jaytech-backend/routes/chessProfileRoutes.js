
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const ALLOWED_AVATARS = new Set([
  "🦊",
  "🐼",
  "🦁",
  "🐯",
  "🐸",
  "🐺",
  "🦄",
  "🐨",
]);

// PATCH /api/chess-profile/avatar
// Header: Authorization: Bearer <token>
// Body: { "randomAvatar": "🦊" }
router.patch("/avatar", async (req, res) => {
  try {
    const authorization = req.headers.authorization || "";

    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        success: false,
        message: "Server authentication is not configured",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const randomAvatar = String(req.body?.randomAvatar || "");

    if (!ALLOWED_AVATARS.has(randomAvatar)) {
      return res.status(400).json({
        success: false,
        message: "Invalid avatar selection",
      });
    }

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { $set: { randomAvatar } },
      { new: true, runValidators: true }
    ).select(
      "fname lname rating randomAvatar profilePhoto countryCode"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Save chess avatar error:", error);

    return res.status(401).json({
      success: false,
      message: "Could not authenticate or save avatar",
    });
  }
});

module.exports = router;
