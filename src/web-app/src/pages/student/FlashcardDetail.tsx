import {
  useState,
  useEffect,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
  Keyboard,
  Volume2,
} from "lucide-react";
import StudentBadge from "@/components/student/StudentBadge";
import StudentActionButton from "@/components/student/StudentActionButton";
import GridBackground from "@/layouts/GridBackground";
import { flashcardsService } from "@/api/services/flashcards";
import { rewardsService } from "@/api/services/rewards";
import type { CardSetResponse, RewardStatusResponse } from "@/api/types";
import { useAppDispatch } from "@/store/hooks";
import { fetchCurrentUserProfile } from "@/store/userProfileSlice";

function FlashcardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [deck, setDeck] = useState<CardSetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [rewardStatus, setRewardStatus] = useState<RewardStatusResponse | null>(
    null,
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answers, setAnswers] = useState<("correct" | "incorrect" | null)[]>(
    [],
  );
  const [isCompleted, setIsCompleted] = useState(false);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchDeck = async () => {
      try {
        const data = await flashcardsService.getById(id);
        setDeck(data);
        setAnswers(new Array(data.cards.length).fill(null));

        try {
          const status = await rewardsService.getRewardStatus("FLASHCARD", id);
          setRewardStatus(status);
        } catch (statusErr) {
          console.error("Failed to fetch reward status:", statusErr);
        }
      } catch (err) {
        console.error("Failed to fetch flashcard deck:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeck();
  }, [id]);

  useEffect(() => {
    if (isCompleted && id) {
      const submitCompletion = async () => {
        if (rewardStatus?.eligible) {
          try {
            await flashcardsService.complete(id);
            dispatch(fetchCurrentUserProfile());
          } catch (err) {
            console.error("Failed to submit flashcard completion reward:", err);
          }
        }
      };
      submitCompletion();
    }
  }, [isCompleted, id, rewardStatus, dispatch]);

  const cards = deck?.cards || [];

  // Keyboard controls helper
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted || !deck || cards.length === 0) return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === "ArrowLeft" || e.key === "1") {
        if (isFlipped) {
          handleAnswer(false);
        }
      } else if (e.key === "ArrowRight" || e.key === "2") {
        if (isFlipped) {
          handleAnswer(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, isCompleted, currentIndex, deck, cards]);

  const handleSpeak = (
    e: React.MouseEvent<HTMLButtonElement>,
    text: string,
  ) => {
    e.stopPropagation();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentIndex] = isCorrect ? "correct" : "incorrect";
    setAnswers(updatedAnswers);
    setShowTip(false);

    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 300); // smooth slide-flip transition
    } else {
      setIsCompleted(true);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setAnswers(new Array(cards.length).fill(null));
    setIsCompleted(false);
    setShowTip(false);
  };

  if (loading) {
    return (
      <div className="relative isolate min-h-[100dvh] w-full flex items-center justify-center bg-[var(--background)]">
        <p className="text-white">Loading flashcards...</p>
      </div>
    );
  }

  if (!deck || cards.length === 0) {
    return (
      <div className="relative isolate min-h-[100dvh] w-full flex items-center justify-center bg-[var(--background)]">
        <p className="text-white">No flashcards found.</p>
      </div>
    );
  }

  const correctCount = answers.filter((a) => a === "correct").length;
  const masteredPercentage = Math.round((correctCount / cards.length) * 100);

  const cardInnerStyle = {
    transformStyle: "preserve-3d" as const,
    transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
  };

  const cardFaceStyle = {
    WebkitBackfaceVisibility: "hidden" as const,
    backfaceVisibility: "hidden" as const,
  };

  const cardBackStyle = {
    WebkitBackfaceVisibility: "hidden" as const,
    backfaceVisibility: "hidden" as const,
    transform: "rotateY(180deg)",
  };

  return (
    <div className="relative isolate min-h-[100dvh] w-full overflow-hidden bg-[var(--background)] flex flex-col font-sans">
      <GridBackground />

      {/* Decorative Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-10 bg-[rgba(24,18,45,0.9)] border-b border-[var(--border)] px-8 py-4 shadow-[0_12px_40px_rgba(10,10,20,0.18)] backdrop-blur-xl flex items-center justify-between">
        <button
          onClick={() => navigate("/student/dashboard/learning")}
          className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-white transition-colors bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[var(--border)] px-4 py-2.5 rounded-xl text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Session</span>
        </button>

        <div className="text-center hidden md:block">
          <p className="text-xs text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">
            Flashcard Deck
          </p>
          <h1 className="text-xl font-black text-white flex items-center gap-2 justify-center">
            <span>📚</span>
            <span>{deck.title}</span>
          </h1>
        </div>

        <StudentBadge variant="purple" className="px-4 py-1.5">
          Epic
        </StudentBadge>
      </header>

      {/* Page Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center p-6 md:p-8">
        {!isCompleted ? (
          <div className="w-full max-w-xl flex flex-col items-center gap-6">
            {/* Progress Area */}
            <div className="w-full">
              <div className="flex justify-between items-center text-sm font-bold text-[var(--muted-foreground)] mb-2">
                <span>
                  Card {currentIndex + 1} of {cards.length}
                </span>
                <span className="text-[var(--primary-light)]">
                  {Math.round((currentIndex / cards.length) * 100)}% Complete
                </span>
              </div>
              <div className="w-full h-3 bg-[var(--muted)] border border-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${(currentIndex / cards.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Flashcard Component */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full aspect-[4/3] min-h-[300px] md:min-h-[360px] cursor-pointer"
              style={{ perspective: "1000px" }}
            >
              <div
                className="relative w-full h-full text-center transition-all duration-500"
                style={cardInnerStyle}
              >
                {/* FRONT FACE */}
                <div
                  className="absolute inset-0 w-full h-full flex flex-col justify-between p-8 rounded-3xl border border-purple-500/30 bg-[#18122d] shadow-2xl transition-all hover:border-purple-500/50 hover:shadow-[0_20px_50px_rgba(168,85,247,0.15)]"
                  style={cardFaceStyle}
                >
                  <div className="flex justify-between items-center text-xs text-[var(--muted-foreground)] font-bold tracking-wider uppercase">
                    <span>Front Side</span>
                    <span className="text-purple-400/80">{deck.title}</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <p className="text-3xl md:text-5xl font-black text-white max-w-md leading-relaxed px-4 tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                      {cards[currentIndex].frontSide}
                    </p>
                    <button
                      onClick={(e) =>
                        handleSpeak(e, cards[currentIndex].frontSide)
                      }
                      className="p-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-white rounded-full transition-all duration-200 shadow-md hover:scale-105 active:scale-95 flex items-center justify-center"
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-xs text-[var(--muted-foreground)] font-semibold flex items-center justify-center gap-1.5 animate-pulse">
                    <span>Click card to reveal answer</span>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* BACK FACE */}
                <div
                  className="absolute inset-0 w-full h-full flex flex-col justify-between p-8 rounded-3xl border border-amber-500/30 bg-[#1c163a] shadow-2xl transition-all hover:border-amber-500/50 hover:shadow-[0_20px_50px_rgba(245,158,11,0.15)]"
                  style={cardBackStyle}
                >
                  <div className="flex justify-between items-center text-xs text-[var(--muted-foreground)] font-bold tracking-wider uppercase">
                    <span>Back Side</span>
                    <span className="text-amber-400 font-extrabold tracking-widest">
                      Answer Revealed
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <p className="text-3xl md:text-5xl font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent px-4 tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                      {cards[currentIndex].backSide}
                    </p>
                    <button
                      onClick={(e) =>
                        handleSpeak(e, cards[currentIndex].backSide)
                      }
                      className="p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-white rounded-full transition-all duration-200 shadow-md hover:scale-105 active:scale-95 flex items-center justify-center"
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between w-full">
                    <div />
                    <div className="text-xs text-[var(--muted-foreground)] font-semibold flex items-center justify-center gap-1.5">
                      <span>Click card to show question</span>
                      <RotateCcw className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] bg-[rgba(0,0,0,0.2)] px-4 py-2.5 rounded-full border border-[var(--border)] shadow-sm">
              <Keyboard className="w-4 h-4 text-[var(--primary)]" />
              <span>
                <strong>Space</strong>: Flip | <strong>Left/Right Arrow</strong>
                : Got It / Review
              </span>
            </div>

            {/* Study Actions */}
            <div className="w-full flex gap-4 mt-2">
              {isFlipped ? (
                <>
                  <button
                    onClick={() => handleAnswer(false)}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 active:scale-98 rounded-2xl py-4 font-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    <span>Review Again (1)</span>
                  </button>
                  <button
                    onClick={() => handleAnswer(true)}
                    className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 active:scale-98 rounded-2xl py-4 font-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    <span>Got It! (2)</span>
                  </button>
                </>
              ) : (
                <StudentActionButton
                  size="lg"
                  onClick={() => setIsFlipped(true)}
                >
                  <RotateCcw className="w-5 h-5" />
                  Reveal Answer
                </StudentActionButton>
              )}
            </div>
          </div>
        ) : (
          /* CELEBRATION VIEW */
          <div className="w-full max-w-lg bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-8 text-center shadow-2xl relative animate-[fadeIn_0.5s_ease-out]">
            {/* Glow accent behind trophy */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="w-24 h-24 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border border-amber-300/40 animate-bounce">
              <Trophy className="w-12 h-12 text-purple-950" />
            </div>

            <h2 className="text-3xl font-black mb-2 text-white">
              Deck Completed!
            </h2>
            <p className="text-[var(--muted-foreground)] mb-8">
              Outstanding work! You've successfully completed the {deck.title}{" "}
              session.
            </p>

            {/* Stats Summary Card */}
            <div className="bg-[var(--second-card)] border border-[var(--border)] rounded-2xl p-6 mb-8 grid grid-cols-2 gap-4">
              <div className="text-center border-r border-[var(--border)]">
                <p className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider mb-1">
                  XP Gained
                </p>
                <div className="flex items-center justify-center gap-1 text-[var(--primary-light)]">
                  <Zap className="w-5 h-5 fill-current" />
                  <span className="text-3xl font-black">
                    {rewardStatus?.eligible ? "+100" : "+0"}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider mb-1">
                  Coins Earned
                </p>
                <div className="flex items-center justify-center gap-1 text-amber-400">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-3xl font-black">
                    {rewardStatus?.eligible ? "+50" : "+0"}
                  </span>
                </div>
              </div>

              {rewardStatus && !rewardStatus.eligible && (
                <div className="col-span-2 mt-2 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl text-xs font-bold text-center">
                  ⏱️ Đang trong thời gian chờ (cooldown 1 ngày). Bạn sẽ đủ điều
                  kiện nhận XP/Coin tiếp theo sau:{" "}
                  {rewardStatus.nextEligibleAt
                    ? new Date(rewardStatus.nextEligibleAt).toLocaleString(
                        "vi-VN",
                      )
                    : "1 ngày"}
                </div>
              )}

              <div className="col-span-2 pt-4 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider mb-1">
                  Mastery Score
                </p>
                <p className="text-2xl font-black text-white">
                  {correctCount} / {cards.length} Cards
                </p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  ({masteredPercentage}% accuracy)
                </p>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-col gap-3">
              <StudentActionButton
                size="lg"
                onClick={() => navigate("/student/dashboard/learning")}
              >
                Return to Learning Hub
              </StudentActionButton>

              <button
                onClick={handleReset}
                className="w-full py-4 text-base rounded-2xl bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--second-muted)] font-black transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Study Again
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default FlashcardDetail;
