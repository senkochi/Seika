import { BookOpen, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ContentListEmptyProps {
  variant: "flashcards" | "quiz-sets";
  onCreate: () => void;
}

function ContentListEmpty({ variant, onCreate }: ContentListEmptyProps) {
  const Icon: LucideIcon = variant === "flashcards" ? BookOpen : HelpCircle;
  const message =
    variant === "flashcards"
      ? "Bạn chưa tạo bộ Flashcard nào."
      : "Bạn chưa tạo Bộ đề Quiz nào.";
  return (
    <div className="text-center p-20 bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl">
      <Icon className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4 opacity-50" />
      <p className="text-[var(--muted-foreground)] mb-4">{message}</p>
      <button
        onClick={onCreate}
        className="px-4 py-2 bg-purple-900/40 text-purple-300 border border-purple-800 rounded-xl text-sm font-semibold"
      >
        Tạo ngay
      </button>
    </div>
  );
}

export default ContentListEmpty;
