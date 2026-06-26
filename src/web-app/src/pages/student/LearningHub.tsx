import { BookOpen, Target } from "lucide-react";
import StudentActionButton from "@/components/student/StudentActionButton";
import StudentBadge from "@/components/student/StudentBadge";
import { useEffect, useState } from "react";
import { marketplaceApi, Product } from "@/api";
import { useNavigate } from "react-router-dom";

function LearningHub() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await marketplaceApi.getMyInventory();
        setInventory(res.data);
      } catch (error) {
        console.error("Failed to fetch inventory", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const flashcards = inventory.filter((item) => item.type === "FLASHCARD");
  const quizzes = inventory.filter((item) => item.type === "QUIZ");

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Learning Hub
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Choose your adventure and level up your skills!
        </p>
      </div>

      {loading ? (
        <p className="text-[var(--muted-foreground)]">Loading your items...</p>
      ) : (
        <>
          {/* Flashcard Decks */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-[var(--primary)]" />
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Flashcard Decks
              </h2>
            </div>

            {flashcards.length === 0 ? (
              <p className="text-[var(--muted-foreground)]">
                Bạn chưa sở hữu bộ flashcard nào.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {flashcards.map((deck) => (
                  <div key={deck.id} className="group relative">
                    <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 h-full hover:border-[var(--primary)] transition-all flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <StudentBadge variant="info" uppercase={false}>
                          Owned
                        </StudentBadge>
                      </div>

                      <div className="text-5xl mb-4 text-center">📚</div>

                      <h3 className="text-lg font-bold text-white mb-2 text-center">
                        {deck.name}
                      </h3>

                      <p className="text-sm text-[var(--muted-foreground)] text-center mb-6 line-clamp-2 flex-1">
                        {deck.description || "Chưa có mô tả"}
                      </p>

                      <StudentActionButton
                        className="py-2 font-bold w-full"
                        onClick={() =>
                          navigate(
                            `/student/dashboard/flashcard/${deck.referenceId}`,
                          )
                        }
                      >
                        Study Now
                      </StudentActionButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quiz Center */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold text-white">Quizzes</h2>
            </div>

            {quizzes.length === 0 ? (
              <p className="text-[var(--muted-foreground)]">
                Bạn chưa sở hữu bộ quiz nào.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="group relative">
                    <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 h-full hover:border-purple-500 transition-all flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <StudentBadge variant="purple" uppercase={false}>
                          Owned
                        </StudentBadge>
                      </div>

                      <div className="text-5xl mb-4 text-center">❓</div>

                      <h3 className="text-lg font-bold text-white mb-2 text-center">
                        {quiz.name}
                      </h3>

                      <p className="text-sm text-[var(--muted-foreground)] text-center mb-6 line-clamp-2 flex-1">
                        {quiz.description || "Chưa có mô tả"}
                      </p>

                      <StudentActionButton
                        className="py-2 font-bold w-full !bg-purple-600 hover:!bg-purple-500"
                        onClick={() =>
                          navigate(
                            `/student/dashboard/quiz/${quiz.referenceId}`,
                          )
                        }
                      >
                        Take Quiz
                      </StudentActionButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default LearningHub;
