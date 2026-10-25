 import { Chess, Move } from "chess.js";                

export type PlayerChessStats = {
  accuracy: number;
  missedWins: number;
  blunders: number;
  checks: number;
  captures: number;
  pieceValue: number;
};

export type ChessGameStatsResult = {
  white: PlayerChessStats;
  black: PlayerChessStats;
};

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const emptyStats = (): PlayerChessStats => ({
  accuracy: 100,
  missedWins: 0,
  blunders: 0,
  checks: 0,
  captures: 0,
  pieceValue: 0,
});

const colorKey = (
  color: "w" | "b"
): "white" | "black" =>
  color === "w" ? "white" : "black";

function calculateMaterial(
  chess: Chess,
  color: "w" | "b"
): number {
  let total = 0;

  const board = chess.board();

  for (const row of board) {
    for (const piece of row) {
      if (!piece) {
        continue;
      }

      if (piece.color !== color) {
        continue;
      }

      total += PIECE_VALUES[piece.type] || 0;
    }
  }

  return total;
}

/**
 * Looks for a mate-in-one opportunity before the move.
 */
function hasMateInOne(
  chess: Chess,
  color: "w" | "b"
): boolean {
  if (chess.turn() !== color) {
    return false;
  }

  const moves = chess.moves({
    verbose: true,
  }) as Move[];

  for (const candidate of moves) {
    try {
      const test = new Chess(chess.fen());

      test.move({
        from: candidate.from,
        to: candidate.to,
        promotion:
          candidate.promotion || "q",
      });

      if (test.isCheckmate()) {
        return true;
      }
    } catch {
      // Ignore invalid candidate.
    }
  }

  return false;
}

/**
 * Returns the number of legal moves which immediately win.
 */
function countMateMoves(
  chess: Chess,
  color: "w" | "b"
): number {
  if (chess.turn() !== color) {
    return 0;
  }

  let count = 0;

  const moves = chess.moves({
    verbose: true,
  }) as Move[];

  for (const candidate of moves) {
    try {
      const test = new Chess(chess.fen());

      test.move({
        from: candidate.from,
        to: candidate.to,
        promotion:
          candidate.promotion || "q",
      });

      if (test.isCheckmate()) {
        count++;
      }
    } catch {
      // Ignore.
    }
  }

  return count;
}

/**
 * Approximate move quality.
 *
 * This intentionally does not claim to be Stockfish accuracy.
 * It provides a deterministic in-app calculation using:
 *
 * - checkmate
 * - captures
 * - material loss
 * - mate-in-one opportunities
 */
function calculateMoveQuality(
  before: Chess,
  after: Chess,
  move: Move
): {
  quality: number;
  blunder: boolean;
  missedWin: boolean;
} {
  const movingColor = move.color;
  const opponentColor =
    movingColor === "w" ? "b" : "w";

  const beforeOwnMaterial =
    calculateMaterial(
      before,
      movingColor
    );

  const afterOwnMaterial =
    calculateMaterial(
      after,
      movingColor
    );

  const beforeOpponentMaterial =
    calculateMaterial(
      before,
      opponentColor
    );

  const afterOpponentMaterial =
    calculateMaterial(
      after,
      opponentColor
    );

  const ownLoss =
    beforeOwnMaterial -
    afterOwnMaterial;

  const opponentLoss =
    beforeOpponentMaterial -
    afterOpponentMaterial;

  let quality = 100;

  /*
   * Capturing material improves the move.
   */
  if (move.captured) {
    quality += Math.min(
      8,
      (PIECE_VALUES[
        move.captured
      ] || 0) * 2
    );
  }

  /*
   * Losing material without receiving
   * enough material back is bad.
   */
  const materialSwing =
    opponentLoss - ownLoss;

  if (materialSwing < 0) {
    quality += materialSwing * 7;
  }

  /*
   * Checks are rewarded slightly.
   */
  if (
    move.san.includes("+") ||
    move.san.includes("#")
  ) {
    quality += 4;
  }

  /*
   * Checkmate is perfect.
   */
  if (after.isCheckmate()) {
    quality = 100;
  }

  /*
   * Detect a missed mate-in-one.
   */
  const hadMateInOne =
    hasMateInOne(
      before,
      movingColor
    );

  const madeMate =
    after.isCheckmate();

  const missedWin =
    hadMateInOne && !madeMate;

  if (missedWin) {
    quality -= 15;
  }

  /*
   * A large material loss is treated
   * as a blunder.
   */
  const severeMaterialLoss =
    ownLoss - opponentLoss >= 3;

  const blunder =
    severeMaterialLoss ||
    quality < 65;

  if (blunder) {
    quality = Math.min(
      quality,
      55
    );
  }

  return {
    quality: Math.max(
      0,
      Math.min(100, quality)
    ),
    blunder,
    missedWin,
  };
}

export function calculateChessGameStats(
  initialFen?: string,
  moves?: Move[]
): ChessGameStatsResult {
  const white = emptyStats();
  const black = emptyStats();

  const game = new Chess(
    initialFen ||
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );

  const history =
    moves ||
    (game.history({
      verbose: true,
    }) as Move[]);

  /*
   * If moves were supplied, replay them.
   */
  if (moves) {
    // game is already initial.
  }

  const qualityTotals = {
    white: 0,
    black: 0,
  };

  const moveCounts = {
    white: 0,
    black: 0,
  };

  for (const move of history) {
    const before =
      new Chess(game.fen());

    let playedMove: Move;

    try {
      playedMove =
        game.move({
          from: move.from,
          to: move.to,
          promotion:
            move.promotion || "q",
        }) as Move;
    } catch {
      continue;
    }

    const player =
      colorKey(move.color);

    moveCounts[player] += 1;

    /*
     * Captures.
     */
    if (playedMove.captured) {
      const value =
        PIECE_VALUES[
          playedMove.captured
        ] || 0;

      if (player === "white") {
        white.captures += 1;
        white.pieceValue += value;
      } else {
        black.captures += 1;
        black.pieceValue += value;
      }
    }

    /*
     * Checks.
     */
    if (
      playedMove.san.includes("+") ||
      playedMove.san.includes("#")
    ) {
      if (player === "white") {
        white.checks += 1;
      } else {
        black.checks += 1;
      }
    }

    const quality =
      calculateMoveQuality(
        before,
        game,
        playedMove
      );

    qualityTotals[player] +=
      quality.quality;

    if (quality.blunder) {
      if (player === "white") {
        white.blunders += 1;
      } else {
        black.blunders += 1;
      }
    }

    if (quality.missedWin) {
      if (player === "white") {
        white.missedWins += 1;
      } else {
        black.missedWins += 1;
      }
    }
  }

  white.accuracy =
    moveCounts.white > 0
      ? Math.round(
          qualityTotals.white /
            moveCounts.white
        )
      : 100;

  black.accuracy =
    moveCounts.black > 0
      ? Math.round(
          qualityTotals.black /
            moveCounts.black
        )
      : 100;

  return {
    white,
    black,
  };
}

/**
 * Useful when your current Chess instance
 * already contains the complete history.
 */
export function calculateStatsFromGame(
  game: Chess
): ChessGameStatsResult {
  const history =
    game.history({
      verbose: true,
    }) as Move[];

  /*
   * Replay from the beginning.
   */
  const replay =
    new Chess();

  return calculateChessGameStats(
    replay.fen(),
    history
  );
}