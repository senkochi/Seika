import {
  ArrowLeft,
  BookOpen,
  Coins,
  MessageSquare,
  RefreshCcw,
  ShieldCheck,
  Star,
  Target,
  Undo2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  marketplaceApi,
  walletService,
  type EscrowTransaction,
  type InventoryItem,
  type Product,
  type ReviewResponse,
} from "@/api";
import { useFormatDate, useFormatNumber } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { useAppSelector } from "@/store/hooks";
import { useTranslation } from "react-i18next";

const ORDER_POLL_ATTEMPTS = 10;
const ORDER_POLL_DELAY_MS = 700;

const wait = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

async function waitForPaidOrder(orderId: string, t: (key: string) => string) {
  for (let attempt = 0; attempt < ORDER_POLL_ATTEMPTS; attempt += 1) {
    const response = await marketplaceApi.getOrder(orderId);
    if (response.data.status === "PAID") return response.data;
    if (response.data.status === "FAILED") {
      throw new Error(t("toast.paymentFailed"));
    }
    await wait(ORDER_POLL_DELAY_MS);
  }
  return null;
}

function toNumber(value: unknown) {
  return Number(value ?? 0) || 0;
}

function productKind(product: Product, t: (key: string) => string) {
  return product.type === "FLASHCARD"
    ? { label: t("type.flashcard"), icon: BookOpen, variant: "info" as const }
    : { label: t("type.quiz"), icon: Target, variant: "success" as const };
}

function tierVariant(tier?: string | null) {
  if (tier === "ELITE" || tier === "GOLD") return "gold" as const;
  if (tier === "SILVER") return "info" as const;
  if (tier === "BRONZE") return "warning" as const;
  return "neutral" as const;
}

function latestEscrowForProduct(
  escrows: EscrowTransaction[],
  productId: string,
) {
  return escrows
    .filter((escrow) => escrow.productId === productId)
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    )[0];
}

function canRequestSelfServiceRefund(
  escrow: EscrowTransaction | undefined,
  inventory: InventoryItem | undefined,
) {
  return Boolean(
    escrow &&
    escrow.status === "HELD" &&
    !escrow.needsAdminDecision &&
    !escrow.creditRequestedAt &&
    !escrow.refundRequestedAt &&
    !inventory?.consumedAt,
  );
}

function refundHelpText(
  escrow: EscrowTransaction | undefined,
  inventory: InventoryItem | undefined,
  t: (key: string) => string,
) {
  if (!escrow) return t("refundHelp.noEscrow");
  if (inventory?.consumedAt) {
    return t("refundHelp.consumed");
  }
  if (escrow.status === "REFUNDED") return t("refundHelp.refunded");
  if (escrow.status === "RELEASED") return t("refundHelp.released");
  if (escrow.needsAdminDecision || escrow.status === "PENDING_ADMIN_DECISION") {
    return t("refundHelp.pendingDecision");
  }
  if (escrow.refundRequestedAt) return t("refundHelp.refundRequested");
  if (escrow.creditRequestedAt) return t("refundHelp.creditRequested");
  return t("refundHelp.canRefund");
}

function ProductDetail() {
  const { t } = useTranslation("marketplace");
  const formatNum = useFormatNumber();
  const formatDt = useFormatDate();
  const formatCoins = (value: unknown) => formatNum(toNumber(value));
  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    return formatDt(value);
  };
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = useAppSelector((state) => state.userProfile.userId);
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [escrows, setEscrows] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [
        productResponse,
        reviewResponse,
        inventoryResponse,
        escrowResponse,
      ] = await Promise.all([
        marketplaceApi.getProductById(id),
        marketplaceApi.getProductReviews(id),
        marketplaceApi
          .getMyInventoryDetails()
          .catch(() => ({ data: [] as InventoryItem[] })),
        marketplaceApi
          .getMyEscrows()
          .catch(() => ({ data: [] as EscrowTransaction[] })),
      ]);
      setProduct(productResponse.data);
      setReviews(reviewResponse.data ?? []);
      setInventory(inventoryResponse.data ?? []);
      setEscrows(escrowResponse.data ?? []);
    } catch (err) {
      console.error(err);
      setError("This product is unavailable or no longer published.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const ownedInventory = useMemo(
    () =>
      inventory.find((item) => item.productId === product?.id && item.active),
    [inventory, product?.id],
  );
  const owned = Boolean(ownedInventory);
  const escrow = useMemo(
    () => (product ? latestEscrowForProduct(escrows, product.id) : undefined),
    [escrows, product],
  );
  const isEscrowBuyer = Boolean(userId && escrow && escrow.buyerId === userId);
  const canRefund =
    isEscrowBuyer && canRequestSelfServiceRefund(escrow, ownedInventory);
  const isOwnProduct = Boolean(
    userId && product && product.sellerUserId === userId,
  );

  const handleBuy = async () => {
    if (!product) return;
    if (!userId) {
      toast.error(t("toast.loginRequired"));
      return;
    }
    setBuying(true);
    try {
      toast.loading(t("toast.checkingBalance"), { id: "buy-product-detail" });
      const balance = await walletService.getBalance();
      const currentBalance = toNumber(balance.balance);
      if (currentBalance < toNumber(product.price)) {
        toast.error(
          t("toast.insufficientBalance", {
            price: formatCoins(product.price),
            balance: formatCoins(currentBalance),
          }),
          { id: "buy-product-detail" },
        );
        return;
      }

      toast.loading(t("toast.creatingOrder"), { id: "buy-product-detail" });
      const order = await marketplaceApi.createOrder(userId, [
        {
          productId: product.id,
          productType: product.type,
          referenceId: product.referenceId,
          productName: product.name,
          unitPrice: toNumber(product.price),
          quantity: 1,
          sellerUserId: product.sellerUserId,
        },
      ]);
      toast.loading(t("toast.verifyingPayment"), { id: "buy-product-detail" });
      await waitForPaidOrder(order.data.id, t);
      toast.success(t("toast.buySuccess"), {
        id: "buy-product-detail",
      });
      await load();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          t("toast.buyFailed"),
        { id: "buy-product-detail" },
      );
    } finally {
      setBuying(false);
    }
  };

  const handleRefund = async () => {
    if (!escrow || !canRefund) return;
    setRefunding(true);
    try {
      await marketplaceApi.requestRefund(escrow.id);
      toast.success(t("toast.refundSent"));
      await load();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          t("toast.refundFailed"),
      );
    } finally {
      setRefunding(false);
    }
  };

  const handleSubmitReview = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!product || !owned) return;
    setReviewSubmitting(true);
    try {
      const response = await marketplaceApi.submitReview({
        productId: product.id,
        rating,
        comment: comment.trim(),
      });
      setComment("");
      setRating(5);
      await load();
      if (response.data.status === "PENDING_RISK_REVIEW") {
        toast.info(t("toast.reviewReceived"));
      } else {
        toast.success(t("toast.reviewSubmitted"));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          t("toast.reviewFailed"),
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 font-sans-ui text-sm text-white/55">
        Loading product...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <Button variant="ghost" size="md" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("detail.back")}
        </Button>
        <EmptyState
          icon={<BookOpen className="w-5 h-5" aria-hidden="true" />}
          title={t("detail.unavailableTitle")}
          description={error ?? t("detail.unavailableDesc")}
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate("/student/dashboard/marketplace")}
            >
              {t("detail.returnMarketplace")}
            </Button>
          }
        />
      </div>
    );
  }

  const kind = productKind(product, t);
  const KindIcon = kind.icon;
  const targetPath =
    product.type === "FLASHCARD"
      ? `/student/dashboard/flashcard/${product.referenceId}`
      : `/student/dashboard/quiz/${product.referenceId}`;

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title={product.name}
        subtitle={product.description || t("detail.subtitleDefault")}
        actions={
          <Button
            variant="ghost"
            size="md"
            onClick={() => navigate("/student/dashboard/marketplace")}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("header.title")}
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <SectionCard className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              variant={kind.variant}
              icon={<KindIcon className="h-3.5 w-3.5" />}
            >
              {kind.label}
            </StatusPill>
            <StatusPill
              variant={tierVariant(product.teacherTier)}
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
            >
              {product.teacherTier ?? "NEWBIE"}
            </StatusPill>
            {owned && (
              <StatusPill variant="success">
                {t("detail.ownedBadge")}
              </StatusPill>
            )}
          </div>

          <div className="aspect-[16/9] w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] grid place-items-center">
            <KindIcon
              className="h-16 w-16 text-[#d4a843]"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                {t("detail.priceLabel")}
              </p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-cream tabular-nums">
                <Coins className="h-5 w-5 text-[#d4a843]" aria-hidden="true" />
                {formatCoins(product.price)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                {t("detail.teacherLabel")}
              </p>
              <p className="mt-1 text-base font-medium text-cream">
                {product.teacherDisplayName || product.sellerUserId}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                {t("detail.ratingLabel")}
              </p>
              <p className="mt-1 text-base font-medium text-cream">
                {toNumber(product.teacherAverageRating).toFixed(1)} / 5
                <span className="ml-2 text-sm text-white/45">
                  ({product.teacherValidReviewCount ?? 0})
                </span>
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard className="space-y-5">
          <div>
            <h2 className="font-sans-ui text-base font-semibold text-cream">
              {t("detail.actionsTitle")}
            </h2>
            <p className="mt-1 text-sm text-white/55">
              {t("detail.actionsDesc")}
            </p>
          </div>

          {owned ? (
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => navigate(targetPath)}
            >
              {t("detail.openInLearningHub")}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleBuy}
              loading={buying}
            >
              {t("detail.buyForCoins", { price: formatCoins(product.price) })}
            </Button>
          )}

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-sans-ui text-sm font-medium text-cream">
                  {t("detail.escrowRefundTitle")}
                </p>
                <p className="mt-1 text-sm text-white/50">
                  {refundHelpText(escrow, ownedInventory, t)}
                </p>
              </div>
              {escrow && (
                <StatusPill variant="neutral">{escrow.status}</StatusPill>
              )}
            </div>
            {canRefund && (
              <Button
                variant="ghost"
                size="md"
                tone="danger"
                className="mt-4 w-full"
                onClick={handleRefund}
                loading={refunding}
              >
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                {t("detail.requestRefund")}
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="md"
            className="w-full"
            onClick={load}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            {t("detail.refreshStatus")}
          </Button>
        </SectionCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <SectionCard className="space-y-5">
          <div className="flex items-center gap-2">
            <MessageSquare
              className="h-4 w-4 text-[#d4a843]"
              aria-hidden="true"
            />
            <h2 className="font-sans-ui text-base font-semibold text-cream">
              {t("detail.reviewsTitle")}
            </h2>
          </div>

          {reviews.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-5 h-5" aria-hidden="true" />}
              title={t("detail.noReviewsTitle")}
              description={t("detail.noReviewsDesc")}
            />
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div
                      className="flex items-center gap-1 text-[#d4a843]"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${
                            index < review.rating
                              ? "fill-current"
                              : "opacity-30"
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-white/45">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-3 text-sm leading-6 text-white/70">
                      {review.comment}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard className="space-y-5">
          <div>
            <h2 className="font-sans-ui text-base font-semibold text-cream">
              {t("detail.writeReviewTitle")}
            </h2>
            <p className="mt-1 text-sm text-white/55">
              {t("detail.writeReviewDesc")}
            </p>
          </div>

          {isOwnProduct ? (
            <p className="text-sm text-white/55">
              {t("detail.cannotReviewOwn")}
            </p>
          ) : !owned ? (
            <EmptyState
              icon={<ShieldCheck className="w-5 h-5" aria-hidden="true" />}
              title={t("detail.purchaseRequiredTitle")}
              description={t("detail.purchaseRequiredDesc")}
            />
          ) : (
            <form className="space-y-4" onSubmit={handleSubmitReview}>
              <div>
                <span className="block text-sm font-medium text-cream">
                  {t("detail.ratingLabel")}
                </span>
                <div
                  className="mt-2 flex gap-1"
                  role="group"
                  aria-label={t("detail.chooseRatingAria")}
                >
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1;
                    const active = value <= rating;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-label={`${value} star rating`}
                        className={`rounded-full p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] ${
                          active
                            ? "text-[#d4a843]"
                            : "text-white/25 hover:text-white/55"
                        }`}
                        onClick={() => setRating(value)}
                      >
                        <Star
                          className={`h-5 w-5 ${active ? "fill-current" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="review-comment"
                  className="text-sm font-medium text-cream"
                >
                  {t("detail.commentLabel")}
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-cream outline-none focus:border-[#d4a843]/50"
                  placeholder={t("detail.commentPlaceholder")}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                loading={reviewSubmitting}
              >
                {t("detail.submitReview")}
              </Button>
            </form>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export default ProductDetail;
