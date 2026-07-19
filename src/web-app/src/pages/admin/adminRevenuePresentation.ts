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
    fallbackFlowDirection: "NEUTRAL",
  },
  LEARNING_REWARD: {
    labelKey: "revenue.transactions.type.learningReward",
    pillVariant: "info",
    fallbackFlowDirection: "NEUTRAL",
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
    pillVariant: "info",
    fallbackFlowDirection: "NEUTRAL",
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

const withdrawableEscrowDefinition: TransactionTypeDefinition = {
  labelKey: "revenue.transactions.type.escrowReleaseWithdrawable",
  pillVariant: "danger",
  fallbackFlowDirection: "OUTFLOW",
};

const promoEscrowDefinition: TransactionTypeDefinition = {
  labelKey: "revenue.transactions.type.escrowReleasePromo",
  pillVariant: "gold",
  fallbackFlowDirection: "NEUTRAL",
};

function isAdminFlowDirection(value: unknown): value is AdminFlowDirection {
  return value === "INFLOW" || value === "OUTFLOW" || value === "NEUTRAL";
}

function resolveDefinition(
  type: string | undefined,
  source: string | undefined,
): { definition: TransactionTypeDefinition; isKnownType: boolean } {
  if (type === "ESCROW_RELEASE_CREDIT") {
    if (source === "EARNED_WITHDRAWABLE") {
      return { definition: withdrawableEscrowDefinition, isKnownType: true };
    }
    if (source === "EARNED_PROMO") {
      return { definition: promoEscrowDefinition, isKnownType: true };
    }
  }

  const definition = transactionTypeDefinitions[type ?? ""];
  if (definition) {
    return { definition, isKnownType: true };
  }

  return {
    definition: {
      labelKey: "revenue.transactions.type.unknown",
      pillVariant: "neutral",
      fallbackFlowDirection: "NEUTRAL",
    },
    isKnownType: false,
  };
}

export function getAdminTransactionPresentation(
  type: string | undefined,
  source: string | undefined,
  apiFlowDirection: unknown,
) {
  const { definition, isKnownType } = resolveDefinition(type, source);
  const flowDirection =
    !isKnownType && isAdminFlowDirection(apiFlowDirection)
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
