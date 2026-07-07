import { useCallback, useEffect, useMemo, useState } from "react";

import { walletService } from "../../../api";
import {
  EARN_TYPES,
  SPEND_TYPES,
  type Transaction,
} from "./types";

interface WalletData {
  balance: number;
  history: Transaction[];
  withdrawalRate: number;
  loading: boolean;
  totalEarned: number;
  totalSpent: number;
  reload: () => Promise<void>;
}

export function useWalletData(): WalletData {
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [withdrawalRate, setWithdrawalRate] = useState<number>(90);
  const [loading, setLoading] = useState<boolean>(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [balanceRes, historyRes, configsRes] = await Promise.all([
        walletService.getBalance(),
        walletService.getHistory(),
        walletService.getConfigs().catch(() => []),
      ]);

      setBalance(balanceRes.balance || 0);

      if (Array.isArray(historyRes)) {
        const sorted = [...historyRes].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setHistory(sorted);
      } else if (historyRes && Array.isArray((historyRes as any).data)) {
        const sorted = [...(historyRes as any).data].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setHistory(sorted);
      } else {
        setHistory([]);
      }

      if (Array.isArray(configsRes)) {
        const rateEntry = configsRes.find(
          (c) => c.key === "WITHDRAWAL_VND_PER_COIN",
        );
        if (rateEntry && !isNaN(Number(rateEntry.value))) {
          setWithdrawalRate(Number(rateEntry.value));
        }
      }
    } catch (err) {
      console.error(err);
      setBalance(0);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const totalEarned = useMemo(
    () =>
      history
        .filter((t) => (EARN_TYPES as readonly string[]).includes(t.type))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [history],
  );

  const totalSpent = useMemo(
    () =>
      history
        .filter((t) => (SPEND_TYPES as readonly string[]).includes(t.type))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [history],
  );

  return { balance, history, withdrawalRate, loading, totalEarned, totalSpent, reload };
}