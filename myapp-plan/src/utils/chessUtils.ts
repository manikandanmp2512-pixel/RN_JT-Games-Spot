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
    "+1": "🇺🇸",
    "+7": "🇷🇺",
    "+20": "🇪🇬",
    "+27": "🇿🇦",
    "+30": "🇬🇷",
    "+31": "🇳🇱",
    "+32": "🇧🇪",
    "+33": "🇫🇷",
    "+34": "🇪🇸",
    "+36": "🇭🇺",
    "+39": "🇮🇹",
    "+40": "🇷🇴",
    "+41": "🇨🇭",
    "+43": "🇦🇹",
    "+44": "🇬🇧",
    "+45": "🇩🇰",
    "+46": "🇸🇪",
    "+47": "🇳🇴",
    "+48": "🇵🇱",
    "+49": "🇩🇪",
    "+52": "🇲🇽",
    "+55": "🇧🇷",
    "+60": "🇲🇾",
    "+61": "🇦🇺",
    "+62": "🇮🇩",
    "+63": "🇵🇭",
    "+64": "🇳🇿",
    "+65": "🇸🇬",
    "+66": "🇹🇭",
    "+81": "🇯🇵",
    "+82": "🇰🇷",
    "+84": "🇻🇳",
    "+86": "🇨🇳",
    "+90": "🇹🇷",
    "+91": "🇮🇳",
    "+92": "🇵🇰",
    "+93": "🇦🇫",
    "+94": "🇱🇰",
    "+95": "🇲🇲",
    "+98": "🇮🇷",
    "+212": "🇲🇦",
    "+213": "🇩🇿",
    "+216": "🇹🇳",
    "+218": "🇱🇾",
    "+234": "🇳🇬",
    "+254": "🇰🇪",
    "+255": "🇹🇿",
    "+256": "🇺🇬",
    "+260": "🇿🇲",
    "+263": "🇿🇼",
    "+351": "🇵🇹",
    "+352": "🇱🇺",
    "+353": "🇮🇪",
    "+354": "🇮🇸",
    "+358": "🇫🇮",
    "+359": "🇧🇬",
    "+370": "🇱🇹",
    "+371": "🇱🇻",
    "+372": "🇪🇪",
    "+380": "🇺🇦",
    "+420": "🇨🇿",
    "+421": "🇸🇰",
    "+852": "🇭🇰",
    "+853": "🇲🇴",
    "+855": "🇰🇭",
    "+880": "🇧🇩",
    "+886": "🇹🇼",
    "+971": "🇦🇪",
    "+972": "🇮🇱",
    "+974": "🇶🇦",
    "+966": "🇸🇦",
    "+968": "🇴🇲",
    "+973": "🇧🇭",
    "+965": "🇰🇼",
    "+962": "🇯🇴",
    "+961": "🇱🇧",
    "+964": "🇮🇶",
    "+963": "🇸🇾",
    "+995": "🇬🇪",
    "+998": "🇺🇿",
  };

  return flags[normalized] || "🌍";
};

export const formatClock = (ms: number) => {
  const safe = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};
