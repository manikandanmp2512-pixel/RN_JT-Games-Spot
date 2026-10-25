const mongoose = require("mongoose");

const ChessMatchSettlementSchema = new mongoose.Schema(
  {
    matchId: {
      type: String,
      required: true,
      unique: true,
    },

    modeId: {
      type: String,
      required: true,
    },

    outcome: {
      type: String,
      enum: ["win", "draw"],
      required: true,
    },

    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    loser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    settled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ChessMatchSettlement",
  ChessMatchSettlementSchema
);