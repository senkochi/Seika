import { Plus, RefreshCcw } from "lucide-react";

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
  return (
    <div className="mb-8 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Content Manager
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Tạo, cấu hình và quản lý tài liệu học tập của bạn (Flashcard & Quiz
          Sets).
        </p>
      </div>
      {showCreate && (
        <div className="flex items-center gap-3">
          <button
            onClick={onReload}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] transition-all"
          >
            <RefreshCcw className="h-4 w-4" />
            Làm mới
          </button>
          <button
            id="btn-create-content"
            onClick={onCreate}
            className="flex items-center gap-2 px-5 py-3 bg-[var(--primary)] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            {activeTab === "flashcards" ? "Bộ Flashcard Mới" : "Bộ đề Quiz Mới"}
          </button>
        </div>
      )}
    </div>
  );
}

export default ContentManagerHeader;