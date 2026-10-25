const mongoose = require("mongoose");

const ChessTransactionSchema = new mongoose.Schema(
  {
    transactionKey: {
      type: String,
      required: true,
      unique: true,
    },

    accountType: {
      type: String,
      enum: ["player", "platform"],
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    matchId: {
      type: String,
      required: true,
      index: true,
    },

    modeId: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "entry",
        "win_reward",
        "loss_reward",
        "draw_refund",
        "platform_share",
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    balanceAfter: {
      type: Number,
      default: null,
    },

    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

ChessTransactionSchema.index({
  user: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "ChessTransaction",
  ChessTransactionSchema
);