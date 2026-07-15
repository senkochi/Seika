import { useState } from "react";
import { DollarSign, Loader2, Plus, Trash2, X } from "lucide-react";

import type { QuizSetResponse } from "../../../api";
import { quizzesService } from "../../../api";
import { showError, showSuccess } from "../../toast/toastUtils";
import QuizTypeBadge from "./QuizTypeBadge";
import QuizQuestionForm, { type QuestionDraft } from "./QuizQuestionForm";
import { useProductPriceRange } from "./useProductPriceRange";

interface QuizSetFormProps {
  initial?: QuizSetResponse;
  onSaved: () => void;
  onCancel: () => void;
}

function QuizSetForm({ initial, onSaved, onCancel }: QuizSetFormProps) {
  const { minPrice, maxPrice } = useProductPriceRange();

  const [title, setTitle] = useState<string>(initial?.title ?? "");
  const [description, setDescription] = useState<string>(
    initial?.description ?? "",
  );
  const [price, setPrice] = useState<number>(initial?.price ?? 0);
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => {
    if (initial?.quizzes && initial.quizzes.length > 0) {
      return initial.quizzes.map((q) => {
        const mapped: QuestionDraft = {
          questionText: q.questionText,
          type: q.type,
        };
        if (q.type === "MULTIPLE_CHOICE") {
          mapped.options = q.options;
          mapped.correctOptionIndex = q.correctOptionIndex;
        } else if (q.type === "MATCHING") {
          mapped.matchingPairs = q.matchingPairs;
        } else if (q.type === "REORDER") {
          mapped.correctOrder = q.correctOrder;
        } else if (q.type === "FILL_IN_THE_BLANK") {
          mapped.acceptedAnswers = q.acceptedAnswers;
        }
        return mapped;
      });
    }
    return [];
  });
  const [showQuestionForm, setShowQuestionForm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const editingId = initial?.id;
  const isEditing = Boolean(editingId);

  const handleAddQuestion = (draft: QuestionDraft) => {
    setQuestions((prev) => [...prev, draft]);
    setShowQuestionForm(false);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return showError("Tiêu đề bộ đề là bắt buộc.");
    if (questions.length === 0) {
      return showError("Bộ đề phải có ít nhất một câu hỏi.");
    }
    if (price < 0) return showError("Giá sản phẩm không được nhỏ hơn 0.");
    if (price > 0 && (price < minPrice || price > maxPrice)) {
      return showError(
        `Giá sản phẩm phải nằm trong khoảng từ ${minPrice} đến ${maxPrice} coin!`,
      );
    }

    setLoading(true);
    try {
      const payload = {
        title,
        description,
        price: Number(price),
        questions,
      };
      if (isEditing && editingId) {
        await quizzesService.updateQuizSet(editingId, payload);
        showSuccess("Bộ đề Quiz đã được cập nhật thành công!");
      } else {
        await quizzesService.createQuizSet(payload);
        showSuccess("Bộ đề Quiz đã được tạo thành công!");
      }
      onSaved();
    } catch (err) {
      console.error(err);
      showError(
        isEditing
          ? "Không thể cập nhật Bộ đề Quiz."
          : "Không thể tạo Bộ đề Quiz.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-8 max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[var(--border)] pb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-[var(--foreground)]">
          {isEditing ? "Cập nhật Bộ đề Quiz" : "Tạo Bộ Đề Quiz Mới"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
            Tiêu đề Bộ đề
          </label>
          <input
            type="text"
            required
            placeholder="VD: Bài kiểm tra 15 phút Toán học"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
            Mô tả
          </label>
          <textarea
            placeholder="Mô tả về bộ đề..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            Giá (coin)
          </label>
          <input
            id="quiz-set-price"
            type="number"
            min={0}
            step={1}
            placeholder="0 = Miễn phí"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
          />
          <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
            Để 0 nếu miễn phí. Khi bán trên Marketplace, giá phải từ{" "}
            <span className="font-semibold text-amber-400">{minPrice}</span> đến{" "}
            <span className="font-semibold text-amber-400">{maxPrice}</span>{" "}
            coin.
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--border)] pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-[var(--foreground)]">
            Danh sách Câu hỏi ({questions.length})
          </h3>
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div
              key={idx}
              className="p-4 bg-[var(--second-card)] border border-[var(--border)] rounded-2xl flex justify-between items-start gap-4"
            >
              <div>
                <QuizTypeBadge type={q.type} />
                <p className="text-[var(--foreground)] font-medium text-sm">
                  {q.questionText}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveQuestion(idx)}
                className="text-red-400 hover:text-red-500"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {!showQuestionForm ? (
          <button
            type="button"
            onClick={() => setShowQuestionForm(true)}
            className="w-full py-4 border-2 border-dashed border-[var(--border)] rounded-2xl text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all font-semibold flex flex-col items-center justify-center gap-2"
          >
            <Plus className="w-6 h-6" />
            Thêm Câu hỏi mới
          </button>
        ) : (
          <QuizQuestionForm
            onAdd={handleAddQuestion}
            onCancel={() => setShowQuestionForm(false)}
          />
        )}
      </div>

      <div className="border-t border-[var(--border)] pt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || questions.length === 0}
          className="px-8 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEditing ? "Lưu thay đổi" : "Xuất bản Bộ đề"}
        </button>
      </div>
    </div>
  );
}

export default QuizSetForm;
