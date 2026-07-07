import { useEffect, useState } from "react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchQuizAttempts,
  fetchRevenue,
  fetchStatisticsOverview,
  fetchStudents,
  fetchTopProducts,
} from "../../store/statisticsSlice";
import { showError } from "../../components/toast/toastUtils";

import StatisticsHeader, {
  type StatisticsPeriod,
} from "../../components/teacher/statistics/StatisticsHeader";
import OverviewStatsGrid from "../../components/teacher/statistics/OverviewStatsGrid";
import PassRateStrip from "../../components/teacher/statistics/PassRateStrip";
import RevenueChartCard from "../../components/teacher/statistics/RevenueChartCard";
import TopProductsCard from "../../components/teacher/statistics/TopProductsCard";
import StudentsCard from "../../components/teacher/statistics/StudentsCard";
import AttemptsModal from "../../components/teacher/statistics/AttemptsModal";
import StatisticsLoadingState from "../../components/teacher/statistics/StatisticsLoadingState";
import StatisticsErrorState from "../../components/teacher/statistics/StatisticsErrorState";
import { useStatisticsOverview } from "../../components/teacher/statistics/useStatisticsOverview";

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

  const [period, setPeriod] = useState<StatisticsPeriod>("month");
  const [modalQuizSetId, setModalQuizSetId] = useState<string | null>(null);

  const totals = useStatisticsOverview(revenue ?? [], flashcardOverview, quizOverview);

  const refetch = () => {
    void dispatch(fetchStatisticsOverview());
    void dispatch(fetchTopProducts(undefined));
    void dispatch(fetchStudents(50));
    void dispatch(fetchRevenue(period));
  };

  useEffect(() => {
    void dispatch(fetchStatisticsOverview());
    void dispatch(fetchTopProducts(undefined));
    void dispatch(fetchStudents(50));
  }, [dispatch]);

  useEffect(() => {
    void dispatch(fetchRevenue(period));
  }, [dispatch, period]);

  const openAttempts = (quizSetId: string) => {
    setModalQuizSetId(quizSetId);
    if (!attemptsByQuizSet[quizSetId]) {
      dispatch(fetchQuizAttempts(quizSetId)).then((result) => {
        if (fetchQuizAttempts.rejected.match(result)) {
          const message =
            (result.payload as string | undefined) ?? "Không thể tải lịch sử làm bài.";
          showError(message);
        }
      });
    }
  };

  const hasOverview = quizOverview || flashcardOverview;

  if (overviewStatus === "loading" && !hasOverview) {
    return <StatisticsLoadingState message="Đang tải bảng thống kê..." />;
  }

  if (overviewStatus === "failed" && !hasOverview) {
    return (
      <StatisticsErrorState
        message={overviewError ?? "Lỗi không xác định"}
        onRetry={refetch}
      />
    );
  }

  const modalProductName =
    modalQuizSetId && topProducts
      ? topProducts.find((p) => p.productId === modalQuizSetId)?.productName ?? ""
      : "";

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <StatisticsHeader period={period} onPeriodChange={setPeriod} onReload={refetch} />

      <OverviewStatsGrid
        totalRevenue={totals.totalRevenue}
        totalOrders={totals.totalOrders + totals.totalFlashcardSales}
        totalStudents={totals.totalStudents}
        totalContent={totals.totalContent}
      />

      {quizOverview && (
        <PassRateStrip
          passRate={quizOverview.passRate}
          totalPassed={quizOverview.totalPassed}
          totalAttempts={quizOverview.totalAttempts}
        />
      )}

      <RevenueChartCard period={period} data={revenue ?? []} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TopProductsCard
          products={topProducts ?? []}
          status={topProductsStatus}
          onOpenAttempts={openAttempts}
        />
        <StudentsCard entries={students ?? []} status={studentsStatus} />
      </div>

      <AttemptsModal
        open={modalQuizSetId !== null}
        onClose={() => setModalQuizSetId(null)}
        productName={modalProductName}
        attempts={modalQuizSetId ? attemptsByQuizSet[modalQuizSetId] : undefined}
        isLoading={attemptsStatus === "loading"}
      />
    </div>
  );
}

export default TeacherStatistics;