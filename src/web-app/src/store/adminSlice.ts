import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { adminService } from "../api/services/admin";
import { getApiErrorMessage } from "../api/errors";
import type {
  AdminDashboardStats,
  PendingProduct,
  SystemConfigEntry,
  UserAdminResponse,
} from "../api/types";

export type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

interface UsersState {
  content: UserAdminResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  status: RequestStatus;
  error: string | null;
  filterRole: string;
}

interface ProductsState {
  content: PendingProduct[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  status: RequestStatus;
  error: string | null;
}

interface AdminState {
  dashboard: AdminDashboardStats | null;
  dashboardStatus: RequestStatus;
  dashboardError: string | null;

  users: UsersState;
  products: ProductsState;

  configs: SystemConfigEntry[];
  configsStatus: RequestStatus;
  configsError: string | null;

  // Write operations — track last op for UI to react
  mutationStatus: RequestStatus;
  mutationError: string | null;
}

const initialState: AdminState = {
  dashboard: null,
  dashboardStatus: "idle",
  dashboardError: null,
  users: {
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    status: "idle",
    error: null,
    filterRole: "",
  },
  products: {
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    status: "idle",
    error: null,
  },
  configs: [],
  configsStatus: "idle",
  configsError: null,
  mutationStatus: "idle",
  mutationError: null,
};

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------

export const fetchAdminDashboard = createAsyncThunk<
  AdminDashboardStats,
  void,
  { rejectValue: string }
>("admin/fetchDashboard", async (_, { rejectWithValue }) => {
  try {
    return await adminService.getDashboardStats();
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Không thể tải dashboard."),
    );
  }
});

export const fetchAdminUsers = createAsyncThunk<
  {
    content: UserAdminResponse[];
    page: number;
    totalElements: number;
    totalPages: number;
  },
  { role?: string; page?: number; size?: number },
  { rejectValue: string }
>("admin/fetchUsers", async (params, { rejectWithValue }) => {
  try {
    const result = await adminService.listUsers(
      params.role,
      params.page ?? 0,
      params.size ?? 20,
    );
    return {
      content: result.content,
      page: result.number,
      totalElements: result.totalElements,
      totalPages: result.totalPages,
    };
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Không thể tải danh sách người dùng."),
    );
  }
});

export const lockAdminUser = createAsyncThunk<
  UserAdminResponse,
  string,
  { rejectValue: string }
>("admin/lockUser", async (userId, { rejectWithValue }) => {
  try {
    return await adminService.lockUser(userId);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Không thể khóa tài khoản."),
    );
  }
});

export const unlockAdminUser = createAsyncThunk<
  UserAdminResponse,
  string,
  { rejectValue: string }
>("admin/unlockUser", async (userId, { rejectWithValue }) => {
  try {
    return await adminService.unlockUser(userId);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Không thể mở khóa tài khoản."),
    );
  }
});

export const changeAdminUserRole = createAsyncThunk<
  UserAdminResponse,
  { userId: string; role: "STUDENT" | "TEACHER" },
  { rejectValue: string }
>("admin/changeUserRole", async ({ userId, role }, { rejectWithValue }) => {
  try {
    return await adminService.changeUserRole(userId, role);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Không thể đổi role."));
  }
});

export const resetAdminUserPassword = createAsyncThunk<
  { message: string },
  string,
  { rejectValue: string }
>("admin/resetUserPassword", async (userId, { rejectWithValue }) => {
  try {
    return await adminService.resetUserPassword(userId);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Không thể reset mật khẩu."),
    );
  }
});

export const fetchPendingProducts = createAsyncThunk<
  {
    content: PendingProduct[];
    page: number;
    totalElements: number;
    totalPages: number;
  },
  { page?: number; size?: number },
  { rejectValue: string }
>("admin/fetchPendingProducts", async (params, { rejectWithValue }) => {
  try {
    const result = await adminService.listPendingProducts(
      params.page ?? 0,
      params.size ?? 20,
    );
    return {
      content: result.content,
      page: result.number,
      totalElements: result.totalElements,
      totalPages: result.totalPages,
    };
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Không thể tải danh sách sản phẩm chờ duyệt."),
    );
  }
});

export const approveAdminProduct = createAsyncThunk<
  PendingProduct,
  string,
  { rejectValue: string }
>("admin/approveProduct", async (productId, { rejectWithValue }) => {
  try {
    return await adminService.approveProduct(productId);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Không thể duyệt sản phẩm."),
    );
  }
});

export const rejectAdminProduct = createAsyncThunk<
  PendingProduct,
  { productId: string; reason: string },
  { rejectValue: string }
>("admin/rejectProduct", async ({ productId, reason }, { rejectWithValue }) => {
  try {
    return await adminService.rejectProduct(productId, { reason });
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Không thể từ chối sản phẩm."),
    );
  }
});

export const fetchAdminConfigs = createAsyncThunk<
  SystemConfigEntry[],
  void,
  { rejectValue: string }
>("admin/fetchConfigs", async (_, { rejectWithValue }) => {
  try {
    return await adminService.listConfigs();
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Không thể tải cấu hình."),
    );
  }
});

export const updateAdminConfig = createAsyncThunk<
  SystemConfigEntry,
  { key: string; value: string },
  { rejectValue: string }
>("admin/updateConfig", async ({ key, value }, { rejectWithValue }) => {
  try {
    return await adminService.updateConfig(key, { value });
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Không thể cập nhật cấu hình."),
    );
  }
});

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setUsersRoleFilter(state, action: { payload: string }) {
      state.users.filterRole = action.payload;
      state.users.page = 0;
    },
    setUsersPage(state, action: { payload: number }) {
      state.users.page = action.payload;
    },
    setUsersSize(state, action: { payload: number }) {
      state.users.size = action.payload;
      state.users.page = 0;
    },
    setProductsPage(state, action: { payload: number }) {
      state.products.page = action.payload;
    },
    setProductsSize(state, action: { payload: number }) {
      state.products.size = action.payload;
      state.products.page = 0;
    },
    clearMutationStatus(state) {
      state.mutationStatus = "idle";
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    // Dashboard
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.dashboardStatus = "loading";
        state.dashboardError = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.dashboardStatus = "succeeded";
        state.dashboard = action.payload;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.dashboardStatus = "failed";
        state.dashboardError = action.payload ?? "Unknown";
      });

    // Users
    builder
      .addCase(fetchAdminUsers.pending, (state) => {
        state.users.status = "loading";
        state.users.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.users.status = "succeeded";
        state.users.content = action.payload.content;
        state.users.page = action.payload.page;
        state.users.totalElements = action.payload.totalElements;
        state.users.totalPages = action.payload.totalPages;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.users.status = "failed";
        state.users.error = action.payload ?? "Unknown";
      });

    // Lock / unlock / change role — replace single user trong list
    builder
      .addCase(lockAdminUser.fulfilled, (state, action) => {
        replaceUser(state, action.payload);
      })
      .addCase(unlockAdminUser.fulfilled, (state, action) => {
        replaceUser(state, action.payload);
      })
      .addCase(changeAdminUserRole.fulfilled, (state, action) => {
        replaceUser(state, action.payload);
      });

    // Products
    builder
      .addCase(fetchPendingProducts.pending, (state) => {
        state.products.status = "loading";
        state.products.error = null;
      })
      .addCase(fetchPendingProducts.fulfilled, (state, action) => {
        state.products.status = "succeeded";
        state.products.content = action.payload.content;
        state.products.page = action.payload.page;
        state.products.totalElements = action.payload.totalElements;
        state.products.totalPages = action.payload.totalPages;
      })
      .addCase(fetchPendingProducts.rejected, (state, action) => {
        state.products.status = "failed";
        state.products.error = action.payload ?? "Unknown";
      })
      // Approve/Reject — remove khỏi pending list
      .addCase(approveAdminProduct.fulfilled, (state, action) => {
        state.products.content = state.products.content.filter(
          (p) => p.id !== action.payload.id,
        );
        state.products.totalElements = Math.max(
          0,
          state.products.totalElements - 1,
        );
      })
      .addCase(rejectAdminProduct.fulfilled, (state, action) => {
        state.products.content = state.products.content.filter(
          (p) => p.id !== action.payload.id,
        );
        state.products.totalElements = Math.max(
          0,
          state.products.totalElements - 1,
        );
      });

    // Configs
    builder
      .addCase(fetchAdminConfigs.pending, (state) => {
        state.configsStatus = "loading";
        state.configsError = null;
      })
      .addCase(fetchAdminConfigs.fulfilled, (state, action) => {
        state.configsStatus = "succeeded";
        state.configs = action.payload;
      })
      .addCase(fetchAdminConfigs.rejected, (state, action) => {
        state.configsStatus = "failed";
        state.configsError = action.payload ?? "Unknown";
      })
      .addCase(updateAdminConfig.fulfilled, (state, action) => {
        const idx = state.configs.findIndex(
          (c) => c.key === action.payload.key,
        );
        if (idx >= 0) {
          state.configs[idx] = action.payload;
        } else {
          state.configs.push(action.payload);
        }
      });

    // Mutation tracking cho mọi write op (addMatcher phải đến sau tất cả addCase)
    builder
      .addMatcher(
        (action) =>
          action.type === lockAdminUser.pending.type ||
          action.type === unlockAdminUser.pending.type ||
          action.type === changeAdminUserRole.pending.type ||
          action.type === resetAdminUserPassword.pending.type ||
          action.type === approveAdminProduct.pending.type ||
          action.type === rejectAdminProduct.pending.type ||
          action.type === updateAdminConfig.pending.type,
        (state) => {
          state.mutationStatus = "loading";
          state.mutationError = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type === lockAdminUser.rejected.type ||
          action.type === unlockAdminUser.rejected.type ||
          action.type === changeAdminUserRole.rejected.type ||
          action.type === resetAdminUserPassword.rejected.type ||
          action.type === approveAdminProduct.rejected.type ||
          action.type === rejectAdminProduct.rejected.type ||
          action.type === updateAdminConfig.rejected.type,
        (state, action: { payload?: string }) => {
          state.mutationStatus = "failed";
          state.mutationError = action.payload ?? "Unknown";
        },
      )
      .addMatcher(
        (action) =>
          action.type === lockAdminUser.fulfilled.type ||
          action.type === unlockAdminUser.fulfilled.type ||
          action.type === changeAdminUserRole.fulfilled.type ||
          action.type === resetAdminUserPassword.fulfilled.type ||
          action.type === approveAdminProduct.fulfilled.type ||
          action.type === rejectAdminProduct.fulfilled.type ||
          action.type === updateAdminConfig.fulfilled.type,
        (state) => {
          state.mutationStatus = "succeeded";
          state.mutationError = null;
        },
      );
  },
});

function replaceUser(state: AdminState, user: UserAdminResponse) {
  const idx = state.users.content.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    state.users.content[idx] = user;
  }
}

export const {
  setUsersRoleFilter,
  setUsersPage,
  setUsersSize,
  setProductsPage,
  setProductsSize,
  clearMutationStatus,
} = adminSlice.actions;
export default adminSlice.reducer;
