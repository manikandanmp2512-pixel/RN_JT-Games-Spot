const User = require("../models/User");
const ChessTransaction = require("../models/ChessTransaction");

const {
  CHESS_REWARD_MODES,
} = require("../services/chessRewardService");

exports.getModes = (req, res) => {
  return res.json({
    success: true,
    modes: Object.values(CHESS_REWARD_MODES),
  });
};

exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("gems");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      coins: Number(user.gems || 0),
    });
  } catch (error) {
    console.error("Chess reward balance error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load virtual coin balance",
    });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    const [transactions, total] = await Promise.all([
      ChessTransaction.find({
        user: req.user.id,
        accountType: "player",
      })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      ChessTransaction.countDocuments({
        user: req.user.id,
        accountType: "player",
      }),
    ]);

    return res.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Chess reward history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load virtual coin history",
    });
  }
};