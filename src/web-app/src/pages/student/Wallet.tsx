import { Sparkles, TrendingUp, TrendingDown, Zap, Coins } from "lucide-react";
import StudentActionButton from "@/components/student/StudentActionButton";
import StudentBadge from "@/components/student/StudentBadge";

function Wallet() {
  const walletStats = {
    totalCoin: 2847,
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
            <h1 className="text-4xl font-black text-[var(--foreground)] mb-2">
              <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text">
                Wallet
              </span>
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Track your Coin and treasure history
            </p>
          </div>

          {/* Balance Card */}
          <div className="relative group w-full md:w-[30rem] lg:w-[34rem] md:ml-auto">
            <div className="relative w-full bg-gradient-to-b from-amber-400 to-yellow-500 rounded-3xl p-1 shadow-2xl">
              <div className="rounded-[22px] px-8 py-6">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-white text-sm font-black uppercase tracking-wider mb-1">
                      Your Balance
                    </p>
                    <p className="text-purple-950 text-4xl font-black">
                      {walletStats.totalCoin.toLocaleString()}
                    </p>
                    <p className="text-purple-900/90 text-sm font-semibold">
                      Coin
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/40 flex items-center justify-between">
                  <div>
                    <p className="text-white/85 text-xs font-semibold">Rank</p>
                    <p className="text-purple-950 font-black">
                      {walletStats.rank}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/85 text-xs font-semibold">
                      Earned Today
                    </p>
                    <p className="text-purple-950 font-black">
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
              className="relative bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 shadow-[0_20px_60px_rgba(10,10,20,0.18)] hover:border-[var(--ring)] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[var(--second-card)] rounded-2xl flex items-center justify-center border border-[var(--border)]">
                  <Icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)] text-sm">
                    {stat.label}
                  </p>
                  <p className="text-[var(--foreground)] text-2xl font-black">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Treasure Log */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Coins className="w-8 h-8 text-[var(--primary)]" />
          <h2 className="text-3xl font-black text-[var(--foreground)]">
            Treasure Log
          </h2>
        </div>

        <div className="max-h-[28rem] lg:max-h-[34rem] overflow-y-auto pr-2 space-y-4">
          {treasureLog.map((entry) => (
            <div
              key={entry.id}
              className="group relative bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 shadow-[0_20px_60px_rgba(10,10,20,0.18)] hover:border-[var(--ring)] transition-all"
            >
              <div className="flex items-center gap-6">
                {/* Icon */}
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${entry.color} rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-transform`}
                >
                  {entry.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-black text-[var(--foreground)] mb-1">
                        {entry.title}
                      </h3>
                      <p className="text-[var(--muted-foreground)] text-sm">
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
                      <p className="text-[var(--muted-foreground)] text-xs">
                        Coin
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <StudentBadge variant="glass" uppercase={false}>
                      {entry.category}
                    </StudentBadge>
                    <span className="text-[var(--muted-foreground)] text-xs">
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
        <div className="relative bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-8 shadow-[0_20px_60px_rgba(10,10,20,0.18)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--muted-foreground)] mb-2">
                Keep learning to earn more Xu!
              </p>
              <p className="text-[var(--foreground)] text-lg font-black">
                Complete quizzes, maintain streaks, and master new skills.
              </p>
            </div>
            <StudentActionButton
              size="lg"
              icon={Zap}
              fullWidth={false}
              className="px-8"
            >
              Start Learning
            </StudentActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Wallet;
