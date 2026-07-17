import { useFormatNumber } from "../../../utils/format";

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export const EARN_TYPES = ["EARN", "REWARD"] as const;
export const SPEND_TYPES = ["WITHDRAW", "SPEND"] as const;

export function isPositiveTransaction(tx: Transaction): boolean {
  return (
    tx.type === "EARN" ||
    tx.type === "REWARD" ||
    (tx.amount > 0 && tx.type !== "CASH_OUT")
  );
}

export function formatVnd(n: number, locale = "vi-VN"): string {
  return n.toLocaleString(locale);
}

export const useFormatVnd = () => {
  const formatNumber = useFormatNumber();
  return (n: number) => formatNumber(n);
};
