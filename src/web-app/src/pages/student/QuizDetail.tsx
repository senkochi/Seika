import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Zap,
  Target,
  ShieldCheck,
} from "lucide-react";
import GridBackground from "@/layouts/GridBackground";
import { quizzesService } from "@/api/services/quizzes";
import { rewardsService } from "@/api/services/rewards";
import type { QuizSetResponse, RewardStatusResponse } from "@/api/types";
import { useAppDispatch } from "@/store/hooks";
import { fetchCurrentUserProfile } from "@/store/userProfileSlice";
import { Button } from "@/components/ui/Button";
import { IconChip } from "@/components/ui/IconChip";
import { StatusPill } from "@/components/ui/StatusPill";
import { SectionCard } from "@/components/ui/SectionCard";

// Import custom quiz components
import MultipleChoiceQuiz from "@/components/student/quiz/MultipleChoiceQuiz";
import MatchingQuiz from "@/components/student/quiz/MatchingQuiz";
import ReorderQuiz from "@/components/student/quiz/ReorderQuiz";
import FillInBlankQuiz from "@/components/student/quiz/FillInBlankQuiz";

export default function QuizDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const isAdmin = location.pathname.startsWith("/admin");
  const backPath = isAdmin
    ? "/admin/dashboard/moderation"
    : "/student/dashboard/learning";

  const [quizSet, setQuizSet] = useState<QuizSetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [rewardStatus, setRewardStatus] = useState<RewardStatusResponse | null>(
    null,
  );

  useEffect(() => {
    if (!id) return;
    const fetchQuiz = async () => {
      try {
        const res = await quizzesService.getQuizSetById(id);
        setQuizSet(res.data);

        if (!isAdmin) {
          try {
            const status = await rewardsService.getRewardStatus("QUIZ", id);
            setRewardStatus(status);
          } catch (statusErr) {
            console.error("Failed to fetch reward status:", statusErr);
          }
        }
      } catch (err) {
        console.error("Failed to fetch quiz set", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  const questions = quizSet?.quizzes || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // States for user answers in the current question
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null,
  );
  const [userAnswer, setUserAnswer] = useState("");
  const [userOrder, setUserOrder] = useState<string[]>([]);
  const [userMatches, setUserMatches] = useState<Record<string, string>>({});

  // History of quiz answers (correct or incorrect)
  const [scoreHistory, setScoreHistory] = useState<boolean[]>([]);

  const currentQuestion = questions[currentIndex];

  // Reset inputs when moving to a new question
  useEffect(() => {
    setSelectedOptionIndex(null);
    setUserAnswer("");
    setUserOrder([]);
    setUserMatches({});
    setIsSubmitted(false);
  }, [currentIndex, id]);

  const hasProvidedInput = () => {
    if (!currentQuestion) return false;
    switch (currentQuestion.type) {
      case "MULTIPLE_CHOICE":
        return selectedOptionIndex !== null;
      case "FILL_IN_THE_BLANK":
        return userAnswer.trim().length > 0;
      case "REORDER":
        return userOrder.length > 0;
      case "MATCHING":
        return (
          Object.keys(userMatches).length ===
          Object.keys(currentQuestion.matchingPairs || {}).length
        );
      default:
        return false;
    }
  };

  const handleCheckAnswer = () => {
    if (isSubmitted) return;

    let correct = false;
    switch (currentQuestion.type) {
      case "MULTIPLE_CHOICE":
        correct = selectedOptionIndex === currentQuestion.correctOptionIndex;
        break;
      case "FILL_IN_THE_BLANK":
        correct = (currentQuestion.acceptedAnswers || []).some(
          (ans) => ans.trim().toLowerCase() === userAnswer.trim().toLowerCase(),
        );
        break;
      case "REORDER":
        correct =
          JSON.stringify(userOrder) ===
          JSON.stringify(currentQuestion.correctOrder);
        break;
      case "MATCHING":
        correct = Object.keys(currentQuestion.matchingPairs || {}).every(
          (key) =>
            (currentQuestion.matchingPairs || {})[key] === userMatches[key],
        );
        break;
    }

    setScoreHistory((prev) => [...prev, correct]);
    setIsSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsSubmitted(false);
    setIsCompleted(false);
    setSelectedOptionIndex(null);
    setUserAnswer("");
    setUserOrder([]);
    setUserMatches({});
    setScoreHistory([]);
  };

  const correctCount = scoreHistory.filter((val) => val === true).length;
  const accuracyPercentage =
    questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;

  const eligiblePassed = !!(rewardStatus?.eligible && accuracyPercentage >= 70);

  useEffect(() => {
    if (isCompleted && id && questions.length > 0) {
      const submitQuizScores = async () => {
        if (!isAdmin && eligiblePassed) {
          try {
            await quizzesService.submitQuiz(id, accuracyPercentage);
            dispatch(fetchCurrentUserProfile());
          } catch (err) {
            console.error("Failed to submit quiz score reward:", err);
          }
        }
      };
      submitQuizScores();
    }
  }, [
    isCompleted,
    id,
    eligiblePassed,
    accuracyPercentage,
    questions.length,
    dispatch,
    isAdmin,
  ]);

  // Compute proportional XP and Coin gains
  const gainedXp = eligiblePassed
    ? Math.round(100 * (correctCount / questions.length))
    : 0;
  const gainedCoins = eligiblePassed
    ? Math.round(50 * (correctCount / questions.length))
    : 0;

  if (loading) {
    return (
      <div className="relative isolate min-h-[100dvh] w-full flex items-center justify-center bg-[#15091e]">
        <p className="font-sans-ui text-white/55">Đang tải quiz…</p>
      </div>
    );
  }

  if (!quizSet || questions.length === 0) {
    return (
      <div className="relative isolate min-h-[100dvh] w-full flex items-center justify-center bg-[#15091e]">
        <p className="font-sans-ui text-white/55">Không tìm thấy quiz.</p>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-[100dvh] w-full overflow-hidden bg-[#15091e] flex flex-col font-sans-ui">
      <GridBackground />

      {/* Header Bar — hairline, not glass */}
      <header className="relative z-10 bg-[#15091e]/80 backdrop-blur-md border-b border-white/[0.06] px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-2 font-sans-ui text-sm font-medium text-white/55 hover:text-cream bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{isAdmin ? "Quay lại trang duyệt" : "Thoát quiz"}</span>
        </button>

        <div className="text-center hidden md:block">
          <p className="font-sans-ui text-xs text-white/45 uppercase tracking-[0.12em]">
            Quiz session
          </p>
          <h1 className="font-sans-ui text-base font-semibold text-cream flex items-center gap-2 justify-center mt-1">
            <span aria-hidden="true">❓</span>
            <span>{quizSet.title}</span>
          </h1>
        </div>

        <StatusPill variant="info">Epic</StatusPill>
      </header>

      {isAdmin && (
        <div className="relative z-10 bg-sky-400/10 border-b border-sky-400/25 px-8 py-3 flex items-center justify-between text-sky-200">
          <div className="flex items-center gap-2 font-sans-ui text-sm font-medium">
            <ShieldCheck className="w-4 h-4 text-sky-300" aria-hidden="true" />
            <span>Chế độ xem trước dành cho Admin (Admin Preview Mode)</span>
          </div>
          <button
            onClick={() => navigate("/admin/dashboard/moderation")}
            className="rounded-md bg-sky-400/20 px-3 py-1.5 font-sans-ui text-xs font-medium text-sky-200 hover:bg-sky-400/30 transition-colors"
          >
            Quay lại trang duyệt
          </button>
        </div>
      )}

      {/* Page Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center p-6 md:p-8">
        {!isCompleted ? (
          <div className="w-full max-w-2xl flex flex-col items-center gap-6">
            {/* Progress Area */}
            <div className="w-full">
              <div className="flex justify-between items-center font-sans-ui text-xs text-white/55 mb-2">
                <span className="flex items-center gap-1.5 tabular-nums">
                  <Target className="w-4 h-4 text-[#d4a843]" aria-hidden="true" />
                  Câu {currentIndex + 1} / {questions.length}
                </span>
                <span className="tabular-nums text-[#d4a843]">
                  {Math.round((currentIndex / questions.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-white/[0.04] border border-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#d4a843] rounded-full transition-all duration-300"
                  style={{
                    width: `${(currentIndex / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Dynamic Question Render */}
            <div className="w-full flex-1 flex items-center">
              {currentQuestion.type === "MULTIPLE_CHOICE" && (
                <MultipleChoiceQuiz
                  questionText={currentQuestion.questionText}
                  options={currentQuestion.options || []}
                  selectedOptionIndex={selectedOptionIndex}
                  correctOptionIndex={currentQuestion.correctOptionIndex || 0}
                  isSubmitted={isSubmitted}
                  onSelectOption={setSelectedOptionIndex}
                />
              )}

              {currentQuestion.type === "MATCHING" && (
                <MatchingQuiz
                  questionText={currentQuestion.questionText}
                  matchingPairs={currentQuestion.matchingPairs || {}}
                  userMatches={userMatches}
                  isSubmitted={isSubmitted}
                  onMatchesChange={setUserMatches}
                />
              )}

              {currentQuestion.type === "REORDER" && (
                <ReorderQuiz
                  questionText={currentQuestion.questionText}
                  correctOrder={currentQuestion.correctOrder || []}
                  userOrder={userOrder}
                  isSubmitted={isSubmitted}
                  onOrderChange={setUserOrder}
                />
              )}

              {currentQuestion.type === "FILL_IN_THE_BLANK" && (
                <FillInBlankQuiz
                  questionText={currentQuestion.questionText}
                  acceptedAnswers={currentQuestion.acceptedAnswers || []}
                  userAnswer={userAnswer}
                  isSubmitted={isSubmitted}
                  onAnswerChange={setUserAnswer}
                />
              )}
            </div>

            {/* Actions Bar */}
            <div className="w-full flex justify-end mt-4">
              {!isSubmitted ? (
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!hasProvidedInput()}
                  onClick={handleCheckAnswer}
                  className="w-full md:w-auto md:px-12"
                >
                  Kiểm tra đáp án
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleNextQuestion}
                  className="w-full md:w-auto md:px-12"
                >
                  {currentIndex + 1 < questions.length
                    ? "Câu tiếp theo"
                    : "Hoàn thành quiz"}
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* CELEBRATION VIEW — flat, hairline, no animation theatre */
          <SectionCard className="max-w-lg w-full text-center">
            <div className="flex flex-col items-center gap-4 pt-2">
              <IconChip variant="gold" className="h-12 w-12">
                <Trophy className="w-5 h-5" aria-hidden="true" />
              </IconChip>
              <div>
                <StatusPill
                  variant={
                    accuracyPercentage >= 70 ? "success" : "warning"
                  }
                >
                  {accuracyPercentage >= 70
                    ? "Đã hoàn thành"
                    : "Cần luyện thêm"}
                </StatusPill>
                <h2 className="font-sans-ui text-2xl font-semibold text-cream mt-3 tracking-tight">
                  Hoàn thành quiz!
                </h2>
                <p className="font-sans-ui text-sm text-white/55 mt-2">
                  Bạn vừa hoàn thành phiên "{quizSet.title}".
                </p>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="mt-6 bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 grid grid-cols-2 gap-6 font-sans-ui">
              <div className="text-center border-r border-white/[0.06]">
                <p className="text-[10px] text-white/45 uppercase tracking-[0.12em] mb-1">
                  XP gained
                </p>
                <div className="flex items-center justify-center gap-1 text-cream">
                  <Zap className="w-4 h-4 text-[#d4a843]" aria-hidden="true" />
                  <span className="text-2xl font-semibold tabular-nums">
                    +{gainedXp}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-white/45 uppercase tracking-[0.12em] mb-1">
                  Coins earned
                </p>
                <div className="flex items-center justify-center gap-1 text-cream">
                  <span className="text-2xl font-semibold tabular-nums">
                    +{gainedCoins}
                  </span>
                </div>
              </div>

              {rewardStatus && !rewardStatus.eligible && (
                <div className="col-span-2 px-4 py-3 bg-amber-400/10 border border-amber-400/25 text-amber-300 rounded-lg text-xs text-center">
                  Chỉ nhận thưởng Quiz trong lần hoàn thành đầu tiên. Bạn đã
                  làm bài này rồi.
                </div>
              )}

              {rewardStatus?.eligible && accuracyPercentage < 70 && (
                <div className="col-span-2 px-4 py-3 bg-red-400/10 border border-red-400/25 text-red-300 rounded-lg text-xs text-center">
                  Bạn cần đạt tối thiểu 70% độ chính xác để nhận Coin & XP
                  (hiện tại: {accuracyPercentage}%).
                </div>
              )}

              <div className="col-span-2 pt-4 border-t border-white/[0.06]">
                <p className="text-[10px] text-white/45 uppercase tracking-[0.12em] mb-1">
                  Accuracy score
                </p>
                <p className="text-xl font-semibold text-cream tabular-nums">
                  {correctCount} / {questions.length} đúng
                </p>
                <p className="text-xs text-white/55 mt-1 tabular-nums">
                  {accuracyPercentage}% độ chính xác
                </p>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="mt-6 flex flex-col gap-3 font-sans-ui">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => navigate(backPath)}
              >
                {isAdmin ? "Quay lại trang duyệt" : "Về Learning Hub"}
              </Button>

              <Button
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Làm lại
              </Button>
            </div>
          </SectionCard>
        )}
      </main>
    </div>
  );
}