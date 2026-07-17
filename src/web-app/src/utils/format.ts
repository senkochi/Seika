import { formatDistanceToNow } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { useActiveLocale } from "../hooks/useActiveLocale";
import type { SupportedLanguage } from "../i18n/config";

const INTL_MAP: Record<SupportedLanguage, string> = {
  vi: "vi-VN",
  en: "en-US",
};

const DATE_FNS_LOCALE_MAP = {
  vi,
  en: enUS,
} as const;

export const useFormatLocale = (): SupportedLanguage => useActiveLocale();

export const useIntlLocale = (): string => INTL_MAP[useActiveLocale()];

export const useFormatNumber = () => {
  const locale = useIntlLocale();
  return (value: number, options?: Intl.NumberFormatOptions): string =>
    new Intl.NumberFormat(locale, options).format(value);
};

export const useFormatDate = () => {
  const locale = useIntlLocale();
  return (value: Date | string, options?: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat(locale, options).format(
      typeof value === "string" ? new Date(value) : value,
    );
};

export const useFormatRelativeTime = () => {
  const language = useFormatLocale();
  return (value: Date | string): string =>
    formatDistanceToNow(typeof value === "string" ? new Date(value) : value, {
      addSuffix: true,
      locale: DATE_FNS_LOCALE_MAP[language],
    });
};
