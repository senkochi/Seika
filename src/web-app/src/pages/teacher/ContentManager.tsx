import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  HelpCircle,
  FileText,
  DollarSign,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useAppSelector } from "../../store/hooks";
import { flashcardsService, quizzesService } from "../../api";
import type { CardSetResponse, QuizResponse, QuizType, Card } from "../../api";
import { showSuccess, showError } from "../../components/toast/toastUtils";

function ContentManager() {
  const { userId } = useAppSelector((state) => state.userProfile);
  const [activeTab, setActiveTab] = useState<"flashcards" | "quizzes">(
    "flashcards",
  );

  // State danh sách
  const [flashcardSets, setFlashcardSets] = useState<CardSetResponse[]>([]);
  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Trạng thái Form
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Dữ liệu Form Flashcard Set
  const [setTitle, setSetTitle] = useState("");
  const [setDescription, setSetDescription] = useState("");
  const [setPrice, setSetPrice] = useState<number>(0);
  const [cards, setCards] = useState<Card[]>([{ front: "", back: "" }]);

  // Dữ liệu Form Quiz
  const [quizText, setQuizText] = useState("");
  const [quizType, setQuizType] = useState<QuizType>("MULTIPLE_CHOICE");
  const [mcqOptions, setMcqOptions] = useState<string[]>(["", "", "", ""]);
  const [mcqCorrectIndex, setMcqCorrectIndex] = useState<number>(0);
  const [matchingPairs, setMatchingPairs] = useState<
    { key: string; val: string }[]
  >([{ key: "", val: "" }]);
  const [reorderItems, setReorderItems] = useState<string[]>(["", ""]);
  const [blankAnswers, setBlankAnswers] = useState<string[]>([""]);

  // Fetch dữ liệu
  const loadData = async () => {
    if (!userId) return;
    setLoadingList(true);
    try {
      if (activeTab === "flashcards") {
        const sets = await flashcardsService.getByAuthorId(userId);
        setFlashcardSets(sets);
      } else {
        const response = await quizzesService.getAll();
        // Lọc các quiz do giáo viên này tạo ra
        const myQuizzes = (response.data || []).filter(
          (q) => q.createdBy === userId,
        );
        setQuizzes(myQuizzes);
      }
    } catch (err) {
      console.error(err);
      showError("Failed to load content list.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, userId]);

  // Thêm / Xóa card trong Form Flashcard
  const handleAddCard = () => {
    setCards([...cards, { front: "", back: "" }]);
  };

  const handleRemoveCard = (index: number) => {
    if (cards.length === 1) return;
    setCards(cards.filter((_, i) => i !== index));
  };

  const handleCardChange = (
    index: number,
    field: "front" | "back",
    val: string,
  ) => {
    const newCards = [...cards];
    newCards[index][field] = val;
    setCards(newCards);
  };

  // Submit tạo Flashcard Set
  const handleSubmitFlashcardSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setTitle.trim()) return showError("Title is required.");
    if (cards.some((c) => !c.front.trim() || !c.back.trim())) {
      return showError("All cards must have front and back content.");
    }

    setLoadingSubmit(true);
    try {
      await flashcardsService.create({
        title: setTitle,
        description: setDescription,
        price: Number(setPrice),
        cards: cards,
      });
      showSuccess("Flashcard Set created successfully!");
      // Reset form
      setSetTitle("");
      setSetDescription("");
      setSetPrice(0);
      setCards([{ front: "", back: "" }]);
      setIsCreatingSet(false);
      loadData();
    } catch (err) {
      console.error(err);
      showError("Failed to create Flashcard Set.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Thêm/Xóa phần tử động trong Form Quiz
  const handleAddMatchingPair = () => {
    setMatchingPairs([...matchingPairs, { key: "", val: "" }]);
  };
  const handleRemoveMatchingPair = (index: number) => {
    if (matchingPairs.length === 1) return;
    setMatchingPairs(matchingPairs.filter((_, i) => i !== index));
  };
  const handleMatchingChange = (
    index: number,
    field: "key" | "val",
    val: string,
  ) => {
    const newPairs = [...matchingPairs];
    newPairs[index][field] = val;
    setMatchingPairs(newPairs);
  };

  const handleAddReorderItem = () => {
    setReorderItems([...reorderItems, ""]);
  };
  const handleRemoveReorderItem = (index: number) => {
    if (reorderItems.length === 2) return;
    setReorderItems(reorderItems.filter((_, i) => i !== index));
  };

  const handleAddBlankAnswer = () => {
    setBlankAnswers([...blankAnswers, ""]);
  };
  const handleRemoveBlankAnswer = (index: number) => {
    if (blankAnswers.length === 1) return;
    setBlankAnswers(blankAnswers.filter((_, i) => i !== index));
  };

  // Submit tạo Quiz
  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizText.trim()) return showError("Question text is required.");

    // Xây dựng payload dựa trên QuizType
    const payload: any = {
      questionText: quizText,
      type: quizType,
    };

    if (quizType === "MULTIPLE_CHOICE") {
      if (mcqOptions.some((o) => !o.trim())) {
        return showError("Please fill in all MCQ options.");
      }
      payload.options = mcqOptions;
      payload.correctOptionIndex = mcqCorrectIndex;
    } else if (quizType === "MATCHING") {
      if (matchingPairs.some((p) => !p.key.trim() || !p.val.trim())) {
        return showError("Please fill in all matching pairs.");
      }
      const pairRecord: Record<string, string> = {};
      matchingPairs.forEach((p) => {
        pairRecord[p.key] = p.val;
      });
      payload.matchingPairs = pairRecord;
    } else if (quizType === "REORDER") {
      if (reorderItems.some((item) => !item.trim())) {
        return showError("Please fill in all reorder items.");
      }
      payload.correctOrder = reorderItems;
    } else if (quizType === "FILL_IN_THE_BLANK") {
      if (blankAnswers.some((ans) => !ans.trim())) {
        return showError("Please fill in all accepted blank answers.");
      }
      if (!quizText.includes("_")) {
        return showError(
          "Question text must contain an underscore '_' to represent the blank.",
        );
      }
      payload.acceptedAnswers = blankAnswers;
    }

    setLoadingSubmit(true);
    try {
      await quizzesService.create(payload);
      showSuccess("Quiz Question created successfully!");
      // Reset form
      setQuizText("");
      setMcqOptions(["", "", "", ""]);
      setMcqCorrectIndex(0);
      setMatchingPairs([{ key: "", val: "" }]);
      setReorderItems(["", ""]);
      setBlankAnswers([""]);
      setIsCreatingQuiz(false);
      loadData();
    } catch (err) {
      console.error(err);
      showError("Failed to create Quiz.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="p-8">
      {/* Title */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            Content Manager
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Create, configure and manage your learning material (Flashcards and
            Quizzes).
          </p>
        </div>
        {!isCreatingSet && !isCreatingQuiz && (
          <button
            onClick={() => {
              if (activeTab === "flashcards") setIsCreatingSet(true);
              else setIsCreatingQuiz(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-[var(--primary)] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            {activeTab === "flashcards"
              ? "New Flashcard Set"
              : "New Quiz Question"}
          </button>
        )}
      </div>

      {/* Tabs */}
      {!isCreatingSet && !isCreatingQuiz && (
        <div className="flex gap-4 border-b border-[var(--border)] mb-8">
          <button
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
            onClick={() => setActiveTab("quizzes")}
            className={`px-4 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "quizzes"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Quizzes (Questions)
          </button>
        </div>
      )}

      {/* Main List Section */}
      {!isCreatingSet && !isCreatingQuiz && (
        <div>
          {loadingList ? (
            <div className="flex flex-col items-center justify-center p-20 text-[var(--muted-foreground)] gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
              <p>Fetching your published material...</p>
            </div>
          ) : activeTab === "flashcards" ? (
            /* Flashcard List */
            flashcardSets.length === 0 ? (
              <div className="text-center p-20 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
                <p className="text-[var(--muted-foreground)] mb-4">
                  You haven't created any Flashcard set yet.
                </p>
                <button
                  onClick={() => setIsCreatingSet(true)}
                  className="px-4 py-2 bg-purple-900/40 text-purple-300 border border-purple-800 rounded-xl text-sm font-semibold"
                >
                  Create one now
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {flashcardSets.map((set) => (
                  <div
                    key={set.id}
                    className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between hover:border-[var(--primary)] transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-semibold rounded-full">
                          {set.cards.length} cards
                        </span>
                        <span className="flex items-center text-yellow-400 font-bold text-sm">
                          <DollarSign className="w-4 h-4" />
                          {set.price > 0 ? `${set.price} Coins` : "Free"}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
                        {set.title}
                      </h3>
                      <p className="text-[var(--muted-foreground)] text-sm line-clamp-3 mb-6">
                        {set.description || "No description provided."}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] pt-4 border-t border-[var(--border)]">
                      <span>Created by you</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : /* Quiz List */
          quizzes.length === 0 ? (
            <div className="text-center p-20 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
              <p className="text-[var(--muted-foreground)] mb-4">
                You haven't created any Quiz Question yet.
              </p>
              <button
                onClick={() => setIsCreatingQuiz(true)}
                className="px-4 py-2 bg-purple-900/40 text-purple-300 border border-purple-800 rounded-xl text-sm font-semibold"
              >
                Create one now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--primary)] transition-all flex items-start justify-between gap-6"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full">
                        {quiz.type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h4 className="text-[var(--foreground)] font-bold text-base mb-2">
                      {quiz.questionText}
                    </h4>
                    {/* MCQ Options Display */}
                    {quiz.type === "MULTIPLE_CHOICE" && quiz.options && (
                      <div className="grid grid-cols-2 gap-2 mt-4 max-w-lg">
                        {quiz.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-xl border text-sm flex items-center gap-2 ${
                              oIdx === quiz.correctOptionIndex
                                ? "border-green-500/50 bg-green-500/5"
                                : "border-[var(--border)] bg-[var(--second-card)]"
                            }`}
                          >
                            <span className="font-bold text-purple-400">
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            <span className="text-[var(--foreground)]">
                              {opt}
                            </span>
                            {oIdx === quiz.correctOptionIndex && (
                              <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE FLASHCARD SET FORM */}
      {isCreatingSet && (
        <form
          onSubmit={handleSubmitFlashcardSet}
          className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl space-y-6"
        >
          <div className="border-b border-[var(--border)] pb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Create New Flashcard Set
            </h2>
            <button
              type="button"
              onClick={() => setIsCreatingSet(false)}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Cancel
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
                  Set Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. English Grammar Essentials"
                  value={setTitle}
                  onChange={(e) => setSetTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Describe what students will learn from this deck..."
                  value={setDescription}
                  onChange={(e) => setSetDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
                  Marketplace Price (Coins)
                </label>
                <div className="relative">
                  <DollarSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <input
                    type="number"
                    min={0}
                    placeholder="0 for Free"
                    value={setPrice}
                    onChange={(e) => setSetPrice(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                  />
                </div>
                <p className="text-[var(--muted-foreground)] text-xs mt-2">
                  Set price above 0 if you want students to buy this card set
                  from the marketplace.
                </p>
              </div>
            </div>
          </div>

          {/* Cards Section */}
          <div className="border-t border-[var(--border)] pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--primary)]" />
                Cards List ({cards.length})
              </h3>
              <button
                type="button"
                onClick={handleAddCard}
                className="px-4 py-2 bg-purple-900/40 text-purple-300 border border-purple-800 rounded-xl text-xs font-semibold"
              >
                + Add Card
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
                      placeholder="Front Side (Term / Question)"
                      required
                      value={card.front}
                      onChange={(e) =>
                        handleCardChange(index, "front", e.target.value)
                      }
                      className="px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                    />
                    <input
                      type="text"
                      placeholder="Back Side (Definition / Answer)"
                      required
                      value={card.back}
                      onChange={(e) =>
                        handleCardChange(index, "back", e.target.value)
                      }
                      className="px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={cards.length === 1}
                    onClick={() => handleRemoveCard(index)}
                    className="p-2 text-red-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t border-[var(--border)] pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreatingSet(false)}
              className="px-6 py-3 border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loadingSubmit}
              className="px-8 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {loadingSubmit && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish Set
            </button>
          </div>
        </form>
      )}

      {/* CREATE QUIZ QUESTION FORM */}
      {isCreatingQuiz && (
        <form
          onSubmit={handleSubmitQuiz}
          className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 max-w-3xl mx-auto shadow-2xl space-y-6"
        >
          <div className="border-b border-[var(--border)] pb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Create New Quiz Question
            </h2>
            <button
              type="button"
              onClick={() => setIsCreatingQuiz(false)}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
                  Question Type
                </label>
                <select
                  value={quizType}
                  onChange={(e) => setQuizType(e.target.value as QuizType)}
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                >
                  <option value="MULTIPLE_CHOICE" className="bg-[var(--card)]">
                    Multiple Choice (MCQ)
                  </option>
                  <option value="MATCHING" className="bg-[var(--card)]">
                    Matching Pairs
                  </option>
                  <option value="REORDER" className="bg-[var(--card)]">
                    Reorder Elements
                  </option>
                  <option
                    value="FILL_IN_THE_BLANK"
                    className="bg-[var(--card)]"
                  >
                    Fill in the Blank
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--foreground)] mb-2">
                Question Text
              </label>
              <textarea
                required
                placeholder={
                  quizType === "FILL_IN_THE_BLANK"
                    ? "e.g. Paris is the capital of _."
                    : "e.g. What is the value of 2 + 2?"
                }
                value={quizText}
                onChange={(e) => setQuizText(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] resize-none"
              />
              {quizType === "FILL_IN_THE_BLANK" && (
                <p className="text-[var(--muted-foreground)] text-xs mt-1">
                  * Must include at least one underscore character "_" to
                  represent the blank space.
                </p>
              )}
            </div>

            {/* MCQ Fields */}
            {quizType === "MULTIPLE_CHOICE" && (
              <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                <label className="block text-sm font-bold text-[var(--foreground)]">
                  MCQ Options & Correct Index
                </label>
                <div className="space-y-3">
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
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...mcqOptions];
                          newOpts[idx] = e.target.value;
                          setMcqOptions(newOpts);
                        }}
                        className="flex-1 px-4 py-2.5 bg-[var(--second-card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MATCHING Fields */}
            {quizType === "MATCHING" && (
              <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-[var(--foreground)]">
                    Matching Pairs (Key & Value)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMatchingPair}
                    className="px-3 py-1 bg-purple-900/40 text-purple-300 border border-purple-800 rounded-lg text-xs font-semibold"
                  >
                    + Add Pair
                  </button>
                </div>
                <div className="space-y-3">
                  {matchingPairs.map((pair, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Keyword (e.g. Dog)"
                        value={pair.key}
                        onChange={(e) =>
                          handleMatchingChange(idx, "key", e.target.value)
                        }
                        className="flex-1 px-4 py-2.5 bg-[var(--second-card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
                      />
                      <span className="text-[var(--muted-foreground)]">⇔</span>
                      <input
                        type="text"
                        required
                        placeholder="Matches with (e.g. Canine)"
                        value={pair.val}
                        onChange={(e) =>
                          handleMatchingChange(idx, "val", e.target.value)
                        }
                        className="flex-1 px-4 py-2.5 bg-[var(--second-card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={matchingPairs.length === 1}
                        onClick={() => handleRemoveMatchingPair(idx)}
                        className="text-red-400 hover:text-red-500 disabled:opacity-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REORDER Fields */}
            {quizType === "REORDER" && (
              <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-[var(--foreground)]">
                    Items in Correct Order
                  </label>
                  <button
                    type="button"
                    onClick={handleAddReorderItem}
                    className="px-3 py-1 bg-purple-900/40 text-purple-300 border border-purple-800 rounded-lg text-xs font-semibold"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {reorderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="font-bold text-xs text-[var(--muted-foreground)] w-6 text-center">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        required
                        placeholder={`Element ${idx + 1} in order`}
                        value={item}
                        onChange={(e) => {
                          const newItems = [...reorderItems];
                          newItems[idx] = e.target.value;
                          setReorderItems(newItems);
                        }}
                        className="flex-1 px-4 py-2.5 bg-[var(--second-card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={reorderItems.length === 2}
                        onClick={() => handleRemoveReorderItem(idx)}
                        className="text-red-400 hover:text-red-500 disabled:opacity-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FILL_IN_THE_BLANK Fields */}
            {quizType === "FILL_IN_THE_BLANK" && (
              <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-[var(--foreground)]">
                    Accepted Correct Answers
                  </label>
                  <button
                    type="button"
                    onClick={handleAddBlankAnswer}
                    className="px-3 py-1 bg-purple-900/40 text-purple-300 border border-purple-800 rounded-lg text-xs font-semibold"
                  >
                    + Add Alternative Answer
                  </button>
                </div>
                <div className="space-y-3">
                  {blankAnswers.map((ans, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="text"
                        required
                        placeholder={`Correct answer ${idx + 1}`}
                        value={ans}
                        onChange={(e) => {
                          const newAns = [...blankAnswers];
                          newAns[idx] = e.target.value;
                          setBlankAnswers(newAns);
                        }}
                        className="flex-1 px-4 py-2.5 bg-[var(--second-card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={blankAnswers.length === 1}
                        onClick={() => handleRemoveBlankAnswer(idx)}
                        className="text-red-400 hover:text-red-500 disabled:opacity-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="border-t border-[var(--border)] pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreatingQuiz(false)}
              className="px-6 py-3 border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loadingSubmit}
              className="px-8 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {loadingSubmit && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish Quiz
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ContentManager;
