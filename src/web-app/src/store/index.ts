import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./authSlice";
import userProfileReducer from "./userProfileSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    userProfile: userProfileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
