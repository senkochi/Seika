import { Store } from "lucide-react";
import { useEffect, useState } from "react";
import { marketplaceApi, Product, walletService } from "@/api";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";

function Marketplace() {
  const userId = useAppSelector((state) => state.userProfile.userId);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await marketplaceApi.getProducts();
        setProducts(res.data);
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    };
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

      toast.loading("Đang xử lý yêu cầu...", { id: "buy-product" });
      await marketplaceApi.createOrder(userId, [
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

      toast.success("Đã mua hàng thành công!", { id: "buy-product" });
    } catch (error: any) {
      console.error(error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Mua hàng thất bại";
      toast.error(errorMessage, { id: "buy-product" });
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Marketplace
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Power up your learning with exclusive items!
        </p>
      </div>

      {/* All Items */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Store className="w-8 h-8 text-[var(--primary)]" />
          <h2 className="text-3xl font-black text-[var(--foreground)]">
            All Items
          </h2>
        </div>

        {loading ? (
          <p>Loading items...</p>
        ) : products.length === 0 ? (
          <p className="text-[var(--muted-foreground)]">
            Chưa có sản phẩm nào trên chợ.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((item) => (
              <div
                key={item.id}
                className="group relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--primary)] transition-all overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-xs font-bold uppercase tracking-wider">
                    {item.type === "FLASHCARD" ? "Flashcards" : "Quiz"}
                  </div>
                </div>

                <div className="text-5xl mb-4 text-center">
                  {item.type === "FLASHCARD" ? "📚" : "❓"}
                </div>

                <h3 className="text-xl font-bold text-white mb-2 text-center">
                  {item.name}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] text-center mb-6 line-clamp-2">
                  {item.description || "Chưa có mô tả"}
                </p>

                <div className="flex justify-between items-center mt-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-amber-400">
                      {item.price}
                    </span>
                    <span className="text-sm text-amber-500 font-bold uppercase">
                      Coins
                    </span>
                  </div>
                  <button
                    onClick={() => handleBuy(item)}
                    className="px-6 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl font-bold transition-colors"
                  >
                    Buy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Marketplace;
