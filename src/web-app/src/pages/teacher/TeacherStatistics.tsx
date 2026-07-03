import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Users,
  ShoppingCart,
  DollarSign,
  Layers,
  Loader2,
  RefreshCcw,
  X,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchQuizAttempts,
  fetchRevenue,
  fetchStatisticsOverview,
  fetchStudents,
  fetchTopProducts,
} from "../../store/statisticsSlice";
import { showError } from "../../components/toast/toastUtils";
import type {
  QuizAttempt,
  RevenuePoint,
  StudentPurchase,
  TopProduct,
} from "../../api/types";

const numberFormatter = new Intl.NumberFormat("vi-VN");

const formatCurrency = (value: number | undefined | null) =>
  `${numberFormatter.format(value ?? 0)} Coins`;

const formatNumber = (value: number | undefined | null) =>
  numberFormatter.format(value ?? 0);

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
    <div
      className={`bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 shadow-[0_20px_60px_rgba(10,10,20,0.28)] hover:border-[var(--primary)] transition-colors`}
    >
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

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-4xl">⚠️</div>
        <p className="text-[var(--foreground)] font-bold">
          Không thể tải thống kê
        </p>
        <p className="text-[var(--muted-foreground)] text-sm max-w-md">
          {message}
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          <RefreshCcw className="h-4 w-4" /> Thử lại
        </button>
      </div>
    </div>
  );
}

interface AttemptsModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  attempts: QuizAttempt[] | undefined;
  isLoading: boolean;
}

function AttemptsModal({
  open,
  onClose,
  productName,
  attempts,
  isLoading,
}: AttemptsModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Lịch sử làm bài
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {productName}
            </p>
          </div>
          <button
            aria-label="Đóng"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--background)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {isLoading ? (
            <LoadingState message="Đang tải lịch sử làm bài..." />
          ) : !attempts || attempts.length === 0 ? (
            <p className="py-12 text-center text-[var(--muted-foreground)]">
              Chưa có lượt làm bài nào.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted-foreground)]">
                  <th className="pb-3 font-medium">Học sinh</th>
                  <th className="pb-3 font-medium">Điểm</th>
                  <th className="pb-3 font-medium">Trạng thái</th>
                  <th className="pb-3 font-medium">Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td className="py-3 font-mono text-xs text-[var(--foreground)]">
                      {attempt.userId.length > 14
                        ? `${attempt.userId.slice(0, 8)}…${attempt.userId.slice(-4)}`
                        : attempt.userId}
                    </td>
                    <td className="py-3 text-[var(--foreground)]">
                      {attempt.score.toFixed(1)}%
                    </td>
                    <td className="py-3">
                      {attempt.passed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Đạt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-400">
                          <XCircle className="h-3.5 w-3.5" /> Chưa đạt
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-[var(--muted-foreground)]">
                      {format(new Date(attempt.attemptAt), "dd/MM/yyyy HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function TeacherStatistics() {
  const dispatch = useAppDispatch();
  const {
    overviewStatus,
    overviewError,
    quizOverview,
    flashcardOverview,
    revenue,
    topProducts,
    topProductsStatus,
    students,
    studentsStatus,
    attemptsByQuizSet,
    attemptsStatus,
  } = useAppSelector((state) => state.statistics);

  const [period, setPeriod] = useState<"month" | "day">("month");
  const [modalQuizSetId, setModalQuizSetId] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(fetchStatisticsOverview());
    void dispatch(fetchTopProducts(undefined));
    void dispatch(fetchStudents(50));
  }, [dispatch]);

  useEffect(() => {
    void dispatch(fetchRevenue(period));
  }, [dispatch, period]);

  const totals = useMemo(() => {
    const revenueTotal = revenue.reduce(
      (acc, p) => acc + (p.totalRevenue || 0),
      0,
    );
    const ordersTotal = revenue.reduce(
      (acc, p) => acc + (p.orderCount || 0),
      0,
    );
    return { revenueTotal, ordersTotal };
  }, [revenue]);

  const flashcardRevenue = flashcardOverview?.totalRevenue ?? 0;
  const quizRevenue = quizOverview?.totalRevenue ?? 0;
  const totalRevenue =
    revenue.length > 0 ? totals.revenueTotal : flashcardRevenue + quizRevenue;

  const totalOrders = revenue.length > 0 ? totals.ordersTotal : 0;
  const totalFlashcardSales = flashcardOverview?.totalPurchases ?? 0;
  const totalStudents = Math.max(
    flashcardOverview?.totalStudents ?? 0,
    quizOverview?.totalStudents ?? 0,
  );
  const totalContent =
    (quizOverview?.totalQuizSets ?? 0) +
    (flashcardOverview?.totalCardSets ?? 0);

  const onRetry = () => {
    void dispatch(fetchStatisticsOverview());
    void dispatch(fetchTopProducts(undefined));
    void dispatch(fetchStudents(50));
    void dispatch(fetchRevenue(period));
  };

  const openAttempts = (quizSetId: string) => {
    setModalQuizSetId(quizSetId);
    if (!attemptsByQuizSet[quizSetId]) {
      dispatch(fetchQuizAttempts(quizSetId)).then((result) => {
        if (fetchQuizAttempts.rejected.match(result)) {
          const message =
            (result.payload as string | undefined) ??
            "Không thể tải lịch sử làm bài.";
          showError(message);
        }
      });
    }
  };

  if (overviewStatus === "loading" && !quizOverview && !flashcardOverview) {
    return <LoadingState message="Đang tải bảng thống kê..." />;
  }

  if (overviewStatus === "failed" && !quizOverview && !flashcardOverview) {
    return (
      <ErrorState
        message={overviewError ?? "Lỗi không xác định"}
        onRetry={onRetry}
      />
    );
  }

  const chartData: RevenuePoint[] = revenue ?? [];

  const modalProductName =
    modalQuizSetId && topProducts
      ? (topProducts.find((p) => p.productId === modalQuizSetId)?.productName ??
        "")
      : "";

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-[var(--foreground)]">
            <BarChart3 className="h-7 w-7 text-[var(--primary)]" />
            Thống kê giáo viên
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Theo dõi doanh thu, học sinh và kết quả học tập của các sản phẩm bạn
            đã tạo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 text-sm">
            {(["month", "day"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  period === value
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {value === "month" ? "Theo tháng" : "Theo ngày"}
              </button>
            ))}
          </div>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)]"
          >
            <RefreshCcw className="h-4 w-4" /> Làm mới
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng doanh thu"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          accent="from-amber-400 to-yellow-500"
        />
        <StatCard
          label="Tổng lượt mua"
          value={formatNumber(totalOrders + totalFlashcardSales)}
          icon={ShoppingCart}
          accent="from-blue-500 to-cyan-600"
        />
        <StatCard
          label="Học sinh đã tiếp cận"
          value={formatNumber(totalStudents)}
          icon={Users}
          accent="from-violet-500 to-purple-600"
        />
        <StatCard
          label="Sản phẩm đã đăng"
          value={formatNumber(totalContent)}
          icon={Layers}
          accent="from-emerald-500 to-teal-600"
        />
      </div>

      {/* Pass-rate strip */}
      {quizOverview && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(10,10,20,0.28)]">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">
                Tỷ lệ đạt quiz trung bình
              </p>
              <p className="text-xl font-bold text-[var(--foreground)]">
                {quizOverview.passRate.toFixed(1)}%
                <span className="ml-2 text-sm font-medium text-[var(--muted-foreground)]">
                  ({formatNumber(quizOverview.totalPassed)} /{" "}
                  {formatNumber(quizOverview.totalAttempts)} lượt)
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Revenue chart */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(10,10,20,0.28)]">
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
          Doanh thu ({period === "month" ? "theo tháng" : "theo ngày"})
        </h2>
        {chartData.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--muted-foreground)]">
            Chưa có dữ liệu doanh thu trong khoảng thời gian này.
          </p>
        ) : (
          <div className="h-[300px] w-full">
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
                    value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
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
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top products + students */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(10,10,20,0.28)]">
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
            Sản phẩm bán chạy
          </h2>
          {topProductsStatus === "loading" ? (
            <LoadingState message="Đang tải..." />
          ) : !topProducts || topProducts.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--muted-foreground)]">
              Chưa có sản phẩm nào được bán.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--muted-foreground)]">
                    <th className="pb-3 font-medium">Sản phẩm</th>
                    <th className="pb-3 font-medium">Loại</th>
                    <th className="pb-3 font-medium text-right">Giá</th>
                    <th className="pb-3 font-medium text-right">Lượt mua</th>
                    <th className="pb-3 font-medium text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {topProducts.map((product: TopProduct) => (
                    <tr
                      key={product.productId}
                      onClick={() => {
                        if (product.productType === "QUIZ_SET") {
                          openAttempts(product.productId);
                        }
                      }}
                      className={
                        product.productType === "QUIZ_SET"
                          ? "cursor-pointer hover:bg-[var(--background)]"
                          : ""
                      }
                    >
                      <td className="py-3 font-medium text-[var(--foreground)]">
                        {product.productName}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex rounded-full bg-[var(--primary)]/10 px-2 py-1 text-xs font-medium text-[var(--primary)]">
                          {product.productType}
                        </span>
                      </td>
                      <td className="py-3 text-right text-[var(--foreground)]">
                        {formatCurrency(product.unitPrice)}
                      </td>
                      <td className="py-3 text-right text-[var(--foreground)]">
                        {formatNumber(product.totalSold)}
                      </td>
                      <td className="py-3 text-right font-semibold text-[var(--foreground)]">
                        {formatCurrency(product.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(10,10,20,0.28)]">
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
            Học sinh đã mua
          </h2>
          {studentsStatus === "loading" ? (
            <LoadingState message="Đang tải..." />
          ) : !students || students.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--muted-foreground)]">
              Chưa có học sinh nào mua sản phẩm của bạn.
            </p>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--card)]">
                  <tr className="text-left text-[var(--muted-foreground)]">
                    <th className="pb-3 font-medium">Học sinh</th>
                    <th className="pb-3 font-medium">Sản phẩm</th>
                    <th className="pb-3 font-medium text-right">Giá</th>
                    <th className="pb-3 font-medium">Ngày mua</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {students.map((entry: StudentPurchase, idx: number) => (
                    <tr key={`${entry.userId}-${entry.productId}-${idx}`}>
                      <td className="py-3 font-mono text-xs text-[var(--foreground)]">
                        {entry.userId.length > 14
                          ? `${entry.userId.slice(0, 8)}…${entry.userId.slice(-4)}`
                          : entry.userId}
                      </td>
                      <td className="py-3 text-[var(--foreground)]">
                        {entry.productName}
                      </td>
                      <td className="py-3 text-right text-[var(--foreground)]">
                        {formatCurrency(entry.unitPrice)}
                      </td>
                      <td className="py-3 text-[var(--muted-foreground)]">
                        {format(
                          new Date(entry.purchasedAt),
                          "dd/MM/yyyy HH:mm",
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AttemptsModal
        open={modalQuizSetId !== null}
        onClose={() => setModalQuizSetId(null)}
        productName={modalProductName}
        attempts={
          modalQuizSetId ? attemptsByQuizSet[modalQuizSetId] : undefined
        }
        isLoading={attemptsStatus === "loading"}
      />
    </div>
  );
}

export default TeacherStatistics;
