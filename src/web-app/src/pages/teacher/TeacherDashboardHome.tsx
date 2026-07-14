import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, DollarSign, Users } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentUserProfile } from "../../store/userProfileSlice";
import { fetchRevenue } from "../../store/statisticsSlice";
import { walletService, userProfilesService } from "../../api";
import type { TransactionResponse, TeacherProfileResponse } from "../../api";
import type { RevenuePoint } from "../../api/types";

import DashboardWelcomeHeader from "../../components/teacher/dashboard/DashboardWelcomeHeader";
import TopStatsGrid from "../../components/teacher/dashboard/TopStatsGrid";
import type { TeacherTopStat } from "../../components/teacher/dashboard/TopStatsGrid";
import RevenueChartCard from "../../components/teacher/dashboard/RevenueChartCard";
import LevelProgressCard from "../../components/teacher/dashboard/LevelProgressCard";
import RecentIncomesList from "../../components/teacher/dashboard/RecentIncomesList";
import DashboardLoadingState from "../../components/teacher/dashboard/DashboardLoadingState";
import DashboardFailedState from "../../components/teacher/dashboard/DashboardFailedState";
import TeacherTierBadge from "../../components/teacher/TeacherTierBadge";
import { useTeacherRating } from "../../components/teacher/useTeacherRating";

const XP_PER_LEVEL = 1000;

function TeacherDashboardHome() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { status, error, fullName, username, exp, level, userId } =
    useAppSelector((state) => state.userProfile);
  const { revenue } = useAppSelector((state) => state.statistics);
  const authUsername = useAppSelector((state) => state.auth.username);

  const [teacherProfile, setTeacherProfile] =
    useState<TeacherProfileResponse | null>(null);
  const [withdrawableBalance, setWithdrawableBalance] = useState<number>(0);
  const [recentEvents, setRecentEvents] = useState<TransactionResponse[]>([]);
  const [period, setPeriod] = useState<"month" | "day">("month");
  const { rating: teacherRating } = useTeacherRating(userId);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCurrentUserProfile());
    }
  }, [dispatch, status]);

  const fetchDashboardData = async () => {
    try {
      const profile = await userProfilesService.getTeacherProfile();
      setTeacherProfile(profile);

      const breakdown = await walletService.getBalanceBreakdown();
      setWithdrawableBalance(breakdown.earnedWithdrawableBalance);

      const history = await walletService.getHistory();
      const incomeEvents = history
        .filter((tx) => tx.type === "REWARD" || tx.type === "DEPOSIT")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      setRecentEvents(incomeEvents.slice(0, 5));
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    }
  };

  const handleRefresh = async () => {
    dispatch(fetchCurrentUserProfile());
    dispatch(fetchRevenue(period));
    await fetchDashboardData();
  };

  useEffect(() => {
    if (status === "succeeded") {
      fetchDashboardData();
    }
  }, [status]);

  useEffect(() => {
    void dispatch(fetchRevenue(period));
  }, [dispatch, period]);

  const chartData: RevenuePoint[] = revenue ?? [];
  const displayName = fullName ?? username ?? authUsername ?? "Teacher";
  const contentPublished =
    (teacherProfile?.totalQuizCreated ?? 0) +
    (teacherProfile?.totalFlashcardsCreated ?? 0);

  const stats: TeacherTopStat[] = [
    {
      label: "Có thể rút",
      value: `${withdrawableBalance.toLocaleString("vi-VN")} Coins`,
      trend: "Hiện tại",
      icon: DollarSign,
      variant: "gold",
    },
    {
      label: "Tổng học viên đã tiếp cận",
      value: `${teacherProfile?.totalStudentsReached ?? 0}`,
      trend: "Tổng thể",
      icon: Users,
      variant: "info",
    },
    {
      label: "Nội dung đã xuất bản",
      value: `${contentPublished} mục`,
      trend: "Tổng thể",
      icon: BookOpen,
      variant: "success",
    },
  ];

  if (status === "loading") {
    return <DashboardLoadingState />;
  }

  if (status === "failed") {
    return (
      <DashboardFailedState
        error={error}
        onRetry={() => dispatch(fetchCurrentUserProfile())}
      />
    );
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <DashboardWelcomeHeader
        displayName={displayName}
        onRefresh={handleRefresh}
        onCreateMaterial={() => navigate("/teacher/dashboard/content")}
      />

      <div className="max-w-md">
        <TeacherTierBadge rating={teacherRating} />
      </div>

      <TopStatsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RevenueChartCard
          chartData={chartData}
          period={period}
          onPeriodChange={setPeriod}
        />
        <LevelProgressCard
          level={level}
          currentXP={exp % XP_PER_LEVEL}
          nextXP={XP_PER_LEVEL}
        />
      </div>

      <RecentIncomesList
        events={recentEvents}
        onGoToWallet={() => navigate("/teacher/dashboard/wallet")}
      />
    </div>
  );
}

export default TeacherDashboardHome;
