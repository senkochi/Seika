import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentUserProfile } from "../../store/userProfileSlice";

import WelcomeHeader from "../../components/student/dashboard/WelcomeHeader";
import StatCard from "../../components/student/dashboard/StatCard";
import QuickStatItem from "../../components/student/dashboard/QuickStatItem";
import LevelProgressCard from "../../components/student/dashboard/LevelProgressCard";
import RecentTransactionsSection from "../../components/student/dashboard/RecentTransactionsSection";
import DashboardLoading from "../../components/student/dashboard/DashboardLoading";
import DashboardError from "../../components/student/dashboard/DashboardError";
import { useRecentTransactions } from "../../components/student/dashboard/useRecentTransactions";
import {
  topStatsConfig,
  quickStatsConfig,
} from "../../components/student/dashboard/topStats";

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
  const displayName = fullName ?? username ?? authUsername ?? "Learner";

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

  return (
    <div className="p-8">
      <WelcomeHeader displayName={displayName} onRefresh={handleRefresh} />

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {topStatsConfig.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={
              stat.label === "Total XP"
                ? exp.toLocaleString()
                : quizzesCompleted.toString()
            }
            trend={stat.trend}
            trendUp={stat.trendUp}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <LevelProgressCard
          level={level}
          currentXP={currentLevelXP}
          nextXP={nextLevelXP}
        />
        <div className="flex flex-col gap-6 h-full">
          {quickStatsConfig.map((stat) => (
            <QuickStatItem
              key={stat.label}
              label={stat.label}
              value={
                stat.label === "Current Streak"
                  ? currentStreak.toString()
                  : longestStreak.toString()
              }
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </div>
      </div>

      <RecentTransactionsSection transactions={recentTransactions} />
    </div>
  );
}

export default DashboardHome;