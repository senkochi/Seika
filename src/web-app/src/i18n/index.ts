import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import {
  FALLBACK_LANGUAGE,
  NAMESPACES,
  readStoredLanguage,
  type SupportedLanguage,
} from "./config";

import viCommon from "./locales/vi/common.json";
import viAuth from "./locales/vi/auth.json";
import viWallet from "./locales/vi/wallet.json";
import viMarketplace from "./locales/vi/marketplace.json";
import viLearning from "./locales/vi/learning.json";
import viProfile from "./locales/vi/profile.json";
import viTeacher from "./locales/vi/teacher.json";
import viAdmin from "./locales/vi/admin.json";
import viErrors from "./locales/vi/errors.json";
import viToasts from "./locales/vi/toasts.json";

import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enWallet from "./locales/en/wallet.json";
import enMarketplace from "./locales/en/marketplace.json";
import enLearning from "./locales/en/learning.json";
import enProfile from "./locales/en/profile.json";
import enTeacher from "./locales/en/teacher.json";
import enAdmin from "./locales/en/admin.json";
import enErrors from "./locales/en/errors.json";
import enToasts from "./locales/en/toasts.json";

const resources = {
  vi: {
    common: viCommon,
    auth: viAuth,
    wallet: viWallet,
    marketplace: viMarketplace,
    learning: viLearning,
    profile: viProfile,
    teacher: viTeacher,
    admin: viAdmin,
    errors: viErrors,
    toasts: viToasts,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    wallet: enWallet,
    marketplace: enMarketplace,
    learning: enLearning,
    profile: enProfile,
    teacher: enTeacher,
    admin: enAdmin,
    errors: enErrors,
    toasts: enToasts,
  },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: readStoredLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  defaultNS: "common",
  ns: [...NAMESPACES],
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
  react: { useSuspense: false },
});

/**
 * Change the active language and persist it. Call this from anywhere —
 * typically from a Redux action's middleware or directly from the LanguageSwitcher.
 */
export const changeLanguage = async (
  lang: SupportedLanguage,
): Promise<void> => {
  await i18n.changeLanguage(lang);
  if (typeof window !== "undefined") {
    window.localStorage.setItem("seika.ui.language", lang);
  }
};

export default i18n;
