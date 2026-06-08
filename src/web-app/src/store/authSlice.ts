import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import { authService, getApiErrorMessage, setAuthToken } from "../api";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../api";

type AuthStorageState = {
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string | null;
  username: string | null;
  roles: string[];
};

type AuthState = AuthStorageState & {
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const storageKey = "seika.auth";

const emptyAuthStorageState: AuthStorageState = {
  accessToken: null,
  refreshToken: null,
  tokenType: null,
  username: null,
  roles: [],
};

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
    return { ...emptyAuthStorageState, ...JSON.parse(rawAuth) };
  } catch {
    window.localStorage.removeItem(storageKey);
    window.sessionStorage.removeItem(storageKey);
    return emptyAuthStorageState;
  }
};

const persistAuth = (auth: AuthStorageState, rememberMe: boolean) => {
  if (typeof window === "undefined") {
    return;
  }

  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  const staleStorage = rememberMe ? window.sessionStorage : window.localStorage;

  staleStorage.removeItem(storageKey);
  storage.setItem(storageKey, JSON.stringify(auth));
};

const clearPersistedAuth = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(storageKey);
  window.sessionStorage.removeItem(storageKey);
};

const toAuthStorageState = (auth: AuthResponse): AuthStorageState => ({
  accessToken: auth.accessToken,
  refreshToken: auth.refreshToken,
  tokenType: auth.tokenType,
  username: auth.username,
  roles: auth.roles ?? [],
});

const storedAuth = getStoredAuth();
setAuthToken(storedAuth.accessToken);

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
