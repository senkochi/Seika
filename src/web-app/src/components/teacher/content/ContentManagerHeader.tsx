import { Plus, RefreshCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ContentManagerHeaderProps {
  onReload: () => void;
  onCreate: () => void;
  activeTab: "flashcards" | "quiz-sets";
  showCreate: boolean;
}

function ContentManagerHeader({
  onReload,
  onCreate,
  activeTab,
  showCreate,
}: ContentManagerHeaderProps) {
  const { t } = useTranslation("teacher");
  return (
    <div className="mb-8 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          {t("content.title")}
        </h1>
        <p className="text-[var(--muted-foreground)]">
          {t("content.subtitle")}
        </p>
      </div>
      {showCreate && (
        <div className="flex items-center gap-3">
          <button
            onClick={onReload}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-md px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] transition-all"
          >
            <RefreshCcw className="h-4 w-4" />
            {t("content.refresh")}
          </button>
          <button
            id="btn-create-content"
            onClick={onCreate}
            className="flex items-center gap-2 px-5 py-3 bg-[var(--primary)] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            {activeTab === "flashcards"
              ? t("content.createFlashcardBtn")
              : t("content.createQuizSetBtn")}
          </button>
        </div>
      )}
    </div>
  );
}

export default ContentManagerHeader;
