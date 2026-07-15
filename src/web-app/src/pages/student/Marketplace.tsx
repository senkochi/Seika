import { Store, RefreshCcw, Coins } from "lucide-react";
import { useEffect, useState } from "react";
import { marketplaceApi, Product, walletService } from "@/api";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

const ORDER_POLL_ATTEMPTS = 10;
const ORDER_POLL_DELAY_MS = 700;

const wait = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

async function waitForPaidOrder(orderId: string) {
  for (let attempt = 0; attempt < ORDER_POLL_ATTEMPTS; attempt += 1) {
    const response = await marketplaceApi.getOrder(orderId);
    if (response.data.status === "PAID") {
      return response.data;
    }
    if (response.data.status === "FAILED") {
      throw new Error(
        "Thanh toán thất bại. Coin đã được giữ nguyên hoặc sẽ được hoàn theo hệ thống.",
      );
    }
    await wait(ORDER_POLL_DELAY_MS);
  }
  return null;
}

function Marketplace() {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleBuy = async (product: Product) => {
    try {
      if (!userId) {
        toast.error("Vui lòng đăng nhập để mua hàng");
        return;
      }

      toast.loading("Đang kiểm tra số dư...", { id: "buy-product" });
      const balanceRes = await walletService.getBalance();
      const currentBalance = balanceRes.balance || 0;

      if (currentBalance < product.price) {
        toast.error(
          `Số dư không đủ! Bạn cần ${product.price} Coins nhưng hiện tại chỉ có ${currentBalance} Coins.`,
          { id: "buy-product" },
        );
        return;
      }

      toast.loading("Đang tạo đơn hàng...", { id: "buy-product" });
      const orderResponse = await marketplaceApi.createOrder(userId, [
        {
          productId: product.id,
          productType: product.type,
          referenceId: product.referenceId,
          productName: product.name,
          unitPrice: product.price,
          quantity: 1,
          sellerUserId: product.sellerUserId,
        },
      ]);

      toast.loading("Đang xác nhận thanh toán...", { id: "buy-product" });
      const paidOrder = await waitForPaidOrder(orderResponse.data.id);
      await fetchProducts();

      if (paidOrder) {
        toast.success(
          "Đã mua hàng thành công! Sản phẩm đã có trong Learning Hub.",
          { id: "buy-product" },
        );
      } else {
        toast.info(
          "Đơn hàng đang được xử lý. Vui lòng làm mới Learning Hub sau ít giây.",
          { id: "buy-product" },
        );
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Mua hàng thất bại";
      toast.error(errorMessage, { id: "buy-product" });
      void fetchProducts();
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title="Marketplace"
        subtitle="Khám phá các bộ thẻ và quiz do giáo viên trên hệ thống đăng bán."
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
            Làm mới
          </Button>
        }
      />

      <section>
        <div className="flex items-center gap-2 mb-5">
          <Store className="w-4 h-4 text-[#d4a843]" aria-hidden="true" />
          <h2 className="font-sans-ui text-base font-semibold text-cream">
            Tất cả sản phẩm
          </h2>
        </div>

        {loading ? (
          <div className="font-sans-ui text-white/55 text-sm">
            Đang tải sản phẩm…
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Store className="w-5 h-5" aria-hidden="true" />}
            title="Chưa có sản phẩm nào"
            description="Marketplace hiện chưa có sản phẩm. Quay lại sau nhé."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((item) => {
              const isFlashcard = item.type === "FLASHCARD";
              return (
                <SectionCard
                  key={item.id}
                  className="flex flex-col h-full overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <StatusPill variant={isFlashcard ? "info" : "success"}>
                      {isFlashcard ? "Flashcard" : "Quiz"}
                    </StatusPill>
                  </div>

                  <div className="aspect-[4/3] w-full rounded-xl bg-white/[0.03] border border-white/[0.06] grid place-items-center mb-4">
                    <span aria-hidden="true" className="text-3xl">
                      {isFlashcard ? "📚" : "❓"}
                    </span>
                  </div>

                  <h3 className="font-sans-ui text-base font-semibold text-cream mb-2 line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="font-sans-ui text-sm text-white/55 line-clamp-2 flex-1 mb-5">
                    {item.description || "Chưa có mô tả"}
                  </p>

                  <div className="flex justify-between items-center mt-auto font-sans-ui">
                    <div className="flex items-center gap-1.5">
                      <Coins
                        className="w-4 h-4 text-[#d4a843]"
                        aria-hidden="true"
                      />
                      <span className="text-xl font-semibold text-cream tabular-nums">
                        {item.price.toLocaleString("vi-VN")}
                      </span>
                      <span className="text-xs text-white/55 uppercase tracking-[0.12em]">
                        Coins
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleBuy(item)}
                    >
                      Mua
                    </Button>
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