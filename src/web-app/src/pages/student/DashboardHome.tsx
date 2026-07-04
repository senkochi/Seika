import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  ArrowRight,
  Sword,
  Swords,
  Loader2,
  Clock,
  RefreshCcw,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentUserProfile } from "../../store/userProfileSlice";
import { walletService } from "../../api";
import type { TransactionResponse } from "../../api";

// Hằng số XP cần để lên level (có thể mở rộng thành công thức sau)
const XP_PER_LEVEL = 1000;

function DashboardHome() {
  const dispatch = useAppDispatch();
  const {
    status,
    error,
    fullName,
    username,
    level,
    exp,
    currentStreak,
    longestStreak,
    quizzesCompleted,
  } = useAppSelector((state) => state.userProfile);

  const [recentTransactions, setRecentTransactions] = useState<
    TransactionResponse[]
  >([]);

  // Lấy username từ auth state để dùng khi profile chưa load xong
  const authUsername = useAppSelector((state) => state.auth.username);

  useEffect(() => {
    // Chỉ fetch khi chưa có data
    if (status === "idle") {
      dispatch(fetchCurrentUserProfile());
    }
  }, [dispatch, status]);

  const fetchRecentTransactions = async () => {
    try {
      const history = await walletService.getHistory();
      const spendings = history
        .filter((tx) => tx.type === "WITHDRAW" || tx.type === "SPEND")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5);
      setRecentTransactions(spendings);
    } catch (err) {
      console.error("Failed to fetch wallet history", err);
    }
  };

  const handleRefresh = async () => {
    await dispatch(fetchCurrentUserProfile());
    await fetchRecentTransactions();
  };

  useEffect(() => {
    // Chỉ fetch wallet history khi profile đã được load thành công
    if (status === "succeeded") {
      fetchRecentTransactions();
    }
  }, [status]);

  // Tính toán XP progress trong level hiện tại
  const currentLevelXP = exp % XP_PER_LEVEL;
  const nextLevelXP = XP_PER_LEVEL;

  const displayName = fullName ?? username ?? authUsername ?? "Learner";

  const topStats = [
    {
      label: "Total XP",
      value: exp.toLocaleString(),
      trend: "+12%",
      trendUp: true,
      icon: Zap,
      color: "from-amber-400 to-yellow-500",
    },
    {
      label: "Quizzes Completed",
      value: quizzesCompleted.toString(),
      trend: "+1",
      trendUp: true,
      icon: Target,
      color: "from-purple-500 to-violet-600",
    },
  ];

  const quickStats = [
    {
      label: "Current Streak",
      value: currentStreak.toString(),
      icon: Sword,
      color: "text-blue-400",
    },
    {
      label: "Longest Streak",
      value: longestStreak.toString(),
      icon: Swords,
      color: "text-green-400",
    },
  ];

  if (status === "loading") {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-[var(--muted-foreground)]">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-4xl">⚠️</div>
          <p className="text-[var(--foreground)] font-bold">
            Failed to load profile
          </p>
          <p className="text-[var(--muted-foreground)] text-sm">{error}</p>
          <button
            onClick={() => dispatch(fetchCurrentUserProfile())}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Welcome Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            Welcome back, {displayName}!
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Here's what's happening with your learning today.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] transition-all"
        >
          <RefreshCcw className="h-4 w-4" /> Làm mới
        </button>
      </div>

      {/* Top Stats Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {topStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="relative group bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] rounded-2xl p-6 hover:border-[var(--primary)] transition-all"
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
                <p className="text-[var(--muted-foreground)] text-sm mb-1">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-[var(--foreground)]">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress & Quick Stats Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Level Progress */}
        <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] hover:border-[var(--primary)] rounded-2xl p-6 flex flex-col items-center justify-center">
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
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - currentLevelXP / nextLevelXP)}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-bold text-[var(--foreground)]">
                {Math.round((currentLevelXP / nextLevelXP) * 100)}%
              </p>
              <p className="text-[var(--muted-foreground)] text-sm">Complete</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[var(--muted-foreground)] text-sm mb-1">
              Current Level
            </p>
            <p className="text-2xl font-bold text-[var(--foreground)] mb-4">
              Level {level}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {currentLevelXP.toLocaleString()} / {nextLevelXP.toLocaleString()}{" "}
              XP
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-col gap-6 h-full">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="flex-1 bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] rounded-2xl p-6 flex items-center hover:border-[var(--primary)] transition-all"
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

      {/* Recent Transactions */}
      <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] hover:border-[var(--primary)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            Recent Transactions
          </h2>
          <button className="text-sm text-[var(--muted-foreground)] hover:text-[var(--light-primary)] transition-colors flex items-center gap-1">
            See All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <p className="text-[var(--muted-foreground)] text-sm">
              No recent transactions.
            </p>
          ) : (
            recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 p-4 bg-[var(--second-card)] backdrop-blur-md rounded-xl hover:bg-[var(--second-muted)] transition-colors"
              >
                <div className="text-2xl">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[var(--foreground)] font-semibold text-sm">
                    {tx.description}
                  </p>
                  <p className="text-[var(--muted-foreground)] text-xs">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-red-500/10 rounded-full">
                  <span className="text-red-400 text-sm font-semibold">
                    -{tx.amount} Coins
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
