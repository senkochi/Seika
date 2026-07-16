import {
  BookOpen,
  Coins,
  Eye,
  RefreshCcw,
  ShieldCheck,
  Star,
  Store,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { marketplaceApi, type Product, walletService } from "@/api";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { useAppSelector } from "@/store/hooks";

const ORDER_POLL_ATTEMPTS = 10;
const ORDER_POLL_DELAY_MS = 700;

const wait = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

async function waitForPaidOrder(orderId: string) {
  for (let attempt = 0; attempt < ORDER_POLL_ATTEMPTS; attempt += 1) {
    const response = await marketplaceApi.getOrder(orderId);
    if (response.data.status === "PAID") return response.data;
    if (response.data.status === "FAILED") {
      throw new Error(
        "Payment failed. Your coins were kept or will be restored by the system.",
      );
    }
    await wait(ORDER_POLL_DELAY_MS);
  }
  return null;
}

function toNumber(value: unknown) {
  return Number(value ?? 0) || 0;
}

function tierVariant(tier?: string | null) {
  if (tier === "ELITE" || tier === "GOLD") return "gold" as const;
  if (tier === "SILVER") return "info" as const;
  if (tier === "BRONZE") return "warning" as const;
  return "neutral" as const;
}

function productKind(product: Product) {
  return product.type === "FLASHCARD"
    ? { label: "Flashcard", icon: BookOpen, variant: "info" as const }
    : { label: "Quiz", icon: Target, variant: "success" as const };
}

function Marketplace() {
  const navigate = useNavigate();
  const userId = useAppSelector((state) => state.userProfile.userId);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await marketplaceApi.getProducts();
      setProducts(res.data);
    } catch (error) {
      console.error("Failed to fetch products", error);
      toast.error("Failed to load marketplace products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProducts();
  }, []);

  const handleBuy = async (product: Product) => {
    try {
      if (!userId) {
        toast.error("Please sign in before buying.");
        return;
      }

      toast.loading("Checking wallet balance...", { id: "buy-product" });
      const balanceRes = await walletService.getBalance();
      const currentBalance = toNumber(balanceRes.balance);
      const price = toNumber(product.price);

      if (currentBalance < price) {
        toast.error(
          `Not enough coins. You need ${price.toLocaleString("vi-VN")} coins, current balance is ${currentBalance.toLocaleString("vi-VN")}.`,
          { id: "buy-product" },
        );
        return;
      }

      toast.loading("Creating order...", { id: "buy-product" });
      const orderResponse = await marketplaceApi.createOrder(userId, [
        {
          productId: product.id,
          productType: product.type,
          referenceId: product.referenceId,
          productName: product.name,
          unitPrice: price,
          quantity: 1,
          sellerUserId: product.sellerUserId,
        },
      ]);

      toast.loading("Confirming payment...", { id: "buy-product" });
      const paidOrder = await waitForPaidOrder(orderResponse.data.id);
      await fetchProducts();

      if (paidOrder) {
        toast.success(
          "Purchase complete. The product is now in Learning Hub.",
          {
            id: "buy-product",
          },
        );
      } else {
        toast.info(
          "Order is still processing. Refresh Learning Hub in a moment.",
          {
            id: "buy-product",
          },
        );
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Purchase failed.";
      toast.error(errorMessage, { id: "buy-product" });
      void fetchProducts();
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title="Marketplace"
        subtitle="Browse teacher-made flashcard decks and quiz packs."
        actions={
          <Button
            variant="ghost"
            size="md"
            onClick={fetchProducts}
            disabled={loading}
          >
            <RefreshCcw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Refresh
          </Button>
        }
      />

      <section>
        <div className="flex items-center gap-2 mb-5">
          <Store className="w-4 h-4 text-[#d4a843]" aria-hidden="true" />
          <h2 className="font-sans-ui text-base font-semibold text-cream">
            All products
          </h2>
        </div>

        {loading ? (
          <div className="font-sans-ui text-white/55 text-sm">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Store className="w-5 h-5" aria-hidden="true" />}
            title="No products yet"
            description="Marketplace products will appear here when teachers publish them."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((item) => {
              const kind = productKind(item);
              const KindIcon = kind.icon;
              const price = toNumber(item.price);
              return (
                <SectionCard
                  key={item.id}
                  className="flex flex-col h-full overflow-hidden"
                >
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <StatusPill
                      variant={kind.variant}
                      icon={<KindIcon className="h-3.5 w-3.5" />}
                    >
                      {kind.label}
                    </StatusPill>
                    <StatusPill
                      variant={tierVariant(item.teacherTier)}
                      icon={<ShieldCheck className="h-3.5 w-3.5" />}
                    >
                      {item.teacherTier ?? "NEWBIE"}
                    </StatusPill>
                  </div>

                  <div className="aspect-[4/3] w-full rounded-xl bg-white/[0.03] border border-white/[0.06] grid place-items-center mb-4">
                    <KindIcon
                      aria-hidden="true"
                      className="h-12 w-12 text-[#d4a843]"
                      strokeWidth={1.5}
                    />
                  </div>

                  <h3 className="font-sans-ui text-base font-semibold text-cream mb-2 line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="font-sans-ui text-sm text-white/55 line-clamp-2 flex-1 mb-4">
                    {item.description || "No description yet."}
                  </p>

                  <div className="mb-5 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 font-sans-ui">
                    <p className="text-xs uppercase tracking-[0.14em] text-white/40">
                      Teacher
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-cream line-clamp-1">
                        {item.teacherDisplayName || item.sellerUserId}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm text-white/65">
                        <Star
                          className="h-3.5 w-3.5 text-[#d4a843] fill-current"
                          aria-hidden="true"
                        />
                        {toNumber(item.teacherAverageRating).toFixed(1)}
                        <span className="text-white/35">
                          ({item.teacherValidReviewCount ?? 0})
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-auto font-sans-ui sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-1.5">
                      <Coins
                        className="w-4 h-4 text-[#d4a843]"
                        aria-hidden="true"
                      />
                      <span className="text-xl font-semibold text-cream tabular-nums">
                        {price.toLocaleString("vi-VN")}
                      </span>
                      <span className="text-xs text-white/55 uppercase tracking-[0.12em]">
                        Coins
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() =>
                          navigate("/student/dashboard/marketplace/" + item.id)
                        }
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        Details
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => handleBuy(item)}
                      >
                        Buy
                      </Button>
                    </div>
                  </div>
                </SectionCard>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Marketplace;
