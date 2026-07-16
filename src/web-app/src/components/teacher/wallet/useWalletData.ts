import { useCallback, useEffect, useMemo, useState } from "react";

import {
  walletService,
  type WalletBalanceBreakdown,
  type WalletHold,
} from "../../../api";
import { EARN_TYPES, SPEND_TYPES, type Transaction } from "./types";

interface WalletData {
  balance: number;
  breakdown: WalletBalanceBreakdown;
  history: Transaction[];
  holds: WalletHold[];
  withdrawalRate: number;
  loading: boolean;
  totalEarned: number;
  totalSpent: number;
  withdrawableBalance: number;
  appOnlyBalance: number;
  reload: () => Promise<void>;
}

const emptyBreakdown: WalletBalanceBreakdown = {
  balance: 0,
  bonusBalance: 0,
  rewardBalance: 0,
  paidBalance: 0,
  earnedWithdrawableBalance: 0,
  earnedPromoBalance: 0,
  heldBalance: 0,
  frozen: false,
};

export function useWalletData(): WalletData {
  const [breakdown, setBreakdown] =
    useState<WalletBalanceBreakdown>(emptyBreakdown);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [holds, setHolds] = useState<WalletHold[]>([]);
  const [withdrawalRate, setWithdrawalRate] = useState<number>(90);
  const [loading, setLoading] = useState<boolean>(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [breakdownRes, historyRes, configsRes, holdsRes] =
        await Promise.all([
          walletService.getBalanceBreakdown().catch(async () => {
            const fallback = await walletService.getBalance();
            return { ...emptyBreakdown, balance: fallback.balance || 0 };
          }),
          walletService.getHistory(),
          walletService.getConfigs().catch(() => []),
          walletService.getMyHolds().catch(() => []),
        ]);

      setBreakdown(breakdownRes);
      setHolds(Array.isArray(holdsRes) ? holdsRes : []);

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
      setBreakdown(emptyBreakdown);
      setHistory([]);
      setHolds([]);
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

  const appOnlyBalance =
    breakdown.bonusBalance +
    breakdown.rewardBalance +
    breakdown.paidBalance +
    breakdown.earnedPromoBalance;

  return {
    balance: breakdown.balance,
    breakdown,
    history,
    holds,
    withdrawalRate,
    loading,
    totalEarned,
    totalSpent,
    withdrawableBalance: breakdown.earnedWithdrawableBalance,
    appOnlyBalance,
    reload,
  };
}
