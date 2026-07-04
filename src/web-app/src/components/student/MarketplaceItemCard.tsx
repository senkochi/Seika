import { Flame, ShoppingCart, Sparkles, Star } from "lucide-react";
import StudentActionButton from "@/components/student/StudentActionButton";
import StudentBadge from "@/components/student/StudentBadge";

type MarketplaceItemCardProps = {
  category: string;
  title: string;
  description: string;
  price: number;
  icon: string;
  badge: "New" | "Hot" | null;
};

function MarketplaceItemCard({
  category,
  title,
  description,
  price,
  icon,
  badge,
}: MarketplaceItemCardProps) {
  const badgeVariant =
    badge === "Hot" ? "warning" : badge === "New" ? "success" : "glass";

  const badgeIcon =
    badge === "Hot" ? Flame : badge === "New" ? Star : undefined;

  return (
    <div className="group relative">
      <div className="group bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--primary)] transition-all flex flex-col">
        {badge && (
          <div className="absolute top-4 right-4 z-10">
            <StudentBadge
              variant={badgeVariant}
              icon={badgeIcon}
              className="shadow-lg"
            >
              {badge}
            </StudentBadge>
          </div>
        )}

        <div className="mb-3">
          <span className="text-[var(--muted-foreground)] text-xs font-black uppercase tracking-wider">
            {category}
          </span>
        </div>

        <div className="text-5xl mb-4 transform transition-transform">
          {icon}
        </div>

        <h3 className="text-xl font-black text-[var(--foreground)] mb-2">
          {title}
        </h3>
        <p className="text-[var(--muted-foreground)] text-sm mb-4 flex-1">
          {description}
        </p>

        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[var(--primary)]" />
          <span className="text-2xl font-black text-[var(--accent)]">
            {price}
          </span>
          <span className="text-[var(--accent)] text-sm">Coin</span>
        </div>

        <StudentActionButton icon={ShoppingCart}>Purchase</StudentActionButton>
      </div>
    </div>
  );
}

export default MarketplaceItemCard;
