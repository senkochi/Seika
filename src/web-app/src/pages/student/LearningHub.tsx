import { BookOpen, Target, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { marketplaceApi, Product } from "@/api";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

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
  return (
    <SectionCard className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <StatusPill variant="info">Đã sở hữu</StatusPill>
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
        {description || "Chưa có mô tả"}
      </p>

      <Button variant="primary" size="md" className="w-full" onClick={onClick}>
        {ctaLabel}
      </Button>
    </SectionCard>
  );
}

function LearningHub() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await marketplaceApi.getMyInventory();
      setInventory(res.data);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const flashcards = inventory.filter((item) => item.type === "FLASHCARD");
  const quizzes = inventory.filter((item) => item.type === "QUIZ");

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title="Trung tâm học tập"
        subtitle="Chọn bộ thẻ hoặc bài quiz đã mua và bắt đầu ôn luyện."
        actions={
          <Button
            variant="ghost"
            size="md"
            onClick={fetchInventory}
            disabled={loading}
          >
            <RefreshCcw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Làm mới
          </Button>
        }
      />

      {loading ? (
        <div className="font-sans-ui text-white/55 text-sm">
          Đang tải kho nội dung…
        </div>
      ) : (
        <>
          {/* Flashcard Decks */}
          <section>
            <div className="flex items-center gap-2 mb-5">
              <BookOpen
                className="w-4 h-4 text-[#d4a843]"
                aria-hidden="true"
              />
              <h2 className="font-sans-ui text-base font-semibold text-cream">
                Bộ flashcard
              </h2>
            </div>

            {flashcards.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-5 h-5" aria-hidden="true" />}
                title="Chưa có bộ flashcard nào"
                description="Mua bộ thẻ từ Marketplace để bắt đầu học."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {flashcards.map((deck) => (
                  <ProductCard
                    key={deck.id}
                    emoji="📚"
                    title={deck.name}
                    description={deck.description || ""}
                    ctaLabel="Học ngay"
                    onClick={() =>
                      navigate(
                        `/student/dashboard/flashcard/${deck.referenceId}`,
                      )
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {/* Quiz Center */}
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Target className="w-4 h-4 text-[#d4a843]" aria-hidden="true" />
              <h2 className="font-sans-ui text-base font-semibold text-cream">
                Quiz
              </h2>
            </div>

            {quizzes.length === 0 ? (
              <EmptyState
                icon={<Target className="w-5 h-5" aria-hidden="true" />}
                title="Chưa có bộ quiz nào"
                description="Mua bài quiz từ Marketplace để bắt đầu luyện tập."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {quizzes.map((quiz) => (
                  <ProductCard
                    key={quiz.id}
                    emoji="❓"
                    title={quiz.name}
                    description={quiz.description || ""}
                    ctaLabel="Làm quiz"
                    onClick={() =>
                      navigate(`/student/dashboard/quiz/${quiz.referenceId}`)
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default LearningHub;