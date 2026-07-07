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

const XP_PER_LEVEL = 1000;

function TeacherDashboardHome() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { status, error, fullName, username, exp, level } = useAppSelector(
    (state) => state.userProfile,
  );
  const { revenue } = useAppSelector((state) => state.statistics);
  const authUsername = useAppSelector((state) => state.auth.username);

  const [teacherProfile, setTeacherProfile] =
    useState<TeacherProfileResponse | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [recentEvents, setRecentEvents] = useState<TransactionResponse[]>([]);
  const [period, setPeriod] = useState<"month" | "day">("month");

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCurrentUserProfile());
    }
  }, [dispatch, status]);

  const fetchDashboardData = async () => {
    try {
      const profile = await userProfilesService.getTeacherProfile();
      setTeacherProfile(profile);

      const balRes = await walletService.getBalance();
      setBalance(balRes.balance);

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
      label: "Total Balance",
      value: `${balance.toLocaleString()} Coins`,
      trend: "Current",
      icon: DollarSign,
      color: "from-amber-400 to-yellow-500",
    },
    {
      label: "Total Students Reached",
      value: `${teacherProfile?.totalStudentsReached ?? 0} Students`,
      trend: "Overall",
      icon: Users,
      color: "from-purple-500 to-violet-600",
    },
    {
      label: "Content Published",
      value: `${contentPublished} Items`,
      trend: "Overall",
      icon: BookOpen,
      color: "from-blue-500 to-cyan-600",
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
    <div className="p-8">
      <DashboardWelcomeHeader
        displayName={displayName}
        onRefresh={handleRefresh}
        onCreateMaterial={() => navigate("/teacher/dashboard/content")}
      />

      <TopStatsGrid stats={stats} />

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
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