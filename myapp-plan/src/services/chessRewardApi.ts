import api from "@/services/chessApi";

import {
  ChessRewardMode,
  ChessRewardBalanceResponse,
  ChessTransaction,
} from "@/types/chessRewards";

type ModesResponse = {
  success: boolean;
  modes: ChessRewardMode[];
};

type HistoryResponse = {
  success: boolean;
  transactions: ChessTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

type RevenueSummary = {
  network: string;
  currency: string;
  estimatedRevenue: number;
  finalizedRevenue: number;
  paidRevenue: number;
  reportCount: number;
};

type RevenueResponse = {
  success: boolean;
  summaries: RevenueSummary[];
};

export async function fetchChessRewardModes(): Promise<ChessRewardMode[]> {
  const response = await api.get<ModesResponse>(
    "/chess-rewards/modes"
  );

  return response.data.modes;
}

export async function fetchChessRewardBalance(): Promise<number> {
  const response = await api.get<ChessRewardBalanceResponse>(
    "/chess-rewards/balance"
  );

  return response.data.coins;
}

export async function fetchChessRewardHistory(
  page = 1,
  limit = 20
): Promise<HistoryResponse> {
  const response = await api.get<HistoryResponse>(
    "/chess-rewards/history",
    {
      params: { page, limit },
    }
  );

  return response.data;
}

export async function fetchAdRevenueSummary(): Promise<RevenueResponse> {
  const response = await api.get<RevenueResponse>(
    "/ad-revenue/summary"
  );

  return response.data;
}