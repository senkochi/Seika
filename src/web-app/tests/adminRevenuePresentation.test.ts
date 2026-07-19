import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getAdminTransactionPresentation } from "../src/pages/admin/adminRevenuePresentation.ts";

test("falls back to platform inflow styling when an old API omits flowDirection", () => {
  const presentation = getAdminTransactionPresentation(
    "PLATFORM_FEE_REAL",
    undefined,
  );

  assert.equal(presentation.flowDirection, "INFLOW");
  assert.equal(presentation.sign, "+");
  assert.equal(presentation.valueClassName, "text-emerald-300");
  assert.equal(
    presentation.labelKey,
    "revenue.transactions.type.platformFeeReal",
  );
});

test("falls back to platform outflow styling for escrow release", () => {
  const presentation = getAdminTransactionPresentation(
    "ESCROW_RELEASE_CREDIT",
    undefined,
  );

  assert.equal(presentation.flowDirection, "OUTFLOW");
  assert.equal(presentation.sign, "-");
  assert.equal(presentation.valueClassName, "text-red-300");
  assert.equal(
    presentation.labelKey,
    "revenue.transactions.type.escrowRelease",
  );
});

test("provides a localized label and pill variant for every current ledger type", () => {
  const ledgerTypes = [
    "TOP_UP",
    "INITIAL_BONUS",
    "LEARNING_REWARD",
    "PURCHASE_DEBIT",
    "ESCROW_RELEASE_CREDIT",
    "ESCROW_REFUND_CREDIT",
    "PLATFORM_FEE_REAL",
    "PLATFORM_FEE_PROMO_SINK",
    "CASH_OUT",
    "WALLET_HOLD",
    "WALLET_FREEZE",
    "WALLET_UNFREEZE",
  ] as const;

  for (const type of ledgerTypes) {
    const presentation = getAdminTransactionPresentation(type, undefined);

    assert.match(presentation.labelKey, /^revenue\.transactions\.type\./);
    assert.notEqual(presentation.pillVariant, "neutral", type);

    for (const locale of ["vi", "en"]) {
      const translations = JSON.parse(
        readFileSync(
          new URL(
            "../src/i18n/locales/" + locale + "/admin.json",
            import.meta.url,
          ),
          "utf8",
        ),
      ) as Record<string, unknown>;
      const label = presentation.labelKey
        .split(".")
        .reduce<unknown>(
          (value, key) =>
            typeof value === "object" && value !== null
              ? (value as Record<string, unknown>)[key]
              : undefined,
          translations,
        );

      assert.equal(typeof label, "string", locale + ":" + type);
    }
  }
});

test("uses a valid direction supplied by the API", () => {
  const presentation = getAdminTransactionPresentation(
    "PURCHASE_DEBIT",
    "OUTFLOW",
  );

  assert.equal(presentation.flowDirection, "OUTFLOW");
  assert.equal(presentation.sign, "-");
  assert.equal(presentation.valueClassName, "text-red-300");
});
