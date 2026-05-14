import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Trophy,
  Clock,
  ArrowRight,
} from "lucide-react";

function DashboardHome() {
  // Mock data
  const userData = {
    name: "Alex",
    level: 12,
    currentXP: 3450,
    nextLevelXP: 5000,
    coins: 2847,
    streak: 7,
  };

  const topStats = [
    {
      label: "Total XP",
      value: "12,450",
      trend: "+12%",
      trendUp: true,
      icon: Zap,
      color: "from-amber-400 to-yellow-500",
    },
    {
      label: "Quizzes Completed",
      value: "148",
      trend: "+8%",
      trendUp: true,
      icon: Target,
      color: "from-purple-500 to-violet-600",
    },
  ];

  const activityData = [
    { day: "Mon", value: 5 },
    { day: "Tue", value: 8 },
    { day: "Wed", value: 3 },
    { day: "Thu", value: 10 },
    { day: "Fri", value: 7 },
    { day: "Sat", value: 12 },
    { day: "Sun", value: 6 },
  ];

  const maxValue = Math.max(...activityData.map((d) => d.value));

  const recentActivities = [
    {
      icon: "🏆",
      title: 'Completed "Algebra Adventure"',
      time: "2 hours ago",
      xp: 150,
    },
    {
      icon: "📚",
      title: "Mastered 20 flashcards",
      time: "5 hours ago",
      xp: 100,
    },
    { icon: "⭐", title: "Achieved 7-day streak", time: "1 day ago", xp: 200 },
    {
      icon: "🎯",
      title: "Perfect score on Grammar Quiz",
      time: "1 day ago",
      xp: 250,
    },
  ];

  const quickStats = [
    { label: "Study Hours", value: "23h", icon: Clock, color: "text-blue-400" },
    {
      label: "Win Rate",
      value: "87%",
      icon: TrendingUp,
      color: "text-green-400",
    },
    {
      label: "Achievements",
      value: "34",
      icon: Trophy,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="p-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Welcome back, {userData.name}!
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Here's what's happening with your learning today.
        </p>
      </div>

      {/* Top Stats Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {topStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="relative group bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] rounded-2xl p-6 hover:border-[var(--ring)] transition-all"
            >
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-[var(--foreground)]" />
                  </div>
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                      stat.trendUp
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {stat.trendUp ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-sm font-semibold">{stat.trend}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-[var(--foreground)]">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              Weekly Activity
            </h2>
            <button className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
              View Details
            </button>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between gap-4 h-48">
            {activityData.map((item, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div
                  className="w-full bg-[var(--card)] rounded-t-xl relative overflow-hidden"
                  style={{ height: `${(item.value / maxValue) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-purple-600 rounded-t-xl"></div>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {item.day}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="text-xs text-[var(--muted-foreground)]">
                Quizzes Completed
              </span>
            </div>
          </div>
        </div>

        {/* Progress Circle */}
        <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] rounded-2xl p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-6">
            Level Progress
          </h3>

          {/* Circular Progress */}
          <div className="relative w-40 h-40 mb-6">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#10111a"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#9333ea"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - userData.currentXP / userData.nextLevelXP)}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-bold text-[var(--foreground)]">
                {Math.round((userData.currentXP / userData.nextLevelXP) * 100)}%
              </p>
              <p className="text-[var(--muted-foreground)] text-sm">Complete</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">Current Level</p>
            <p className="text-[var(--muted-foreground)] text-sm mb-1">
              Current Level
            </p>
            <p className="text-2xl font-bold text-[var(--foreground)] mb-4">
              Level {userData.level}
            </p>
            <p className="text-xs text-gray-500">
              {userData.currentXP.toLocaleString()} /{" "}
              {userData.nextLevelXP.toLocaleString()} XP
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              Recent Activity
            </h2>
            <button className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors flex items-center gap-1">
              See All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-[var(--second-card)] backdrop-blur-md rounded-xl hover:bg-[var(--second-muted)] transition-colors"
              >
                <div className="text-2xl">{activity.icon}</div>
                <div className="flex-1">
                  <p className="text-[var(--foreground)] font-semibold text-sm">
                    {activity.title}
                  </p>
                  <p className="text-[var(--muted-foreground)] text-xs">
                    {activity.time}
                  </p>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-[var(--primary)]/10 rounded-full">
                  <Sparkles className="w-3 h-3 text-[var(--primary)]" />
                  <span className="text-[var(--primary)] text-sm font-semibold">
                    +{activity.xp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] rounded-2xl p-6 hover:border-[var(--ring)] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--card)] rounded-xl flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-[var(--muted-foreground)] text-sm">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
