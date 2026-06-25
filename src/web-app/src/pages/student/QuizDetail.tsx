import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
  Target,
} from "lucide-react";
import StudentBadge from "@/components/student/StudentBadge";
import StudentActionButton from "@/components/student/StudentActionButton";
import GridBackground from "@/layouts/GridBackground";

// Import custom quiz components
import MultipleChoiceQuiz from "@/components/student/quiz/MultipleChoiceQuiz";
import MatchingQuiz from "@/components/student/quiz/MatchingQuiz";
import ReorderQuiz from "@/components/student/quiz/ReorderQuiz";
import FillInBlankQuiz from "@/components/student/quiz/FillInBlankQuiz";

interface QuizQuestion {
  id: string;
  questionText: string;
  type: "MULTIPLE_CHOICE" | "REORDER" | "MATCHING" | "FILL_IN_THE_BLANK";
  options?: string[];
  correctOptionIndex?: number;
  matchingPairs?: Record<string, string>;
  correctOrder?: string[];
  acceptedAnswers?: string[];
}

interface QuizSet {
  id: number;
  name: string;
  description: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  color: string;
  icon: string;
  xpReward: number;
  coinReward: number;
  questions: QuizQuestion[];
}

const mockQuizSetsData: Record<number, QuizSet> = {
  1: {
    id: 1,
    name: "Math Quiz",
    description: "Test your math skills",
    rarity: "Common",
    color: "from-blue-500 to-cyan-600",
    icon: "🔢",
    xpReward: 100,
    coinReward: 50,
    questions: [
      {
        id: "m1",
        questionText: "What is 12 x 11?",
        type: "MULTIPLE_CHOICE",
        options: ["121", "132", "144", "156"],
        correctOptionIndex: 1,
      },
      {
        id: "m2",
        questionText: "Complete the equation: 5 + 3 * 2 = _",
        type: "FILL_IN_THE_BLANK",
        acceptedAnswers: ["11"],
      },
      {
        id: "m3",
        questionText: "Order these numbers from smallest to largest:",
        type: "REORDER",
        correctOrder: ["-5", "0.5", "2", "10"],
      },
      {
        id: "m4",
        questionText: "Match the math terms to their symbols:",
        type: "MATCHING",
        matchingPairs: {
          "Addition": "+",
          "Subtraction": "-",
          "Multiplication": "*",
          "Division": "/",
        },
      },
    ],
  },
  2: {
    id: 2,
    name: "English Quiz",
    description: "Test your English skills",
    rarity: "Rare",
    color: "from-purple-500 to-violet-600",
    icon: "📚",
    xpReward: 150,
    coinReward: 75,
    questions: [
      {
        id: "e1",
        questionText: "Which of the following is a synonym of 'Ephemeral'?",
        type: "MULTIPLE_CHOICE",
        options: ["Eternal", "Transient", "Permanent", "Slow"],
        correctOptionIndex: 1,
      },
      {
        id: "e2",
        questionText: "The past tense of the verb 'go' is _.",
        type: "FILL_IN_THE_BLANK",
        acceptedAnswers: ["went"],
      },
      {
        id: "e3",
        questionText: "Arrange these words to make a correct sentence:",
        type: "REORDER",
        correctOrder: ["The", "quick", "brown", "fox", "jumps"],
      },
      {
        id: "e4",
        questionText: "Match the words with their antonyms:",
        type: "MATCHING",
        matchingPairs: {
          "Hot": "Cold",
          "Happy": "Sad",
          "Fast": "Slow",
          "High": "Low",
        },
      },
    ],
  },
  3: {
    id: 3,
    name: "Science Quiz",
    description: "Test your science skills",
    rarity: "Epic",
    color: "from-green-500 to-emerald-600",
    icon: "🔬",
    xpReward: 200,
    coinReward: 100,
    questions: [
      {
        id: "s1",
        questionText: "What is the primary gas found in Earth's atmosphere?",
        type: "MULTIPLE_CHOICE",
        options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
        correctOptionIndex: 1,
      },
      {
        id: "s2",
        questionText: "Water boils at _ degrees Celsius at sea level.",
        type: "FILL_IN_THE_BLANK",
        acceptedAnswers: ["100", "100C", "100 degrees"],
      },
      {
        id: "s3",
        questionText: "Order the planets starting closest to the Sun:",
        type: "REORDER",
        correctOrder: ["Mercury", "Venus", "Earth", "Mars"],
      },
      {
        id: "s4",
        questionText: "Match the organ with its body system:",
        type: "MATCHING",
        matchingPairs: {
          "Heart": "Circulatory",
          "Brain": "Nervous",
          "Lungs": "Respiratory",
          "Stomach": "Digestive",
        },
      },
    ],
  },
  4: {
    id: 4,
    name: "History Quiz",
    description: "Test your history skills",
    rarity: "Legendary",
    color: "from-amber-400 to-yellow-500",
    icon: "👑",
    xpReward: 300,
    coinReward: 150,
    questions: [
      {
        id: "h1",
        questionText: "Who was the first person to step on the Moon?",
        type: "MULTIPLE_CHOICE",
        options: ["Yuri Gagarin", "Neil Armstrong", "Buzz Aldrin", "Michael Collins"],
        correctOptionIndex: 1,
      },
      {
        id: "h2",
        questionText: "World War II ended in the year _.",
        type: "FILL_IN_THE_BLANK",
        acceptedAnswers: ["1945"],
      },
      {
        id: "h3",
        questionText: "Order these historical periods chronologically (earliest first):",
        type: "REORDER",
        correctOrder: ["Ancient Egypt", "Roman Empire", "Middle Ages", "Renaissance"],
      },
      {
        id: "h4",
        questionText: "Match the historical figure to their achievement:",
        type: "MATCHING",
        matchingPairs: {
          "Albert Einstein": "Theory of Relativity",
          "Isaac Newton": "Laws of Motion",
          "Marie Curie": "Discovery of Radium",
          "Charles Darwin": "Theory of Evolution",
        },
      },
    ],
  },
};

export default function QuizDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const quizId = Number(id) || 1;
  const quizSet = mockQuizSetsData[quizId] || mockQuizSetsData[1];
  const { questions } = quizSet;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // States for user answers in the current question
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
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
  }, [currentIndex, quizId]);

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
          (ans) => ans.trim().toLowerCase() === userAnswer.trim().toLowerCase()
        );
        break;
      case "REORDER":
        correct = JSON.stringify(userOrder) === JSON.stringify(currentQuestion.correctOrder);
        break;
      case "MATCHING":
        correct = Object.keys(currentQuestion.matchingPairs || {}).every(
          (key) => (currentQuestion.matchingPairs || {})[key] === userMatches[key]
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
  const accuracyPercentage = Math.round((correctCount / questions.length) * 100);

  // Compute proportional XP and Coin gains
  const gainedXp = Math.round(quizSet.xpReward * (correctCount / questions.length));
  const gainedCoins = Math.round(quizSet.coinReward * (correctCount / questions.length));

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
          <span>Exit Quiz</span>
        </button>

        <div className="text-center hidden md:block">
          <p className="text-xs text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">Quiz Session</p>
          <h1 className="text-xl font-black text-white flex items-center gap-2 justify-center">
            <span>{quizSet.icon}</span>
            <span>{quizSet.name}</span>
          </h1>
        </div>

        <StudentBadge
          variant={
            quizSet.rarity === "Rare"
              ? "info"
              : quizSet.rarity === "Epic" || quizSet.rarity === "Legendary"
                ? "purple"
                : "glass"
          }
          className="px-4 py-1.5"
        >
          {quizSet.rarity}
        </StudentBadge>
      </header>

      {/* Page Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center p-6 md:p-8">
        {!isCompleted ? (
          <div className="w-full max-w-2xl flex flex-col items-center gap-6">
            {/* Progress Area */}
            <div className="w-full">
              <div className="flex justify-between items-center text-sm font-bold text-[var(--muted-foreground)] mb-2">
                <span className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-purple-400" />
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-[var(--primary-light)]">
                  {Math.round((currentIndex / questions.length) * 100)}% Complete
                </span>
              </div>
              <div className="w-full h-3 bg-[var(--muted)] border border-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${(currentIndex / questions.length) * 100}%` }}
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
                <StudentActionButton
                  size="lg"
                  disabled={!hasProvidedInput()}
                  onClick={handleCheckAnswer}
                  className="w-full md:w-auto px-12"
                >
                  Check Answer
                </StudentActionButton>
              ) : (
                <StudentActionButton
                  size="lg"
                  onClick={handleNextQuestion}
                  className="w-full md:w-auto px-12 !bg-purple-600 hover:!bg-purple-500 text-white"
                >
                  {currentIndex + 1 < questions.length ? "Next Question" : "Finish Quiz"}
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

            <h2 className="text-3xl font-black mb-2 text-white">Quiz Completed!</h2>
            <p className="text-[var(--muted-foreground)] mb-8">
              Outstanding effort! You've successfully finished the {quizSet.name} session.
            </p>

            {/* Stats Summary Card */}
            <div className="bg-[var(--second-card)] border border-[var(--border)] rounded-2xl p-6 mb-8 grid grid-cols-2 gap-4">
              <div className="text-center border-r border-[var(--border)]">
                <p className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider mb-1">XP Gained</p>
                <div className="flex items-center justify-center gap-1 text-[var(--primary-light)]">
                  <Zap className="w-5 h-5 fill-current" />
                  <span className="text-3xl font-black">+{gainedXp}</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider mb-1">Coins Earned</p>
                <div className="flex items-center justify-center gap-1 text-amber-400">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-3xl font-black">+{gainedCoins}</span>
                </div>
              </div>

              <div className="col-span-2 pt-4 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider mb-1">Accuracy Score</p>
                <p className="text-2xl font-black text-white">{correctCount} / {questions.length} Correct</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">({accuracyPercentage}% accuracy)</p>
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
                Retake Quiz
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
