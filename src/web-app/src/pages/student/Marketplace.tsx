import { Clock, Flame, Store } from "lucide-react";
import MarketplaceOfferCard from "@/components/student/MarketplaceOfferCard";
import MarketplaceItemCard from "@/components/student/MarketplaceItemCard";

type MarketplaceOffer = {
  id: number;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  icon: string;
  color: string;
  badge: "Limited" | "Hot";
  timeLeft: string;
};

type MarketplaceItem = {
  id: number;
  category: string;
  title: string;
  description: string;
  price: number;
  icon: string;
  color?: string;
  badge: "New" | "Hot" | null;
};

function Marketplace() {
  const limitedOffers: MarketplaceOffer[] = [
    {
      id: 1,
      title: "Legendary Math Bundle",
      description: "Complete algebra mastery pack",
      price: 999,
      originalPrice: 1499,
      icon: "👑",
      color: "from-amber-400 to-yellow-500",
      badge: "Limited",
      timeLeft: "2:34:12",
    },
    {
      id: 2,
      title: "Double XP Boost",
      description: "24 hours of 2x XP",
      price: 500,
      originalPrice: 750,
      icon: "⚡",
      color: "from-purple-500 to-violet-600",
      badge: "Hot",
      timeLeft: "5:12:45",
    },
  ];

  const items: MarketplaceItem[] = [
    {
      id: 1,
      category: "Quiz Packs",
      title: "Science Explorer Pack",
      description: "50 physics & chemistry quizzes",
      price: 450,
      icon: "🔬",
      badge: "New",
    },
    {
      id: 2,
      category: "Flashcard Decks",
      title: "History Heroes",
      description: "100 world history cards",
      price: 350,
      icon: "🏛️",
      badge: null,
    },
    {
      id: 3,
      category: "Power-ups",
      title: "Streak Freeze",
      description: "Protect your streak for 1 day",
      price: 150,
      icon: "🛡️",
      color: "from-cyan-400 to-blue-500",
      badge: "Hot",
    },
    {
      id: 4,
      category: "Cosmetics",
      title: "Golden Avatar Frame",
      description: "Shine like a champion",
      price: 800,
      icon: "✨",
      color: "from-amber-400 to-yellow-500",
      badge: null,
    },
    {
      id: 5,
      category: "Quiz Packs",
      title: "Grammar Guru Pack",
      description: "75 advanced English quizzes",
      price: 400,
      icon: "📖",
      color: "from-violet-500 to-purple-600",
      badge: "New",
    },
    {
      id: 6,
      category: "Power-ups",
      title: "XP Multiplier x3",
      description: "1 hour of triple XP",
      price: 600,
      icon: "🚀",
      color: "from-red-500 to-orange-600",
      badge: "Hot",
    },
    {
      id: 7,
      category: "Flashcard Decks",
      title: "Vocabulary Vault",
      description: "200 SAT words",
      price: 500,
      icon: "💎",
      color: "from-indigo-500 to-purple-600",
      badge: null,
    },
    {
      id: 8,
      category: "Cosmetics",
      title: "Rainbow Name Tag",
      description: "Animated username effect",
      price: 650,
      icon: "🌈",
      color: "from-pink-500 to-violet-600",
      badge: null,
    },
    {
      id: 9,
      category: "Quiz Packs",
      title: "Mystery Box",
      description: "Random quiz pack - any subject!",
      price: 300,
      icon: "🎁",
      color: "from-purple-600 to-pink-600",
      badge: null,
    },
  ];

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

      {/* Limited Time Offers */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Flame className="w-6 h-6 text-[var(--accent)]" />
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            Limited Time Offers
          </h2>
          <Clock className="w-5 h-5 text-[var(--accent)]" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {limitedOffers.map((offer) => (
            <MarketplaceOfferCard key={offer.id} {...offer} />
          ))}
        </div>
      </div>

      {/* All Items */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Store className="w-8 h-8 text-[var(--primary)]" />
          <h2 className="text-3xl font-black text-[var(--foreground)]">
            All Items
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <MarketplaceItemCard key={item.id} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Marketplace;
