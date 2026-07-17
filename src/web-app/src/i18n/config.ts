export const SUPPORTED_LANGUAGES = ["vi", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "vi";
export const FALLBACK_LANGUAGE: SupportedLanguage = "en";

export const NAMESPACES = [
  "common",
  "auth",
  "wallet",
  "marketplace",
  "learning",
  "profile",
  "teacher",
  "admin",
  "errors",
  "toasts",
] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const UI_LANGUAGE_STORAGE_KEY = "seika.ui.language";

export const isSupportedLanguage = (
  value: unknown,
): value is SupportedLanguage =>
  typeof value === "string" &&
  (SUPPORTED_LANGUAGES as readonly string[]).includes(value);

export const readStoredLanguage = (): SupportedLanguage => {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }
  const raw = window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
  return isSupportedLanguage(raw) ? raw : DEFAULT_LANGUAGE;
};
