import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Check, X, GripVertical } from "lucide-react";
import { cn } from "@/components/ui/utils";

interface ReorderQuizProps {
  questionText: string;
  correctOrder: string[];
  userOrder: string[];
  isSubmitted: boolean;
  onOrderChange: (order: string[]) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  // Ensure we don't accidentally return the already-sorted array
  let iterations = 0;
  while (iterations < 10) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (JSON.stringify(arr) !== JSON.stringify(array) || array.length <= 1) {
      break;
    }
    iterations++;
  }
  return arr;
}

export default function ReorderQuiz({
  questionText,
  correctOrder,
  userOrder,
  isSubmitted,
  onOrderChange,
}: ReorderQuizProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Initialize shuffled items
  useEffect(() => {
    onOrderChange(shuffleArray(correctOrder));
    setSelectedIndex(null);
  }, [questionText, correctOrder]);

  const handleMoveUp = (index: number) => {
    if (isSubmitted || index === 0) return;
    const newOrder = [...userOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    onOrderChange(newOrder);
    setSelectedIndex(null);
  };

  const handleMoveDown = (index: number) => {
    if (isSubmitted || index === userOrder.length - 1) return;
    const newOrder = [...userOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    onOrderChange(newOrder);
    setSelectedIndex(null);
  };

  const handleItemClick = (index: number) => {
    if (isSubmitted) return;
    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      // Swap items
      const newOrder = [...userOrder];
      const temp = newOrder[selectedIndex];
      newOrder[selectedIndex] = newOrder[index];
      newOrder[index] = temp;
      onOrderChange(newOrder);
      setSelectedIndex(null);
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
          Click an item to select, then click another to swap. Or use the Up/Down arrows to sort!
        </p>
      </div>

      {/* Items List */}
      <div className="flex flex-col gap-3 max-w-xl mx-auto w-full">
        {userOrder.map((item, idx) => {
          const isCorrect = isSubmitted && item === correctOrder[idx];
          const isWrong = isSubmitted && !isCorrect;
          const isSelected = selectedIndex === idx;

          let itemClass = "bg-[var(--second-card)] border-[var(--border)] text-white hover:bg-[rgba(255,255,255,0.02)]";
          if (isCorrect) {
            itemClass = "bg-green-500/10 border-green-500 text-green-200";
          } else if (isWrong) {
            itemClass = "bg-red-500/10 border-red-500 text-red-200";
          } else if (isSelected) {
            itemClass = "bg-purple-500/10 border-[var(--accent)] text-white shadow-[0_0_12px_rgba(250,204,21,0.1)]";
          }

          return (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border font-semibold transition-all duration-200 outline-none text-base select-none",
                itemClass
              )}
            >
              {/* Index Number */}
              <span className="w-8 h-8 rounded-full bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)] flex items-center justify-center text-xs font-black">
                {idx + 1}
              </span>

              {/* Text Area (Clickable to select and swap) */}
              <div
                onClick={() => handleItemClick(idx)}
                className={cn(
                  "flex-1 flex items-center gap-2 pr-4 min-h-[40px]",
                  !isSubmitted && "cursor-pointer"
                )}
              >
                {!isSubmitted && <GripVertical className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />}
                <span>{item}</span>
              </div>

              {/* Controls or Feedback Icons */}
              {isSubmitted ? (
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <X className="w-5 h-5 text-red-400" />
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded">
                        Correct: {correctOrder.indexOf(item) + 1}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveUp(idx);
                    }}
                    disabled={idx === 0}
                    className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--muted-foreground)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveDown(idx);
                    }}
                    disabled={idx === userOrder.length - 1}
                    className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--muted-foreground)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
