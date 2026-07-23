import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setLanguage } from "../../store/uiSlice";
import { changeLanguage } from "../../i18n";
import type { SupportedLanguage } from "../../i18n/config";

const LABELS: Record<SupportedLanguage, string> = {
  vi: "Tiếng Việt",
  en: "English",
};

function LanguageSwitcher() {
  const { t } = useTranslation("common");
  const dispatch = useAppDispatch();
  const language = useAppSelector((state) => state.ui.language);

  const handleChange = async (next: SupportedLanguage) => {
    if (next === language) return;
    dispatch(setLanguage(next));
    await changeLanguage(next);
  };

  return (
    <div className="relative" data-testid="language-switcher">
      <label className="sr-only" htmlFor="language-select">
        {t("languageSwitcher.label")}
      </label>
      <div className="flex items-center gap-2 p-2 bg-white/[0.04] border border-white/[0.08] rounded-lg">
        <Globe className="w-4 h-4 text-white/60" aria-hidden="true" />
        <select
          id="language-select"
          value={language}
          onChange={(event) => {
            void handleChange(event.target.value as SupportedLanguage);
          }}
          className="bg-transparent text-sm font-sans-ui text-cream focus:outline-none cursor-pointer pr-1"
        >
          {(Object.keys(LABELS) as SupportedLanguage[]).map((lang) => (
            <option
              key={lang}
              value={lang}
              className="bg-[var(--color-sidebar)] text-cream"
            >
              {LABELS[lang]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default LanguageSwitcher;
