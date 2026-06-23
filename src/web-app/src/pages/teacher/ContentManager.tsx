import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  HelpCircle,
  FileText,
  DollarSign,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { fetchCurrentUserProfile } from "../../store/userProfileSlice";
import { flashcardsService, quizzesService } from "../../api";
import type {
  CardSetResponse,
  QuizSetResponse,
  QuizType,
  Card,
} from "../../api";
import { showSuccess, showError } from "../../components/toast/toastUtils";

// ────────────────────────────────────────────────────────────────
// Confirm Delete Dialog
// ────────────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmDialog({
  title,
  description,
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--card)] border border-red-500/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-red-900/30">
        <div className="flex items-start gap-4 mb-5">
          <div className="p-2 bg-red-500/10 rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
              {title}
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {description}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────
function ContentManager() {
  const dispatch = useAppDispatch();
  const { userId, status } = useAppSelector((state) => state.userProfile);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCurrentUserProfile());
    }
  }, [status, dispatch]);
  const [activeTab, setActiveTab] = useState<"flashcards" | "quiz-sets">(
    "flashcards",
  );

  // State danh sách
  const [flashcardSets, setFlashcardSets] = useState<CardSetResponse[]>([]);
  const [quizSets, setQuizSets] = useState<QuizSetResponse[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Trạng thái Form
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [isCreatingQuizSet, setIsCreatingQuizSet] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Confirm delete dialog
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "flashcard" | "quizset";
    id: string;
    title: string;
  } | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Dữ liệu Form Flashcard Set
  const [setTitle, setSetTitle] = useState("");
  const [setDescription, setSetDescription] = useState("");
  const [setPrice, setSetPrice] = useState<number>(0);
  const [cards, setCards] = useState<Card[]>([{ frontSide: "", backSide: "" }]);

  // Dữ liệu Form Quiz Set
  const [quizSetTitle, setQuizSetTitle] = useState("");
  const [quizSetDescription, setQuizSetDescription] = useState("");
  const [quizSetQuestions, setQuizSetQuestions] = useState<any[]>([]);

  // Dữ liệu Form cho câu hỏi đang tạo
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [quizText, setQuizText] = useState("");
  const [quizType, setQuizType] = useState<QuizType>("MULTIPLE_CHOICE");
  const [mcqOptions, setMcqOptions] = useState<string[]>(["", "", "", ""]);
  const [mcqCorrectIndex, setMcqCorrectIndex] = useState<number>(0);
  const [matchingPairs, setMatchingPairs] = useState<
    { key: string; val: string }[]
  >([{ key: "", val: "" }]);
  const [reorderItems, setReorderItems] = useState<string[]>(["", ""]);
  const [blankAnswers, setBlankAnswers] = useState<string[]>([""]);

  // ──────────────────────────────────────────
  // Data fetching
  // ──────────────────────────────────────────
  const loadData = async () => {
    if (!userId) return;
    setLoadingList(true);
    try {
      if (activeTab === "flashcards") {
        const sets = await flashcardsService.getByAuthorId(userId);
        setFlashcardSets(sets);
      } else {
        const response = await quizzesService.getMyQuizSets();
        setQuizSets(response.data || []);
      }
    } catch (err) {
      console.error(err);
      showError("Không thể tải danh sách nội dung.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, userId]);

  // ──────────────────────────────────────────
  // Flashcard form handlers
  // ──────────────────────────────────────────
  const handleAddCard = () => {
    setCards([...cards, { frontSide: "", backSide: "" }]);
  };

  const handleRemoveCard = (index: number) => {
    if (cards.length === 1) return;
    setCards(cards.filter((_, i) => i !== index));
  };

  const handleCardChange = (
    index: number,
    field: "frontSide" | "backSide",
    val: string,
  ) => {
    const newCards = [...cards];
    newCards[index][field] = val;
    setCards(newCards);
  };

  const handleSubmitFlashcardSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setTitle.trim()) return showError("Tiêu đề là bắt buộc.");
    if (cards.some((c) => !c.frontSide.trim() || !c.backSide.trim())) {
      return showError("Mỗi thẻ phải có nội dung mặt trước và mặt sau.");
    }

    setLoadingSubmit(true);
    try {
      await flashcardsService.create({
        title: setTitle,
        description: setDescription,
        price: Number(setPrice),
        cards: cards,
      });
      showSuccess("Flashcard Set đã được tạo thành công!");
      setSetTitle("");
      setSetDescription("");
      setSetPrice(0);
      setCards([{ frontSide: "", backSide: "" }]);
      setIsCreatingSet(false);
      loadData();
    } catch (err) {
      console.error(err);
      showError("Không thể tạo Flashcard Set.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  // ──────────────────────────────────────────
  // Quiz Set form handlers
  // ──────────────────────────────────────────
  const resetQuestionForm = () => {
    setQuizText("");
    setQuizType("MULTIPLE_CHOICE");
    setMcqOptions(["", "", "", ""]);
    setMcqCorrectIndex(0);
    setMatchingPairs([{ key: "", val: "" }]);
    setReorderItems(["", ""]);
    setBlankAnswers([""]);
    setShowQuestionForm(false);
  };

  const handleAddQuestionToSet = () => {
    if (!quizText.trim()) return showError("Nội dung câu hỏi là bắt buộc.");

    const payload: any = {
      questionText: quizText,
      type: quizType,
    };

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

    setQuizSetQuestions([...quizSetQuestions, payload]);
    resetQuestionForm();
  };

  const handleSubmitQuizSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizSetTitle.trim()) return showError("Tiêu đề bộ đề là bắt buộc.");
    if (quizSetQuestions.length === 0) {
      return showError("Bộ đề phải có ít nhất một câu hỏi.");
    }

    setLoadingSubmit(true);
    try {
      await quizzesService.createQuizSet({
        title: quizSetTitle,
        description: quizSetDescription,
        questions: quizSetQuestions,
      });
      showSuccess("Bộ đề Quiz đã được tạo thành công!");
      setQuizSetTitle("");
      setQuizSetDescription("");
      setQuizSetQuestions([]);
      setIsCreatingQuizSet(false);
      loadData();
    } catch (err) {
      console.error(err);
      showError("Không thể tạo Bộ đề Quiz.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  // ──────────────────────────────────────────
  // Delete handlers
  // ──────────────────────────────────────────
  const openDeleteDialog = (
    type: "flashcard" | "quizset",
    id: string,
    title: string,
  ) => {
    setDeleteTarget({ type, id, title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setLoadingDelete(true);
    try {
      if (deleteTarget.type === "flashcard") {
        await flashcardsService.deleteSet(deleteTarget.id);
        showSuccess("Đã xóa Flashcard Set thành công.");
      } else {
        await quizzesService.deleteQuizSet(deleteTarget.id);
        showSuccess("Đã xóa Bộ đề Quiz thành công.");
      }
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error(err);
      showError("Xóa thất bại. Vui lòng thử lại.");
    } finally {
      setLoadingDelete(false);
    }
  };

  // ──────────────────────────────────────────
  // Quiz type badge color
  // ──────────────────────────────────────────
  const quizTypeBadge = (type: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      MULTIPLE_CHOICE: {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        label: "Trắc nghiệm",
      },
      MATCHING: {
        bg: "bg-violet-500/10",
        text: "text-violet-400",
        label: "Ghép cặp",
      },
      REORDER: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        label: "Sắp xếp",
      },
      FILL_IN_THE_BLANK: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        label: "Điền từ",
      },
    };
    return (
      map[type] ?? { bg: "bg-gray-500/10", text: "text-gray-400", label: type }
    );
  };

  // ──────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────
  return (
    <div className="p-8">
      {/* Confirm Delete Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          title={
            deleteTarget.type === "flashcard"
              ? "Xóa Flashcard Set?"
              : "Xóa Bộ đề Quiz?"
          }
          description={`Bạn có chắc chắn muốn xóa "${deleteTarget.title}" không? Hành động này không thể hoàn tác.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={loadingDelete}
        />
      )}

      {/* Header */}
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
        {!isCreatingSet && !isCreatingQuizSet && (
          <button
            id="btn-create-content"
            onClick={() => {
              if (activeTab === "flashcards") setIsCreatingSet(true);
              else setIsCreatingQuizSet(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-[var(--primary)] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            {activeTab === "flashcards" ? "Bộ Flashcard Mới" : "Bộ đề Quiz Mới"}
          </button>
        )}
      </div>

      {/* Tabs */}
      {!isCreatingSet && !isCreatingQuizSet && (
        <div className="flex gap-4 border-b border-[var(--border)] mb-8">
          <button
            id="tab-flashcards"
            onClick={() => setActiveTab("flashcards")}
            className={`px-4 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "flashcards"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Flashcard Sets
          </button>
          <button
            id="tab-quiz-sets"
            onClick={() => setActiveTab("quiz-sets")}
            className={`px-4 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "quiz-sets"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Quiz Sets (Bộ đề)
          </button>
        </div>
      )}

      {/* ── MAIN LIST ── */}
      {!isCreatingSet && !isCreatingQuizSet && (
        <div>
          {loadingList ? (
            <div className="flex flex-col items-center justify-center p-20 text-[var(--muted-foreground)] gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
              <p>Đang tải nội dung của bạn...</p>
            </div>
          ) : activeTab === "flashcards" ? (
            /* ── Flashcard List ── */
            flashcardSets.length === 0 ? (
              <div className="text-center p-20 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
                <BookOpen className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4 opacity-50" />
                <p className="text-[var(--muted-foreground)] mb-4">
                  Bạn chưa tạo bộ Flashcard nào.
                </p>
                <button
                  onClick={() => setIsCreatingSet(true)}
                  className="px-4 py-2 bg-purple-900/40 text-purple-300 border border-purple-800 rounded-xl text-sm font-semibold"
                >
                  Tạo ngay
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {flashcardSets.map((set) => (
                  <div
                    key={set.id}
                    className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between hover:border-[var(--primary)] transition-all group"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-semibold rounded-full">
                          {set.cards?.length || 0} thẻ
                        </span>
                        <span className="flex items-center text-yellow-400 font-bold text-sm">
                          <DollarSign className="w-4 h-4" />
                          {set.price > 0 ? `${set.price} Coins` : "Miễn phí"}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
                        {set.title}
                      </h3>
                      <p className="text-[var(--muted-foreground)] text-sm line-clamp-3 mb-6">
                        {set.description || "Chưa có mô tả."}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                      <span className="text-xs text-[var(--muted-foreground)]">
                        Tạo bởi bạn
                      </span>
                      <button
                        onClick={() =>
                          openDeleteDialog("flashcard", set.id, set.title)
                        }
                        className="p-2 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Xóa bộ thẻ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : /* ── Quiz Sets List ── */
          quizSets.length === 0 ? (
            <div className="text-center p-20 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
              <HelpCircle className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4 opacity-50" />
              <p className="text-[var(--muted-foreground)] mb-4">
                Bạn chưa tạo Bộ đề Quiz nào.
              </p>
              <button
                onClick={() => setIsCreatingQuizSet(true)}
                className="px-4 py-2 bg-purple-900/40 text-purple-300 border border-purple-800 rounded-xl text-sm font-semibold"
              >
                Tạo ngay
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizSets.map((set) => (
                <div
                  key={set.id}
                  className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between hover:border-[var(--primary)] transition-all group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full">
                        {set.quizzes?.length || 0} câu hỏi
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
                      {set.title}
                    </h3>
                    <p className="text-[var(--muted-foreground)] text-sm line-clamp-3 mb-6">
                      {set.description || "Chưa có mô tả."}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {new Date(set.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() =>
                        openDeleteDialog("quizset", set.id, set.title)
                      }
                      className="p-2 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Xóa bộ đề"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CREATE FLASHCARD SET FORM ── */}
      {isCreatingSet && (
        <form
          onSubmit={handleSubmitFlashcardSet}
          className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl space-y-6"
        >
          {/* Form details (same as before) */}
          <div className="border-b border-[var(--border)] pb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Tạo Bộ Flashcard Mới
            </h2>
            <button
              type="button"
              onClick={() => setIsCreatingSet(false)}
              className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
                  Tiêu đề Bộ thẻ
                </label>
                <input
                  type="text"
                  required
                  value={setTitle}
                  onChange={(e) => setSetTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
                  Mô tả
                </label>
                <textarea
                  value={setDescription}
                  onChange={(e) => setSetDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] resize-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
                Giá Marketplace (Coins)
              </label>
              <div className="relative">
                <DollarSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  type="number"
                  min={0}
                  value={setPrice}
                  onChange={(e) => setSetPrice(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--primary)]" />
                Danh sách Thẻ ({cards.length})
              </h3>
              <button
                type="button"
                onClick={handleAddCard}
                className="px-4 py-2 bg-purple-900/40 text-purple-300 border border-purple-800 rounded-xl text-xs font-semibold"
              >
                + Thêm thẻ
              </button>
            </div>
            <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-2">
              {cards.map((card, index) => (
                <div
                  key={index}
                  className="p-4 bg-[var(--second-card)] border border-[var(--border)] rounded-2xl flex gap-4 items-center"
                >
                  <span className="font-bold text-xs text-[var(--muted-foreground)] w-6 text-center">
                    {index + 1}
                  </span>
                  <div className="flex-1 grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Mặt trước"
                      required
                      value={card.frontSide}
                      onChange={(e) =>
                        handleCardChange(index, "frontSide", e.target.value)
                      }
                      className="px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Mặt sau"
                      required
                      value={card.backSide}
                      onChange={(e) =>
                        handleCardChange(index, "backSide", e.target.value)
                      }
                      className="px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={cards.length === 1}
                    onClick={() => handleRemoveCard(index)}
                    className="p-2 text-red-400 hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreatingSet(false)}
              className="px-6 py-3 border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loadingSubmit}
              className="px-8 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:opacity-90 flex items-center gap-2"
            >
              {loadingSubmit && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
              Xuất bản Bộ thẻ
            </button>
          </div>
        </form>
      )}

      {/* ── CREATE QUIZ SET FORM ── */}
      {isCreatingQuizSet && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl space-y-6">
          <div className="border-b border-[var(--border)] pb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Tạo Bộ Đề Quiz Mới
            </h2>
            <button
              onClick={() => setIsCreatingQuizSet(false)}
              className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Thông tin chung */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
                Tiêu đề Bộ đề
              </label>
              <input
                type="text"
                required
                placeholder="VD: Bài kiểm tra 15 phút Toán học"
                value={quizSetTitle}
                onChange={(e) => setQuizSetTitle(e.target.value)}
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
                Mô tả
              </label>
              <textarea
                placeholder="Mô tả về bộ đề..."
                value={quizSetDescription}
                onChange={(e) => setQuizSetDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Danh sách câu hỏi đã thêm */}
          <div className="border-t border-[var(--border)] pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                Danh sách Câu hỏi ({quizSetQuestions.length})
              </h3>
            </div>

            <div className="space-y-3">
              {quizSetQuestions.map((q, idx) => {
                const badge = quizTypeBadge(q.type);
                return (
                  <div
                    key={idx}
                    className="p-4 bg-[var(--second-card)] border border-[var(--border)] rounded-2xl flex justify-between items-start gap-4"
                  >
                    <div>
                      <span
                        className={`inline-block mb-2 px-2 py-0.5 ${badge.bg} ${badge.text} text-xs font-semibold rounded-md`}
                      >
                        {badge.label}
                      </span>
                      <p className="text-[var(--foreground)] font-medium text-sm">
                        {q.questionText}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setQuizSetQuestions(
                          quizSetQuestions.filter((_, i) => i !== idx),
                        )
                      }
                      className="text-red-400 hover:text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {!showQuestionForm ? (
              <button
                onClick={() => setShowQuestionForm(true)}
                className="w-full py-4 border-2 border-dashed border-[var(--border)] rounded-2xl text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all font-semibold flex flex-col items-center justify-center gap-2"
              >
                <Plus className="w-6 h-6" />
                Thêm Câu hỏi mới
              </button>
            ) : (
              <div className="p-6 bg-[rgba(255,255,255,0.02)] border border-[var(--border)] rounded-2xl space-y-4 relative">
                <button
                  onClick={resetQuestionForm}
                  className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <X className="w-5 h-5" />
                </button>
                <h4 className="font-bold text-[var(--foreground)]">
                  Soạn Câu hỏi
                </h4>

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
                      <option value="MULTIPLE_CHOICE">Trắc nghiệm (MCQ)</option>
                      <option value="MATCHING">Ghép cặp</option>
                      <option value="REORDER">Sắp xếp thứ tự</option>
                      <option value="FILL_IN_THE_BLANK">
                        Điền vào chỗ trống
                      </option>
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

                {/* MCQ Options */}
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

                {/* MATCHING Fields */}
                {quizType === "MATCHING" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-bold text-[var(--foreground)]">
                        Cặp ghép (Key ↔ Value)
                      </label>
                      <button
                        onClick={() =>
                          setMatchingPairs([
                            ...matchingPairs,
                            { key: "", val: "" },
                          ])
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
                        <span className="text-[var(--muted-foreground)]">
                          ⇔
                        </span>
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
                          disabled={matchingPairs.length === 1}
                          onClick={() =>
                            setMatchingPairs(
                              matchingPairs.filter((_, i) => i !== idx),
                            )
                          }
                          className="text-red-400 hover:text-red-500 disabled:opacity-30"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* REORDER Fields */}
                {quizType === "REORDER" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-bold text-[var(--foreground)]">
                        Thứ tự đúng
                      </label>
                      <button
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
                          disabled={reorderItems.length === 2}
                          onClick={() =>
                            setReorderItems(
                              reorderItems.filter((_, i) => i !== idx),
                            )
                          }
                          className="text-red-400 hover:text-red-500 disabled:opacity-30"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* FILL_IN_THE_BLANK Fields */}
                {quizType === "FILL_IN_THE_BLANK" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-bold text-[var(--foreground)]">
                        Đáp án được chấp nhận
                      </label>
                      <button
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
                          disabled={blankAnswers.length === 1}
                          onClick={() =>
                            setBlankAnswers(
                              blankAnswers.filter((_, i) => i !== idx),
                            )
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
                    onClick={handleAddQuestionToSet}
                    className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-bold rounded-xl"
                  >
                    Thêm vào Bộ đề
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-[var(--border)] pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreatingQuizSet(false)}
              className="px-6 py-3 border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmitQuizSet}
              disabled={loadingSubmit || quizSetQuestions.length === 0}
              className="px-8 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {loadingSubmit && <Loader2 className="w-4 h-4 animate-spin" />}
              Xuất bản Bộ đề
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContentManager;
