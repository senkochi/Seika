import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  UI_LANGUAGE_STORAGE_KEY,
  type SupportedLanguage,
} from "../i18n/config";

export type UiState = {
  language: SupportedLanguage;
};

const initialLanguage: SupportedLanguage = (() => {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }
  const raw = window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
  return isSupportedLanguage(raw) ? raw : DEFAULT_LANGUAGE;
})();

const initialState: UiState = {
  language: initialLanguage,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<SupportedLanguage>) {
      state.language = action.payload;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, action.payload);
      }
    },
  },
});

export const { setLanguage } = uiSlice.actions;
export default uiSlice.reducer;
