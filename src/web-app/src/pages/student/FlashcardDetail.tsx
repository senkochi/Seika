import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
  Keyboard
} from "lucide-react";
import StudentBadge from "@/components/student/StudentBadge";
import StudentActionButton from "@/components/student/StudentActionButton";
import GridBackground from "@/layouts/GridBackground";

interface Flashcard {
  question: string;
  answer: string;
  tip?: string;
}

interface Deck {
  id: number;
  title: string;
  cardsCount: number;
  mastered: number;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  color: string;
  icon: string;
  cards: Flashcard[];
  xpReward: number;
  coinReward: number;
}

const flashcardDecksData: Record<number, Deck> = {
  1: {
    id: 1,
    title: "Math Basics",
    cardsCount: 48,
    mastered: 35,
    rarity: "Common",
    color: "from-blue-500 to-cyan-600",
    icon: "🔢",
    xpReward: 100,
    coinReward: 50,
    cards: [
      { question: "What is 7 x 8?", answer: "56", tip: "Think of 7 x 7 + 7" },
      { question: "What is the square root of 144?", answer: "12", tip: "12 times itself equals 144" },
      { question: "Solve for x: 2x + 5 = 15", answer: "x = 5", tip: "Subtract 5 from both sides, then divide by 2" },
      { question: "What is 15% of 200?", answer: "30", tip: "10% is 20, 5% is 10" },
      { question: "What is the value of Pi to 2 decimal places?", answer: "3.14", tip: "Archimedes' constant" },
      { question: "What is the sum of angles in a triangle?", answer: "180 degrees", tip: "A straight line angle" },
      { question: "What is 9 cubed (9^3)?", answer: "729", tip: "9 x 9 = 81, then 81 x 9" },
      { question: "Solve: 10 - 3 x 2 + 1", answer: "5", tip: "Follow PEMDAS order of operations" }
    ]
  },
  2: {
    id: 2,
    title: "English Vocabulary",
    cardsCount: 120,
    mastered: 89,
    rarity: "Rare",
    color: "from-purple-500 to-violet-600",
    icon: "📚",
    xpReward: 150,
    coinReward: 75,
    cards: [
      { question: "Ephemeral", answer: "Lasting for a very short time; transient", tip: "Think of flowers that bloom for a day" },
      { question: "Eloquent", answer: "Fluent or persuasive in speaking or writing", tip: "A great speech maker is eloquent" },
      { question: "Meticulous", answer: "Showing great attention to detail; very careful and precise", tip: "An accountant or watchmaker's work" },
      { question: "Capricious", answer: "Given to sudden and unaccountable changes of mood or behavior", tip: "Like unpredictable weather" },
      { question: "Pragmatic", answer: "Dealing with things sensibly and realistically in a practical way", tip: "Opposite of idealistic" },
      { question: "Superfluous", answer: "Unnecessary, especially through being more than enough", tip: "Extra luggage on a trip" },
      { question: "Anachronism", answer: "A thing belonging or appropriate to a period other than that in which it exists", tip: "A wristwatch in a movie about ancient Rome" },
      { question: "Benevolent", answer: "Well meaning and kindly", tip: "A friendly grandparent or charity donor" }
    ]
  },
  3: {
    id: 3,
    title: "Science Facts",
    cardsCount: 64,
    mastered: 42,
    rarity: "Epic",
    color: "from-green-500 to-emerald-600",
    icon: "🔬",
    xpReward: 200,
    coinReward: 100,
    cards: [
      { question: "What is the powerhouse of the cell?", answer: "Mitochondria", tip: "Where ATP cellular energy is made" },
      { question: "What is the speed of light?", answer: "Approx. 300,000 km/s (or 186,000 mi/s)", tip: "It takes about 8 minutes to travel from Sun to Earth" },
      { question: "What element does 'H' stand for?", answer: "Hydrogen", tip: "The most abundant element in the universe" },
      { question: "What is the chemical formula for water?", answer: "H2O", tip: "Two hydrogen atoms, one oxygen atom" },
      { question: "What gas do plants absorb during photosynthesis?", answer: "Carbon Dioxide (CO2)", tip: "The gas humans exhale" },
      { question: "How many bones are in the adult human body?", answer: "206", tip: "Babies are born with around 270 bones" },
      { question: "What is the closest planet to the Sun?", answer: "Mercury", tip: "It's also the smallest planet in our solar system" },
      { question: "What is the absolute zero temperature in Celsius?", answer: "-273.15 °C", tip: "0 Kelvin, where molecular motion stops" }
    ]
  },
  4: {
    id: 4,
    title: "History Heroes",
    cardsCount: 85,
    mastered: 0,
    rarity: "Legendary",
    color: "from-amber-400 to-yellow-500",
    icon: "👑",
    xpReward: 300,
    coinReward: 150,
    cards: [
      { question: "Who was the first President of the United States?", answer: "George Washington", tip: "Featured on the US one-dollar bill" },
      { question: "In which year did World War II end?", answer: "1945", tip: "Ended in the month of September" },
      { question: "Who wrote the Declaration of Independence?", answer: "Thomas Jefferson", tip: "The third US President" },
      { question: "Who gave the famous 'I Have a Dream' speech?", answer: "Martin Luther King Jr.", tip: "Civil rights leader in 1963" },
      { question: "Who was the first emperor of the Roman Empire?", answer: "Augustus Caesar", tip: "Formerly known as Octavian" },
      { question: "Which empire built the Machu Picchu?", answer: "Inca Empire", tip: "Located in modern-day Peru" },
      { question: "Who was the famous queen of ancient Egypt allied with Julius Caesar?", answer: "Cleopatra", tip: "The last active ruler of the Ptolemaic Kingdom" },
      { question: "Which year was the printing press invented by Johannes Gutenberg?", answer: "Around 1440", tip: "Mid-15th century innovation that revolutionized books" }
    ]
  }
};

function FlashcardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const deckId = Number(id) || 1;
  const deck = flashcardDecksData[deckId] || flashcardDecksData[1];
  const { cards } = deck;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answers, setAnswers] = useState<("correct" | "incorrect" | null)[]>(
    new Array(cards.length).fill(null)
  );
  const [isCompleted, setIsCompleted] = useState(false);
  const [showTip, setShowTip] = useState(false);

  // Keyboard controls helper
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted) return;

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
  }, [isFlipped, isCompleted, currentIndex]);

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

  const correctCount = answers.filter((a) => a === "correct").length;
  const masteredPercentage = Math.round((correctCount / cards.length) * 100);

  const cardInnerStyle = {
    transformStyle: "preserve-3d" as const,
    transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
  };

  const cardFaceStyle = {
    backfaceVisibility: "hidden" as const,
  };

  const cardBackStyle = {
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
          onClick={() => navigate("/dashboard/learning")}
          className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-white transition-colors bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[var(--border)] px-4 py-2.5 rounded-xl text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Session</span>
        </button>

        <div className="text-center hidden md:block">
          <p className="text-xs text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">Flashcard Deck</p>
          <h1 className="text-xl font-black text-white flex items-center gap-2 justify-center">
            <span>{deck.icon}</span>
            <span>{deck.title}</span>
          </h1>
        </div>

        <StudentBadge
          variant={
            deck.rarity === "Rare"
              ? "info"
              : deck.rarity === "Epic" || deck.rarity === "Legendary"
                ? "purple"
                : "glass"
          }
          className="px-4 py-1.5"
        >
          {deck.rarity}
        </StudentBadge>
      </header>

      {/* Page Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center p-6 md:p-8">
        {!isCompleted ? (
          <div className="w-full max-w-xl flex flex-col items-center gap-6">
            
            {/* Progress Area */}
            <div className="w-full">
              <div className="flex justify-between items-center text-sm font-bold text-[var(--muted-foreground)] mb-2">
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <span className="text-[var(--primary-light)]">{Math.round((currentIndex / cards.length) * 100)}% Complete</span>
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
                className="relative w-full h-full text-center rounded-3xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-md shadow-2xl transition-all"
                style={cardInnerStyle}
              >
                {/* FRONT FACE */}
                <div
                  className="absolute inset-0 w-full h-full flex flex-col justify-between p-8 rounded-3xl"
                  style={{ ...cardFaceStyle, backfaceVisibility: "hidden" }}
                >
                  <div className="flex justify-between items-center text-xs text-[var(--muted-foreground)] font-bold tracking-wider uppercase">
                    <span>Front</span>
                    <span>{deck.title}</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <span className="text-5xl md:text-6xl">{deck.icon}</span>
                    <p className="text-2xl md:text-3xl font-black text-white max-w-md leading-relaxed px-4">
                      {cards[currentIndex].question}
                    </p>
                  </div>

                  <div className="text-xs text-[var(--muted-foreground)] font-semibold flex items-center justify-center gap-1">
                    <span>Click card to reveal answer</span>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* BACK FACE */}
                <div
                  className="absolute inset-0 w-full h-full flex flex-col justify-between p-8 rounded-3xl"
                  style={cardBackStyle}
                >
                  <div className="flex justify-between items-center text-xs text-[var(--muted-foreground)] font-bold tracking-wider uppercase">
                    <span>Back</span>
                    <span className="text-amber-400">Answer Revealed</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent px-4">
                      {cards[currentIndex].answer}
                    </p>
                    {showTip && cards[currentIndex].tip && (
                      <p className="text-sm text-[var(--muted-foreground)] max-w-sm mt-2 italic bg-[rgba(255,255,255,0.03)] px-4 py-2 rounded-xl border border-[var(--border)]">
                        💡 {cards[currentIndex].tip}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between w-full">
                    {cards[currentIndex].tip ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTip(!showTip);
                        }}
                        className="text-xs text-[var(--muted-foreground)] hover:text-white font-bold underline transition-colors"
                      >
                        {showTip ? "Hide Hint" : "Show Hint"}
                      </button>
                    ) : (
                      <div />
                    )}
                    <div className="text-xs text-[var(--muted-foreground)] font-semibold flex items-center justify-center gap-1">
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
                <strong>Space</strong>: Flip | <strong>Left/Right Arrow</strong>: Got It / Review
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

            <h2 className="text-3xl font-black mb-2 text-white">Deck Completed!</h2>
            <p className="text-[var(--muted-foreground)] mb-8">
              Outstanding work! You've successfully completed the {deck.title} session.
            </p>

            {/* Stats Summary Card */}
            <div className="bg-[var(--second-card)] border border-[var(--border)] rounded-2xl p-6 mb-8 grid grid-cols-2 gap-4">
              <div className="text-center border-r border-[var(--border)]">
                <p className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider mb-1">XP Gained</p>
                <div className="flex items-center justify-center gap-1 text-[var(--primary-light)]">
                  <Zap className="w-5 h-5 fill-current" />
                  <span className="text-3xl font-black">+{deck.xpReward}</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider mb-1">Coins Earned</p>
                <div className="flex items-center justify-center gap-1 text-amber-400">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-3xl font-black">+{deck.coinReward}</span>
                </div>
              </div>
              
              <div className="col-span-2 pt-4 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider mb-1">Mastery Score</p>
                <p className="text-2xl font-black text-white">{correctCount} / {cards.length} Cards</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">({masteredPercentage}% accuracy)</p>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-col gap-3">
              <StudentActionButton
                size="lg"
                onClick={() => navigate("/dashboard/learning")}
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
