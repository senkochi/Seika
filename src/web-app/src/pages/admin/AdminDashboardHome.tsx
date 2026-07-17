import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Users,
  Package,
  Wallet as WalletIcon,
  Loader2,
  RefreshCcw,
  TrendingUp,
  ShieldAlert,
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
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";
import { StatCard } from "../../components/ui/StatCard";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { useFormatNumber } from "../../utils/format";

function LoadingState() {
  return (
    <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-white/55 font-sans-ui">
        <Loader2
          className="w-8 h-8 animate-spin text-[#d4a843]"
          aria-hidden="true"
        />
        <p>{t("dashboard.loading")}</p>
      </div>
    </div>
  );
}

function AdminDashboardHome() {
  const { t } = useTranslation("admin");
  const formatNum = useFormatNumber();
  const formatNumber = (value: number | undefined | null) =>
    formatNum(value ?? 0);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { dashboard, dashboardStatus, dashboardError } = useAppSelector(
    (state) => state.admin,
  );

  useEffect(() => {
    void dispatch(fetchAdminDashboard());
  }, [dispatch]);

  if (dashboardStatus === "loading" && !dashboard) {
    return <LoadingState />;
  }

  if (dashboardStatus === "failed" && !dashboard) {
    return (
      <div className="p-6 lg:p-8">
        <EmptyState
          icon={<ShieldAlert className="w-5 h-5" aria-hidden="true" />}
          title={t("dashboard.error.title")}
          description={dashboardError ?? t("dashboard.error.description")}
          action={
            <Button
              variant="ghost"
              size="md"
              onClick={() => dispatch(fetchAdminDashboard())}
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Thử lại
            </Button>
          }
        />
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
    { name: t("dashboard.chart.teacher"), value: d?.totalTeachers ?? 0 },
    { name: t("dashboard.chart.student"), value: d?.totalStudents ?? 0 },
    { name: t("dashboard.chart.locked"), value: d?.totalDisabledUsers ?? 0 },
  ];

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate("/admin/dashboard/revenue")}
            >
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              {t("dashboard.manageRevenue")}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => dispatch(fetchAdminDashboard())}
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              {t("dashboard.error.retry")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("dashboard.stats.totalTeachers")}
          value={formatNumber(d?.totalTeachers ?? 0)}
          icon={<Users className="w-4 h-4" aria-hidden="true" />}
          iconVariant="gold"
        />
        <StatCard
          label={t("dashboard.stats.totalStudents")}
          value={formatNumber(d?.totalStudents ?? 0)}
          icon={<Users className="w-4 h-4" aria-hidden="true" />}
          iconVariant="info"
        />
        <StatCard
          label={t("dashboard.stats.pendingProducts")}
          value={pendingDisplay}
          icon={<Package className="w-4 h-4" aria-hidden="true" />}
          iconVariant="danger"
        />
        <StatCard
          label={t("dashboard.stats.circulation")}
          value={circulationDisplay}
          icon={<WalletIcon className="w-4 h-4" aria-hidden="true" />}
          iconVariant="success"
        />
      </div>

      <SectionCard>
        <h2 className="font-sans-ui text-base font-semibold text-cream mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#d4a843]" aria-hidden="true" />
          {t("dashboard.section.title")}
        </h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.45)"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.45)"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  background: "#1c0f2e",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#faf6ee",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "rgba(255,255,255,0.55)" }}
                itemStyle={{ color: "#d4a843" }}
              />
              <Bar dataKey="value" fill="#d4a843" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}

export default AdminDashboardHome;
