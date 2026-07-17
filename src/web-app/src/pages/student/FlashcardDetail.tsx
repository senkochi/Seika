import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  X,
  RotateCcw,
  Trophy,
  Zap,
  Keyboard,
  Volume2,
  ShieldCheck,
} from "lucide-react";
import GridBackground from "@/layouts/GridBackground";
import { flashcardsService } from "@/api/services/flashcards";
import { rewardsService } from "@/api/services/rewards";
import type { CardSetResponse, RewardStatusResponse } from "@/api/types";
import { useAppDispatch } from "@/store/hooks";
import { fetchCurrentUserProfile } from "@/store/userProfileSlice";
import { Button } from "@/components/ui/Button";
import { IconChip } from "@/components/ui/IconChip";
import { StatusPill } from "@/components/ui/StatusPill";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "react-i18next";
import { useActiveLocale } from "@/hooks/useActiveLocale";

function FlashcardDetail() {
  const { t } = useTranslation(["learning", "common"]);
  const locale = useActiveLocale();
  const dateLocale = locale === "vi" ? "vi-VN" : "en-US";
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const isAdmin = location.pathname.startsWith("/admin");
  const backPath = isAdmin
    ? "/admin/dashboard/moderation"
    : "/student/dashboard/learning";

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

  useEffect(() => {
    if (!id) return;
    const fetchDeck = async () => {
      try {
        const data = await flashcardsService.getById(id);
        setDeck(data);
        setAnswers(new Array(data.cards.length).fill(null));

        if (!isAdmin) {
          try {
            const status = await rewardsService.getRewardStatus(
              "FLASHCARD",
              id,
            );
            setRewardStatus(status);
          } catch (statusErr) {
            console.error("Failed to fetch reward status:", statusErr);
          }
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
        if (!isAdmin && rewardStatus?.eligible) {
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
  }, [isCompleted, id, rewardStatus, dispatch, isAdmin]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 300);
    } else {
      setIsCompleted(true);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setAnswers(new Array(cards.length).fill(null));
    setIsCompleted(false);
  };

  if (loading) {
    return (
      <div className="relative isolate min-h-[100dvh] w-full flex items-center justify-center bg-[#15091e]">
        <p className="font-sans-ui text-white/55">
          {t("learning:flashcardDetail.loading")}
        </p>
      </div>
    );
  }

  if (!deck || cards.length === 0) {
    return (
      <div className="relative isolate min-h-[100dvh] w-full flex items-center justify-center bg-[#15091e]">
        <p className="font-sans-ui text-white/55">
          {t("learning:flashcardDetail.notFound")}
        </p>
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
    <div className="relative isolate min-h-[100dvh] w-full overflow-hidden bg-[#15091e] flex flex-col font-sans-ui">
      <GridBackground />

      {/* Header Bar — hairline, not glass */}
      <header className="relative z-10 bg-[#15091e]/80 backdrop-blur-md border-b border-white/[0.06] px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-2 font-sans-ui text-sm font-medium text-white/55 hover:text-cream bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>
            {isAdmin
              ? t("learning:sessionCommon.backToModeration")
              : t("learning:flashcardDetail.exitSession")}
          </span>
        </button>

        <div className="text-center hidden md:block">
          <p className="font-sans-ui text-xs text-white/45 uppercase tracking-[0.12em]">
            Flashcard deck
          </p>
          <h1 className="font-sans-ui text-base font-semibold text-cream flex items-center gap-2 justify-center mt-1">
            <span aria-hidden="true">📚</span>
            <span>{deck.title}</span>
          </h1>
        </div>

        <StatusPill variant="info">Epic</StatusPill>
      </header>

      {isAdmin && (
        <div className="relative z-10 bg-sky-400/10 border-b border-sky-400/25 px-8 py-3 flex items-center justify-between text-sky-200">
          <div className="flex items-center gap-2 font-sans-ui text-sm font-medium">
            <ShieldCheck className="w-4 h-4 text-sky-300" aria-hidden="true" />
            <span>{t("learning:sessionCommon.adminPreview")}</span>
          </div>
          <button
            onClick={() => navigate("/admin/dashboard/moderation")}
            className="rounded-md bg-sky-400/20 px-3 py-1.5 font-sans-ui text-xs font-medium text-sky-200 hover:bg-sky-400/30 transition-colors"
          >
            {t("learning:sessionCommon.backToModeration")}
          </button>
        </div>
      )}

      {/* Page Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center p-6 md:p-8">
        {!isCompleted ? (
          <div className="w-full max-w-xl flex flex-col items-center gap-6">
            {/* Progress Area */}
            <div className="w-full">
              <div className="flex justify-between items-center font-sans-ui text-xs text-white/55 mb-2">
                <span className="tabular-nums">
                  {t("learning:flashcardDetail.progressCard", {
                    current: currentIndex + 1,
                    total: cards.length,
                  })}
                </span>
                <span className="tabular-nums text-[#d4a843]">
                  {Math.round((currentIndex / cards.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-white/[0.04] border border-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#d4a843] rounded-full transition-all duration-300"
                  style={{ width: `${(currentIndex / cards.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Flashcard Component */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full aspect-[4/3] min-h-[300px] md:min-h-[360px] cursor-pointer"
              style={{ perspective: "1000px" }}
              role="button"
              aria-label={
                isFlipped
                  ? t("learning:flashcardDetail.ariaReveal")
                  : t("learning:flashcardDetail.ariaFlip")
              }
            >
              <div
                className="relative w-full h-full text-center"
                style={cardInnerStyle}
              >
                {/* FRONT FACE */}
                <div
                  className="absolute inset-0 w-full h-full flex flex-col justify-between p-8 rounded-2xl border border-white/[0.08] bg-[#1c0f2e]"
                  style={cardFaceStyle}
                >
                  <div className="flex justify-between items-center font-sans-ui text-[10px] text-white/45 uppercase tracking-[0.12em]">
                    <span>{t("learning:flashcardDetail.frontLabel")}</span>
                    <span>{deck.title}</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <p className="font-sans-ui text-3xl md:text-5xl font-semibold text-cream max-w-md leading-tight px-4 tracking-tight">
                      {cards[currentIndex].frontSide}
                    </p>
                    <button
                      onClick={(e) =>
                        handleSpeak(e, cards[currentIndex].frontSide)
                      }
                      className="p-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/65 hover:text-cream rounded-full transition-colors flex items-center justify-center"
                      title={t("learning:flashcardDetail.speakTitle")}
                      aria-label={t("learning:flashcardDetail.speakTitle")}
                    >
                      <Volume2 className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="font-sans-ui text-xs text-white/45 flex items-center justify-center gap-1.5">
                    <span>{t("learning:flashcardDetail.clickToFlip")}</span>
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                </div>

                {/* BACK FACE */}
                <div
                  className="absolute inset-0 w-full h-full flex flex-col justify-between p-8 rounded-2xl border border-[#d4a843]/25 bg-[#1c0f2e]"
                  style={cardBackStyle}
                >
                  <div className="flex justify-between items-center font-sans-ui text-[10px] text-white/45 uppercase tracking-[0.12em]">
                    <span>{t("learning:flashcardDetail.backLabel")}</span>
                    <span className="text-[#d4a843] tracking-widest">
                      Answer revealed
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <p className="font-sans-ui text-3xl md:text-5xl font-semibold text-cream px-4 tracking-tight">
                      {cards[currentIndex].backSide}
                    </p>
                    <button
                      onClick={(e) =>
                        handleSpeak(e, cards[currentIndex].backSide)
                      }
                      className="p-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/65 hover:text-cream rounded-full transition-colors flex items-center justify-center"
                      title={t("learning:flashcardDetail.speakTitle")}
                      aria-label={t("learning:flashcardDetail.speakTitle")}
                    >
                      <Volume2 className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between w-full">
                    <div />
                    <div className="font-sans-ui text-xs text-white/45 flex items-center justify-center gap-1.5">
                      <span>
                        {t("learning:flashcardDetail.clickToQuestion")}
                      </span>
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="flex items-center gap-2 font-sans-ui text-xs text-white/55 bg-white/[0.02] px-4 py-2.5 rounded-full border border-white/[0.06]">
              <Keyboard className="w-4 h-4 text-[#d4a843]" aria-hidden="true" />
              <span>
                <strong>Space</strong>:{" "}
                {t("learning:flashcardDetail.shortcutFlip")} ·{" "}
                <strong>← / →</strong>:{" "}
                {t("learning:flashcardDetail.shortcutAnswer")}
              </span>
            </div>

            {/* Study Actions */}
            <div className="w-full flex gap-3 mt-2">
              {isFlipped ? (
                <>
                  <Button
                    variant="ghost"
                    tone="danger"
                    size="lg"
                    className="flex-1"
                    onClick={() => handleAnswer(false)}
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                    {t("learning:flashcardDetail.actionReview")}
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    onClick={() => handleAnswer(true)}
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                    {t("learning:flashcardDetail.actionMastered")}
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => setIsFlipped(true)}
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  {t("learning:flashcardDetail.actionFlipAnswer")}
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
                <StatusPill variant="success">
                  {t("learning:sessionCommon.completedBadge")}
                </StatusPill>
                <h2 className="font-sans-ui text-2xl font-semibold text-cream mt-3 tracking-tight">
                  {t("learning:flashcardDetail.completedTitle")}
                </h2>
                <p className="font-sans-ui text-sm text-white/55 mt-2">
                  {t("learning:flashcardDetail.completedDesc", {
                    title: deck.title,
                  })}
                </p>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="mt-6 bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 grid grid-cols-2 gap-6 font-sans-ui">
              <div className="text-center border-r border-white/[0.06]">
                <p className="text-[10px] text-white/45 uppercase tracking-[0.12em] mb-1">
                  {t("learning:sessionCommon.xpGained")}
                </p>
                <div className="flex items-center justify-center gap-1 text-cream">
                  <Zap className="w-4 h-4 text-[#d4a843]" aria-hidden="true" />
                  <span className="text-2xl font-semibold tabular-nums">
                    {rewardStatus?.eligible ? "+100" : "+0"}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-white/45 uppercase tracking-[0.12em] mb-1">
                  {t("learning:sessionCommon.coinsEarned")}
                </p>
                <div className="flex items-center justify-center gap-1 text-cream">
                  <span className="text-2xl font-semibold tabular-nums">
                    {rewardStatus?.eligible ? "+50" : "+0"}
                  </span>
                </div>
              </div>

              {rewardStatus && !rewardStatus.eligible && (
                <div className="col-span-2 px-4 py-3 bg-amber-400/10 border border-amber-400/25 text-amber-300 rounded-lg text-xs text-center">
                  {t("learning:flashcardDetail.cooldownNotice", {
                    time: rewardStatus.nextEligibleAt
                      ? new Date(rewardStatus.nextEligibleAt).toLocaleString(
                          dateLocale,
                        )
                      : t("learning:flashcardDetail.oneDay"),
                  })}
                </div>
              )}

              <div className="col-span-2 pt-4 border-t border-white/[0.06]">
                <p className="text-[10px] text-white/45 uppercase tracking-[0.12em] mb-1">
                  Mastery score
                </p>
                <p className="text-xl font-semibold text-cream tabular-nums">
                  {t("learning:flashcardDetail.masteryScore", {
                    correct: correctCount,
                    total: cards.length,
                  })}
                </p>
                <p className="text-xs text-white/55 mt-1 tabular-nums">
                  {t("learning:flashcardDetail.masteryPercentage", {
                    percent: masteredPercentage,
                  })}
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
                {isAdmin
                  ? t("learning:sessionCommon.backToModeration")
                  : t("learning:sessionCommon.backToLearningHub")}
              </Button>

              <Button
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                {t("learning:flashcardDetail.studyAgain")}
              </Button>
            </div>
          </SectionCard>
        )}
      </main>
    </div>
  );
}

export default FlashcardDetail;
