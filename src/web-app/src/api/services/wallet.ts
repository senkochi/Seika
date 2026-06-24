import { apiClient } from "../client";

export interface TransactionReqDTO {
  amount: number;
  description: string;
}

export interface TransactionResponse {
  id: string;
  userId: string;
  amount: number;
  type: "DEPOSIT" | "WITHDRAW" | "REWARD" | "SPEND" | "EARN";
  description: string;
  createdAt: string;
}

// Vì response.data từ Wallet service trả về trực tiếp kết quả dạng Map hoặc Object,
// chúng ta bọc kiểu trả về dưới dạng JSON linh hoạt.
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

  getHistory: async (): Promise<TransactionResponse[]> => {
    // API POST /api/wallet/history (Theo định nghĩa Swagger ở wallet.json là POST)
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
};
