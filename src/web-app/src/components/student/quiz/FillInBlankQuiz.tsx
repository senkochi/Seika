import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/components/ui/utils";

interface FillInBlankQuizProps {
  questionText: string;
  acceptedAnswers: string[];
  userAnswer: string;
  isSubmitted: boolean;
  onAnswerChange: (val: string) => void;
}

export default function FillInBlankQuiz({
  questionText,
  acceptedAnswers,
  userAnswer,
  isSubmitted,
  onAnswerChange,
}: FillInBlankQuizProps) {
  // Check if answer is correct (trimmed, case-insensitive match with any accepted answers)
  const isCorrect = acceptedAnswers.some(
    (accepted) =>
      accepted.trim().toLowerCase() === userAnswer.trim().toLowerCase(),
  );

  // Find the first sequence of underscores (with optional spaces) and mark it with ||INPUT||.
  // Replace all other underscores with a static line placeholder (______).
  let processedText = questionText;
  const match = /_[\s_]*/.exec(processedText);
  if (match) {
    const firstIndex = match.index;
    const matchLength = match[0].length;
    const before = processedText.substring(0, firstIndex);
    const after = processedText.substring(firstIndex + matchLength);
    const cleanedAfter = after.replace(/_[\s_]*/g, "______");
    processedText = before + "||INPUT||" + cleanedAfter;
  } else {
    processedText = processedText + " ||INPUT||";
  }
  const parts = processedText.split("||INPUT||");

  return (
    <div className="w-full flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Question Card with Inline Input */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 shadow-xl text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-4 text-xl md:text-2xl font-bold text-white leading-relaxed">
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              <span>{part}</span>
              {index < parts.length - 1 && (
                <div className="relative inline-flex items-center">
                  <input
                    type="text"
                    value={userAnswer}
                    disabled={isSubmitted}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    placeholder="???"
                    className={cn(
                      "mx-1 px-4 py-1.5 text-center font-black text-white bg-[rgba(0,0,0,0.2)] border rounded-xl outline-none transition-all duration-300 w-48 shadow-inner",
                      isSubmitted
                        ? isCorrect
                          ? "border-green-500 bg-green-500/10 text-green-200"
                          : "border-red-500 bg-red-500/10 text-red-200"
                        : "border-[var(--border)] focus:border-[var(--accent)] focus:shadow-[0_0_12px_rgba(250,204,21,0.25)] focus:scale-[1.02]",
                    )}
                  />
                  {isSubmitted && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCorrect ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <X className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Answer feedback details */}
      {isSubmitted && (
        <div className="max-w-md mx-auto w-full text-center">
          {isCorrect ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-sm font-semibold">
              🎉 Correct! Excellent job.
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-semibold">
              <div>❌ Incorrect answer.</div>
              <div className="text-white text-xs mt-1">
                Accepted answers:{" "}
                <span className="font-mono bg-[rgba(0,0,0,0.3)] px-2 py-1 rounded border border-[var(--border)]">
                  {acceptedAnswers.join(" or ")}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
