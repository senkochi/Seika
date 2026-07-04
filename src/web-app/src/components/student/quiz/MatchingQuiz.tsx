import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/components/ui/utils";

interface MatchingQuizProps {
  questionText: string;
  matchingPairs: Record<string, string>;
  userMatches: Record<string, string>;
  isSubmitted: boolean;
  onMatchesChange: (matches: Record<string, string>) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function MatchingQuiz({
  questionText,
  matchingPairs,
  userMatches,
  isSubmitted,
  onMatchesChange,
}: MatchingQuizProps) {
  const [leftItems, setLeftItems] = useState<string[]>([]);
  const [rightItems, setRightItems] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = useState<{ left: string; right: string } | null>(null);

  // Initialize shuffled items
  useEffect(() => {
    const keys = Object.keys(matchingPairs);
    const values = Object.values(matchingPairs);
    setLeftItems(shuffleArray(keys));
    setRightItems(shuffleArray(values));
    setSelectedLeft(null);
    setSelectedRight(null);
    setWrongFlash(null);
  }, [questionText, matchingPairs]);

  const handleLeftClick = (key: string) => {
    if (isSubmitted) return;
    if (userMatches[key]) return; // Already matched
    if (wrongFlash) return;

    if (selectedLeft === key) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(key);
      if (selectedRight) {
        checkMatch(key, selectedRight);
      }
    }
  };

  const handleRightClick = (val: string) => {
    if (isSubmitted) return;
    // Check if value is already matched
    const isValMatched = Object.values(userMatches).includes(val);
    if (isValMatched) return;
    if (wrongFlash) return;

    if (selectedRight === val) {
      setSelectedRight(null);
    } else {
      setSelectedRight(val);
      if (selectedLeft) {
        checkMatch(selectedLeft, val);
      }
    }
  };

  const checkMatch = (left: string, right: string) => {
    const correctValue = matchingPairs[left];
    if (correctValue === right) {
      // Correct Match
      const updated = { ...userMatches, [left]: right };
      onMatchesChange(updated);
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      // Incorrect Match: Flash red and reset
      setWrongFlash({ left, right });
      setSelectedLeft(null);
      setSelectedRight(null);
      setTimeout(() => {
        setWrongFlash(null);
      }, 800);
    }
  };


  return (
    <div className="w-full flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Question Card */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl">
        <p className="text-xl md:text-2xl font-bold text-white text-center leading-relaxed">
          {questionText}
        </p>
        <p className="text-xs text-[var(--muted-foreground)] text-center mt-2">
          Click an item on the left and its match on the right!
        </p>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-2 gap-6 md:gap-12 relative">
        {/* Left Column (Keys) */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider pl-1 mb-1">Items</p>
          {leftItems.map((key) => {
            const isMatched = !!userMatches[key];
            const isSelected = selectedLeft === key;
            const isWrong = wrongFlash?.left === key;

            let cardStyle = "bg-[var(--second-card)] border-[var(--border)] text-white hover:bg-[rgba(255,255,255,0.02)]";
            if (isMatched || (isSubmitted && matchingPairs[key] === userMatches[key])) {
              cardStyle = "bg-green-500/10 border-green-500 text-green-200 opacity-80 cursor-default";
            } else if (isWrong) {
              cardStyle = "bg-red-500/20 border-red-500 text-red-200 animate-shake";
            } else if (isSelected) {
              cardStyle = "bg-purple-500/10 border-[var(--accent)] text-white shadow-[0_0_12px_rgba(250,204,21,0.1)]";
            }

            return (
              <button
                key={key}
                disabled={isMatched || isSubmitted}
                onClick={() => handleLeftClick(key)}
                className={cn(
                  "p-4 rounded-xl border text-center font-semibold transition-all duration-200 text-sm md:text-base outline-none min-h-[56px] flex items-center justify-center gap-2",
                  !(isMatched || isSubmitted) && "cursor-pointer active:scale-[0.98]",
                  cardStyle
                )}
              >
                <span>{key}</span>
                {isMatched && <Check className="w-4 h-4 text-green-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Right Column (Values) */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider pl-1 mb-1">Matches</p>
          {rightItems.map((val) => {
            const isMatched = Object.values(userMatches).includes(val);
            const isSelected = selectedRight === val;
            const isWrong = wrongFlash?.right === val;

            let cardStyle = "bg-[var(--second-card)] border-[var(--border)] text-white hover:bg-[rgba(255,255,255,0.02)]";
            if (isMatched || (isSubmitted && Object.values(matchingPairs).includes(val))) {
              cardStyle = "bg-green-500/10 border-green-500 text-green-200 opacity-80 cursor-default";
            } else if (isWrong) {
              cardStyle = "bg-red-500/20 border-red-500 text-red-200 animate-shake";
            } else if (isSelected) {
              cardStyle = "bg-purple-500/10 border-[var(--accent)] text-white shadow-[0_0_12px_rgba(250,204,21,0.1)]";
            }

            return (
              <button
                key={val}
                disabled={isMatched || isSubmitted}
                onClick={() => handleRightClick(val)}
                className={cn(
                  "p-4 rounded-xl border text-center font-semibold transition-all duration-200 text-sm md:text-base outline-none min-h-[56px] flex items-center justify-center gap-2",
                  !(isMatched || isSubmitted) && "cursor-pointer active:scale-[0.98]",
                  cardStyle
                )}
              >
                <span>{val}</span>
                {isMatched && <Check className="w-4 h-4 text-green-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
