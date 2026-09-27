export type ChessBoardTheme =
  | "wood"
  | "marble"
  | "neon";

export type Difficulty =
  | "simple"
  | "medium"
  | "complex";

export type ChessColor =
  | "white"
  | "black";

export type GameModeId =
  | "rapid"
  | "chill"
  | "blitz5"
  | "tempo"
  | "blitz3"
  | "bullet";

export type GameMode = {
  id: GameModeId;
  title: string;
  icon: string;
  time: string;
  baseMs: number;
  incrementMs: number;
  increment?: string;
  perMoveMs?: number;
};

export type ClockState = {
  white: number;
  black: number;
  active: ChessColor | null;
  serverAt: number;
};

/* -------------------------------------------------------------------------- */
/* Friends                                                                    */
/* -------------------------------------------------------------------------- */

export type Friend = {
  id: string;
  name: string;
  avatar?: string;
  countryFlag?: string;
  rating: number;
  online?: boolean;
};

export type FriendRequest = {
  id: string;

  from?: {
    id?: string;
    name?: string;
    avatar?: string;
    countryFlag?: string;
    rating?: number;
  };
};

/* -------------------------------------------------------------------------- */
/* Captured Chess Pieces                                                      */
/* -------------------------------------------------------------------------- */

export type CapturedPieceType =
  | "p"
  | "n"
  | "b"
  | "r"
  | "q";

export type CapturedPieces = {
  p: number;
  n: number;
  b: number;
  r: number;
  q: number;
};

export type CapturedByColor = {
  white: CapturedPieces;
  black: CapturedPieces;
};

export const EMPTY_CAPTURED_PIECES: CapturedPieces = {
  p: 0,
  n: 0,
  b: 0,
  r: 0,
  q: 0,
};

export const EMPTY_CAPTURED_BY_COLOR: CapturedByColor = {
  white: {
    p: 0,
    n: 0,
    b: 0,
    r: 0,
    q: 0,
  },

  black: {
    p: 0,
    n: 0,
    b: 0,
    r: 0,
    q: 0,
  },
};