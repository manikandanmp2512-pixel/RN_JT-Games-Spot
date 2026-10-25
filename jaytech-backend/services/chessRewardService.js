const mongoose = require("mongoose");

const User = require("../models/User");
const ChessTransaction = require("../models/ChessTransaction");
const ChessMatchSettlement = require(
  "../models/ChessMatchSettlement"
);

const CHESS_REWARD_MODES = require(
  "../config/chessRewardModes"
);

class ChessRewardError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "ChessRewardError";
    this.statusCode = statusCode;
  }
}

async function settleChessMatch({
  matchId,
  modeId,
  winnerId = null,
  loserId = null,
  player1Id = null,
  player2Id = null,
  outcome = "win",
}) {
  if (!matchId || !modeId) {
    throw new ChessRewardError(
      "Match ID and game mode are required"
    );
  }

  const mode = CHESS_REWARD_MODES[modeId];

  if (!mode) {
    throw new ChessRewardError("Invalid chess reward mode");
  }

  const isDraw = outcome === "draw";

  if (!isDraw && outcome !== "win") {
    throw new ChessRewardError("Invalid match outcome");
  }

  const firstId = isDraw ? player1Id : winnerId;
  const secondId = isDraw ? player2Id : loserId;

  if (!firstId || !secondId || String(firstId) === String(secondId)) {
    throw new ChessRewardError("Invalid match players");
  }

  if (
    !mongoose.isValidObjectId(firstId) ||
    !mongoose.isValidObjectId(secondId)
  ) {
    throw new ChessRewardError("Invalid player ID");
  }

  const session = await mongoose.startSession();
  let response;

  try {
    await session.withTransaction(async () => {
      const existing = await ChessMatchSettlement.findOne({
        matchId: String(matchId),
      }).session(session);

      if (existing) {
        response = {
          alreadySettled: true,
          settlement: existing,
        };
        return;
      }

      const firstUser = await User.findById(firstId).session(session);
      const secondUser = await User.findById(secondId).session(session);

      if (!firstUser || !secondUser) {
        throw new ChessRewardError("One or both players were not found", 404);
      }

      const entryCoins = mode.entryCoins;

      // Deduct virtual entry coins from both players.
      // Insufficient balances abort the entire transaction.
      let firstAfterEntry = Number(firstUser.gems || 0);
      let secondAfterEntry = Number(secondUser.gems || 0);

      if (entryCoins > 0) {
        const firstUpdated = await User.findOneAndUpdate(
          {
            _id: firstId,
            gems: { $gte: entryCoins },
          },
          {
            $inc: { gems: -entryCoins },
          },
          {
            new: true,
            session,
          }
        );

        if (!firstUpdated) {
          throw new ChessRewardError(
            "The first player does not have enough virtual coins"
          );
        }

        const secondUpdated = await User.findOneAndUpdate(
          {
            _id: secondId,
            gems: { $gte: entryCoins },
          },
          {
            $inc: { gems: -entryCoins },
          },
          {
            new: true,
            session,
          }
        );

        if (!secondUpdated) {
          throw new ChessRewardError(
            "The second player does not have enough virtual coins"
          );
        }

        firstAfterEntry = Number(firstUpdated.gems || 0);
        secondAfterEntry = Number(secondUpdated.gems || 0);
      }

      const transactions = [];

      if (entryCoins > 0) {
        transactions.push({
          transactionKey: `${matchId}:${firstId}:entry`,
          accountType: "player",
          user: firstId,
          matchId: String(matchId),
          modeId,
          type: "entry",
          amount: -entryCoins,
          balanceAfter: firstAfterEntry,
          description: "Virtual chess entry",
        });

        transactions.push({
          transactionKey: `${matchId}:${secondId}:entry`,
          accountType: "player",
          user: secondId,
          matchId: String(matchId),
          modeId,
          type: "entry",
          amount: -entryCoins,
          balanceAfter: secondAfterEntry,
          description: "Virtual chess entry",
        });
      }

      let firstFinalBalance = firstAfterEntry;
      let secondFinalBalance = secondAfterEntry;

      if (isDraw) {
        // A draw refunds both players' virtual entry coins.
        if (entryCoins > 0) {
          const firstRefund = await User.findByIdAndUpdate(
            firstId,
            { $inc: { gems: entryCoins } },
            { new: true, session }
          );

          const secondRefund = await User.findByIdAndUpdate(
            secondId,
            { $inc: { gems: entryCoins } },
            { new: true, session }
          );

          firstFinalBalance = Number(firstRefund.gems || 0);
          secondFinalBalance = Number(secondRefund.gems || 0);

          transactions.push({
            transactionKey: `${matchId}:${firstId}:draw-refund`,
            accountType: "player",
            user: firstId,
            matchId: String(matchId),
            modeId,
            type: "draw_refund",
            amount: entryCoins,
            balanceAfter: firstFinalBalance,
            description: "Virtual coins refunded for a draw",
          });

          transactions.push({
            transactionKey: `${matchId}:${secondId}:draw-refund`,
            accountType: "player",
            user: secondId,
            matchId: String(matchId),
            modeId,
            type: "draw_refund",
            amount: entryCoins,
            balanceAfter: secondFinalBalance,
            description: "Virtual coins refunded for a draw",
          });
        }
      } else {
        const winnerReward = mode.winnerCoins;
        const loserReward = mode.loserCoins;

        const winnerUpdated = await User.findByIdAndUpdate(
          winnerId,
          { $inc: { gems: winnerReward } },
          { new: true, session }
        );

        const loserUpdated = await User.findByIdAndUpdate(
          loserId,
          { $inc: { gems: loserReward } },
          { new: true, session }
        );

        firstFinalBalance = Number(winnerUpdated.gems || 0);
        secondFinalBalance = Number(loserUpdated.gems || 0);

        transactions.push({
          transactionKey: `${matchId}:${winnerId}:win-reward`,
          accountType: "player",
          user: winnerId,
          matchId: String(matchId),
          modeId,
          type: "win_reward",
          amount: winnerReward,
          balanceAfter: firstFinalBalance,
          description: "Chess match winner reward",
        });

        transactions.push({
          transactionKey: `${matchId}:${loserId}:loss-reward`,
          accountType: "player",
          user: loserId,
          matchId: String(matchId),
          modeId,
          type: "loss_reward",
          amount: loserReward,
          balanceAfter: secondFinalBalance,
          description: "Chess match participation reward",
        });

        if (mode.platformCoins > 0) {
          transactions.push({
            transactionKey: `${matchId}:platform:share`,
            accountType: "platform",
            user: null,
            matchId: String(matchId),
            modeId,
            type: "platform_share",
            amount: mode.platformCoins,
            balanceAfter: null,
            description: "Non-cash virtual coin ledger entry",
          });
        }
      }

      if (transactions.length > 0) {
        await ChessTransaction.insertMany(transactions, { session });
      }

      const settlement = await ChessMatchSettlement.create(
        [
          {
            matchId: String(matchId),
            modeId,
            outcome: isDraw ? "draw" : "win",
            winner: isDraw ? null : winnerId,
            loser: isDraw ? null : loserId,
            players: [firstId, secondId],
            settled: true,
          },
        ],
        { session }
      );

      response = {
        alreadySettled: false,
        settlement: settlement[0],
        rewards: isDraw
          ? { firstPlayerCoins: entryCoins, secondPlayerCoins: entryCoins }
          : {
              winnerCoins: mode.winnerCoins,
              loserCoins: mode.loserCoins,
              platformVirtualCoins: mode.platformCoins,
            },
      };
    });

    return response;
  } finally {
    await session.endSession();
  }
}

module.exports = {
  settleChessMatch,
  CHESS_REWARD_MODES,
  ChessRewardError,
};