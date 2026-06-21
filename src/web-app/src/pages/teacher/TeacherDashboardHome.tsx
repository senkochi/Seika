import { useEffect } from "react";
import {
  TrendingUp,
  BookOpen,
  DollarSign,
  Users,
  ArrowRight,
  PlusCircle,
  Zap,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentUserProfile } from "../../store/userProfileSlice";

function TeacherDashboardHome() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { status, error, fullName, username } = useAppSelector(
    (state) => state.userProfile,
  );
  const authUsername = useAppSelector((state) => state.auth.username);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCurrentUserProfile());
    }
  }, [dispatch, status]);

  const displayName = fullName ?? username ?? authUsername ?? "Teacher";

  const stats = [
    {
      label: "Total Revenue",
      value: "5,450 Coins",
      trend: "+18%",
      trendUp: true,
      icon: DollarSign,
      color: "from-amber-400 to-yellow-500",
    },
    {
      label: "Total Students Purchased",
      value: "148 Students",
      trend: "+12%",
      trendUp: true,
      icon: Users,
      color: "from-purple-500 to-violet-600",
    },
    {
      label: "Content Published",
      value: "12 Items",
      trend: "+2 new",
      trendUp: true,
      icon: BookOpen,
      color: "from-blue-500 to-cyan-600",
    },
  ];

  const weeklyRevenue = [
    { day: "Mon", value: 350 },
    { day: "Tue", value: 600 },
    { day: "Wed", value: 450 },
    { day: "Thu", value: 900 },
    { day: "Fri", value: 1200 },
    { day: "Sat", value: 800 },
    { day: "Sun", value: 1150 },
  ];

  const maxVal = Math.max(...weeklyRevenue.map((d) => d.value));

  const recentEvents = [
    {
      icon: "🛒",
      title: 'Student "lucas_dev" bought "Basic React Native"',
      time: "2 hours ago",
      reward: "+150 Coins",
      type: "purchase",
    },
    {
      icon: "🛒",
      title: 'Student "jane_doe" bought "English IELTS Vocabulary"',
      time: "5 hours ago",
      reward: "+250 Coins",
      type: "purchase",
    },
    {
      icon: "💸",
      title: "Requested cash out of 2,000 Coins",
      time: "1 day ago",
      reward: "-2,000 Coins",
      type: "withdraw",
    },
    {
      icon: "📚",
      title: 'Created new Flashcard set "Database Normalization"',
      time: "2 days ago",
      reward: "Published",
      type: "publish",
    },
  ];

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
                  <Icon className="w-6 h-6 text-purple-950" />
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              Weekly Marketplace Earnings
            </h2>
            <span className="text-xs text-[var(--muted-foreground)]">
              Updated just now
            </span>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between gap-4 h-48">
            {weeklyRevenue.map((item, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div
                  className="w-full bg-purple-900/30 rounded-t-xl relative overflow-hidden"
                  style={{ height: `${(item.value / maxVal) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-xl"></div>
                </div>
                <span className="text-xs text-[var(--muted-foreground)] font-medium">
                  {item.day}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full"></div>
              <span className="text-xs text-[var(--muted-foreground)]">
                Coins earned via flashcard purchases
              </span>
            </div>
          </div>
        </div>

        {/* Quick Tips or Profile Summary */}
        <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] hover:border-[var(--primary)] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">
              Creator Guidelines
            </h3>
            <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Publish high-quality decks to gain Verified Creator status.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Keep your deck prices reasonable (50 to 500 Coins) for maximum
                  sales.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Ensure to verify all card answers before listing on the
                  Marketplace.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-purple-950/40 rounded-xl border border-purple-800/40">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-xs text-purple-300 font-bold">
                  Verified Account
                </p>
                <p className="text-[var(--foreground)] text-xs">
                  All your earnings are eligible for Cash Out.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Recent activities */}
      <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] hover:border-[var(--primary)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            Recent Sales & Activities
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
          {recentEvents.map((event, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-[var(--second-card)] backdrop-blur-md rounded-xl hover:bg-[var(--second-muted)] transition-colors"
            >
              <div className="text-2xl w-10 h-10 bg-[var(--card)] border border-[var(--border)] rounded-lg flex items-center justify-center">
                {event.icon}
              </div>
              <div className="flex-1">
                <p className="text-[var(--foreground)] font-semibold text-sm">
                  {event.title}
                </p>
                <p className="text-[var(--muted-foreground)] text-xs">
                  {event.time}
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  event.type === "purchase"
                    ? "bg-green-500/10 text-green-400"
                    : event.type === "withdraw"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-blue-500/10 text-blue-400"
                }`}
              >
                {event.reward}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboardHome;
