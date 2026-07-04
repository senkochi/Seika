import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  statisticsService,
  type TeacherStatisticsOverview,
} from "../api/services/statistics";
import {
  getApiErrorMessage,
} from "../api/errors";
import type {
  FlashcardStatisticsOverview,
  QuizAttempt,
  QuizStatisticsOverview,
  RevenuePoint,
  StudentPurchase,
  TopProduct,
} from "../api/types";

export type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface StatisticsState {
  overviewStatus: RequestStatus;
  overviewError: string | null;

  quizOverview: QuizStatisticsOverview | null;
  flashcardOverview: FlashcardStatisticsOverview | null;
  revenue: RevenuePoint[];

  topProducts: TopProduct[];
  topProductsStatus: RequestStatus;
  topProductsError: string | null;

  students: StudentPurchase[];
  studentsStatus: RequestStatus;
  studentsError: string | null;

  /** Attempts grouped by quizSetId (used by the drill-down modal). */
  attemptsByQuizSet: Record<string, QuizAttempt[]>;
  attemptsStatus: RequestStatus;
  attemptsError: string | null;
}

const initialState: StatisticsState = {
  overviewStatus: "idle",
  overviewError: null,
  quizOverview: null,
  flashcardOverview: null,
  revenue: [],
  topProducts: [],
  topProductsStatus: "idle",
  topProductsError: null,
  students: [],
  studentsStatus: "idle",
  studentsError: null,
  attemptsByQuizSet: {},
  attemptsStatus: "idle",
  attemptsError: null,
};

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------

export const fetchStatisticsOverview = createAsyncThunk<
  TeacherStatisticsOverview,
  void,
  { rejectValue: string }
>("statistics/fetchOverview", async (_, { rejectWithValue }) => {
  try {
    return await statisticsService.fetchOverviewBundle();
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Không thể tải thống kê."));
  }
});

export const fetchRevenue = createAsyncThunk<
  RevenuePoint[],
  "month" | "day",
  { rejectValue: string }
>("statistics/fetchRevenue", async (period, { rejectWithValue }) => {
  try {
    return await statisticsService.getRevenue(period);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Không thể tải doanh thu."));
  }
});

export const fetchTopProducts = createAsyncThunk<
  TopProduct[],
  { productType?: string; limit?: number } | undefined,
  { rejectValue: string }
>("statistics/fetchTopProducts", async (params, { rejectWithValue }) => {
  try {
    return await statisticsService.getTopProducts(
      params?.productType,
      params?.limit ?? 10,
    );
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Không thể tải sản phẩm hàng đầu."),
    );
  }
});

export const fetchStudents = createAsyncThunk<
  StudentPurchase[],
  number | undefined,
  { rejectValue: string }
>("statistics/fetchStudents", async (limit, { rejectWithValue }) => {
  try {
    return await statisticsService.getStudents(limit ?? 50);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Không thể tải danh sách học sinh."));
  }
});

export const fetchQuizAttempts = createAsyncThunk<
  { quizSetId: string; attempts: QuizAttempt[] },
  string,
  { rejectValue: string }
>("statistics/fetchQuizAttempts", async (quizSetId, { rejectWithValue }) => {
  try {
    const attempts = await statisticsService.getQuizAttempts(quizSetId);
    return { quizSetId, attempts };
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Không thể tải lịch sử làm bài."));
  }
});

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const statisticsSlice = createSlice({
  name: "statistics",
  initialState,
  reducers: {
    clearStatistics: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatisticsOverview.pending, (state) => {
        state.overviewStatus = "loading";
        state.overviewError = null;
      })
      .addCase(fetchStatisticsOverview.fulfilled, (state, action) => {
        state.overviewStatus = "succeeded";
        state.quizOverview = action.payload.quiz;
        state.flashcardOverview = action.payload.flashcard;
        state.revenue = action.payload.revenue;
      })
      .addCase(fetchStatisticsOverview.rejected, (state, action) => {
        state.overviewStatus = "failed";
        state.overviewError = action.payload ?? "Unknown error";
      })
      .addCase(fetchRevenue.fulfilled, (state, action) => {
        state.revenue = action.payload;
      })
      .addCase(fetchTopProducts.pending, (state) => {
        state.topProductsStatus = "loading";
        state.topProductsError = null;
      })
      .addCase(fetchTopProducts.fulfilled, (state, action) => {
        state.topProductsStatus = "succeeded";
        state.topProducts = action.payload;
      })
      .addCase(fetchTopProducts.rejected, (state, action) => {
        state.topProductsStatus = "failed";
        state.topProductsError = action.payload ?? "Unknown error";
      })
      .addCase(fetchStudents.pending, (state) => {
        state.studentsStatus = "loading";
        state.studentsError = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.studentsStatus = "succeeded";
        state.students = action.payload;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.studentsStatus = "failed";
        state.studentsError = action.payload ?? "Unknown error";
      })
      .addCase(fetchQuizAttempts.pending, (state) => {
        state.attemptsStatus = "loading";
        state.attemptsError = null;
      })
      .addCase(fetchQuizAttempts.fulfilled, (state, action) => {
        state.attemptsStatus = "succeeded";
        state.attemptsByQuizSet[action.payload.quizSetId] = action.payload.attempts;
      })
      .addCase(fetchQuizAttempts.rejected, (state, action) => {
        state.attemptsStatus = "failed";
        state.attemptsError = action.payload ?? "Unknown error";
      });
  },
});

export const { clearStatistics } = statisticsSlice.actions;
export default statisticsSlice.reducer;
