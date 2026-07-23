import { BookOpen, Target, RefreshCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { marketplaceApi, Product } from "@/api";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";

function ProductCard({
  emoji,
  title,
  description,
  ctaLabel,
  onClick,
}: {
  emoji: string;
  title: string;
  description: string;
  ctaLabel: string;
  onClick: () => void;
}) {
  const { t } = useTranslation("learning");

  return (
    <SectionCard className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <StatusPill variant="info">{t("productCard.ownedBadge")}</StatusPill>
      </div>

      <div className="aspect-[4/3] w-full rounded-xl bg-white/[0.03] border border-white/[0.06] grid place-items-center mb-4">
        <span aria-hidden="true" className="text-3xl">
          {emoji}
        </span>
      </div>

      <h3 className="font-sans-ui text-base font-semibold text-cream mb-2 line-clamp-2">
        {title}
      </h3>

      <p className="font-sans-ui text-sm text-white/55 line-clamp-2 flex-1 mb-5">
        {description || t("productCard.noDescription")}
      </p>

      <Button variant="primary" size="md" className="w-full" onClick={onClick}>
        {ctaLabel}
      </Button>
    </SectionCard>
  );
}

function LearningHub() {
  const { t } = useTranslation("learning");
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState<Product[]>([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(true);
  const [flashcardPage, setFlashcardPage] = useState(0);
  const [flashcardSize, setFlashcardSize] = useState(8);
  const [flashcardTotalPages, setFlashcardTotalPages] = useState(0);
  const [flashcardTotalElements, setFlashcardTotalElements] = useState(0);

  const [quizzes, setQuizzes] = useState<Product[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [quizPage, setQuizPage] = useState(0);
  const [quizSize, setQuizSize] = useState(8);
  const [quizTotalPages, setQuizTotalPages] = useState(0);
  const [quizTotalElements, setQuizTotalElements] = useState(0);

  const fetchFlashcards = async () => {
    setFlashcardsLoading(true);
    try {
      const res = await marketplaceApi.getMyInventoryPaginated(
        "FLASHCARD",
        flashcardPage,
        flashcardSize,
      );
      setFlashcards(res.data.content);
      setFlashcardTotalPages(res.data.totalPages);
      setFlashcardTotalElements(res.data.totalElements);
    } catch (error) {
      console.error("Failed to fetch flashcards", error);
    } finally {
      setFlashcardsLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    setQuizzesLoading(true);
    try {
      const res = await marketplaceApi.getMyInventoryPaginated(
        "QUIZ",
        quizPage,
        quizSize,
      );
      setQuizzes(res.data.content);
      setQuizTotalPages(res.data.totalPages);
      setQuizTotalElements(res.data.totalElements);
    } catch (error) {
      console.error("Failed to fetch quizzes", error);
    } finally {
      setQuizzesLoading(false);
    }
  };

  useEffect(() => {
    void fetchFlashcards();
  }, [flashcardPage, flashcardSize]);

  useEffect(() => {
    void fetchQuizzes();
  }, [quizPage, quizSize]);

  const refreshAll = () => {
    void fetchFlashcards();
    void fetchQuizzes();
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title={t("hub.title")}
        subtitle={t("hub.subtitle")}
        actions={
          <Button
            variant="ghost"
            size="md"
            onClick={refreshAll}
            disabled={flashcardsLoading || quizzesLoading}
          >
            <RefreshCcw
              className={`h-4 w-4 ${
                flashcardsLoading || quizzesLoading ? "animate-spin" : ""
              }`}
              aria-hidden="true"
            />
            {t("common:actions.refresh")}
          </Button>
        }
      />

      <div className="space-y-12">
        {/* Flashcard Decks */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="w-4 h-4 text-[#d4a843]" aria-hidden="true" />
            <h2 className="font-sans-ui text-base font-semibold text-cream">
              {t("hub.flashcardSection")}
            </h2>
          </div>

          {flashcardsLoading ? (
            <div className="font-sans-ui text-white/55 text-sm">
              {t("hub.loading")}
            </div>
          ) : flashcards.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-5 h-5" aria-hidden="true" />}
              title={t("emptyState.flashcard.title")}
              description={t("emptyState.flashcard.description")}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {flashcards.map((deck) => (
                  <ProductCard
                    key={deck.id}
                    emoji="📚"
                    title={deck.name}
                    description={deck.description || ""}
                    ctaLabel={t("productCard.studyFlashcard")}
                    onClick={() =>
                      navigate(
                        `/student/dashboard/flashcard/${deck.referenceId}`,
                      )
                    }
                  />
                ))}
              </div>
              <div className="mt-8">
                <Pagination
                  currentPage={flashcardPage}
                  totalPages={flashcardTotalPages}
                  totalElements={flashcardTotalElements}
                  pageSize={flashcardSize}
                  onPageChange={setFlashcardPage}
                  onPageSizeChange={(newSize) => {
                    setFlashcardSize(newSize);
                    setFlashcardPage(0);
                  }}
                  pageSizeOptions={[8, 16, 32]}
                />
              </div>
            </>
          )}
        </section>

        {/* Quiz Center */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-[#d4a843]" aria-hidden="true" />
            <h2 className="font-sans-ui text-base font-semibold text-cream">
              {t("hub.quizSection")}
            </h2>
          </div>

          {quizzesLoading ? (
            <div className="font-sans-ui text-white/55 text-sm">
              {t("hub.loading")}
            </div>
          ) : quizzes.length === 0 ? (
            <EmptyState
              icon={<Target className="w-5 h-5" aria-hidden="true" />}
              title={t("emptyState.quiz.title")}
              description={t("emptyState.quiz.description")}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {quizzes.map((quiz) => (
                  <ProductCard
                    key={quiz.id}
                    emoji="❓"
                    title={quiz.name}
                    description={quiz.description || ""}
                    ctaLabel={t("productCard.takeQuiz")}
                    onClick={() =>
                      navigate(`/student/dashboard/quiz/${quiz.referenceId}`)
                    }
                  />
                ))}
              </div>
              <div className="mt-8">
                <Pagination
                  currentPage={quizPage}
                  totalPages={quizTotalPages}
                  totalElements={quizTotalElements}
                  pageSize={quizSize}
                  onPageChange={setQuizPage}
                  onPageSizeChange={(newSize) => {
                    setQuizSize(newSize);
                    setQuizPage(0);
                  }}
                  pageSizeOptions={[8, 16, 32]}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default LearningHub;
