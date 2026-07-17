import { BookOpen, HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export type ContentTab = "flashcards" | "quiz-sets";

interface ContentManagerTabsProps {
  activeTab: ContentTab;
  onChange: (tab: ContentTab) => void;
}

function ContentManagerTabs({ activeTab, onChange }: ContentManagerTabsProps) {
  const { t } = useTranslation("teacher");
  return (
    <div className="flex gap-4 border-b border-[var(--border)] mb-8">
      <button
        id="tab-flashcards"
        onClick={() => onChange("flashcards")}
        className={`px-4 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
          activeTab === "flashcards"
            ? "border-[var(--primary)] text-[var(--primary)]"
            : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        }`}
      >
        <BookOpen className="w-4 h-4" />
        {t("content.tabFlashcards")}
      </button>
      <button
        id="tab-quiz-sets"
        onClick={() => onChange("quiz-sets")}
        className={`px-4 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
          activeTab === "quiz-sets"
            ? "border-[var(--primary)] text-[var(--primary)]"
            : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        }`}
      >
        <HelpCircle className="w-4 h-4" />
        {t("content.tabQuizSets")}
      </button>
    </div>
  );
}

export default ContentManagerTabs;
