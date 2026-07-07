import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

import type { QuizType } from "../../../api";
import { showError } from "../../toast/toastUtils";

interface MatchingPair {
  key: string;
  val: string;
}

export interface QuestionDraft {
  questionText: string;
  type: QuizType;
  options?: string[];
  correctOptionIndex?: number;
  matchingPairs?: Record<string, string>;
  correctOrder?: string[];
  acceptedAnswers?: string[];
}

interface QuizQuestionFormProps {
  onAdd: (draft: QuestionDraft) => void;
  onCancel: () => void;
}

const QUIZ_TYPE_OPTIONS: { value: QuizType; label: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "Trắc nghiệm (MCQ)" },
  { value: "MATCHING", label: "Ghép cặp" },
  { value: "REORDER", label: "Sắp xếp thứ tự" },
  { value: "FILL_IN_THE_BLANK", label: "Điền vào chỗ trống" },
];

function QuizQuestionForm({ onAdd, onCancel }: QuizQuestionFormProps) {
  const [quizText, setQuizText] = useState<string>("");
  const [quizType, setQuizType] = useState<QuizType>("MULTIPLE_CHOICE");
  const [mcqOptions, setMcqOptions] = useState<string[]>(["", "", "", ""]);
  const [mcqCorrectIndex, setMcqCorrectIndex] = useState<number>(0);
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>([
    { key: "", val: "" },
  ]);
  const [reorderItems, setReorderItems] = useState<string[]>(["", ""]);
  const [blankAnswers, setBlankAnswers] = useState<string[]>([""]);

  const handleSubmit = () => {
    if (!quizText.trim()) return showError("Nội dung câu hỏi là bắt buộc.");

    const payload: QuestionDraft = { questionText: quizText, type: quizType };

    if (quizType === "MULTIPLE_CHOICE") {
      if (mcqOptions.some((o) => !o.trim())) {
        return showError("Vui lòng điền đầy đủ các lựa chọn MCQ.");
      }
      payload.options = mcqOptions;
      payload.correctOptionIndex = mcqCorrectIndex;
    } else if (quizType === "MATCHING") {
      if (matchingPairs.some((p) => !p.key.trim() || !p.val.trim())) {
        return showError("Vui lòng điền đầy đủ các cặp matching.");
      }
      const pairRecord: Record<string, string> = {};
      matchingPairs.forEach((p) => {
        pairRecord[p.key] = p.val;
      });
      payload.matchingPairs = pairRecord;
    } else if (quizType === "REORDER") {
      if (reorderItems.some((item) => !item.trim())) {
        return showError("Vui lòng điền đầy đủ các phần tử reorder.");
      }
      payload.correctOrder = reorderItems;
    } else if (quizType === "FILL_IN_THE_BLANK") {
      if (blankAnswers.some((ans) => !ans.trim())) {
        return showError("Vui lòng điền đầy đủ các đáp án được chấp nhận.");
      }
      if (!quizText.includes("_")) {
        return showError(
          "Nội dung câu hỏi phải chứa dấu gạch dưới '_' để đại diện cho chỗ trống.",
        );
      }
      payload.acceptedAnswers = blankAnswers;
    }

    onAdd(payload);
  };

  return (
    <div className="p-6 bg-[rgba(255,255,255,0.02)] border border-[var(--border)] rounded-2xl space-y-4 relative">
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <X className="w-5 h-5" />
      </button>
      <h4 className="font-bold text-[var(--foreground)]">Soạn Câu hỏi</h4>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
            Loại câu hỏi
          </label>
          <select
            value={quizType}
            onChange={(e) => setQuizType(e.target.value as QuizType)}
            className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
          >
            {QUIZ_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
          Nội dung câu hỏi
        </label>
        <textarea
          required
          placeholder={
            quizType === "FILL_IN_THE_BLANK"
              ? "VD: Paris là thủ đô của _."
              : "Nhập câu hỏi..."
          }
          value={quizText}
          onChange={(e) => setQuizText(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none resize-none"
        />
      </div>

      {quizType === "MULTIPLE_CHOICE" && (
        <div className="space-y-3">
          <label className="block text-sm font-bold text-[var(--foreground)]">
            Các lựa chọn & Đáp án đúng
          </label>
          {mcqOptions.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                type="radio"
                name="correct-option"
                checked={mcqCorrectIndex === idx}
                onChange={() => setMcqCorrectIndex(idx)}
                className="w-4 h-4 text-purple-600 focus:ring-purple-500"
              />
              <span className="font-bold text-sm text-[var(--muted-foreground)] w-6">
                {String.fromCharCode(65 + idx)}
              </span>
              <input
                type="text"
                required
                value={opt}
                onChange={(e) => {
                  const newOpts = [...mcqOptions];
                  newOpts[idx] = e.target.value;
                  setMcqOptions(newOpts);
                }}
                className="flex-1 px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      {quizType === "MATCHING" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-bold text-[var(--foreground)]">
              Cặp ghép (Key ↔ Value)
            </label>
            <button
              type="button"
              onClick={() =>
                setMatchingPairs([...matchingPairs, { key: "", val: "" }])
              }
              className="px-3 py-1 bg-purple-900/40 text-purple-300 rounded-lg text-xs"
            >
              + Thêm
            </button>
          </div>
          {matchingPairs.map((pair, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Từ khoá"
                value={pair.key}
                onChange={(e) => {
                  const newP = [...matchingPairs];
                  newP[idx].key = e.target.value;
                  setMatchingPairs(newP);
                }}
                className="flex-1 px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
              />
              <span className="text-[var(--muted-foreground)]">⇔</span>
              <input
                type="text"
                placeholder="Ghép với"
                value={pair.val}
                onChange={(e) => {
                  const newP = [...matchingPairs];
                  newP[idx].val = e.target.value;
                  setMatchingPairs(newP);
                }}
                className="flex-1 px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
              />
              <button
                type="button"
                disabled={matchingPairs.length === 1}
                onClick={() =>
                  setMatchingPairs(matchingPairs.filter((_, i) => i !== idx))
                }
                className="text-red-400 hover:text-red-500 disabled:opacity-30"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {quizType === "REORDER" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-bold text-[var(--foreground)]">
              Thứ tự đúng
            </label>
            <button
              type="button"
              onClick={() => setReorderItems([...reorderItems, ""])}
              className="px-3 py-1 bg-purple-900/40 text-purple-300 rounded-lg text-xs"
            >
              + Thêm
            </button>
          </div>
          {reorderItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="font-bold text-xs text-[var(--muted-foreground)] w-6 text-center">
                {idx + 1}
              </span>
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const newI = [...reorderItems];
                  newI[idx] = e.target.value;
                  setReorderItems(newI);
                }}
                className="flex-1 px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
              />
              <button
                type="button"
                disabled={reorderItems.length === 2}
                onClick={() =>
                  setReorderItems(reorderItems.filter((_, i) => i !== idx))
                }
                className="text-red-400 hover:text-red-500 disabled:opacity-30"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {quizType === "FILL_IN_THE_BLANK" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-bold text-[var(--foreground)]">
              Đáp án được chấp nhận
            </label>
            <button
              type="button"
              onClick={() => setBlankAnswers([...blankAnswers, ""])}
              className="px-3 py-1 bg-purple-900/40 text-purple-300 rounded-lg text-xs"
            >
              + Thêm
            </button>
          </div>
          {blankAnswers.map((ans, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                type="text"
                value={ans}
                onChange={(e) => {
                  const newA = [...blankAnswers];
                  newA[idx] = e.target.value;
                  setBlankAnswers(newA);
                }}
                className="flex-1 px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
              />
              <button
                type="button"
                disabled={blankAnswers.length === 1}
                onClick={() =>
                  setBlankAnswers(blankAnswers.filter((_, i) => i !== idx))
                }
                className="text-red-400 hover:text-red-500 disabled:opacity-30"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-bold rounded-xl"
        >
          <Plus className="w-4 h-4 inline-block mr-1" />
          Thêm vào Bộ đề
        </button>
      </div>
    </div>
  );
}

export default QuizQuestionForm;