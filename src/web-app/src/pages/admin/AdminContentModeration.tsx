import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  X,
  Loader2,
  RefreshCw,
  AlertTriangle,
  BookOpen,
  Layers,
  Eye,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchPendingProducts,
  approveAdminProduct,
  rejectAdminProduct,
  setProductsPage,
  setProductsSize,
} from "../../store/adminSlice";
import { Pagination } from "../../components/ui/Pagination";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";
import { StatusPill } from "../../components/ui/StatusPill";
import { Button } from "../../components/ui/Button";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { showError, showSuccess } from "../../components/toast/toastUtils";
import type { PendingProduct } from "../../api/types";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {});

function typeVariant(type: string): "info" | "success" {
  return type.toUpperCase().includes("QUIZ") ? "info" : "success";
}

function TypeBadge({ type }: { type: string }) {
  const variant = typeVariant(type);
  const upper = type.toUpperCase();
  const isQuiz = upper.includes("QUIZ");
  return (
    <StatusPill variant={variant}>
      {isQuiz ? (
        <BookOpen className="h-3 w-3 mr-1" aria-hidden="true" />
      ) : (
        <Layers className="h-3 w-3 mr-1" aria-hidden="true" />
      )}
      {isQuiz ? "Quiz" : "Flashcard"}
    </StatusPill>
  );
}

function AdminContentModeration() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { products, mutationStatus } = useAppSelector((state) => state.admin);

  const [modalReject, setModalReject] = useState<PendingProduct | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(
      fetchPendingProducts({ page: products.page, size: products.size }),
    );
  }, [dispatch, products.page, products.size]);

  const isMutating = mutationStatus === "loading";

  const handlePreview = (product: PendingProduct) => {
    const isFlashcard =
      product.type === "FLASHCARD" ||
      product.type.toUpperCase().includes("FLASHCARD");
    const path = isFlashcard
      ? `/admin/dashboard/flashcard/${product.referenceId}`
      : `/admin/dashboard/quiz/${product.referenceId}`;
    navigate(path, { state: { pendingProduct: product } });
  };

  const handleApprove = async (product: PendingProduct) => {
    const result = await dispatch(approveAdminProduct(product.id));
    if (approveAdminProduct.rejected.match(result)) {
      showError((result.payload as string) ?? "Duyệt thất bại");
    } else {
      showSuccess(`Đã duyệt "${product.name}"`);
    }
  };

  const openReject = (product: PendingProduct) => {
    setRejectReason("");
    setRejectError(null);
    setModalReject(product);
  };

  const closeReject = () => {
    setModalReject(null);
    setRejectReason("");
    setRejectError(null);
  };

  const handleReject = async () => {
    if (!modalReject) return;
    if (rejectReason.trim().length === 0) {
      setRejectError("Vui lòng nhập lý do từ chối.");
      return;
    }
    const result = await dispatch(
      rejectAdminProduct({
        productId: modalReject.id,
        reason: rejectReason.trim(),
      }),
    );
    if (rejectAdminProduct.rejected.match(result)) {
      showError((result.payload as string) ?? "Từ chối thất bại");
      return;
    }
    showSuccess(`Đã từ chối "${modalReject.name}"`);
    closeReject();
  };

  const tableBody = useMemo(() => {
    if (products.status === "loading" && products.content.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="py-12 text-center font-sans-ui text-white/55">
            <Loader2
              className="mx-auto h-6 w-6 animate-spin text-[#d4a843]"
              aria-hidden="true"
            />
          </td>
        </tr>
      );
    }
    if (products.status === "failed") {
      return (
        <tr>
          <td colSpan={6} className="py-12 text-center font-sans-ui text-red-300">
            {products.error ?? "Lỗi không xác định"}
          </td>
        </tr>
      );
    }
    if (products.content.length === 0) {
      return (
        <tr>
          <td
            colSpan={6}
            className="py-12 text-center font-sans-ui text-white/55"
          >
            Không có sản phẩm nào đang chờ duyệt.
          </td>
        </tr>
      );
    }
    const sortedContent = [...products.content].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return sortedContent.map((p) => (
      <tr
        key={p.id}
        className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
      >
        <td className="py-3 pr-4">
          <button
            type="button"
            onClick={() => handlePreview(p)}
            className="font-sans-ui font-medium text-cream hover:text-[#d4a843] transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
            title="Nhấp để xem trước"
          >
            <span>{p.name}</span>
            <Eye
              className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#d4a843] flex-shrink-0"
              aria-hidden="true"
            />
          </button>
          {p.description && (
            <div className="mt-1 font-sans-ui text-xs text-white/55 line-clamp-2 max-w-md">
              {p.description}
            </div>
          )}
        </td>
        <td className="py-3 pr-4">
          <TypeBadge type={p.type} />
        </td>
        <td className="py-3 pr-4 font-mono text-xs text-white/55">
          {p.sellerUserId.length > 14
            ? `${p.sellerUserId.slice(0, 8)}…${p.sellerUserId.slice(-4)}`
            : p.sellerUserId}
        </td>
        <td className="py-3 pr-4 font-sans-ui text-cream tabular-nums">
          {currencyFormatter.format(p.price)} coin
        </td>
        <td className="py-3 pr-4 font-sans-ui text-xs text-white/55">
          {new Date(p.createdAt).toLocaleString("vi-VN")}
        </td>
        <td className="py-3">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="md"
              onClick={() => handlePreview(p)}
              title="Xem trước nội dung"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              Xem trước
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => handleApprove(p)}
              disabled={isMutating}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Duyệt
            </Button>
            <Button
              variant="ghost"
              tone="danger"
              size="md"
              onClick={() => openReject(p)}
              disabled={isMutating}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Từ chối
            </Button>
          </div>
        </td>
      </tr>
    ));
  }, [products, isMutating]);

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title="Duyệt nội dung"
        subtitle={`Tổng ${currencyFormatter.format(products.totalElements)} sản phẩm đang chờ duyệt.`}
        actions={
          <Button
            variant="ghost"
            size="md"
            onClick={() =>
              dispatch(
                fetchPendingProducts({
                  page: products.page,
                  size: products.size,
                }),
              )
            }
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Tải lại
          </Button>
        }
      />

      <SectionCard className="overflow-hidden p-0">
        <div className="overflow-x-auto p-6">
          <table className="w-full font-sans-ui text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-white/45 border-b border-white/[0.06]">
                <th className="pb-3 pr-4 font-medium">Sản phẩm</th>
                <th className="pb-3 pr-4 font-medium">Loại</th>
                <th className="pb-3 pr-4 font-medium">Seller</th>
                <th className="pb-3 pr-4 font-medium">Giá</th>
                <th className="pb-3 pr-4 font-medium">Ngày tạo</th>
                <th className="pb-3 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>{tableBody}</tbody>
          </table>
        </div>
        <Pagination
          currentPage={products.page}
          totalPages={products.totalPages}
          totalElements={products.totalElements}
          pageSize={products.size}
          onPageChange={(page) => dispatch(setProductsPage(page))}
          onPageSizeChange={(size) => dispatch(setProductsSize(size))}
        />
      </SectionCard>

      <ConfirmModal
        open={modalReject !== null}
        onClose={closeReject}
        onConfirm={handleReject}
        title="Từ chối sản phẩm"
        icon={<AlertTriangle className="h-5 w-5 text-amber-300" aria-hidden="true" />}
        confirmText="Xác nhận từ chối"
        isLoading={isMutating}
        variant="danger"
      >
        <div className="space-y-3 font-sans-ui">
          <p className="text-sm text-white/55">
            Từ chối{" "}
            <span className="font-medium text-cream">{modalReject?.name}</span>?
          </p>
          <div>
            <label
              htmlFor="reject-reason"
              className="block font-sans-ui text-xs uppercase tracking-[0.12em] text-white/55 mb-2"
            >
              Lý do từ chối (bắt buộc)
            </label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError(null);
              }}
              rows={4}
              placeholder="Nhập lý do từ chối (tối đa 500 ký tự)"
              maxLength={500}
              className={
                rejectError
                  ? "w-full resize-none rounded-xl border border-red-400/30 bg-red-400/[0.06] px-4 py-3 font-sans-ui text-base text-cream placeholder:text-white/35 focus:outline-none focus:border-red-400/60 transition-colors"
                  : "w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 font-sans-ui text-base text-cream placeholder:text-white/35 focus:outline-none focus:border-[#d4a843]/50 transition-colors"
              }
            />
            {rejectError ? (
              <p className="mt-2 font-sans-ui text-xs text-red-300">
                {rejectError}
              </p>
            ) : (
              <p className="mt-2 font-sans-ui text-xs text-white/55 tabular-nums">
                {rejectReason.length}/500
              </p>
            )}
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
}

export default AdminContentModeration;