import { apiClient } from "../client";

export interface TransactionReqDTO {
  amount: number;
  description: string;
}

export interface TopUpReqDTO {
  amountVnd: number;
}

export interface TopUpResponse {
  coinsReceived: number;
  amountVnd: number;
  rate: number;
  message: string;
}

export interface WalletBalanceBreakdown {
  balance: number;
  bonusBalance: number;
  rewardBalance: number;
  paidBalance: number;
  earnedWithdrawableBalance: number;
  earnedPromoBalance: number;
  heldBalance: number;
  frozen: boolean;
}

export interface TransactionResponse {
  id: string;
  userId: string;
  amount: number;
  type:
    | "DEPOSIT"
    | "WITHDRAW"
    | "REWARD"
    | "SPEND"
    | "EARN"
    | "CASH_OUT"
    | "TOP_UP";
  description: string;
  createdAt: string;
}

const toNumber = (value: unknown) => Number(value ?? 0) || 0;

const normalizeBreakdown = (
  data: Partial<WalletBalanceBreakdown>,
): WalletBalanceBreakdown => ({
  balance: toNumber(data.balance),
  bonusBalance: toNumber(data.bonusBalance),
  rewardBalance: toNumber(data.rewardBalance),
  paidBalance: toNumber(data.paidBalance),
  earnedWithdrawableBalance: toNumber(data.earnedWithdrawableBalance),
  earnedPromoBalance: toNumber(data.earnedPromoBalance),
  heldBalance: toNumber(data.heldBalance),
  frozen: Boolean(data.frozen),
});

// Vi response.data tu Wallet service co the tra ve truc tiep Map hoac Object,
// wrapper nay giu kieu tra ve linh hoat cho UI cu.
export const walletService = {
  getBalance: async () => {
    // API GET /api/wallet/balance
    const response = await apiClient.get<any>("/wallet/balance");
    const data = response.data;
    if (typeof data === "number") {
      return { balance: data };
    }
    if (data && typeof data.balance === "number") {
      return data;
    }
    return { balance: Number(data) || 0 };
  },

  getBalanceBreakdown: async (): Promise<WalletBalanceBreakdown> => {
    const response = await apiClient.get<WalletBalanceBreakdown>(
      "/wallet/balance/breakdown",
    );
    return normalizeBreakdown(response.data ?? {});
  },

  getHistory: async (): Promise<TransactionResponse[]> => {
    // API POST /api/wallet/history (Theo dinh nghia Swagger o wallet.json la POST)
    const response =
      await apiClient.post<TransactionResponse[]>("/wallet/history");
    return response.data;
  },

  withdraw: async (payload: TransactionReqDTO) => {
    // API POST /api/wallet/withdraw
    const response = await apiClient.post<any>("/wallet/withdraw", payload);
    return response.data;
  },

  deposit: async (payload: TransactionReqDTO) => {
    // API POST /api/wallet/deposit
    const response = await apiClient.post<any>("/wallet/deposit", payload);
    return response.data;
  },

  cashOut: async (payload: TransactionReqDTO) => {
    // API POST /api/wallet/cash-out
    const response = await apiClient.post<any>("/wallet/cash-out", payload);
    return response.data;
  },

  topUp: async (payload: TopUpReqDTO) => {
    // API POST /api/wallet/top-up
    const response = await apiClient.post<TopUpResponse>(
      "/wallet/top-up",
      payload,
    );
    return response.data;
  },

  getConfigs: async () => {
    // API GET /api/wallet/configs
    const response =
      await apiClient.get<
        Array<{ key: string; value: string; description?: string }>
      >("/wallet/configs");
    return response.data;
  },
};
