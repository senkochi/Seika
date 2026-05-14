import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Gift,
  Trophy,
  ShoppingBag,
  Zap,
  Star,
  Coins,
} from "lucide-react";

function Wallet() {
  const walletStats = {
    totalXu: 2847,
    earnedToday: 350,
    spentThisWeek: 1200,
    rank: "Gold Collector",
  };

  const treasureLog = [
    {
      id: 1,
      type: "earn",
      title: "Quiz Victory",
      description: 'Completed "Algebra Adventure"',
      amount: 150,
      icon: "🏆",
      color: "from-green-500 to-emerald-600",
      time: "2 hours ago",
      category: "Quest Reward",
    },
    {
      id: 2,
      type: "earn",
      title: "7-Day Streak Bonus",
      description: "Maintained your learning streak",
      amount: 200,
      icon: "🔥",
      color: "from-orange-500 to-red-600",
      time: "5 hours ago",
      category: "Achievement",
    },
    {
      id: 3,
      type: "spend",
      title: "Streak Freeze",
      description: "Purchased from Marketplace",
      amount: -150,
      icon: "🛡️",
      color: "from-cyan-400 to-blue-500",
      time: "1 day ago",
      category: "Power-up",
    },
    {
      id: 4,
      type: "earn",
      title: "Flashcard Master",
      description: 'Mastered 50 cards in "English Vocabulary"',
      amount: 100,
      icon: "⭐",
      color: "from-purple-500 to-violet-600",
      time: "1 day ago",
      category: "Learning Milestone",
    },
    {
      id: 5,
      type: "spend",
      title: "Golden Avatar Frame",
      description: "Purchased from Marketplace",
      amount: -800,
      icon: "✨",
      color: "from-amber-400 to-yellow-500",
      time: "2 days ago",
      category: "Cosmetic",
    },
    {
      id: 6,
      type: "earn",
      title: "Daily Login",
      description: "Daily reward claimed",
      amount: 50,
      icon: "🎁",
      color: "from-pink-500 to-purple-600",
      time: "2 days ago",
      category: "Daily Bonus",
    },
    {
      id: 7,
      type: "earn",
      title: "Perfect Score!",
      description: 'Got 100% on "Grammar Quest"',
      amount: 250,
      icon: "💯",
      color: "from-blue-500 to-cyan-600",
      time: "3 days ago",
      category: "Quest Reward",
    },
    {
      id: 8,
      type: "spend",
      title: "Science Explorer Pack",
      description: "Purchased from Marketplace",
      amount: -450,
      icon: "🔬",
      color: "from-green-500 to-emerald-600",
      time: "3 days ago",
      category: "Quiz Pack",
    },
  ];

  const quickStats = [
    {
      label: "Total Earned",
      value: "12,450",
      icon: TrendingUp,
      color: "text-green-400",
    },
    {
      label: "Total Spent",
      value: "9,603",
      icon: TrendingDown,
      color: "text-orange-400",
    },
    {
      label: "Active Streak",
      value: "7 Days",
      icon: Zap,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="p-8">
      {/* Header with Balance */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">
              <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Wallet
              </span>
            </h1>
            <p className="text-violet-300">
              Track your Xu and treasure history
            </p>
          </div>

          {/* Balance Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-all"></div>
            <div className="relative bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl p-1 shadow-2xl">
              <div className="bg-gradient-to-br from-purple-950 to-violet-950 rounded-[22px] px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-8 h-8 text-purple-900" />
                  </div>
                  <div>
                    <p className="text-amber-300 text-sm font-black uppercase tracking-wider mb-1">
                      Your Balance
                    </p>
                    <p className="text-white text-4xl font-black">
                      {walletStats.totalXu.toLocaleString()}
                    </p>
                    <p className="text-violet-300 text-sm">Xu</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-purple-800/50 flex items-center justify-between">
                  <div>
                    <p className="text-violet-400 text-xs">Rank</p>
                    <p className="text-amber-400 font-black">
                      {walletStats.rank}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-violet-400 text-xs">Earned Today</p>
                    <p className="text-green-400 font-black">
                      +{walletStats.earnedToday}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="relative bg-gradient-to-br from-purple-900/40 to-violet-900/40 backdrop-blur-sm border-2 border-purple-600/30 rounded-3xl p-6 hover:border-purple-500/50 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-800/50 rounded-2xl flex items-center justify-center">
                  <Icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-violet-300 text-sm">{stat.label}</p>
                  <p className="text-white text-2xl font-black">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Treasure Log */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Coins className="w-8 h-8 text-amber-400" />
          <h2 className="text-3xl font-black text-white">Treasure Log</h2>
        </div>

        <div className="space-y-4">
          {treasureLog.map((entry) => (
            <div
              key={entry.id}
              className="group relative bg-gradient-to-br from-purple-900/60 to-violet-900/60 backdrop-blur-sm border-2 border-purple-600/50 rounded-3xl p-6 hover:border-purple-500 hover:scale-[1.02] transition-all"
            >
              <div className="flex items-center gap-6">
                {/* Icon */}
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${entry.color} rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform`}
                >
                  {entry.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-black text-white mb-1">
                        {entry.title}
                      </h3>
                      <p className="text-violet-300 text-sm">
                        {entry.description}
                      </p>
                    </div>
                    <div className={`text-right`}>
                      <p
                        className={`text-3xl font-black ${entry.type === "earn" ? "text-green-400" : "text-orange-400"}`}
                      >
                        {entry.type === "earn" ? "+" : ""}
                        {entry.amount}
                      </p>
                      <p className="text-violet-400 text-xs">Xu</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-purple-800/50 border border-purple-600/50 rounded-full">
                      <span className="text-violet-300 text-xs font-black">
                        {entry.category}
                      </span>
                    </div>
                    <span className="text-violet-400 text-xs">
                      {entry.time}
                    </span>
                  </div>
                </div>

                {/* Indicator icon */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    entry.type === "earn"
                      ? "bg-green-500/20 border-2 border-green-500/50"
                      : "bg-orange-500/20 border-2 border-orange-500/50"
                  }`}
                >
                  {entry.type === "earn" ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-orange-400" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-12 relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-3xl blur-2xl"></div>
        <div className="relative bg-gradient-to-br from-purple-900/60 to-violet-900/60 backdrop-blur-sm border-2 border-purple-600/50 rounded-3xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-300 mb-2">
                Keep learning to earn more Xu!
              </p>
              <p className="text-white text-lg font-black">
                Complete quizzes, maintain streaks, and master new skills.
              </p>
            </div>
            <button className="px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950 rounded-2xl font-black hover:shadow-2xl hover:shadow-amber-400/50 hover:scale-105 transition-all flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Start Learning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Wallet;
