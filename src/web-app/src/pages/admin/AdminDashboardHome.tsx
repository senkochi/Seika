import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Users,
  Package,
  Wallet as WalletIcon,
  Loader2,
  RefreshCcw,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchAdminDashboard } from "../../store/adminSlice";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

function formatCurrency(value: number | undefined | null) {
  return currencyFormatter.format(value ?? 0);
}

function formatNumber(value: number | undefined | null) {
  return numberFormatter.format(value ?? 0);
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  accent: string;
}) {
  return (
    <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 shadow-[0_20px_60px_rgba(10,10,20,0.28)] hover:border-[var(--primary)] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[var(--muted-foreground)] text-sm font-medium">
            {label}
          </p>
          <p className="mt-3 text-2xl font-bold text-[var(--foreground)] truncate">
            {value}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${accent}`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-[var(--muted-foreground)]">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
        <p>{message}</p>
      </div>
    </div>
  );
}

function AdminDashboardHome() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { dashboard, dashboardStatus, dashboardError } = useAppSelector(
    (state) => state.admin,
  );

  useEffect(() => {
    void dispatch(fetchAdminDashboard());
  }, [dispatch]);

  if (dashboardStatus === "loading" && !dashboard) {
    return <LoadingState message="Đang tải dashboard admin..." />;
  }

  if (dashboardStatus === "failed" && !dashboard) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-4xl">⚠️</div>
          <p className="text-[var(--foreground)] font-bold">
            Không thể tải dashboard
          </p>
          <p className="text-[var(--muted-foreground)] text-sm">
            {dashboardError}
          </p>
          <button
            onClick={() => dispatch(fetchAdminDashboard())}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            <RefreshCcw className="h-4 w-4" /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  const d = dashboard;
  const circulation = d?.totalCoinCirculation
    ? Number.parseFloat(d.totalCoinCirculation)
    : 0;
  const circulationDisplay = Number.isFinite(circulation)
    ? `${formatNumber(circulation)} Coins`
    : "N/A";

  const pendingDisplay =
    d?.pendingProducts === -1 ? "N/A" : formatNumber(d?.pendingProducts ?? 0);

  const chartData = [
    { name: "Teacher", value: d?.totalTeachers ?? 0 },
    { name: "Student", value: d?.totalStudents ?? 0 },
    { name: "Locked", value: d?.totalDisabledUsers ?? 0 },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-[var(--foreground)]">
            <BarChart3 className="h-7 w-7 text-[var(--primary)]" />
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Tổng quan hệ thống: người dùng, nội dung chờ duyệt và coin lưu hành.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/dashboard/revenue")}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-[var(--primary-foreground)] hover:opacity-90 shadow-md transition-all"
          >
            <TrendingUp className="h-4 w-4" /> Quản lý Thu nhập
          </button>
          <button
            onClick={() => dispatch(fetchAdminDashboard())}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)]"
          >
            <RefreshCcw className="h-4 w-4" /> Làm mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng giáo viên"
          value={formatNumber(d?.totalTeachers ?? 0)}
          icon={Users}
          accent="from-amber-400 to-yellow-500"
        />
        <StatCard
          label="Tổng học sinh"
          value={formatNumber(d?.totalStudents ?? 0)}
          icon={Users}
          accent="from-blue-500 to-cyan-600"
        />
        <StatCard
          label="Sản phẩm chờ duyệt"
          value={pendingDisplay}
          icon={Package}
          accent="from-rose-500 to-pink-600"
        />
        <StatCard
          label="Coin lưu hành"
          value={circulationDisplay}
          icon={WalletIcon}
          accent="from-emerald-500 to-teal-600"
        />
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(10,10,20,0.28)]">
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
          Người dùng theo vai trò
        </h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                cursor={false}
                shared={false}
                isAnimationActive={false}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                }}
                labelStyle={{
                  color: "var(--muted-foreground)",
                  fontWeight: "bold",
                }}
              />
              <Bar
                dataKey="value"
                fill="var(--primary)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardHome;
