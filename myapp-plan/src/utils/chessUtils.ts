import { Square } from "chess.js";

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;

export const getSquareName = (row: number, column: number): Square =>
  `${FILES[column]}${RANKS[row]}` as Square;

export const isLightSquare = (row: number, column: number): boolean =>
  (row + column) % 2 === 0;

export const pieceAssetKey = (color: "w" | "b", type: string) =>
  `${color === "w" ? "white" : "black"}_${type}` as const;

export const countryCodeToFlag = (code?: string) => {
  const normalized = (code || "+91").replace(/\s/g, "");
  const flags: Record<string, string> = {
    "+91": "🇮🇳",
    "+1": "🇺🇸",
    "+44": "🇬🇧",
    "+61": "🇦🇺",
    "+81": "🇯🇵",
    "+82": "🇰🇷",
    "+971": "🇦🇪",
    "+65": "🇸🇬",
    "+60": "🇲🇾",
    "+94": "🇱🇰",
  };
  return flags[normalized] || "🌍";
};

export const formatClock = (ms: number) => {
  const safe = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};
