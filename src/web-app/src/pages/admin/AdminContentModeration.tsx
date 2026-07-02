import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Check,
  X,
  Loader2,
  RefreshCw,
  AlertTriangle,
  BookOpen,
  Layers,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchPendingProducts,
  approveAdminProduct,
  rejectAdminProduct,
} from "../../store/adminSlice";
import { showError, showSuccess } from "../../components/toast/toastUtils";
import type { PendingProduct } from "../../api/types";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {});

function typeBadge(type: string) {
  const upper = type.toUpperCase();
  if (upper.includes("QUIZ")) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2 py-1 text-xs font-medium text-violet-300">
        <BookOpen className="h-3 w-3" />
        Quiz
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 px-2 py-1 text-xs font-medium text-sky-300">
      <Layers className="h-3 w-3" />
      Flashcard
    </span>
  );
}

interface RejectModalProps {
  open: boolean;
  product: PendingProduct | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

function RejectModal({ open, product, onClose, onConfirm, isLoading }: RejectModalProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open, product]);

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            Từ chối sản phẩm
          </h3>
          <button
            aria-label="Đóng"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--background)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            Từ chối <span className="font-semibold text-[var(--foreground)]">{product.name}</span>?
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Lý do từ chối (bắt buộc, ≤500 ký tự)"
            maxLength={500}
            className="w-full resize-none px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)]"
          />
          <p className="text-xs text-[var(--muted-foreground)]">{reason.length}/500</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border)] bg-[rgba(0,0,0,0.15)] p-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--background)]"
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={isLoading || reason.trim().length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminContentModeration() {
  const dispatch = useAppDispatch();
  const { products, mutationStatus } = useAppSelector((state) => state.admin);

  const [modalReject, setModalReject] = useState<PendingProduct | null>(null);

  useEffect(() => {
    void dispatch(fetchPendingProducts({ page: 0, size: 20 }));
  }, [dispatch]);

  const isMutating = mutationStatus === "loading";

  const handleApprove = async (product: PendingProduct) => {
    const result = await dispatch(approveAdminProduct(product.id));
    if (approveAdminProduct.rejected.match(result)) {
      showError((result.payload as string) ?? "Duyệt thất bại");
    } else {
      showSuccess(`Đã duyệt "${product.name}"`);
    }
  };

  const handleReject = async (reason: string) => {
    if (!modalReject) return;
    const result = await dispatch(
      rejectAdminProduct({ productId: modalReject.id, reason }),
    );
    if (rejectAdminProduct.rejected.match(result)) {
      showError((result.payload as string) ?? "Từ chối thất bại");
    } else {
      showSuccess(`Đã từ chối "${modalReject.name}"`);
      setModalReject(null);
    }
  };

  const tableBody = useMemo(() => {
    if (products.status === "loading" && products.content.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="py-12 text-center text-[var(--muted-foreground)]">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          </td>
        </tr>
      );
    }
    if (products.status === "failed") {
      return (
        <tr>
          <td colSpan={6} className="py-12 text-center text-rose-400">
            {products.error ?? "Lỗi không xác định"}
          </td>
        </tr>
      );
    }
    if (products.content.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="py-12 text-center text-[var(--muted-foreground)]">
            Không có sản phẩm nào đang chờ duyệt.
          </td>
        </tr>
      );
    }
    return products.content.map((p) => (
      <tr key={p.id} className="hover:bg-[var(--background)] transition-colors">
        <td className="py-3">
          <div className="font-medium text-[var(--foreground)]">{p.name}</div>
          {p.description && (
            <div className="mt-1 text-xs text-[var(--muted-foreground)] line-clamp-2 max-w-md">
              {p.description}
            </div>
          )}
        </td>
        <td className="py-3">{typeBadge(p.type)}</td>
        <td className="py-3 font-mono text-xs text-[var(--muted-foreground)]">
          {p.sellerUserId.length > 14 ? `${p.sellerUserId.slice(0, 8)}…${p.sellerUserId.slice(-4)}` : p.sellerUserId}
        </td>
        <td className="py-3 text-[var(--foreground)]">
          {currencyFormatter.format(p.price)} coin
        </td>
        <td className="py-3 text-xs text-[var(--muted-foreground)]">
          {new Date(p.createdAt).toLocaleString("vi-VN")}
        </td>
        <td className="py-3">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleApprove(p)}
              disabled={isMutating}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Duyệt
            </button>
            <button
              onClick={() => setModalReject(p)}
              disabled={isMutating}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Từ chối
            </button>
          </div>
        </td>
      </tr>
    ));
  }, [products, isMutating]);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-[var(--foreground)]">
            <ShieldCheck className="h-7 w-7 text-[var(--primary)]" />
            Duyệt nội dung
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Tổng: {currencyFormatter.format(products.totalElements)} sản phẩm đang chờ duyệt
          </p>
        </div>
        <button
          onClick={() => dispatch(fetchPendingProducts({ page: 0, size: 20 }))}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)]"
        >
          <RefreshCw className="h-4 w-4" />
          Tải lại
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(10,10,20,0.28)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted-foreground)]">
                <th className="pb-3 font-medium">Sản phẩm</th>
                <th className="pb-3 font-medium">Loại</th>
                <th className="pb-3 font-medium">Seller</th>
                <th className="pb-3 font-medium">Giá</th>
                <th className="pb-3 font-medium">Ngày tạo</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">{tableBody}</tbody>
          </table>
        </div>
      </div>

      <RejectModal
        open={modalReject !== null}
        product={modalReject}
        onClose={() => setModalReject(null)}
        onConfirm={handleReject}
        isLoading={isMutating}
      />
    </div>
  );
}

export default AdminContentModeration;