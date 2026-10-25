
const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const scope = String(req.query.scope || "world").toLowerCase();

    if (!["world", "india"].includes(scope)) {
      return res.status(400).json({
        success: false,
        message: "scope must be world or india",
      });
    }

    const filter =
      scope === "india"
        ? {
            countryCode: {
              $in: ["+91", "91", "IN", "IND", "India"],
            },
          }
        : {};

    const users = await User.find(filter)
      .select(
        "fname lname name rating countryCode randomAvatar profilePhoto"
      )
      .sort({ rating: -1, fname: 1, lname: 1 })
      .limit(500)
      .lean();

    const players = users.map((user) => ({
      id: String(user._id),
      name:
        `${user.fname || ""} ${user.lname || ""}`.trim() ||
        user.name ||
        "Player",
      rating: Number.isFinite(Number(user.rating))
        ? Number(user.rating)
        : 100,
      countryCode: user.countryCode || null,
      randomAvatar: user.randomAvatar || "🦊",
      profilePhoto: user.profilePhoto || null,
    }));

    return res.json({
      success: true,
      scope,
      players,
    });
  } catch (error) {
    console.error("Chess rankings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load chess rankings.",
    });
  }
});

module.exports = router;
