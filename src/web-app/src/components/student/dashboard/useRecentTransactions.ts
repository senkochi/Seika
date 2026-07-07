import { useEffect, useState } from "react";
import { walletService } from "../../../api";
import type { TransactionResponse } from "../../../api";

/**
 * Lấy 5 transaction gần nhất thuộc loại WITHDRAW/SPEND.
 * Chỉ fetch khi `enabled` = true (vd khi profile đã load xong).
 */
export function useRecentTransactions(enabled: boolean) {
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);

  useEffect(() => {
    if (!enabled) return;
    (async () => {
      try {
        const history = await walletService.getHistory();
        const spendings = history
          .filter((tx) => tx.type === "WITHDRAW" || tx.type === "SPEND")
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime(),
          )
          .slice(0, 5);
        setTransactions(spendings);
      } catch (err) {
        console.error("Failed to fetch wallet history", err);
      }
    })();
  }, [enabled]);

  const refresh = async () => {
    try {
      const history = await walletService.getHistory();
      const spendings = history
        .filter((tx) => tx.type === "WITHDRAW" || tx.type === "SPEND")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        )
        .slice(0, 5);
      setTransactions(spendings);
    } catch (err) {
      console.error("Failed to fetch wallet history", err);
    }
  };

  return { transactions, refresh };
}