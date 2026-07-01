import { useEffect, useState } from "react";
import {
  TrendingUp,
  BookOpen,
  DollarSign,
  Users,
  ArrowRight,
  PlusCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentUserProfile } from "../../store/userProfileSlice";
import { fetchRevenue } from "../../store/statisticsSlice";
import { walletService, userProfilesService } from "../../api";
import type { TransactionResponse, TeacherProfileResponse } from "../../api";
import type { RevenuePoint } from "../../api/types";

const XP_PER_LEVEL = 1000;

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number | undefined | null) =>
  currencyFormatter.format(value ?? 0);

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

  useEffect(() => {
    if (status === "succeeded") {
      const fetchDashboardData = async () => {
        try {
          const profile = await userProfilesService.getTeacherProfile();
          setTeacherProfile(profile);

          const balRes = await walletService.getBalance();
          setBalance(balRes.balance);

          const history = await walletService.getHistory();

          // Hoạt động gần nhất (thưởng hoặc nạp)
          const incomeEvents = history
            .filter((tx) => tx.type === "REWARD" || tx.type === "DEPOSIT")
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );

          setRecentEvents(incomeEvents.slice(0, 5));
        } catch (err) {
          console.error("Failed to fetch dashboard data", err);
        }
      };
      fetchDashboardData();
    }
  }, [status]);

  useEffect(() => {
    void dispatch(fetchRevenue(period));
  }, [dispatch, period]);

  const chartData: RevenuePoint[] = revenue ?? [];

  const displayName = fullName ?? username ?? authUsername ?? "Teacher";

  const totalQuizCreated = teacherProfile?.totalQuizCreated ?? 0;
  const totalFlashcardsCreated = teacherProfile?.totalFlashcardsCreated ?? 0;
  const contentPublished = totalQuizCreated + totalFlashcardsCreated;

  const stats = [
    {
      label: "Total Balance",
      value: `${balance.toLocaleString()} Coins`,
      trend: "Current",
      trendUp: true,
      icon: DollarSign,
      color: "from-amber-400 to-yellow-500",
    },
    {
      label: "Total Students Reached",
      value: `${teacherProfile?.totalStudentsReached ?? 0} Students`,
      trend: "Overall",
      trendUp: true,
      icon: Users,
      color: "from-purple-500 to-violet-600",
    },
    {
      label: "Content Published",
      value: `${contentPublished} Items`,
      trend: "Overall",
      trendUp: true,
      icon: BookOpen,
      color: "from-blue-500 to-cyan-600",
    },
  ];

  const currentLevelXP = exp % XP_PER_LEVEL;
  const nextLevelXP = XP_PER_LEVEL;

  if (status === "loading") {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-[var(--muted-foreground)]">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
          <p>Loading teacher dashboard...</p>
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
            Here is your teaching dashboard overview and Marketplace earnings
            today.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/teacher/dashboard/content")}
            className="flex items-center gap-2 px-5 py-3 bg-[var(--primary)] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            Create Material
          </button>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] rounded-2xl p-6 hover:border-[var(--primary)] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6 text-[var(--foreground)]" />
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs font-semibold">{stat.trend}</span>
                </div>
              </div>
              <p className="text-[var(--muted-foreground)] text-sm mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-black text-[var(--foreground)]">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] hover:border-[var(--primary)] rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              Doanh thu ({period === "month" ? "theo tháng" : "theo ngày"})
            </h2>
            <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--background)] p-1 text-xs font-medium">
              {(["month", "day"] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setPeriod(value)}
                  className={`rounded-lg px-3 py-1 transition-colors ${
                    period === value
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {value === "month" ? "Theo tháng" : "Theo ngày"}
                </button>
              ))}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="flex h-[280px] w-full items-center justify-center text-sm text-[var(--muted-foreground)]">
              Chưa có dữ liệu doanh thu trong khoảng thời gian này.
            </div>
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickFormatter={(value) =>
                      value >= 1000
                        ? `${Math.round(value / 1000)}k`
                        : `${value}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                      borderRadius: "0.75rem",
                    }}
                    labelStyle={{ color: "var(--muted-foreground)" }}
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "Doanh thu",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalRevenue"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ stroke: "var(--primary)", fill: "var(--primary)" }}
                    activeDot={{ r: 6, fill: "var(--primary)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Level Progress Box */}
        <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] hover:border-[var(--primary)] rounded-2xl p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-6">
            Level Progress
          </h3>

          <div className="relative w-40 h-40 mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#10111a"
                strokeWidth="12"
                fill="none"
              />
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
      </div>

      {/* Bottom Row - Recent activities */}
      <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] hover:border-[var(--primary)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            Recent Incomes
          </h2>
          <button
            onClick={() => navigate("/teacher/dashboard/wallet")}
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--light-primary)] transition-colors flex items-center gap-1"
          >
            Go to Wallet
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {recentEvents.length === 0 ? (
            <p className="text-[var(--muted-foreground)] text-sm">
              No recent incomes.
            </p>
          ) : (
            recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-4 p-4 bg-[var(--second-card)] backdrop-blur-md rounded-xl hover:bg-[var(--second-muted)] transition-colors"
              >
                <div className="text-2xl w-10 h-10 bg-[var(--card)] border border-[var(--border)] rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[var(--foreground)] font-semibold text-sm">
                    {event.description}
                  </p>
                  <p className="text-[var(--muted-foreground)] text-xs">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400">
                  +{event.amount} Coins
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboardHome;
