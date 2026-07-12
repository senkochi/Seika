import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Coins,
  Database,
  Loader2,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Store,
} from "lucide-react";

import { getApiErrorMessage } from "../../api/errors";
import { adminService } from "../../api/services/admin";
import type { SystemConfigEntry } from "../../api/types";
import { showError, showSuccess } from "../../components/toast/toastUtils";
import { fetchAdminConfigs, updateAdminConfig } from "../../store/adminSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

type ConfigDomain = "wallet" | "marketplace";
type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

type ConfigGroup = {
  title: string;
  description: string;
  keys: string[];
};

const WALLET_GROUPS: ConfigGroup[] = [
  {
    title: "Quy đổi",
    description: "Tỷ giá nạp và rút coin.",
    keys: ["TOPUP_VND_PER_COIN", "WITHDRAWAL_VND_PER_COIN"],
  },
  {
    title: "Coin khởi tạo",
    description: "Số coin mặc định khi tạo ví mới.",
    keys: ["STUDENT_INITIAL_COIN", "TEACHER_INITIAL_COIN"],
  },
  {
    title: "Cash-out",
    description: "Điều kiện tối thiểu khi teacher rút coin.",
    keys: ["CASH_OUT_MIN_COINS", "CASH_OUT_MULTIPLE"],
  },
];

const MARKETPLACE_GROUPS: ConfigGroup[] = [
  {
    title: "Escrow",
    description: "Thời gian giữ escrow và phí vận hành pilot.",
    keys: ["ESCROW_HOLD_DAYS", "ESCROW_OPERATION_FEE_PERCENT"],
  },
  {
    title: "Tier fee",
    description: "Phí platform theo teacher tier.",
    keys: ["TIER_PLATFORM_FEE_PERCENT"],
  },
  {
    title: "Tier thresholds",
    description: "Ngưỡng rating, review count và metric Phase 3.",
    keys: [
      "TIER_RATING_THRESHOLDS",
      "TIER_CONSUME_RATE_MIN",
      "TIER_REFUND_RATE_MAX",
      "TIER_APPROVAL_REJECTION_RATE_MAX",
    ],
  },
  {
    title: "Risk review",
    description: "Cấu hình phát hiện collusion và cash-out hold.",
    keys: [
      "COLLUSION_LOOKBACK_DAYS",
      "COLLUSION_RISK_THRESHOLD",
      "COLLUSION_TX_THRESHOLD",
      "COLLUSION_PROMO_BACKED_RATIO_THRESHOLD",
      "COLLUSION_NO_CONSUME_RATIO_THRESHOLD",
      "WASH_HOLD_DAYS",
    ],
  },
];

function isJsonLike(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function ConfigRow({
  domain,
  entry,
  onSave,
  isSaving,
}: {
  domain: ConfigDomain;
  entry: SystemConfigEntry;
  onSave: (
    domain: ConfigDomain,
    entry: SystemConfigEntry,
    value: string,
  ) => void;
  isSaving: boolean;
}) {
  const [draft, setDraft] = useState(entry.value);
  const [isDirty, setIsDirty] = useState(false);
  const inputId = `${domain}-${entry.key}`;
  const usesTextarea = isJsonLike(entry.value) || isJsonLike(draft);

  useEffect(() => {
    setDraft(entry.value);
    setIsDirty(false);
  }, [entry.value]);

  const handleChange = (next: string) => {
    setDraft(next);
    setIsDirty(next !== entry.value);
  };

  const updatedAt = entry.updatedAt
    ? new Date(entry.updatedAt).toLocaleString("vi-VN")
    : null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <label
            htmlFor={inputId}
            className="block break-words text-sm font-semibold text-[var(--foreground)]"
          >
            {entry.key}
          </label>
          {entry.description && (
            <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
              {entry.description}
            </p>
          )}
          {usesTextarea ? (
            <textarea
              id={inputId}
              value={draft}
              onChange={(event) => handleChange(event.target.value)}
              rows={5}
              spellCheck={false}
              className="mt-3 min-h-28 w-full resize-y rounded-md border border-[var(--border)] bg-[rgba(255,255,255,0.06)] px-3 py-2 font-mono text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none"
            />
          ) : (
            <input
              id={inputId}
              type="text"
              inputMode="decimal"
              value={draft}
              onChange={(event) => handleChange(event.target.value)}
              className="mt-3 w-full rounded-md border border-[var(--border)] bg-[rgba(255,255,255,0.06)] px-3 py-2 font-mono text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none"
            />
          )}
          <div className="mt-2 min-h-4 text-xs text-[var(--muted-foreground)]">
            {updatedAt && <span>Cập nhật: {updatedAt}</span>}
            {entry.updatedBy && <span> bởi {entry.updatedBy}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSave(domain, entry, draft)}
          disabled={!isDirty || isSaving}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 lg:mt-7"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isDirty ? (
            <Save className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Lưu
        </button>
      </div>
    </div>
  );
}

function ConfigSection({
  domain,
  group,
  configs,
  missingKeys,
  savingKey,
  onSave,
}: {
  domain: ConfigDomain;
  group: ConfigGroup;
  configs: SystemConfigEntry[];
  missingKeys: string[];
  savingKey: string | null;
  onSave: (
    domain: ConfigDomain,
    entry: SystemConfigEntry,
    value: string,
  ) => void;
}) {
  if (configs.length === 0 && missingKeys.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3 border-t border-[var(--border)] pt-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          {group.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {group.description}
        </p>
      </div>
      {missingKeys.length > 0 && (
        <div className="flex gap-2 rounded-lg border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-3 text-sm text-[var(--muted-foreground)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
          <span>
            Backend chưa trả các key theo plan: {missingKeys.join(", ")}
          </span>
        </div>
      )}
      <div className="space-y-3">
        {configs.map((entry) => (
          <ConfigRow
            key={entry.key}
            domain={domain}
            entry={entry}
            onSave={onSave}
            isSaving={savingKey === `${domain}:${entry.key}`}
          />
        ))}
      </div>
    </section>
  );
}

function buildGroupedConfigs(
  configs: SystemConfigEntry[],
  groups: ConfigGroup[],
) {
  const byKey = new Map(configs.map((config) => [config.key, config]));
  const knownKeys = new Set(groups.flatMap((group) => group.keys));
  const grouped = groups.map((group) => ({
    group,
    configs: group.keys
      .map((key) => byKey.get(key))
      .filter((entry): entry is SystemConfigEntry => Boolean(entry)),
    missingKeys: group.keys.filter((key) => !byKey.has(key)),
  }));
  const otherConfigs = configs
    .filter((config) => !knownKeys.has(config.key))
    .sort((a, b) => a.key.localeCompare(b.key));

  if (otherConfigs.length > 0) {
    grouped.push({
      group: {
        title: "Khác",
        description: "Các config chưa được phân nhóm trong UI.",
        keys: otherConfigs.map((config) => config.key),
      },
      configs: otherConfigs,
      missingKeys: [],
    });
  }

  return grouped;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--muted-foreground)]">
      {message}
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] p-8">
      <div className="flex flex-col items-center gap-3 text-[var(--muted-foreground)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        <p>{label}</p>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] p-8">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <AlertCircle className="h-9 w-9 text-[var(--primary)]" />
        <p className="font-semibold text-[var(--foreground)]">
          Không thể tải cấu hình
        </p>
        <p className="text-sm text-[var(--muted-foreground)]">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </button>
      </div>
    </div>
  );
}

function AdminSystemConfig() {
  const dispatch = useAppDispatch();
  const { configs, configsStatus, configsError } = useAppSelector(
    (state) => state.admin,
  );
  const [activeTab, setActiveTab] = useState<ConfigDomain>("wallet");
  const [marketplaceConfigs, setMarketplaceConfigs] = useState<
    SystemConfigEntry[]
  >([]);
  const [marketplaceStatus, setMarketplaceStatus] =
    useState<RequestStatus>("idle");
  const [marketplaceError, setMarketplaceError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const loadMarketplaceConfigs = useCallback(async () => {
    setMarketplaceStatus("loading");
    setMarketplaceError(null);
    try {
      const data = await adminService.listMarketplaceConfigs();
      setMarketplaceConfigs(data);
      setMarketplaceStatus("succeeded");
    } catch (error) {
      setMarketplaceStatus("failed");
      setMarketplaceError(
        getApiErrorMessage(error, "Không thể tải cấu hình marketplace."),
      );
    }
  }, []);

  useEffect(() => {
    void dispatch(fetchAdminConfigs());
    void loadMarketplaceConfigs();
  }, [dispatch, loadMarketplaceConfigs]);

  const walletGroups = useMemo(
    () => buildGroupedConfigs(configs, WALLET_GROUPS),
    [configs],
  );
  const marketplaceGroups = useMemo(
    () => buildGroupedConfigs(marketplaceConfigs, MARKETPLACE_GROUPS),
    [marketplaceConfigs],
  );

  const handleSave = async (
    domain: ConfigDomain,
    entry: SystemConfigEntry,
    value: string,
  ) => {
    const scopedKey = `${domain}:${entry.key}`;
    setSavingKey(scopedKey);
    try {
      if (domain === "wallet") {
        const result = await dispatch(
          updateAdminConfig({ key: entry.key, value }),
        );
        if (updateAdminConfig.rejected.match(result)) {
          showError((result.payload as string) ?? "Cập nhật thất bại");
          return;
        }
      } else {
        const updated = await adminService.updateMarketplaceConfig(entry.key, {
          value,
        });
        setMarketplaceConfigs((current) =>
          current.map((config) =>
            config.key === updated.key ? updated : config,
          ),
        );
      }
      showSuccess(`Đã lưu ${entry.key}`);
    } catch (error) {
      showError(getApiErrorMessage(error, "Cập nhật thất bại"));
    } finally {
      setSavingKey(null);
    }
  };

  const refreshActiveTab = () => {
    if (activeTab === "wallet") {
      void dispatch(fetchAdminConfigs());
      return;
    }
    void loadMarketplaceConfigs();
  };

  const renderPanel = () => {
    if (activeTab === "wallet") {
      if (configsStatus === "loading" && configs.length === 0) {
        return <LoadingState label="Đang tải cấu hình wallet..." />;
      }
      if (configsStatus === "failed" && configs.length === 0) {
        return (
          <ErrorState
            message={configsError}
            onRetry={() => void dispatch(fetchAdminConfigs())}
          />
        );
      }
      if (configs.length === 0) {
        return (
          <EmptyState message="Chưa có wallet config nào trong hệ thống." />
        );
      }
      return walletGroups.map(({ group, configs: entries, missingKeys }) => (
        <ConfigSection
          key={group.title}
          domain="wallet"
          group={group}
          configs={entries}
          missingKeys={missingKeys}
          savingKey={savingKey}
          onSave={handleSave}
        />
      ));
    }

    if (marketplaceStatus === "loading" && marketplaceConfigs.length === 0) {
      return <LoadingState label="Đang tải cấu hình marketplace..." />;
    }
    if (marketplaceStatus === "failed" && marketplaceConfigs.length === 0) {
      return (
        <ErrorState
          message={marketplaceError}
          onRetry={loadMarketplaceConfigs}
        />
      );
    }
    if (marketplaceConfigs.length === 0) {
      return (
        <EmptyState message="Chưa có marketplace config nào trong hệ thống." />
      );
    }
    return marketplaceGroups.map(({ group, configs: entries, missingKeys }) => (
      <ConfigSection
        key={group.title}
        domain="marketplace"
        group={group}
        configs={entries}
        missingKeys={missingKeys}
        savingKey={savingKey}
        onSave={handleSave}
      />
    ));
  };

  const tabs = [
    {
      id: "wallet" as const,
      label: "Wallet",
      description: `${configs.length} config`,
      icon: Coins,
    },
    {
      id: "marketplace" as const,
      label: "Marketplace",
      description: `${marketplaceConfigs.length} config`,
      icon: Store,
    },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-[var(--foreground)]">
            <Settings className="h-7 w-7 text-[var(--primary)]" />
            System Config
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Quản lý config theo ownership của từng service.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshActiveTab}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)]"
        >
          <RefreshCw className="h-4 w-4" />
          Tải lại
        </button>
      </div>

      <div
        role="tablist"
        aria-label="System config service tabs"
        className="grid gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 sm:grid-cols-2"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 rounded-md px-3 py-3 text-left transition ${
                selected
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="min-w-0">
                <span className="block font-semibold">{tab.label}</span>
                <span className="block text-xs opacity-80">
                  {tab.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <Database className="h-5 w-5 text-[var(--primary)]" />
          <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">
            Service source
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {activeTab === "wallet" ? "wallet-service" : "marketplace-service"}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <ShieldCheck className="h-5 w-5 text-[var(--primary)]" />
          <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">
            Admin only
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Các endpoint yêu cầu role ADMIN.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <RefreshCw className="h-5 w-5 text-[var(--primary)]" />
          <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">
            Cache
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Một số service có thể đọc lại config theo cache nội bộ.
          </p>
        </div>
      </div>

      <div role="tabpanel" className="space-y-5">
        {renderPanel()}
      </div>
    </div>
  );
}

export default AdminSystemConfig;
