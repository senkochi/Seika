import {
  Sparkles,
  Zap,
  Clock,
  Flame,
  Star,
  Crown,
  Lock,
  ShoppingCart,
} from "lucide-react";

function Marketplace() {
  const limitedOffers = [
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
      glow: true,
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
      glow: true,
    },
  ];

  const items = [
    {
      id: 1,
      category: "Quiz Packs",
      title: "Science Explorer Pack",
      description: "50 physics & chemistry quizzes",
      price: 450,
      icon: "🔬",
      color: "from-green-500 to-emerald-600",
      badge: "New",
      featured: false,
    },
    {
      id: 2,
      category: "Flashcard Decks",
      title: "History Heroes",
      description: "100 world history cards",
      price: 350,
      icon: "🏛️",
      color: "from-blue-500 to-cyan-600",
      badge: null,
      featured: false,
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
      featured: true,
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
      featured: true,
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
      featured: false,
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
      featured: true,
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
      featured: false,
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
      featured: false,
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
      featured: false,
    },
  ];

  const getBadgeStyles = (badge: string | null) => {
    switch (badge) {
      case "Limited":
        return "bg-red-500 text-white";
      case "Hot":
        return "bg-orange-500 text-white";
      case "New":
        return "bg-green-500 text-white";
      default:
        return "";
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Marketplace</h1>
        <p className="text-gray-400">
          Power up your learning with exclusive items!
        </p>
      </div>

      {/* Limited Time Offers */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Flame className="w-6 h-6 text-purple-500 animate-pulse" />
          <h2 className="text-xl font-bold text-white">Limited Time Offers</h2>
          <Clock className="w-5 h-5 text-purple-400" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {limitedOffers.map((offer) => (
            <div key={offer.id} className="group relative">
              {/* Intense glow effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${offer.color} rounded-3xl blur-2xl opacity-40 group-hover:opacity-70 transition-all animate-pulse`}
              ></div>

              {/* Offer card */}
              <div
                className={`relative bg-gradient-to-br ${offer.color} rounded-3xl p-1 shadow-2xl`}
              >
                <div className="bg-gradient-to-br from-purple-950 to-violet-950 rounded-[22px] p-6">
                  {/* Badge and timer */}
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`px-3 py-1 ${getBadgeStyles(offer.badge)} rounded-full text-xs font-black uppercase flex items-center gap-1`}
                    >
                      {offer.badge === "Limited" && (
                        <Flame className="w-3 h-3" />
                      )}
                      {offer.badge === "Hot" && <Zap className="w-3 h-3" />}
                      {offer.badge}
                    </div>
                    <div className="bg-red-500/20 border border-red-500/50 px-3 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3 text-red-400" />
                      <span className="text-red-300 text-xs font-black">
                        {offer.timeLeft}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex items-start gap-6 mb-6">
                    <div className="text-6xl transform group-hover:scale-110 transition-transform">
                      {offer.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-white mb-2">
                        {offer.title}
                      </h3>
                      <p className="text-violet-300 mb-4">
                        {offer.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-5 h-5 text-amber-400" />
                          <span className="text-3xl font-black text-white">
                            {offer.price}
                          </span>
                          <span className="text-violet-300 text-sm">Xu</span>
                        </div>
                        <span className="text-gray-500 line-through text-lg">
                          {offer.originalPrice}
                        </span>
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-black">
                          {Math.round(
                            ((offer.originalPrice - offer.price) /
                              offer.originalPrice) *
                              100,
                          )}
                          % OFF
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Buy button */}
                  <button className="w-full px-6 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-amber-400/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Items */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Store className="w-8 h-8 text-amber-400" />
          <h2 className="text-3xl font-black text-white">All Items</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className={`group relative ${item.featured ? "lg:row-span-1" : ""}`}
            >
              {/* Glow effect for featured items */}
              {item.featured && (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-all`}
                ></div>
              )}

              {/* Item card */}
              <div className="relative bg-gradient-to-br from-purple-900/60 to-violet-900/60 backdrop-blur-sm border-2 border-purple-600/50 rounded-3xl p-6 hover:border-purple-500 hover:scale-105 transition-all h-full flex flex-col">
                {/* Badge */}
                {item.badge && (
                  <div className="absolute top-4 right-4 z-10">
                    <div
                      className={`px-3 py-1 ${getBadgeStyles(item.badge)} rounded-full text-xs font-black uppercase flex items-center gap-1 shadow-lg`}
                    >
                      {item.badge === "Hot" && <Flame className="w-3 h-3" />}
                      {item.badge === "New" && <Star className="w-3 h-3" />}
                      {item.badge}
                    </div>
                  </div>
                )}

                {/* Featured indicator */}
                {item.featured && (
                  <div className="absolute top-4 left-4 z-10">
                    <Crown className="w-6 h-6 text-amber-400" />
                  </div>
                )}

                {/* Category */}
                <div className="mb-3">
                  <span className="text-violet-400 text-xs font-black uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>

                {/* Icon */}
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>

                {/* Title and description */}
                <h3 className="text-xl font-black text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-violet-300 text-sm mb-4 flex-1">
                  {item.description}
                </p>

                {/* Price */}
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-2xl font-black text-white">
                    {item.price}
                  </span>
                  <span className="text-violet-300 text-sm">Xu</span>
                </div>

                {/* Buy button */}
                <button
                  className={`w-full px-4 py-3 bg-gradient-to-r ${item.color} text-white rounded-xl font-black hover:shadow-lg hover:shadow-${item.color}/50 transition-all flex items-center justify-center gap-2`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Purchase
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const Store = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <path d="M2 7h20" />
    <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
  </svg>
);

export default Marketplace;
