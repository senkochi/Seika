
import { Check, X } from "lucide-react";
import { cn } from "@/components/ui/utils";

interface MultipleChoiceQuizProps {
  questionText: string;
  options: string[];
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  isSubmitted: boolean;
  onSelectOption: (index: number) => void;
}

export default function MultipleChoiceQuiz({
  questionText,
  options,
  selectedOptionIndex,
  correctOptionIndex,
  isSubmitted,
  onSelectOption,
}: MultipleChoiceQuizProps) {
  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="w-full flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Question Card */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl">
        <p className="text-xl md:text-2xl font-bold text-white text-center leading-relaxed">
          {questionText}
        </p>
      </div>

      {/* Options List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option, idx) => {
          const isSelected = selectedOptionIndex === idx;
          const isCorrect = idx === correctOptionIndex;
          const isIncorrectSelection = isSelected && !isCorrect;

          let btnClass = "bg-[var(--second-card)] border-[var(--border)] hover:bg-[rgba(255,255,255,0.03)] hover:scale-[1.01]";
          let letterClass = "bg-[var(--muted)] text-[var(--muted-foreground)]";

          if (isSubmitted) {
            if (isCorrect) {
              btnClass = "bg-green-500/10 border-green-500 text-green-200";
              letterClass = "bg-green-500 text-purple-950";
            } else if (isIncorrectSelection) {
              btnClass = "bg-red-500/10 border-red-500 text-red-200";
              letterClass = "bg-red-500 text-purple-950";
            } else {
              btnClass = "bg-[var(--second-card)]/50 border-[var(--border)]/50 text-[var(--muted-foreground)] opacity-50";
              letterClass = "bg-[var(--muted)]/50 text-[var(--muted-foreground)]/50";
            }
          } else if (isSelected) {
            btnClass = "bg-purple-500/10 border-[var(--accent)] text-white shadow-[0_0_15px_rgba(250,204,21,0.15)] scale-[1.01]";
            letterClass = "bg-[var(--accent)] text-[var(--accent-foreground)] font-black";
          }

          return (
            <button
              key={idx}
              disabled={isSubmitted}
              onClick={() => onSelectOption(idx)}
              className={cn(
                "relative flex items-center gap-4 p-5 rounded-xl border text-left font-semibold transition-all duration-200 outline-none text-white",
                !isSubmitted && "cursor-pointer active:scale-[0.99]",
                btnClass
              )}
            >
              {/* Option Letter Indicator */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-base font-black transition-all",
                  letterClass
                )}
              >
                {letters[idx] || idx + 1}
              </div>

              {/* Option Text */}
              <span className="text-base flex-1 pr-6">{option}</span>

              {/* Status Icons */}
              {isSubmitted && isCorrect && (
                <Check className="w-5 h-5 text-green-400 absolute right-4 top-1/2 -translate-y-1/2" />
              )}
              {isSubmitted && isIncorrectSelection && (
                <X className="w-5 h-5 text-red-400 absolute right-4 top-1/2 -translate-y-1/2" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
