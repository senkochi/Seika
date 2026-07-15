import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentUserProfile } from "../../store/userProfileSlice";

import WelcomeHeader from "../../components/student/dashboard/WelcomeHeader";
import LevelProgressCard from "../../components/student/dashboard/LevelProgressCard";
import RecentTransactionsSection from "../../components/student/dashboard/RecentTransactionsSection";
import DashboardLoading from "../../components/student/dashboard/DashboardLoading";
import DashboardError from "../../components/student/dashboard/DashboardError";
import { useRecentTransactions } from "../../components/student/dashboard/useRecentTransactions";
import {
  topStatsConfig,
  quickStatsConfig,
} from "../../components/student/dashboard/topStats";
import { StatCard } from "../../components/ui/StatCard";

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

  const authUsername = useAppSelector((state) => state.auth.username);
  const { transactions: recentTransactions, refresh: refreshTransactions } =
    useRecentTransactions(status === "succeeded");

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCurrentUserProfile());
    }
  }, [dispatch, status]);

  const handleRefresh = async () => {
    await dispatch(fetchCurrentUserProfile());
    await refreshTransactions();
  };

  const currentLevelXP = exp % XP_PER_LEVEL;
  const nextLevelXP = XP_PER_LEVEL;
  const displayName = fullName ?? username ?? authUsername ?? "bạn";

  if (status === "loading") {
    return <DashboardLoading />;
  }

  if (status === "failed") {
    return (
      <DashboardError
        error={error}
        onRetry={() => dispatch(fetchCurrentUserProfile())}
      />
    );
  }

  const topStatValues: Record<string, string | number> = {
    "Total XP": exp.toLocaleString("vi-VN"),
    "Quizzes Completed": quizzesCompleted,
  };

  return (
    <div className="space-y-8 p-6 lg:p-8 font-sans-ui">
      <WelcomeHeader displayName={displayName} onRefresh={handleRefresh} />

      <div className="grid gap-4 md:grid-cols-2">
        {topStatsConfig.map((stat) => {
          const Icon = stat.icon;
          return (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={topStatValues[stat.label] ?? "—"}
              icon={<Icon className="h-4 w-4" aria-hidden="true" />}
              iconVariant={stat.iconVariant}
              delta={{ value: stat.trend, trend: stat.trendUp ? "up" : "down" }}
            />
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <LevelProgressCard
          level={level}
          currentXP={currentLevelXP}
          nextXP={nextLevelXP}
        />
        <div className="grid gap-4 content-start">
          {quickStatsConfig.map((stat) => {
            const Icon = stat.icon;
            const value =
              stat.label === "Current Streak"
                ? currentStreak
                : longestStreak;
            return (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={value}
                unit="ngày"
                icon={<Icon className="h-4 w-4" aria-hidden="true" />}
                iconVariant={stat.iconVariant}
              />
            );
          })}
        </div>
      </div>

      <RecentTransactionsSection transactions={recentTransactions} />
    </div>
  );
}

export default DashboardHome;