export type AdminFlowDirection = "INFLOW" | "OUTFLOW" | "NEUTRAL";

export type TransactionPillVariant =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral"
  | "gold";

type TransactionTypeDefinition = {
  labelKey: string;
  pillVariant: TransactionPillVariant;
  fallbackFlowDirection: AdminFlowDirection;
};

const transactionTypeDefinitions: Record<string, TransactionTypeDefinition> = {
  TOP_UP: {
    labelKey: "revenue.transactions.type.topUp",
    pillVariant: "success",
    fallbackFlowDirection: "INFLOW",
  },
  INITIAL_BONUS: {
    labelKey: "revenue.transactions.type.initialBonus",
    pillVariant: "info",
    fallbackFlowDirection: "OUTFLOW",
  },
  LEARNING_REWARD: {
    labelKey: "revenue.transactions.type.learningReward",
    pillVariant: "info",
    fallbackFlowDirection: "OUTFLOW",
  },
  PURCHASE_DEBIT: {
    labelKey: "revenue.transactions.type.purchaseDebit",
    pillVariant: "warning",
    fallbackFlowDirection: "NEUTRAL",
  },
  ESCROW_RELEASE_CREDIT: {
    labelKey: "revenue.transactions.type.escrowRelease",
    pillVariant: "danger",
    fallbackFlowDirection: "OUTFLOW",
  },
  ESCROW_REFUND_CREDIT: {
    labelKey: "revenue.transactions.type.escrowRefund",
    pillVariant: "danger",
    fallbackFlowDirection: "OUTFLOW",
  },
  PLATFORM_FEE_REAL: {
    labelKey: "revenue.transactions.type.platformFeeReal",
    pillVariant: "success",
    fallbackFlowDirection: "INFLOW",
  },
  PLATFORM_FEE_PROMO_SINK: {
    labelKey: "revenue.transactions.type.platformFeePromoSink",
    pillVariant: "gold",
    fallbackFlowDirection: "NEUTRAL",
  },
  CASH_OUT: {
    labelKey: "revenue.transactions.type.cashOut",
    pillVariant: "danger",
    fallbackFlowDirection: "OUTFLOW",
  },
  WALLET_HOLD: {
    labelKey: "revenue.transactions.type.walletHold",
    pillVariant: "warning",
    fallbackFlowDirection: "NEUTRAL",
  },
  WALLET_FREEZE: {
    labelKey: "revenue.transactions.type.walletFreeze",
    pillVariant: "danger",
    fallbackFlowDirection: "NEUTRAL",
  },
  WALLET_UNFREEZE: {
    labelKey: "revenue.transactions.type.walletUnfreeze",
    pillVariant: "success",
    fallbackFlowDirection: "NEUTRAL",
  },
};

function isAdminFlowDirection(value: unknown): value is AdminFlowDirection {
  return value === "INFLOW" || value === "OUTFLOW" || value === "NEUTRAL";
}

export function getAdminTransactionPresentation(
  type: string | undefined,
  apiFlowDirection: unknown,
) {
  const definition = transactionTypeDefinitions[type ?? ""] ?? {
    labelKey: "revenue.transactions.type.unknown",
    pillVariant: "neutral" as const,
    fallbackFlowDirection: "NEUTRAL" as const,
  };
  const flowDirection = isAdminFlowDirection(apiFlowDirection)
    ? apiFlowDirection
    : definition.fallbackFlowDirection;

  if (flowDirection === "INFLOW") {
    return {
      ...definition,
      flowDirection,
      sign: "+",
      valueClassName: "text-emerald-300",
    } as const;
  }

  if (flowDirection === "OUTFLOW") {
    return {
      ...definition,
      flowDirection,
      sign: "-",
      valueClassName: "text-red-300",
    } as const;
  }

  return {
    ...definition,
    flowDirection,
    sign: "",
    valueClassName: "text-amber-300",
  } as const;
}
