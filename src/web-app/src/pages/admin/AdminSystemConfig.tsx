import { useEffect, useMemo, useState } from "react";
import { Settings, Loader2, Save, Check, RefreshCw } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAdminConfigs,
  updateAdminConfig,
} from "../../store/adminSlice";
import { showError, showSuccess } from "../../components/toast/toastUtils";
import type { SystemConfigEntry } from "../../api/types";

function ConfigRow({
  entry,
  onSave,
  isSaving,
}: {
  entry: SystemConfigEntry;
  onSave: (value: string) => void;
  isSaving: boolean;
}) {
  const [draft, setDraft] = useState(entry.value);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setDraft(entry.value);
    setIsDirty(false);
  }, [entry.value]);

  const handleChange = (next: string) => {
    setDraft(next);
    setIsDirty(next !== entry.value);
  };

  const handleClickSave = () => {
    onSave(draft);
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_8px_24px_rgba(10,10,20,0.18)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-semibold text-[var(--foreground)]">
            {entry.key}
          </label>
          {entry.description && (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{entry.description}</p>
          )}
          <input
            type="text"
            inputMode="numeric"
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            className="mt-3 w-full px-4 py-2.5 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] font-mono"
          />
          <div className="mt-2 text-[11px] text-[var(--muted-foreground)]">
            {entry.updatedAt && (
              <span>
                Cập nhật: {new Date(entry.updatedAt).toLocaleString("vi-VN")}
                {entry.updatedBy && ` • bởi ${entry.updatedBy}`}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleClickSave}
          disabled={!isDirty || isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 shrink-0"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : isDirty ? <Save className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          Lưu
        </button>
      </div>
    </div>
  );
}

function AdminSystemConfig() {
  const dispatch = useAppDispatch();
  const { configs, configsStatus, configsError, mutationStatus } = useAppSelector(
    (state) => state.admin,
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(fetchAdminConfigs());
  }, [dispatch]);

  const sortedConfigs = useMemo(
    () => [...configs].sort((a, b) => a.key.localeCompare(b.key)),
    [configs],
  );

  const handleSave = async (entry: SystemConfigEntry, value: string) => {
    setSavingKey(entry.key);
    const result = await dispatch(updateAdminConfig({ key: entry.key, value }));
    setSavingKey(null);
    if (updateAdminConfig.rejected.match(result)) {
      showError((result.payload as string) ?? "Cập nhật thất bại");
    } else {
      showSuccess(`Đã lưu ${entry.key} = ${value}`);
    }
  };

  if (configsStatus === "loading" && configs.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-[var(--muted-foreground)]">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
          <p>Đang tải cấu hình...</p>
        </div>
      </div>
    );
  }

  if (configsStatus === "failed" && configs.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-4xl">⚠️</div>
          <p className="text-[var(--foreground)] font-bold">Không thể tải cấu hình</p>
          <p className="text-[var(--muted-foreground)] text-sm">{configsError}</p>
          <button
            onClick={() => dispatch(fetchAdminConfigs())}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-[var(--foreground)]">
            <Settings className="h-7 w-7 text-[var(--primary)]" />
            System Config
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Cấu hình tham số hệ thống — thay đổi có hiệu lực sau khi lưu (cache 60s).
          </p>
        </div>
        <button
          onClick={() => dispatch(fetchAdminConfigs())}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)]"
        >
          <RefreshCw className="h-4 w-4" />
          Tải lại
        </button>
      </div>

      {sortedConfigs.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-[var(--muted-foreground)]">
          Chưa có config nào trong hệ thống.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedConfigs.map((c) => (
            <ConfigRow
              key={c.key}
              entry={c}
              onSave={(value) => handleSave(c, value)}
              isSaving={savingKey === c.key && mutationStatus === "loading"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminSystemConfig;