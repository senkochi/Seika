import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import userProfileReducer from "./userProfileSlice";
import notificationReducer from "./notificationSlice";
import statisticsReducer from "./statisticsSlice";
import adminReducer from "./adminSlice";
import uiReducer from "./uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    userProfile: userProfileReducer,
    notifications: notificationReducer,
    statistics: statisticsReducer,
    admin: adminReducer,
    ui: uiReducer,
  },
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
