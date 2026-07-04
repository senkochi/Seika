/**
 * File này chứa Redux slice để quản lý trạng thái xác thực người dùng trong ứng dụng. Nó sử
 * dụng Redux Toolkit để tạo slice, bao gồm các action và reducer liên quan đến đăng nhập, đăng ký,
 * và lưu trữ thông tin xác thực. Slice này cũng xử lý việc lưu trữ token vào localStorage hoặc
 * sessionStorage dựa trên lựa chọn "Remember Me" của người dùng, và cung cấp các action để đăng
 * xuất và xóa lỗi xác thực.
 */
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import { authService, getApiErrorMessage, setAuthToken } from "../api";
import { isTokenExpired } from "../api/tokenUtils";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../api";

// Định nghĩa kiểu dữ liệu cho Auth State của slice.
type AuthStorageState = {
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string | null;
  username: string | null;
  roles: string[];
};

// Kết hợp AuthStorageState với các trường bổ sung để quản lý trạng thái và lỗi của quá trình xác thực.
type AuthState = AuthStorageState & {
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const storageKey = "seika.auth";

// Định nghĩa trạng thái rỗng mặc định cho Auth State.
const emptyAuthStorageState: AuthStorageState = {
  accessToken: null,
  refreshToken: null,
  tokenType: null,
  username: null,
  roles: [],
};

/**
 * Hàm để lấy thông tin xác thực đã lưu trữ từ localStorage hoặc sessionStorage.
 *
 * Bao gồm kiểm tra expiry của access token:
 * - Nếu access token đã hết hạn VÀ không có refresh token → xóa storage, trả về state rỗng
 *   (người dùng sẽ thấy nút Login/Register thay vì "Go to Dashboard").
 * - Nếu access token đã hết hạn NHƯNG có refresh token → giữ state để interceptor
 *   tự động refresh token khi có API call đầu tiên.
 * - Nếu access token còn hiệu lực → giữ state bình thường.
 */
const getStoredAuth = (): AuthStorageState => {
  if (typeof window === "undefined") {
    return emptyAuthStorageState;
  }

  const rawAuth =
    window.localStorage.getItem(storageKey) ??
    window.sessionStorage.getItem(storageKey);

  if (!rawAuth) {
    return emptyAuthStorageState;
  }

  try {
    const parsed: AuthStorageState = {
      ...emptyAuthStorageState,
      ...JSON.parse(rawAuth),
    };

    // Kiểm tra token expiry khi khởi tạo
    if (parsed.accessToken && isTokenExpired(parsed.accessToken)) {
      if (!parsed.refreshToken) {
        // Access token hết hạn + không có refresh token → xóa hết, quay về trạng thái chưa đăng nhập
        window.localStorage.removeItem(storageKey);
        window.sessionStorage.removeItem(storageKey);
        return emptyAuthStorageState;
      }
      // Access token hết hạn + CÓ refresh token → giữ state
      // Interceptor sẽ tự động gọi refresh khi có API call
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(storageKey);
    window.sessionStorage.removeItem(storageKey);
    return emptyAuthStorageState;
  }
};

/**
 * Hàm lưu trữ thông tin xác thực vào localStorage hoặc sessionStorage dựa trên lựa chọn "Remember Me"
 * của người dùng. Nếu rememberMe là true, thông tin sẽ được lưu vào localStorage, ngược lại sẽ lưu vào
 * sessionStorage. Hàm này cũng đảm bảo rằng nếu có thông tin cũ tồn tại trong storage không được sử dụng,
 * nó sẽ bị xóa bỏ trước khi lưu thông tin mới.
 */
const persistAuth = (auth: AuthStorageState, rememberMe: boolean) => {
  if (typeof window === "undefined") {
    return;
  }

  const storage = rememberMe ? window.localStorage : window.sessionStorage; // Biến lưu trữ tạm thời để xác định nơi lưu trữ dựa trên lựa chọn của người dùng.
  const staleStorage = rememberMe ? window.sessionStorage : window.localStorage; // Biến lưu trữ tạm thời để xác định nơi lưu trữ cũ (nếu có) để xóa bỏ.

  staleStorage.removeItem(storageKey);
  storage.setItem(storageKey, JSON.stringify(auth));
};

/**
 * Hàm xóa thông tin xác thực đã lưu trữ khỏi localStorage và sessionStorage. Dùng khi đăng xuất.
 */
const clearPersistedAuth = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(storageKey);
  window.sessionStorage.removeItem(storageKey);
};

/**
 * Hàm adapter để chuyển đổi dữ liệu từ định dạng AuthResponse của API sang định dạng AuthStorageState mà
 * ứng dụng sử dụng.
 */
const toAuthStorageState = (auth: AuthResponse): AuthStorageState => ({
  accessToken: auth.accessToken,
  refreshToken: auth.refreshToken,
  tokenType: auth.tokenType,
  username: auth.username,
  roles: auth.roles ?? [],
});

const storedAuth = getStoredAuth();
setAuthToken(storedAuth.accessToken);

/**
 * Khởi tạo trạng thái ban đầu cho slice bằng cách kết hợp thông tin xác thực đã lưu trữ (nếu có)
 * với trạng thái mặc định. Nếu có thông tin xác thực hợp lệ, token sẽ được thiết lập để sử dụng
 * cho các yêu cầu API tiếp theo. Trạng thái ban đầu cũng đặt status là "idle" và error là null.
 */
const initialState: AuthState = {
  ...storedAuth,
  status: "idle",
  error: null,
};

export const login = createAsyncThunk<
  AuthStorageState,
  { credentials: LoginRequest; rememberMe: boolean },
  { rejectValue: string }
>("auth/login", async ({ credentials, rememberMe }, { rejectWithValue }) => {
  try {
    const auth = toAuthStorageState(await authService.login(credentials));
    setAuthToken(auth.accessToken);
    persistAuth(auth, rememberMe);
    return auth;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Login failed."));
  }
});

export const register = createAsyncThunk<
  AuthStorageState,
  RegisterRequest,
  { rejectValue: string }
>("auth/register", async (payload, { rejectWithValue }) => {
  try {
    const auth = toAuthStorageState(await authService.register(payload));
    setAuthToken(auth.accessToken);
    persistAuth(auth, true);
    return auth;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Registration failed."));
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      Object.assign(state, emptyAuthStorageState);
      state.status = "idle";
      state.error = null;
      setAuthToken(null);
      clearPersistedAuth();
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<AuthStorageState>) => {
      Object.assign(state, action.payload);
      setAuthToken(action.payload.accessToken);
      persistAuth(action.payload, true);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.status = "succeeded";
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Login failed.";
      })
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.status = "succeeded";
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Registration failed.";
      });
  },
});

export const { clearAuthError, logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
