export type ChessRewardModeId =
  | "free"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond";

export type ChessRewardMode = {
  id: ChessRewardModeId;
  name: string;
  entryCoins: number;
  winnerCoins: number;
  loserCoins: number;
  platformCoins: number;
};

export type ChessTransaction = {
  _id?: string;
  transactionKey: string;
  matchId: string;
  modeId: ChessRewardModeId;
  type:
    | "entry"
    | "win_reward"
    | "loss_reward"
    | "draw_refund"
    | "platform_share";
  amount: number;
  balanceAfter?: number | null;
  description?: string;
  createdAt: string;
};

export type ChessRewardBalanceResponse = {
  success: boolean;
  coins: number;
};