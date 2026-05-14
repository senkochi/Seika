import { BookOpen, Sparkles, Zap, Target, Lock } from "lucide-react";

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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common":
        return "text-[var(--muted-foreground)]";
      case "Rare":
        return "text-blue-400";
      case "Epic":
        return "text-[var(--primary)]";
      case "Legendary":
        return "text-[var(--primary)]";
      default:
        return "text-[var(--muted-foreground)]";
    }
  };

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
              {/* Card container */}
              <div className="relative transform transition-all duration-300 group-hover:scale-105">
                {/* Trading Card */}
                <div
                  className={`relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 h-full hover:border-[var(--ring)] transition-all ${deck.locked ? "opacity-60" : ""}`}
                >
                  {/* Rarity indicator */}
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`px-3 py-1 bg-[var(--muted)] rounded-full border border-[var(--border)]`}
                    >
                      <span
                        className={`text-xs font-semibold ${getRarityColor(deck.rarity)}`}
                      >
                        {deck.rarity}
                      </span>
                    </div>
                    {deck.locked && (
                      <div className="w-8 h-8 bg-[var(--muted)] rounded-full flex items-center justify-center">
                        <Lock className="w-4 h-4 text-[var(--primary)]" />
                      </div>
                    )}
                  </div>

                  {/* Icon */}
                  <div className="text-5xl mb-4 text-center">{deck.icon}</div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-2 text-center">
                    {deck.title}
                  </h3>

                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted-foreground)]">
                        {deck.cards} Cards
                      </span>
                      <span className="text-[var(--primary)] font-semibold">
                        {deck.mastered} Mastered
                      </span>
                    </div>

                    {/* Progress bar */}
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

                  {/* Action button */}
                  {!deck.locked ? (
                    <button className="w-full px-4 py-2 bg-[var(--primary)] text-[var(--foreground)] rounded-xl font-semibold hover:bg-[var(--primary)]/90 transition-all">
                      Study Now
                    </button>
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

        {/* Quest Map Container */}
        <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 min-h-[600px]">
          {/* Map background pattern */}
          <div className="absolute inset-0 opacity-5 rounded-2xl overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, rgba(147, 51, 234, 0.3) 1px, transparent 1px)`,
                backgroundSize: "30px 30px",
              }}
            ></div>
          </div>

          {/* Decorative paths */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: 0.1 }}
          >
            <path
              d="M 15% 20% Q 30% 25%, 45% 35%"
              stroke="rgba(147, 51, 234, 0.5)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="10,10"
            />
            <path
              d="M 45% 35% Q 35% 45%, 25% 55%"
              stroke="rgba(147, 51, 234, 0.5)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="10,10"
            />
            <path
              d="M 25% 55% Q 40% 65%, 60% 75%"
              stroke="rgba(147, 51, 234, 0.5)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="10,10"
            />
          </svg>

          {/* Quest nodes */}
          {quests.map((quest) => (
            <div
              key={quest.id}
              className="absolute group cursor-pointer"
              style={{
                top: quest.position.top,
                left: quest.position.left,
              }}
            >
              {/* Quest node */}
              <div className="relative">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${quest.color} rounded-full flex items-center justify-center text-3xl border-2 border-[var(--border)] shadow-lg transform group-hover:scale-110 transition-all`}
                >
                  {quest.icon}
                </div>

                {/* Progress ring */}
                {quest.progress > 0 && (
                  <svg className="absolute -inset-1 w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="#252525"
                      strokeWidth="3"
                      fill="none"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="#9333ea"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - quest.progress / 100)}`}
                      className="transition-all duration-500"
                    />
                  </svg>
                )}

                {/* Quest info popup */}
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-xl whitespace-nowrap">
                    <h4 className="text-[var(--foreground)] font-bold text-base mb-2">
                      {quest.title}
                    </h4>
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 ${
                          quest.difficulty === "Easy"
                            ? "bg-green-500/10 text-green-400"
                            : quest.difficulty === "Medium"
                              ? "bg-blue-500/10 text-blue-400"
                              : quest.difficulty === "Hard"
                                ? "bg-purple-500/10 text-purple-400"
                                : "bg-red-500/10 text-red-400"
                        } rounded-full text-xs font-semibold`}
                      >
                        {quest.difficulty}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-[var(--primary)]" />
                        <span className="text-[var(--foreground)] font-semibold">
                          +{quest.xp} XP
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                        <span className="text-[var(--foreground)] font-semibold">
                          +{quest.coins} Xu
                        </span>
                      </div>
                    </div>
                    {quest.progress > 0 && (
                      <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                        Progress: {quest.progress}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-[var(--muted)] border border-[var(--border)] rounded-xl p-4">
            <p className="text-[var(--foreground)] font-bold text-sm mb-2">
              Difficulty
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-[var(--muted-foreground)]">Easy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-[var(--muted-foreground)]">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-[var(--muted-foreground)]">Hard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-[var(--muted-foreground)]">Expert</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LearningHub;
