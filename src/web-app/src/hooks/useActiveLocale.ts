import { useAppSelector } from "../store/hooks";
import type { SupportedLanguage } from "../i18n/config";

/** Returns the active UI language. UI re-renders when the language changes. */
export const useActiveLocale = (): SupportedLanguage =>
  useAppSelector((state) => state.ui.language);
