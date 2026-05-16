import { BookOpen, Sparkles, Zap, Target, Lock } from "lucide-react";
import StudentActionButton from "@/components/student/StudentActionButton";
import StudentBadge from "@/components/student/StudentBadge";

function LearningHub() {
  const flashcardDecks = [
    {
      id: 1,
      title: "Math Basics",
      cards: 48,
      mastered: 35,
      rarity: "Common",
      color: "from-blue-500 to-cyan-600",
      icon: "🔢",
      locked: false,
    },
    {
      id: 2,
      title: "English Vocabulary",
      cards: 120,
      mastered: 89,
      rarity: "Rare",
      color: "from-purple-500 to-violet-600",
      icon: "📚",
      locked: false,
    },
    {
      id: 3,
      title: "Science Facts",
      cards: 64,
      mastered: 42,
      rarity: "Epic",
      color: "from-green-500 to-emerald-600",
      icon: "🔬",
      locked: false,
    },
    {
      id: 4,
      title: "History Heroes",
      cards: 85,
      mastered: 0,
      rarity: "Legendary",
      color: "from-amber-400 to-yellow-500",
      icon: "👑",
      locked: true,
    },
  ];

  const quests = [
    {
      id: 1,
      title: "Algebra Adventure",
      difficulty: "Easy",
      xp: 100,
      coins: 50,
      progress: 70,
      icon: "⚔️",
      color: "from-green-500 to-emerald-600",
      position: { top: "20%", left: "15%" },
      completed: false,
    },
    {
      id: 2,
      title: "Grammar Quest",
      difficulty: "Medium",
      xp: 200,
      coins: 100,
      progress: 40,
      icon: "📖",
      color: "from-blue-500 to-cyan-600",
      position: { top: "35%", left: "45%" },
      completed: false,
    },
    {
      id: 3,
      title: "Physics Challenge",
      difficulty: "Hard",
      xp: 350,
      coins: 200,
      progress: 0,
      icon: "🚀",
      color: "from-purple-500 to-violet-600",
      position: { top: "55%", left: "25%" },
      completed: false,
    },
    {
      id: 4,
      title: "Boss Battle: Finals",
      difficulty: "Expert",
      xp: 500,
      coins: 500,
      progress: 0,
      icon: "👹",
      color: "from-red-500 to-orange-600",
      position: { top: "75%", left: "60%" },
      completed: false,
    },
  ];

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

      {/* Flashcard Decks - Trading Card Style */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-[var(--primary)]" />
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            Flashcard Decks
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {flashcardDecks.map((deck) => (
            <div
              key={deck.id}
              className="group relative"
              style={{ perspective: "1000px" }}
            >
              <div className="relative">
                <div
                  className={`relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 h-full hover:border-[var(--primary)] transition-all ${deck.locked ? "opacity-60" : ""}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <StudentBadge
                      variant={
                        deck.rarity === "Rare"
                          ? "info"
                          : deck.rarity === "Epic" ||
                              deck.rarity === "Legendary"
                            ? "purple"
                            : "glass"
                      }
                      uppercase={false}
                      className={
                        deck.rarity === "Common"
                          ? "text-[var(--muted-foreground)]"
                          : ""
                      }
                    >
                      {deck.rarity}
                    </StudentBadge>
                    {deck.locked && (
                      <div className="w-8 h-8 bg-[var(--muted)] rounded-full flex items-center justify-center">
                        <Lock className="w-4 h-4 text-[var(--primary)]" />
                      </div>
                    )}
                  </div>

                  <div className="text-5xl mb-4 text-center">{deck.icon}</div>

                  <h3 className="text-lg font-bold text-white mb-2 text-center">
                    {deck.title}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted-foreground)]">
                        {deck.cards} Cards
                      </span>
                      <span className="text-[var(--primary)] font-semibold">
                        {deck.mastered} Mastered
                      </span>
                    </div>

                    {!deck.locked && (
                      <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--primary)] rounded-full"
                          style={{
                            width: `${(deck.mastered / deck.cards) * 100}%`,
                          }}
                        ></div>
                      </div>
                    )}
                  </div>

                  {!deck.locked ? (
                    <StudentActionButton className="py-2 font-bold">
                      Study Now
                    </StudentActionButton>
                  ) : (
                    <button className="w-full px-4 py-2 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-xl font-semibold cursor-not-allowed">
                      Locked
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiz Center - Quest Map */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-6 h-6 text-purple-500" />
          <h2 className="text-xl font-bold text-white">Quest Map</h2>
        </div>
      </div>
    </div>
  );
}

export default LearningHub;
