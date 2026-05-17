import { Clock, Flame, ShoppingCart, Zap } from "lucide-react";
import StudentActionButton from "@/components/student/StudentActionButton";
import StudentBadge from "@/components/student/StudentBadge";

type MarketplaceOfferCardProps = {
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  icon: string;
  badge: "Limited" | "Hot" | null;
  timeLeft: string;
};

function MarketplaceOfferCard({
  title,
  description,
  price,
  originalPrice,
  icon,
  badge,
  timeLeft,
}: MarketplaceOfferCardProps) {
  const badgeVariant =
    badge === "Limited" ? "danger" : badge === "Hot" ? "warning" : "success";

  const badgeIcon =
    badge === "Limited" ? Flame : badge === "Hot" ? Zap : undefined;

  return (
    <div className="group relative">
      <div className="relative rounded-3xl p-1">
        <div className="group bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--primary)] transition-all">
          <div className="flex justify-between items-start mb-4">
            {badge && (
              <StudentBadge variant={badgeVariant} icon={badgeIcon}>
                {badge}
              </StudentBadge>
            )}
            <div className="bg-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="text-white text-xs font-black">{timeLeft}</span>
            </div>
          </div>

          <div className="flex items-start gap-6 mb-6">
            <div className="text-6xl transform transition-transform">
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-black text-[var(--foreground)] mb-2">
                {title}
              </h3>
              <p className="text-[var(--muted-foreground)] mb-4">
                {description}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-3xl font-black text-[var(--accent)]">
                    {price}
                  </span>
                  <span className="text-[var(--accent)] text-sm font-bold">
                    Coin
                  </span>
                </div>
                <span className="text-[var(--muted-foreground)] line-through text-lg">
                  {originalPrice}
                </span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-black">
                  {Math.round(((originalPrice - price) / originalPrice) * 100)}%
                  OFF
                </span>
              </div>
            </div>
          </div>

          <StudentActionButton size="lg" icon={ShoppingCart}>
            Buy Now
          </StudentActionButton>
        </div>
      </div>
    </div>
  );
}

export default MarketplaceOfferCard;
