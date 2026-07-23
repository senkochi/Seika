import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Check,
  X,
  Loader2,
  RefreshCw,
  AlertTriangle,
  BookOpen,
  Layers,
  Eye,
  Info,
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
import { useFormatDate, useFormatNumber } from "../../utils/format";
import { recognizableUsername } from "../../utils/displayName";
import { ProductDetailDrawer } from "../../components/admin/moderation/ProductDetailDrawer";

function typeVariant(type: string): "info" | "success" {
  return type.toUpperCase().includes("QUIZ") ? "info" : "success";
}

function TypeBadge({ type }: { type: string }) {
  const { t } = useTranslation("admin");
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
      {isQuiz ? t("moderation.badge.quiz") : t("moderation.badge.flashcard")}
    </StatusPill>
  );
}

const compactBtn = "!h-8 !px-3 !text-xs gap-1.5 rounded-lg";

function AdminContentModeration() {
  const { t } = useTranslation("admin");
  const formatDate = useFormatDate();
  const formatNumber = useFormatNumber();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { products, mutationStatus } = useAppSelector((state) => state.admin);

  const [modalReject, setModalReject] = useState<PendingProduct | null>(null);
  const [drawerProduct, setDrawerProduct] = useState<PendingProduct | null>(
    null,
  );
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

  const handleApprove = async (product: PendingProduct): Promise<boolean> => {
    const result = await dispatch(approveAdminProduct(product.id));
    if (approveAdminProduct.rejected.match(result)) {
      showError((result.payload as string) ?? t("moderation.error.approve"));
      return false;
    } else {
      showSuccess(t("moderation.success.approve", { name: product.name }));
      setDrawerProduct(null);
      return true;
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
      setRejectError(t("moderation.error.reasonRequired"));
      return;
    }
    const result = await dispatch(
      rejectAdminProduct({
        productId: modalReject.id,
        reason: rejectReason.trim(),
      }),
    );
    if (rejectAdminProduct.rejected.match(result)) {
      showError((result.payload as string) ?? t("moderation.error.reject"));
      return;
    }
    showSuccess(t("moderation.success.reject", { name: modalReject.name }));
    setDrawerProduct(null);
    closeReject();
  };

  const tableBody = useMemo(() => {
    if (products.status === "loading" && products.content.length === 0) {
      return (
        <tr>
          <td
            colSpan={6}
            className="py-12 text-center font-sans-ui text-white/55"
          >
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
          <td
            colSpan={6}
            className="py-12 text-center font-sans-ui text-red-300"
          >
            {products.error ?? t("moderation.error.unknown")}
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
            {t("moderation.table.empty")}
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
        <td className="py-3 pr-4 font-sans-ui text-sm text-white/65">
          {recognizableUsername(p.teacherDisplayName) || "—"}
        </td>
        <td className="py-3 pr-4 font-sans-ui text-cream tabular-nums">
          {formatNumber(p.price)} coin
        </td>
        <td className="py-3 pr-4 font-sans-ui text-xs text-white/55">
          {formatDate(p.createdAt)}
        </td>
        <td className="py-3">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="md"
              className={compactBtn}
              onClick={() => setDrawerProduct(p)}
              title={t("moderation.details")}
            >
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              {t("moderation.details")}
            </Button>
            <Button
              variant="ghost"
              size="md"
              className={compactBtn}
              onClick={() => handlePreview(p)}
              title="Xem trước nội dung"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              {t("moderation.preview")}
            </Button>
            <Button
              variant="ghost"
              size="md"
              className={compactBtn}
              onClick={() => handleApprove(p)}
              disabled={isMutating}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {t("moderation.approve")}
            </Button>
            <Button
              variant="ghost"
              tone="danger"
              size="md"
              className={compactBtn}
              onClick={() => openReject(p)}
              disabled={isMutating}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {t("moderation.reject")}
            </Button>
          </div>
        </td>
      </tr>
    ));
  }, [products, isMutating, t]);

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title={t("moderation.title")}
        subtitle={t("moderation.subtitle", {
          count: products.totalElements,
        })}
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
            {t("moderation.reload")}
          </Button>
        }
      />

      <SectionCard className="overflow-hidden p-0">
        <div className="overflow-x-auto p-6">
          <table className="w-full font-sans-ui text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-white/45 border-b border-white/[0.06]">
                <th className="pb-3 pr-4 font-medium">
                  {t("moderation.table.headers.product")}
                </th>
                <th className="pb-3 pr-4 font-medium">
                  {t("moderation.table.headers.type")}
                </th>
                <th className="pb-3 pr-4 font-medium">
                  {t("moderation.table.headers.seller")}
                </th>
                <th className="pb-3 pr-4 font-medium">
                  {t("moderation.table.headers.price")}
                </th>
                <th className="pb-3 pr-4 font-medium">
                  {t("moderation.table.headers.created")}
                </th>
                <th className="pb-3 font-medium text-right">
                  {t("moderation.table.headers.actions")}
                </th>
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

      <ProductDetailDrawer
        product={drawerProduct}
        isMutating={isMutating}
        onClose={() => setDrawerProduct(null)}
        onPreview={handlePreview}
        onApprove={handleApprove}
        onReject={openReject}
      />

      <ConfirmModal
        open={modalReject !== null}
        onClose={closeReject}
        onConfirm={handleReject}
        title={t("moderation.rejectModal.title")}
        icon={
          <AlertTriangle
            className="h-5 w-5 text-amber-300"
            aria-hidden="true"
          />
        }
        confirmText={t("moderation.rejectModal.confirm")}
        isLoading={isMutating}
        variant="danger"
      >
        <div className="space-y-3 font-sans-ui">
          <p className="text-sm text-white/55">
            {t("moderation.rejectModal.desc", { name: modalReject?.name })}
          </p>
          <div>
            <label
              htmlFor="reject-reason"
              className="block font-sans-ui text-xs uppercase tracking-[0.12em] text-white/55 mb-2"
            >
              {t("moderation.rejectModal.reasonLabel")}
            </label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError(null);
              }}
              rows={4}
              placeholder={t("moderation.rejectModal.reasonPlaceholder")}
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
